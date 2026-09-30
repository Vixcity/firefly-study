import { LIT_THRESHOLD_SEC } from '../constants'
import { dayPoints } from './points'

/** 生成一个空的当日记录 */
export function emptyDay(date) {
  return {
    date,
    totalSec: 0,
    sessionIds: [],
    /** 当日是否已点亮（累计阅读 >= 5 分钟） */
    lit: false,
    /** 首次跨过门槛的时刻，用于"点亮时间"展示 */
    litAt: null,
    /** 是否由休憩卡保护（仅护连击，不发当日奖励、不生成萤火虫） */
    rested: false,
    restedBy: null,
    /** 当日已获得的光点（点亮分 + 时长分，含封顶） */
    pointsEarned: 0,
  }
}

/**
 * 根据当天的会话列表重建聚合记录（幂等，可反复调用）。
 * keep 用于保留休憩卡标记这类"非会话派生"的字段。
 */
export function buildDay(date, daySessions, keep) {
  const day = { ...emptyDay(date), ...(keep ? { rested: keep.rested, restedBy: keep.restedBy } : {}) }
  const list = [...(daySessions || [])].sort((a, b) => a.startedAt - b.startedAt)
  day.sessionIds = list.map((s) => s.id)

  let acc = 0
  let litAt = null
  for (const s of list) {
    acc += Math.max(0, s.durationSec || 0)
    if (litAt == null && acc >= LIT_THRESHOLD_SEC) litAt = s.endedAt
  }
  day.totalSec = acc
  const p = dayPoints(acc)
  day.lit = p.lit
  day.litAt = p.lit ? litAt : null
  day.pointsEarned = p.total
  return day
}

/** 把一天的记录写成"被休憩卡保护"的样子（只改标记，不动时长与光点） */
export function markDayRested(day, date) {
  const base = day && day.date === date ? day : emptyDay(date)
  return { ...base, rested: true, restedBy: 'card' }
}

/** 某天是否算作「有效日」：点亮了，或者被休憩卡保护过 */
export const isEffectiveDay = (day) => !!(day && (day.lit || day.rested))

/** 从会话列表里筛出某一天的会话 */
export const sessionsOfDay = (sessions, date) => sessions.filter((s) => s.date === date)
