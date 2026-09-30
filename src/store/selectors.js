import dayjs from 'dayjs'
import { LEVELS, REPORT_COPY } from './constants'
import { monthKeys, recentKeys, weekKeys, monthKey, rangeKeys } from '../lib/date'
import { elapsedSec } from './rules/timer'
import { badgeWall } from './rules/badges'
import { streakView } from './rules/streak'
import { treeView } from './rules/tree'
import { stageInfo } from './rules/tree'

/** 等级：由累计获得的光点决定 */
export function levelOf(totalEarned) {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (totalEarned >= LEVELS[i].min) idx = i
  }
  const cur = LEVELS[idx]
  const next = LEVELS[idx + 1] || null
  const span = next ? next.min - cur.min : 1
  const into = next ? totalEarned - cur.min : 1
  return {
    index: idx,
    level: cur,
    next,
    progress: next ? Math.min(1, into / span) : 1,
    toNext: next ? Math.max(0, next.min - totalEarned) : 0,
  }
}

/** 单个会话读了多少页 */
export function pagesOfSession(s) {
  if (s.startPage == null || s.endPage == null) return 0
  return Math.max(0, s.endPage - s.startPage)
}

/**
 * 由原始事实（sessions / days / books / ledger）派生出全部统计量。
 * 徽章判定、报告页、等级、分享卡都从这里取数，保证口径一致。
 */
export function deriveStats(state) {
  const days = state.days || {}
  const sessions = state.sessions || []
  const books = state.books || []
  const now = Date.now()

  let totalSec = 0
  let longestSessionSec = 0
  let totalPages = 0
  let notesCount = 0
  let nightReads = 0
  let earlyReads = 0
  let sessionsCount = 0

  for (const s of sessions) {
    sessionsCount += 1
    totalSec += Math.max(0, s.durationSec || 0)
    longestSessionSec = Math.max(longestSessionSec, s.durationSec || 0)
    totalPages += pagesOfSession(s)
    if ((s.note || '').trim()) notesCount += 1
    const h = dayjs(s.endedAt || s.startedAt).hour()
    if (h >= 22) nightReads += 1
    if (h < 7) earlyReads += 1
  }

  let litDays = 0
  let restedDays = 0
  let maxDaySec = 0
  let morningLitDays = 0
  for (const key of Object.keys(days)) {
    const d = days[key]
    if (d.lit) {
      litDays += 1
      const h = d.litAt ? dayjs(d.litAt).hour() : -1
      if (h >= 5 && h < 8) morningLitDays += 1
    }
    if (d.rested) restedDays += 1
    maxDaySec = Math.max(maxDaySec, d.totalSec || 0)
  }

  const finishedBooks = books.filter((b) => b.status === 'finished').length
  const ledger = (state.points && state.points.ledger) || []

  return {
    totalSec,
    sessionsCount,
    longestSessionSec,
    totalPages,
    notesCount,
    nightReads,
    earlyReads,
    litDays,
    restedDays,
    maxDaySec,
    morningLitDays,
    finishedBooks,
    booksCount: books.length,
    currentStreak: state.streak ? state.streak.current : 0,
    bestStreak: state.streak ? state.streak.best : 0,
    totalEarned: (state.points && state.points.totalEarned) || 0,
    redeemedCount: ledger.filter((e) => e.reason === 'redeem').length,
    firstLitAt: Object.values(days)
      .filter((d) => d.lit && d.litAt)
      .map((d) => d.litAt)
      .sort((a, b) => a - b)[0] || null,
    now,
  }
}

/** 某个日期区间的统计（报告页用） */
export function rangeStats(state, startKey, endKey) {
  // 闭区间：从 startKey 一路到 endKey，两头都算
  const keys = rangeKeys(startKey, endKey)
  const keySet = new Set(keys)
  const sessions = (state.sessions || []).filter((s) => keySet.has(s.date))
  const days = keys.map((k) => state.days[k]).filter(Boolean)

  let totalSec = 0
  let longestSessionSec = 0
  let notesCount = 0
  const bookMap = new Map()
  for (const s of sessions) {
    totalSec += Math.max(0, s.durationSec || 0)
    longestSessionSec = Math.max(longestSessionSec, s.durationSec || 0)
    if ((s.note || '').trim()) notesCount += 1
    if (s.bookId) bookMap.set(s.bookId, (bookMap.get(s.bookId) || 0) + (s.durationSec || 0))
  }

  const litDays = days.filter((d) => d.lit).length
  const restedDays = days.filter((d) => d.rested).length
  const finishedInRange = (state.books || []).filter(
    (b) => b.status === 'finished' && b.finishedAt && keySet.has(dayjs(b.finishedAt).format('YYYY-MM-DD'))
  )

  const dailySeries = keys.map((k) => ({
    date: k,
    totalSec: (state.days[k] && state.days[k].totalSec) || 0,
    lit: !!(state.days[k] && state.days[k].lit),
    rested: !!(state.days[k] && state.days[k].rested),
  }))

  const topBooks = [...bookMap.entries()]
    .map(([id, sec]) => ({ book: (state.books || []).find((b) => b.id === id) || null, sec }))
    .filter((x) => x.book)
    .sort((a, b) => b.sec - a.sec)
    .slice(0, 3)

  return {
    startKey,
    endKey,
    totalSec,
    litDays,
    restedDays,
    finishedBooks: finishedInRange.length,
    longestSessionSec,
    notesCount,
    sessionsCount: sessions.length,
    dailySeries,
    topBooks,
    activeDays: dailySeries.filter((d) => d.totalSec > 0).length,
  }
}

/** 报告页的区间定义 */
export function reportRanges(today) {
  // 自然周固定按"周一开始"算，不依赖 dayjs 的 locale 设置
  const d = dayjs(today)
  const mondayOffset = (d.day() + 6) % 7 // 周一 = 0
  const weekStart = d.subtract(mondayOffset, 'day')
  const wkStartKey = weekStart.format('YYYY-MM-DD')
  const prevWeekStart = weekStart.subtract(7, 'day').format('YYYY-MM-DD')
  const prevWeekEnd = weekStart.subtract(1, 'day').format('YYYY-MM-DD')
  const monthStart = d.startOf('month').format('YYYY-MM-DD')
  const prevMonthStart = d.subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
  const prevMonthEnd = d.subtract(1, 'month').endOf('month').format('YYYY-MM-DD')

  return {
    week: { label: '本周', start: wkStartKey, end: today, full: false },
    month: { label: '本月', start: monthStart, end: today, full: false },
    lastWeek: { label: '上周', start: prevWeekStart, end: prevWeekEnd, full: true },
    all: { label: '全部', start: null, end: today, full: true },
    prevWeek: { start: prevWeekStart, end: prevWeekEnd },
    prevMonth: { start: prevMonthStart, end: prevMonthEnd },
    thisWeekKeys: weekKeys(today),
    thisMonthKeys: monthKeys(today),
    monthKey: monthKey(today),
    recent7: recentKeys(today, 7),
  }
}

/** 家庭页需要的全部派生视图，一次算完 */
export function buildDerived(state) {
  const now = Date.now()
  const stats = deriveStats(state)
  const today = dayjs(now).format('YYYY-MM-DD')
  return {
    today,
    stats,
    streak: streakView(state.streak, state.days, today),
    tree: treeView(state.tree.totalSec, state.tree.lastReadAt, now),
    level: levelOf(state.points.totalEarned),
    badges: badgeWall(state.badges.unlocked, { ...stats, currentStreak: stats.currentStreak }),
    balance: state.points.balance,
    restCards: state.streak.restCards,
    readingElapsed: elapsedSec(state.reading, now),
  }
}

/** 报告页文案：温暖、不施压、不给"目标" */
export function reportCopy(range) {
  // 和 formatDuration 口径一致（不足 1 分钟不进位），避免同一页出现 21 / 22 两个数
  const min = Math.floor(range.totalSec / 60)
  if (range.totalSec <= 0) return REPORT_COPY.empty
  if (min < 60) return REPORT_COPY.tiny(min, range.litDays)
  if (min < 600) return REPORT_COPY.small(min, range.litDays)
  return REPORT_COPY.big(min, range.litDays)
}

/** 书架场景的整体亮度：读得越多，房间越亮（0.18 ~ 0.9） */
export function roomLight(totalSec) {
  const h = totalSec / 3600
  if (h <= 0) return 0.18
  const t = Math.min(1, Math.log10(1 + h) / Math.log10(1 + 60))
  return 0.18 + t * 0.72
}

/** 单本书的派生信息 */
export function bookStats(state, bookId) {
  const sessions = (state.sessions || []).filter((s) => s.bookId === bookId)
  let totalSec = 0
  let pages = 0
  let lastAt = 0
  for (const s of sessions) {
    totalSec += Math.max(0, s.durationSec || 0)
    pages += pagesOfSession(s)
    lastAt = Math.max(lastAt, s.endedAt || 0)
  }
  const book = (state.books || []).find((b) => b.id === bookId) || null
  return {
    book,
    totalSec,
    pages,
    sessionCount: sessions.length,
    lastAt,
    progress:
      book && book.totalPages ? Math.min(1, (book.currentPage || 0) / book.totalPages) : null,
  }
}

export { stageInfo }
