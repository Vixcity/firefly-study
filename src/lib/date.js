import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/zh-cn'

dayjs.extend(customParseFormat)
dayjs.locale('zh-cn')

/** 全 App 统一使用的日期格式：YYYY-MM-DD（本地时区） */
export const DAY = 'YYYY-MM-DD'

/** 时间戳 -> 日期键 */
export const toKey = (ts) => dayjs(ts).format(DAY)

/** 日期键 -> dayjs 实例（严格解析，避免 Safari 解析差异） */
export const fromKey = (key) => dayjs(key, DAY, true)

/** 日期键加减天数 */
export const addDays = (key, n) => fromKey(key).add(n, 'day').format(DAY)

/** a - b 的天数差 */
export const diffDays = (a, b) => fromKey(a).diff(fromKey(b), 'day')

/** 日期键 -> YYYY-MM */
export const monthKey = (key) => fromKey(key).format('YYYY-MM')

/** 生成 [start, end] 闭区间的日期键数组 */
export function rangeKeys(start, end) {
  const out = []
  if (diffDays(end, start) < 0) return out
  let cur = start
  let guard = 0
  while (guard < 4000) {
    out.push(cur)
    if (cur === end) break
    cur = addDays(cur, 1)
    guard += 1
  }
  return out
}

/** 最近 n 天（含今天）的日期键数组，升序 */
export const recentKeys = (today, n) => rangeKeys(addDays(today, -(n - 1)), today)

/** 某日期所在自然周（默认周一为第一天）的 7 个日期键，升序 */
export function weekKeys(key, weekStart = 1) {
  const d = fromKey(key)
  const dow = d.day() // 0=周日
  const offset = (dow - weekStart + 7) % 7
  const start = d.subtract(offset, 'day')
  return rangeKeys(start.format(DAY), start.add(6, 'day').format(DAY))
}

/** 某日期所在自然月的全部日期键，升序 */
export function monthKeys(key) {
  const d = fromKey(key)
  return rangeKeys(d.startOf('month').format(DAY), d.endOf('month').format(DAY))
}

/** 以当前时间判定「此刻属于哪一天」 */
export const todayKey = (now = Date.now()) => toKey(now)

/** 距离下一个整点分钟边界还有多少毫秒（用于每分钟对齐的定时器） */
export function msToNextMinute(now = Date.now()) {
  return 60000 - (now % 60000) + 20
}

/** 判断日期键是否落在 [start, end] 内 */
export const withinRange = (key, start, end) => diffDays(key, start) >= 0 && diffDays(key, end) <= 0
