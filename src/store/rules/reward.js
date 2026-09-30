import { uid } from '../../lib/id'
import { deriveStats, levelOf } from '../selectors'
import { evaluateBadges } from './badges'

/**
 * 统一的"发奖励"入口。
 * 任何会让统计量变化的地方（结束阅读、读完书、兑换、导入数据）都走这里，
 * 保证徽章判定口径一致、且已解锁的徽章永不撤销。
 */
export function withBadges(state, now) {
  const ctx = deriveStats(state)
  const fresh = evaluateBadges((state.badges && state.badges.unlocked) || {}, ctx)
  if (!fresh.length) return { state, fresh }
  const unlocked = { ...state.badges.unlocked }
  for (const id of fresh) unlocked[id] = now
  return { state: { ...state, badges: { ...state.badges, unlocked } }, fresh }
}

/** 造一条光点流水 */
export function pointsEntry({ at, delta, reason, date, refId, note }) {
  return { id: uid('pt'), at, delta, reason, date: date || null, refId: refId || null, note: note || '' }
}

/** 增加光点（同时累加 totalEarned，等级只看 totalEarned） */
export function grantPoints(points, entries) {
  const sum = entries.reduce((acc, e) => acc + (e.delta || 0), 0)
  if (sum <= 0) return points
  return {
    ...points,
    balance: points.balance + sum,
    totalEarned: points.totalEarned + sum,
    ledger: [...points.ledger, ...entries],
  }
}

/** 消耗光点（只减 balance，不动 totalEarned，等级不会掉） */
export function spendPoints(points, entries) {
  const sum = entries.reduce((acc, e) => acc + (e.delta || 0), 0)
  if (sum <= 0) return points
  return {
    ...points,
    balance: Math.max(0, points.balance - sum),
    spent: (points.spent || 0) + sum,
    ledger: [...points.ledger, ...entries],
  }
}

/** 等级变化对比，用于结算页提示"升级了" */
export function levelChange(before, after) {
  const a = levelOf(before)
  const b = levelOf(after)
  return { before: a, after: b, up: b.index > a.index }
}
