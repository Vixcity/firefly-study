import { NOTE_MAX, POINT_BOOK_FINISH, POINT_LIT, SESSION_MAX_SEC } from '../constants'
import { uid } from '../../lib/id'
import { buildDay, emptyDay } from './daily'
import { dayPoints } from './points'
import { elapsedSec } from './timer'
import { treeStage } from './tree'
import { streakView } from './streak'
import { grantPoints, levelChange, pointsEntry, withBadges } from './reward'

/**
 * 结束一次阅读 —— 全 App 最核心的一次状态变更。
 * 输入当前状态和结算表单，输出「新状态 + 一份结算结果」，结果用于播放点亮动画。
 * 纯函数：不读时间、不写存储，方便单测。
 */
export function applySessionCompletion(state, payload) {
  const { now } = payload
  const reading = state.reading
  if (!reading) return { state, result: null }

  const durationSec = Math.min(SESSION_MAX_SEC, Math.max(0, elapsedSec(reading, now)))
  const date = reading.date
  const prevDay = state.days[date] || emptyDay(date)
  const prevTotalSec = prevDay.totalSec

  const session = {
    id: reading.sessionId || uid('ses'),
    date,
    startedAt: reading.startedAt,
    endedAt: now,
    durationSec,
    bookId: payload.bookId !== undefined ? payload.bookId : reading.bookId || null,
    startPage: payload.startPage === '' || payload.startPage == null ? null : Number(payload.startPage),
    endPage: payload.endPage === '' || payload.endPage == null ? null : Number(payload.endPage),
    note: String(payload.note || '').trim().slice(0, NOTE_MAX),
    /** 本次是否点着了新的萤火虫（由下面算出） */
    lit: false,
    /** 本次贡献的光点（退款/撤回时用） */
    pointsEarned: 0,
  }

  // ---------- 书籍进度 & 读完判定 ----------
  let books = state.books
  const finishedBookIds = []
  if (session.bookId) {
    books = books.map((b) => {
      if (b.id !== session.bookId) return b
      let next = b
      if (session.endPage != null && (next.currentPage == null || session.endPage > next.currentPage)) {
        next = { ...next, currentPage: session.endPage }
      }
      const reachedEnd =
        next.totalPages != null && next.currentPage != null && next.currentPage >= next.totalPages
      if (reachedEnd && next.status !== 'finished') {
        next = { ...next, status: 'finished', finishedAt: now }
        finishedBookIds.push(next.id)
      }
      return next
    })
  }
  const bookBonus = finishedBookIds.length * POINT_BOOK_FINISH

  // ---------- 当天聚合 ----------
  const sessions = [...state.sessions, session]
  const day = buildDay(
    date,
    sessions.filter((s) => s.date === date),
    prevDay
  )
  const newlyLit = day.lit && !prevDay.lit
  session.lit = newlyLit

  // ---------- 光点 ----------
  const ptsBefore = dayPoints(prevTotalSec).total
  const ptsAfter = dayPoints(day.totalSec).total
  const readingDelta = Math.max(0, ptsAfter - ptsBefore)
  const litDelta = newlyLit ? POINT_LIT : 0
  const timeDelta = Math.max(0, readingDelta - litDelta)
  session.pointsEarned = readingDelta

  const entries = []
  if (litDelta > 0) {
    entries.push(pointsEntry({ at: now, delta: litDelta, reason: 'lit', date, refId: session.id }))
  }
  if (timeDelta > 0) {
    entries.push(pointsEntry({ at: now, delta: timeDelta, reason: 'time', date, refId: session.id }))
  }
  for (const id of finishedBookIds) {
    entries.push(
      pointsEntry({
        at: now,
        delta: POINT_BOOK_FINISH,
        reason: 'book',
        date,
        refId: id,
        note: '读完一本书',
      })
    )
  }

  const pointsGained = readingDelta + bookBonus

  // ---------- 光合树 ----------
  const treeBefore = treeStage(state.tree.totalSec)
  const treeTotalSec = state.tree.totalSec + durationSec
  const treeAfter = treeStage(treeTotalSec)

  // ---------- 组装新状态 ----------
  let next = {
    ...state,
    sessions,
    days: { ...state.days, [date]: day },
    books,
    points: grantPoints(state.points, entries),
    tree: { ...state.tree, totalSec: treeTotalSec, lastReadAt: now },
    reading: null,
  }

  const badges = withBadges(next, now)
  next = badges.state

  const levelBefore = state.points.totalEarned
  const levelAfter = next.points.totalEarned

  return {
    state: next,
    result: {
      sessionId: session.id,
      date,
      durationSec,
      /** 这次结束之后当天的累计时长 */
      dayTotalSec: day.totalSec,
      dayLit: day.lit,
      /** 本次是否点亮了新的萤火虫 */
      newlyLit,
      /** 当天的第一只萤火虫什么时候亮的 */
      litAt: day.litAt,
      pointsGained,
      breakdown: {
        lit: litDelta,
        time: timeDelta,
        book: bookBonus,
        /** 被封顶挡掉的光点，用于结算页温柔提示"今天的光点已经收满了" */
        cappedAway: Math.max(0, dayPoints(day.totalSec).raw - dayPoints(day.totalSec).total),
      },
      finishedBookIds,
      newBadges: badges.fresh,
      treeBefore,
      treeAfter,
      treeGrew: treeAfter > treeBefore,
      level: levelChange(levelBefore, levelAfter),
      streak: streakView(next.streak, next.days, date),
    },
  }
}

/** 放弃本次阅读（不计入记录，一句话都不说，绝不惩罚） */
export function discardReading(state) {
  return { ...state, reading: null }
}
