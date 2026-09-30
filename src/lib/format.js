import dayjs from 'dayjs'
import { fromKey } from './date'

/** 秒 -> 中文可读时长："1 小时 12 分钟" / "18 分钟" / "45 秒" */
export function formatDuration(sec = 0) {
  const s = Math.max(0, Math.floor(sec))
  if (s < 60) return `${s} 秒`
  const totalMin = Math.floor(s / 60)
  if (totalMin < 60) return `${totalMin} 分钟`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m ? `${h} 小时 ${m} 分钟` : `${h} 小时`
}

/** 秒 -> 紧凑写法："1h12m" / "18m" / "45s"，用于空间紧张的卡片 */
export function formatDurationTight(sec = 0) {
  const s = Math.max(0, Math.floor(sec))
  if (s < 60) return `${s}s`
  const totalMin = Math.floor(s / 60)
  if (totalMin < 60) return `${totalMin}m`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m ? `${h}h${m}m` : `${h}h`
}

/** 秒 -> 故事化表达："18 分钟" -> "18 分钟"，"0 秒" 不出现，单独兜底 */
export function formatMinutes(sec = 0) {
  const m = Math.round(sec / 60)
  if (m <= 0) return '还不到 1 分钟'
  return `${m} 分钟`
}

/** 秒 -> 计时器显示 mm:ss（超过 1 小时显示 h:mm:ss） */
export function formatClock(sec = 0) {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`
}

/** 日期键 -> "9月30日 周三" */
export function formatDayLabel(key) {
  const d = fromKey(key)
  if (!d.isValid()) return key
  return `${d.month() + 1}月${d.date()}日 ${d.format('ddd')}`
}

/** 日期键 -> "2026年9月30日" */
export function formatFullDay(key) {
  const d = fromKey(key)
  if (!d.isValid()) return key
  return `${d.year()}年${d.month() + 1}月${d.date()}日`
}

/** 日期键 -> "9/30" */
export function formatShortDay(key) {
  const d = fromKey(key)
  if (!d.isValid()) return key
  return `${d.month() + 1}/${d.date()}`
}

/** 时间戳 -> "21:04" */
export function formatTime(ts) {
  if (!ts) return ''
  return dayjs(ts).format('HH:mm')
}

/** 时间戳 -> "9月30日 21:04" */
export function formatDateTime(ts) {
  if (!ts) return ''
  return dayjs(ts).format('M月D日 HH:mm')
}

/** 小时数 -> "1.5 小时"，用于报告页大数字 */
export function formatHours(sec = 0, digits = 1) {
  const h = sec / 3600
  if (h === 0) return '0'
  if (h < 0.1) return h.toFixed(2)
  return h.toFixed(h < 10 ? digits : 0)
}

/** 数值千分位 */
export function formatNumber(n = 0) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 进度百分比，带上下限保护 */
export function percent(cur, total) {
  if (!total || total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((cur / total) * 100)))
}

/** 根据当前时刻给一句问候，语气温柔、不施压 */
export function greeting(now = Date.now()) {
  const h = dayjs(now).hour()
  if (h < 5) return '夜深了，书房还亮着'
  if (h < 9) return '早安，晨光正好读书'
  if (h < 12) return '上午好，来读几页'
  if (h < 14) return '午后，适合翻几页书'
  if (h < 18) return '下午好，书房安静着'
  if (h < 22) return '晚上好，今晚的书房'
  return '夜色很好，适合读一会儿'
}
