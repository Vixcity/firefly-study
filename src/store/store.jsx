import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import dayjs from 'dayjs'
import { buildDerived } from './selectors'
import { createInitialState } from './initialState'
import { clearState, flushState, loadState, onStorageNotice, saveState } from './storage'
import { applySessionCompletion, discardReading } from './rules/session'
import { rolloverStreak } from './rules/streak'
import {
  chooseBook,
  createReading,
  normalizeReading,
  pauseReading,
  resumeReading,
} from './rules/timer'
import {
  addBook,
  deleteBook,
  deleteSession,
  markBookFinished,
  markBookReading,
  updateBook,
  updateSession,
} from './rules/books'
import { applyCosmetic, redeem } from './rules/shop'
import { markDayRested } from './rules/daily'
import { withBadges } from './rules/reward'

const AppContext = createContext(null)

/**
 * 状态容器。
 *
 * 设计取舍：状态本体放在 ref 里，用 useState 的版本号触发重渲染。
 * 这样所有"业务计算"都发生在 React 更新周期之外 ——
 * 结算时能顺手抛出动画事件、也不会被 StrictMode 的双调用搞出重复奖励。
 */
export function AppProvider({ children }) {
  const initialRef = useRef(null)
  if (initialRef.current === null) {
    const loaded = loadState()
    loaded.reading = normalizeReading(loaded.reading, Date.now())
    initialRef.current = loaded
  }

  const stateRef = useRef(initialRef.current)
  const [state, setState] = useState(initialRef.current)
  const [storageWarning, setStorageWarning] = useState(null)

  useEffect(() => onStorageNotice((e) => setStorageWarning(e)), [])

  /** 提交新状态：更新 ref、触发渲染、节流落盘 */
  const commit = useCallback((next, { immediate = false } = {}) => {
    if (next === stateRef.current) return next
    stateRef.current = next
    setState(next)
    saveState(next, { immediate })
    return next
  }, [])

  /** 纯函数式改写：fn 接收当前状态，返回新状态 */
  const update = useCallback(
    (fn, opts) => {
      const next = fn(stateRef.current)
      if (!next) return stateRef.current
      return commit(next, opts)
    },
    [commit]
  )

  const getState = useCallback(() => stateRef.current, [])

  // ------------------------------------------------------------ 每日结算
  const rollover = useCallback(
    (now = Date.now()) => {
      const today = dayjs(now).format('YYYY-MM-DD')
      const prev = stateRef.current
      if (prev.streak.lastSettledDate === dayjs(today).subtract(1, 'day').format('YYYY-MM-DD')) {
        // 昨天已经结算过，不用重复跑
        return { events: [] }
      }
      const { streak, dayPatches, events } = rolloverStreak(prev.streak, prev.days, today)
      let days = prev.days
      if (Object.keys(dayPatches).length) {
        days = { ...days }
        for (const date of Object.keys(dayPatches)) {
          days[date] = markDayRested(days[date], date)
        }
      }
      let next = { ...prev, streak, days }
      if (events.some((e) => e.type === 'card-used')) {
        next = withBadges(next, now).state
      }
      commit(next)
      return { events }
    },
    [commit]
  )

  // 进 App 先结算一次；回到前台、以及跨零点时再结算
  useEffect(() => {
    rollover()
    const onVisible = () => {
      if (document.visibilityState === 'visible') rollover()
    }
    const onHide = () => flushState()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pagehide', onHide)
    window.addEventListener('beforeunload', onHide)
    const timer = setInterval(() => rollover(), 60 * 1000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pagehide', onHide)
      window.removeEventListener('beforeunload', onHide)
      clearInterval(timer)
      flushState()
    }
  }, [rollover])

  // ------------------------------------------------------------ 动作集合
  const actions = useMemo(() => {
    const nowMs = () => Date.now()

    return {
      getState,

      /** 首屏引导看完 */
      finishOnboarding: () => update((s) => ({ ...s, onboarded: true }), { immediate: true }),

      /** 新手引导巡览走完（或跳过） */
      finishTour: () => update((s) => ({ ...s, tour: { ...s.tour, done: true } }), { immediate: true }),

      /** 从设置里重看引导 */
      restartTour: () => update((s) => ({ ...s, tour: { ...s.tour, done: false } }), { immediate: true }),

      /** 开始阅读 */
      startReading: (bookId = null) => {
        const now = nowMs()
        return update((s) => (s.reading ? s : { ...s, reading: createReading({ bookId, now }) }), {
          immediate: true,
        })
      },

      pauseReading: () => update((s) => ({ ...s, reading: pauseReading(s.reading, nowMs()) }), {
        immediate: true,
      }),

      resumeReading: () => update((s) => ({ ...s, reading: resumeReading(s.reading, nowMs()) }), {
        immediate: true,
      }),

      chooseBook: (bookId) => update((s) => ({ ...s, reading: chooseBook(s.reading, bookId) })),

      /** 放弃本次阅读：不留任何痕迹，也不说一句责备的话 */
      cancelReading: () => update((s) => discardReading(s), { immediate: true }),

      /** 结束阅读并结算，返回结算结果用于播放动画 */
      finishReading: (payload = {}) => {
        const now = nowMs()
        const outcome = applySessionCompletion(stateRef.current, { ...payload, now })
        if (!outcome.result) return null
        commit(outcome.state, { immediate: true })
        return outcome.result
      },

      // ---- 书籍 ----
      addBook: (data) =>
        update((s) => addBook(s, { ...data, now: nowMs() }), { immediate: true }),
      updateBook: (id, patch) => update((s) => updateBook(s, id, patch)),
      deleteBook: (id) => update((s) => deleteBook(s, id), { immediate: true }),
      finishBook: (id) => {
        const { state: next, result } = markBookFinished(stateRef.current, id, nowMs())
        if (result) commit(next, { immediate: true })
        return result
      },
      unfinishBook: (id) => update((s) => markBookReading(s, id)),

      // ---- 记录修正 ----
      updateSession: (id, patch) => update((s) => updateSession(s, id, patch, nowMs())),
      deleteSession: (id) => {
        const { state: next, result } = deleteSession(stateRef.current, id, nowMs())
        if (result) commit(next, { immediate: true })
        return result
      },

      // ---- 商店与装扮 ----
      redeem: (itemId) => {
        const { state: next, result } = redeem(stateRef.current, itemId, nowMs())
        if (result && result.redeemed) commit(next, { immediate: true })
        return result
      },
      useCosmetic: (itemId) => update((s) => applyCosmetic(s, itemId), { immediate: true }),

      // ---- 徽章 ----
      markBadgesSeen: () => update((s) => ({ ...s, badges: { ...s.badges, seenAt: nowMs() } })),

      // ---- 设置 ----
      updateSettings: (patch) =>
        update((s) => ({ ...s, settings: { ...s.settings, ...patch } }), { immediate: true }),
      markReminderFired: (date) =>
        update((s) => ({ ...s, reminder: { ...s.reminder, lastFiredDate: date } }), {
          immediate: true,
        }),

      // ---- 数据 ----
      importState: (nextState) =>
        commit({ ...nextState, onboarded: true }, { immediate: true }),
      resetAll: () => {
        clearState()
        const fresh = createInitialState()
        fresh.onboarded = true
        return commit(fresh, { immediate: true })
      },
    }
  }, [commit, getState, update])

  const derived = useMemo(() => buildDerived(state), [state])

  const value = useMemo(() => ({ state, derived, actions, storageWarning }), [
    state,
    derived,
    actions,
    storageWarning,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp 必须在 <AppProvider> 内使用')
  return ctx
}

/** 只要派生数据（大多数页面用这个就够了） */
export function useDerived() {
  return useApp().derived
}

export function useActions() {
  return useApp().actions
}
