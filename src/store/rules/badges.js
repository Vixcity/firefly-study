import { BADGES, BADGE_MAP } from '../catalog'

/**
 * 徽章判定的度量对照表：徽章 id -> [统计字段, 目标值]。
 * 用进度条展示"还差一点点"，让未解锁的徽章看起来是"快到了"，而不是"你没做到"。
 */
const METRIC = {
  first_light: ['litDays', 1],
  spark_three: ['bestStreak', 3],
  tower_seven: ['bestStreak', 7],
  persist_thirty: ['bestStreak', 30],
  river_hundred: ['bestStreak', 100],
  rest_keeper: ['restedDays', 1],
  deep_plow: ['longestSessionSec', 60 * 60],
  one_sitting: ['maxDaySec', 60 * 60],
  ten_hours: ['totalSec', 10 * 3600],
  fifty_hours: ['totalSec', 50 * 3600],
  hundred_hours: ['totalSec', 100 * 3600],
  night_reader: ['nightReads', 1],
  morning_reader: ['earlyReads', 1],
  five_am: ['morningLitDays', 5],
  note_keeper: ['notesCount', 10],
  finish_one: ['finishedBooks', 1],
  finish_five: ['finishedBooks', 5],
  thousand_pages: ['totalPages', 1000],
  lit_thirty: ['litDays', 30],
  point_thousand: ['totalEarned', 1000],
  collector: ['redeemedCount', 1],
}

/** 找出这一轮新解锁的徽章 id（已解锁的永不撤销） */
export function evaluateBadges(unlocked, ctx) {
  const fresh = []
  for (const badge of BADGES) {
    if (unlocked[badge.id]) continue
    let ok = false
    try {
      ok = !!badge.check(ctx)
    } catch {
      ok = false
    }
    if (ok) fresh.push(badge.id)
  }
  return fresh
}

/** 徽章进度：0~1 以及一句"还差多少" */
export function badgeProgress(badgeId, ctx) {
  const badge = BADGE_MAP[badgeId]
  const metric = METRIC[badgeId]
  if (!badge) return { ratio: 0, cur: 0, target: 1, text: '' }
  if (!metric) return { ratio: 0, cur: 0, target: 1, text: badge.desc }
  const [field, target] = metric
  const cur = Math.max(0, ctx[field] || 0)
  const ratio = Math.min(1, cur / target)
  const remain = Math.max(0, target - cur)
  return {
    ratio,
    cur,
    target,
    remain,
    text: remain === 0 ? badge.desc : `还差 ${formatRemain(field, remain)}`,
  }
}

function formatRemain(field, remain) {
  if (field.endsWith('Sec')) {
    const m = Math.ceil(remain / 60)
    if (remain >= 3600) return `${Math.round((remain / 3600) * 10) / 10} 小时`
    return `${m} 分钟`
  }
  if (field === 'totalPages') return `${remain} 页`
  if (field === 'bestStreak') return `${remain} 天连击`
  if (field === 'litDays') return `${remain} 天点亮`
  return `${remain}`
}

/** 徽章墙数据：已获得按时间倒序在前，未获得按完成度倒序在后 */
export function badgeWall(unlocked, ctx) {
  const got = []
  const locked = []
  for (const badge of BADGES) {
    const at = unlocked[badge.id]
    if (at) got.push({ ...badge, unlockedAt: at })
    else locked.push({ ...badge, ...badgeProgress(badge.id, ctx) })
  }
  got.sort((a, b) => b.unlockedAt - a.unlockedAt)
  locked.sort((a, b) => b.ratio - a.ratio)
  return { got, locked, total: BADGES.length, gotCount: got.length }
}
