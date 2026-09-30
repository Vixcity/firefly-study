import {
  LIT_THRESHOLD_SEC,
  POINT_LIT,
  POINT_SEC_STEP,
  POINT_DAILY_CAP,
  POINT_BOOK_FINISH,
} from '../constants'

/**
 * 当日按累计时长应得的光点明细。
 * 规则：点亮 +10，每多读 5 分钟 +1，当日（点亮分 + 时长分）封顶 100。
 * 这是个纯函数：同样的累计时长永远得到同样的分数，便于用「差值」算增量。
 */
export function dayPoints(totalSec) {
  const sec = Math.max(0, Math.floor(totalSec || 0))
  const lit = sec >= LIT_THRESHOLD_SEC
  const litPoints = lit ? POINT_LIT : 0
  const timePoints = Math.floor(sec / POINT_SEC_STEP)
  const raw = litPoints + timePoints
  const total = Math.min(raw, POINT_DAILY_CAP)
  return {
    lit,
    litPoints,
    timePoints,
    raw,
    total,
    /** 是否已经顶到当日封顶，UI 用来提示"今天的光点已经收满了" */
    capped: raw >= POINT_DAILY_CAP,
  }
}

/** 增量：当日累计从 prevSec 涨到 nextSec，应追加多少阅读类光点（永不为负） */
export function readingPointsDelta(prevSec, nextSec) {
  return Math.max(0, dayPoints(nextSec).total - dayPoints(prevSec).total)
}

/** 距离下一次"每 5 分钟 +1 光点"还差多少秒，用于结算页的鼓励提示 */
export function secToNextPoint(totalSec) {
  const sec = Math.max(0, Math.floor(totalSec || 0))
  const next = (Math.floor(sec / POINT_SEC_STEP) + 1) * POINT_SEC_STEP
  return next - sec
}

/** 读完一本书的固定奖励（不占当日封顶） */
export const bookFinishBonus = () => POINT_BOOK_FINISH
