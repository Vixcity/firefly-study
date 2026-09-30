import { STATE_VERSION, STORAGE_KEY, createInitialState } from './initialState'

/**
 * 本地持久化：数据只存在这台设备的浏览器里，不上传任何服务器。
 * 写入做了节流，避免频繁 setState 时反复序列化。
 */

const listeners = new Set()
let writeTimer = null
let pending = null

function safeLocalStorage() {
  try {
    const k = '__fs_probe__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return window.localStorage
  } catch {
    return null
  }
}

export const storageAvailable = () => !!safeLocalStorage()

/** 版本迁移表：key 为起始版本，函数把该版本的数据升到下一版 */
const MIGRATIONS = {
  // 1: (s) => ({ ...s, version: 2 }),
}

function migrate(raw) {
  let data = raw
  let guard = 0
  while (data.version < STATE_VERSION && guard < 20) {
    const fn = MIGRATIONS[data.version]
    if (!fn) {
      data.version = STATE_VERSION
      break
    }
    data = fn(data)
    guard += 1
  }
  return data
}

/** 把读到的数据补齐成完整结构，缺字段一律用初始值兜底（导入旧备份也走这里） */
export function normalize(raw) {
  const base = createInitialState(raw && raw.createdAt ? raw.createdAt : Date.now())
  if (!raw || typeof raw !== 'object') return base

  const data = migrate({ ...base, ...raw })
  data.version = STATE_VERSION
  data.sessions = Array.isArray(data.sessions) ? data.sessions : []
  data.books = Array.isArray(data.books) ? data.books : []
  data.days = data.days && typeof data.days === 'object' ? data.days : {}
  data.points = { ...base.points, ...(data.points || {}) }
  data.points.ledger = Array.isArray(data.points.ledger) ? data.points.ledger : []
  data.streak = { ...base.streak, ...(data.streak || {}) }
  data.streak.restCardLog = Array.isArray(data.streak.restCardLog) ? data.streak.restCardLog : []
  data.tree = { ...base.tree, ...(data.tree || {}) }
  data.badges = { ...base.badges, ...(data.badges || {}) }
  data.badges.unlocked = data.badges.unlocked || {}
  data.cosmetic = { ...base.cosmetic, ...(data.cosmetic || {}) }
  data.cosmetic.owned = Array.isArray(data.cosmetic.owned)
    ? data.cosmetic.owned
    : base.cosmetic.owned
  data.settings = { ...base.settings, ...(data.settings || {}) }
  data.reminder = { ...base.reminder, ...(data.reminder || {}) }
  data.reading = data.reading || null
  return data
}

export function loadState() {
  const ls = safeLocalStorage()
  if (!ls) return createInitialState()
  try {
    const raw = ls.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    return normalize(JSON.parse(raw))
  } catch {
    // 本地数据坏了也不能让用户打不开 App，退回全新状态（原数据仍留在 localStorage 里）
    return createInitialState()
  }
}

function writeNow(state) {
  const ls = safeLocalStorage()
  if (!ls) return false
  try {
    ls.setItem(STORAGE_KEY, JSON.stringify({ ...state, updatedAt: Date.now() }))
    return true
  } catch (e) {
    // 容量满了：通知界面提示用户导出备份
    listeners.forEach((fn) => fn({ type: 'error', error: e }))
    return false
  }
}

/** 节流保存（默认 350ms 合并一次） */
export function saveState(state, { immediate = false } = {}) {
  pending = state
  if (immediate) {
    if (writeTimer) {
      clearTimeout(writeTimer)
      writeTimer = null
    }
    const s = pending
    pending = null
    writeNow(s)
    return
  }
  if (writeTimer) return
  writeTimer = setTimeout(() => {
    writeTimer = null
    const s = pending
    pending = null
    if (s) writeNow(s)
  }, 350)
}

/** 页面要走了，把没写完的立刻落盘 */
export function flushState() {
  if (writeTimer) {
    clearTimeout(writeTimer)
    writeTimer = null
  }
  if (pending) {
    const s = pending
    pending = null
    writeNow(s)
  }
}

export function clearState() {
  const ls = safeLocalStorage()
  if (!ls) return
  ls.removeItem(STORAGE_KEY)
}

export function onStorageNotice(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ---------------------------------------------------------------- 导出 / 导入

export function exportState(state) {
  return JSON.stringify(
    {
      app: '萤火书房',
      appId: 'firefly-study',
      version: STATE_VERSION,
      exportedAt: new Date().toISOString(),
      data: state,
    },
    null,
    2
  )
}

/** 导入备份：返回 { ok, state, error } */
export function importState(text) {
  try {
    const parsed = JSON.parse(text)
    const raw = parsed && parsed.data ? parsed.data : parsed
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.sessions)) {
      return { ok: false, error: '这个文件看起来不是萤火书房的备份' }
    }
    return { ok: true, state: normalize(raw) }
  } catch {
    return { ok: false, error: '文件内容无法解析，请确认是导出的 JSON 备份' }
  }
}

export function exportFileName(now = Date.now()) {
  const d = new Date(now)
  const p = (n) => String(n).padStart(2, '0')
  return `萤火书房备份-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`
}
