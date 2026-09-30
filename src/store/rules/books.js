import dayjs from 'dayjs'
import { POINT_BOOK_FINISH } from '../constants'
import { uid } from '../../lib/id'
import { buildDay, emptyDay } from './daily'
import { rebuildStreak } from './streak'
import { grantPoints, pointsEntry, withBadges } from './reward'

// ---------------------------------------------------------------- 书籍

export function addBook(state, { title, author = '', totalPages = null, now }) {
  const book = {
    id: uid('bk'),
    title: String(title || '').trim() || '未命名',
    author: String(author || '').trim(),
    totalPages: totalPages == null || totalPages === '' ? null : Math.max(1, Number(totalPages)),
    currentPage: null,
    status: 'reading',
    finishedAt: null,
    createdAt: now,
  }
  return { ...state, books: [book, ...state.books] }
}

export function updateBook(state, id, patch) {
  return {
    ...state,
    books: state.books.map((b) => {
      if (b.id !== id) return b
      const next = { ...b, ...patch }
      if (next.totalPages != null && next.currentPage != null) {
        next.currentPage = Math.min(next.currentPage, next.totalPages)
      }
      return next
    }),
  }
}

/** 删除书籍：只把书从书架拿掉，阅读记录全部保留（记录属于你，不属于书） */
export function deleteBook(state, id) {
  return { ...state, books: state.books.filter((b) => b.id !== id) }
}

/** 手动标记读完（+50 光点，只发一次） */
export function markBookFinished(state, id, now) {
  const book = state.books.find((b) => b.id === id)
  if (!book || book.status === 'finished') return { state, result: null }

  let next = {
    ...state,
    books: state.books.map((b) =>
      b.id === id
        ? {
            ...b,
            status: 'finished',
            finishedAt: now,
            currentPage: b.totalPages != null ? b.totalPages : b.currentPage,
          }
        : b
    ),
  }
  next = {
    ...next,
    points: grantPoints(next.points, [
      pointsEntry({
        at: now,
        delta: POINT_BOOK_FINISH,
        reason: 'book',
        date: dayjs(now).format('YYYY-MM-DD'),
        refId: id,
        note: `读完《${book.title}》`,
      }),
    ]),
  }
  const { state: withBadge, fresh } = withBadges(next, now)
  return {
    state: withBadge,
    result: { bookId: id, title: book.title, pointsGained: POINT_BOOK_FINISH, newBadges: fresh },
  }
}

/** 标回"在读"（不回收已发的光点，不做任何惩罚） */
export function markBookReading(state, id) {
  return {
    ...state,
    books: state.books.map((b) =>
      b.id === id ? { ...b, status: 'reading', finishedAt: null } : b
    ),
  }
}

// ---------------------------------------------------------------- 阅读记录

/** 修正某条记录的页码 / 感想 / 所属书籍 */
export function updateSession(state, sessionId, patch, now) {
  const sessions = state.sessions.map((s) => (s.id === sessionId ? { ...s, ...patch } : s))
  let next = { ...state, sessions }
  const target = next.sessions.find((s) => s.id === sessionId)
  if (target) {
    const prevDay = state.days[target.date] || emptyDay(target.date)
    next = {
      ...next,
      days: { ...next.days, [target.date]: buildDay(target.date, sessions.filter((s) => s.date === target.date), prevDay) },
    }
  }
  const { state: withBadge } = withBadges(next, now)
  return withBadge
}

/**
 * 撤回一条记录（数据修正用）。
 * 处理原则依然是"不惩罚"：光点余额会退回，但累计获得与等级不回退，
 * 已经解锁的徽章也不会被收走。
 */
export function deleteSession(state, sessionId, now) {
  const session = state.sessions.find((s) => s.id === sessionId)
  if (!session) return { state, result: null }

  const sessions = state.sessions.filter((s) => s.id !== sessionId)
  const prevDay = state.days[session.date] || emptyDay(session.date)
  const day = buildDay(session.date, sessions.filter((s) => s.date === session.date), prevDay)

  const days = { ...state.days }
  if (day.sessionIds.length === 0 && !day.rested) delete days[session.date]
  else days[session.date] = day

  const earned = Math.max(0, session.pointsEarned || 0)
  const refund = Math.min(state.points.balance, earned)
  const points = {
    ...state.points,
    balance: state.points.balance - refund,
    ledger: state.points.ledger.map((e) =>
      e.refId === sessionId ? { ...e, voided: true } : e
    ),
  }

  // 书籍进度回退：取剩下会话里最大的页码
  let books = state.books
  if (session.bookId) {
    const remain = sessions.filter((s) => s.bookId === session.bookId && s.endPage != null)
    const maxPage = remain.length ? Math.max(...remain.map((s) => s.endPage)) : null
    books = books.map((b) => (b.id === session.bookId ? { ...b, currentPage: maxPage } : b))
  }

  const tree = { ...state.tree, totalSec: Math.max(0, state.tree.totalSec - session.durationSec) }

  const { streak } = rebuildStreak({ ...state, days }, dayjs(now).format('YYYY-MM-DD'))

  return {
    state: { ...state, sessions, days, points, books, tree, streak },
    result: { sessionId, date: session.date, refunded: refund, dayStillLit: day.lit },
  }
}
