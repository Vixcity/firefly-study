import { SESSION_MAX_SEC } from '../constants'
import { toKey } from '../../lib/date'
import { uid } from '../../lib/id'

/** 开一次新的阅读：立即进入运行状态 */
export function createReading({ bookId = null, now }) {
  return {
    sessionId: uid('ses'),
    /** 归属日：按开始阅读那天算，跨零点也不会拆成两半 */
    date: toKey(now),
    startedAt: now,
    accumulatedSec: 0,
    running: true,
    runningSince: now,
    bookId,
    /** 中途换书：以结束时选定的书为准 */
    bookChanged: false,
  }
}

/** 当前已经读了多少秒（含正在跑的这一段） */
export function elapsedSec(reading, now = Date.now()) {
  if (!reading) return 0
  const live =
    reading.running && reading.runningSince ? Math.floor((now - reading.runningSince) / 1000) : 0
  return Math.max(0, (reading.accumulatedSec || 0) + live)
}

/** 暂停（支持暂停再暂停，幂等） */
export function pauseReading(reading, now) {
  if (!reading || !reading.running) return reading
  return { ...reading, accumulatedSec: elapsedSec(reading, now), running: false, runningSince: null }
}

/** 继续 */
export function resumeReading(reading, now) {
  if (!reading || reading.running) return reading
  return { ...reading, running: true, runningSince: now }
}

/** 中途换书 */
export function chooseBook(reading, bookId) {
  if (!reading || reading.bookId === bookId) return reading
  return { ...reading, bookId, bookChanged: true }
}

/**
 * 从持久化里恢复计时器时做一次体检：
 * 手机可能被锁屏或者浏览器被冻结，导致 runningSince 是很久以前。
 * 超过 12 小时视为"误开"，按 8 小时封顶处理，避免污染累计时长。
 */
export function normalizeReading(reading, now) {
  if (!reading) return null
  const live = elapsedSec(reading, now)
  if (live <= SESSION_MAX_SEC) return reading
  return {
    ...reading,
    accumulatedSec: SESSION_MAX_SEC,
    running: false,
    runningSince: null,
    truncated: true,
  }
}

/** 计时器是否已经越过 5 分钟门槛（用于界面上"萤火虫就要亮了"的提示） */
export function willLight(reading, now) {
  return elapsedSec(reading, now) >= 5 * 60
}
