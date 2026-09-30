import { useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { REMINDER_COPIES } from '../store/constants'
import { useApp } from '../store/store'

/**
 * 温柔提醒。
 *
 * 老实说一句：纯前端页面是没法在关掉浏览器后定时推送的（那需要服务端推送），
 * 所以这里的提醒只在 App 打开着的时候生效 —— README 里也写清楚了这一点。
 * 文案永远温柔、不施压，而且今天已经点亮过就不再打扰。
 */
export function useReminder(onFire) {
  const { state, actions } = useApp()
  const { settings, reminder, days } = state
  const fireRef = useRef(onFire)
  fireRef.current = onFire

  useEffect(() => {
    if (!settings.reminderEnabled) return undefined

    const tick = () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      const today = dayjs(now).format('YYYY-MM-DD')
      if (reminder.lastFiredDate === today) return

      const [h, m] = String(settings.reminderTime || '21:30')
        .split(':')
        .map((n) => parseInt(n, 10))
      const target = dayjs(now).hour(h || 0).minute(m || 0).second(0).millisecond(0)
      if (now < target.valueOf()) return

      // 今天已经点亮过就不再提醒 —— 提醒是为了帮上忙，不是为了打卡
      if (days[today] && days[today].lit) {
        actions.markReminderFired(today)
        return
      }

      const copy = REMINDER_COPIES[(settings.reminderCopyIndex || 0) % REMINDER_COPIES.length]
      actions.markReminderFired(today)
      actions.updateSettings({
        reminderCopyIndex: (settings.reminderCopyIndex || 0) + 1,
      })
      if (fireRef.current) fireRef.current(copy)

      // 浏览器通知（需要用户授权，且仅在页面打开时能触发）
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          // eslint-disable-next-line no-new
          new Notification('萤火书房', { body: copy, tag: 'firefly-study' })
        }
      } catch {
        /* 通知不可用就算了，页面内提示已经足够 */
      }
    }

    const id = setInterval(tick, 30 * 1000)
    const t = setTimeout(tick, 4000)
    return () => {
      clearInterval(id)
      clearTimeout(t)
    }
  }, [settings.reminderEnabled, settings.reminderTime, settings.reminderCopyIndex, reminder.lastFiredDate, days, actions])
}
