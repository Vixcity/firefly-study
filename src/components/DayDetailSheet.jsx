import React, { useMemo, useState } from 'react'
import { Dialog, Toast } from 'antd-mobile'
import { useApp } from '../store/store'
import { Sheet } from './ui/Sheet'
import { BookCover } from './ui/BookCover'
import { Icon } from './icons/Icons'
import { formatDayLabel, formatDuration, formatTime } from '../lib/format'
import { NOTE_MAX } from '../store/constants'
import './daydetail.css'

/**
 * 一天的阅读详情。
 * 点书架上的任意一只萤火虫，看那天的时长、书目和感想。
 */
export function DayDetailSheet({ date, onClose }) {
  const { state, actions } = useApp()
  const [editing, setEditing] = useState(null)

  const day = date ? state.days[date] : null
  const sessions = useMemo(
    () => (state.sessions || []).filter((s) => s.date === date).sort((a, b) => a.startedAt - b.startedAt),
    [state.sessions, date]
  )
  const books = state.books || []
  const bookOf = (id) => books.find((b) => b.id === id) || null

  if (!date) return null

  const status = day && day.lit ? 'lit' : day && day.rested ? 'rest' : 'quiet'
  const statusText =
    status === 'lit' ? '点亮' : status === 'rest' ? '萤火虫休息' : sessions.length ? '还没到 5 分钟' : '安静的一天'

  const askDelete = (s) => {
    Dialog.confirm({
      content: `要撤回 ${formatTime(s.startedAt)} 的这条记录吗？光点余额会退回，已经解锁的徽章和历史最佳都会留着。`,
      confirmText: '撤回',
      cancelText: '再想想',
      onConfirm: () => {
        actions.deleteSession(s.id)
        Toast.show({ content: '这条记录已经撤回' })
      },
    })
  }

  return (
    <>
      <Sheet visible onClose={onClose} title={formatDayLabel(date)}>
        <div className="daydetail__head">
          <span className={`fs-chip ${status === 'lit' ? 'fs-chip--accent' : ''}`}>{statusText}</span>
          <span className="fs-small fs-muted">
            {day && day.totalSec ? `累计 ${formatDuration(day.totalSec)}` : '这天没有阅读记录'}
          </span>
          {day && day.litAt ? (
            <span className="fs-tiny fs-muted">{formatTime(day.litAt)} 亮起</span>
          ) : null}
        </div>

        {day && day.rested ? (
          <div className="daydetail__rest">
            <Icon name="card" size={16} />
            <span>这天用了休憩卡护住连击，萤火虫休息了一下。</span>
          </div>
        ) : null}

        {sessions.length === 0 ? (
          <div className="fs-empty">
            <div className="fs-empty__glyph">
              <Icon name="firefly" size={28} />
            </div>
            这天的书房很安静。
            <br />
            安静的日子也是阅读生活的一部分。
          </div>
        ) : (
          <div className="daydetail__list">
            {sessions.map((s) => {
              const book = bookOf(s.bookId)
              return (
                <div className="daydetail__item" key={s.id}>
                  <div className="daydetail__time fs-num">{formatTime(s.startedAt)}</div>
                  <div className="daydetail__body">
                    <div className="fs-row" style={{ gap: 6 }}>
                      <span className="fs-warm">{formatDuration(s.durationSec)}</span>
                      {s.lit ? <span className="fs-chip fs-chip--accent">点亮</span> : null}
                      {s.pointsEarned ? <span className="fs-chip">+{s.pointsEarned} 光点</span> : null}
                    </div>
                    {book ? (
                      <div className="fs-row" style={{ gap: 8, marginTop: 8 }}>
                        <BookCover title={book.title} size={38} />
                        <div className="fs-grow">
                          <div className="fs-small fs-ellipsis-2">{book.title}</div>
                          {s.startPage != null || s.endPage != null ? (
                            <div className="fs-tiny fs-muted">
                              {s.startPage != null ? `第 ${s.startPage} 页` : ''}
                              {s.endPage != null ? ` → 第 ${s.endPage} 页` : ''}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    {s.note ? <p className="daydetail__note">{s.note}</p> : null}
                    <div className="daydetail__ops">
                      <button type="button" className="fs-btn fs-btn--ghost fs-btn--sm" onClick={() => setEditing(s)}>
                        <Icon name="edit" size={13} />
                        修正
                      </button>
                      <button
                        type="button"
                        className="fs-btn fs-btn--ghost fs-btn--sm fs-btn--danger"
                        onClick={() => askDelete(s)}
                      >
                        <Icon name="trash" size={13} />
                        撤回
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Sheet>

      <SessionEditor session={editing} onClose={() => setEditing(null)} />
    </>
  )
}

/** 修正某条记录的页码 / 感想 / 所属书 */
function SessionEditor({ session, onClose }) {
  const { state, actions } = useApp()
  const [note, setNote] = useState(session ? session.note : '')
  const [startPage, setStartPage] = useState(session && session.startPage != null ? String(session.startPage) : '')
  const [endPage, setEndPage] = useState(session && session.endPage != null ? String(session.endPage) : '')
  const [bookId, setBookId] = useState(session ? session.bookId : null)

  // 换了记录就同步一次表单
  const [lastId, setLastId] = useState(session ? session.id : null)
  if (session && session.id !== lastId) {
    setLastId(session.id)
    setNote(session.note || '')
    setStartPage(session.startPage != null ? String(session.startPage) : '')
    setEndPage(session.endPage != null ? String(session.endPage) : '')
    setBookId(session.bookId || null)
  }

  if (!session) return null

  const save = () => {
    actions.updateSession(session.id, {
      note: note.trim().slice(0, NOTE_MAX),
      startPage: startPage === '' ? null : Number(startPage),
      endPage: endPage === '' ? null : Number(endPage),
      bookId,
    })
    onClose()
    Toast.show({ content: '已经改好了' })
  }

  return (
    <Sheet visible onClose={onClose} title="修正这条记录">
      <div className="fs-field">
        <span className="fs-field__label">书</span>
        <select
          className="fs-input"
          value={bookId || ''}
          onChange={(e) => setBookId(e.target.value || null)}
        >
          <option value="">不指定</option>
          {(state.books || []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
      </div>
      <div className="fs-field">
        <span className="fs-field__label">页码</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="起始"
          value={startPage}
          onChange={(e) => setStartPage(e.target.value)}
        />
        <span className="fs-muted">—</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="结束"
          value={endPage}
          onChange={(e) => setEndPage(e.target.value)}
        />
      </div>
      <div className="fs-field" style={{ alignItems: 'flex-start' }}>
        <span className="fs-field__label" style={{ paddingTop: 8 }}>
          感想
        </span>
        <textarea
          rows={3}
          maxLength={NOTE_MAX}
          style={{ resize: 'none', lineHeight: 1.7 }}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="sheet__footer">
        <button type="button" className="fs-btn fs-btn--ghost" onClick={onClose}>
          取消
        </button>
        <button type="button" className="fs-btn fs-btn--primary" onClick={save}>
          保存
        </button>
      </div>
    </Sheet>
  )
}
