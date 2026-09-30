import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, Toast } from 'antd-mobile'
import { useApp } from '../store/store'
import { elapsedSec } from '../store/rules/timer'
import { LIT_THRESHOLD_SEC, NOTE_MAX, POINT_SEC_STEP } from '../store/constants'
import { useNow } from '../hooks/useNow'
import { Ring } from './ui/Ring'
import { Sheet } from './ui/Sheet'
import { BookCover } from './ui/BookCover'
import { Icon } from './icons/Icons'
import { formatClock, formatDuration, formatMinutes } from '../lib/format'
import './reading.css'

/** 计时进行时尽量别让屏幕熄灭：能用就用，不能用也不打扰用户 */
function useWakeLock(active) {
  const ref = useRef(null)
  useEffect(() => {
    let cancelled = false
    const request = async () => {
      try {
        if (active && 'wakeLock' in navigator) {
          const sentinel = await navigator.wakeLock.request('screen')
          if (cancelled) sentinel.release?.()
          else ref.current = sentinel
        }
      } catch {
        /* 不支持或被拒绝都没关系 */
      }
    }
    request()
    return () => {
      cancelled = true
      try {
        ref.current?.release?.()
      } catch {
        /* ignore */
      }
      ref.current = null
    }
  }, [active])
}

export function ReadingFlow({ onFinish }) {
  const { state, actions } = useApp()
  const reading = state.reading
  const books = state.books
  const running = !!(reading && reading.running)
  const now = useNow(1000, running)

  const [phase, setPhase] = useState('timer')
  const [bookId, setBookId] = useState(reading ? reading.bookId : null)
  const [startPage, setStartPage] = useState('')
  const [endPage, setEndPage] = useState('')
  const [note, setNote] = useState('')
  const [bookSheet, setBookSheet] = useState(false)
  const [newBook, setNewBook] = useState({ title: '', author: '', totalPages: '' })

  useWakeLock(running && phase === 'timer')

  const elapsed = reading ? elapsedSec(reading, now) : 0
  const lit = elapsed >= LIT_THRESHOLD_SEC
  const book = useMemo(() => books.find((b) => b.id === bookId) || null, [books, bookId])

  // 目标环：还没点亮时是"到 5 分钟的距离"，点亮之后是"下一个光点"的进度
  const progress = lit
    ? (elapsed % POINT_SEC_STEP) / POINT_SEC_STEP
    : Math.min(1, elapsed / LIT_THRESHOLD_SEC)
  const toLight = Math.max(0, LIT_THRESHOLD_SEC - elapsed)
  const toNextPoint = POINT_SEC_STEP - (elapsed % POINT_SEC_STEP)

  useEffect(() => {
    if (reading && reading.bookId && !bookId) setBookId(reading.bookId)
  }, [reading, bookId])

  if (!reading) return null

  const askCancel = () => {
    Dialog.confirm({
      content: elapsed < 60
        ? '这一段就不留下了，随时可以再来读。'
        : `已经读了 ${formatDuration(elapsed)}，要离开吗？这一段不会留下记录。`,
      confirmText: '继续阅读',
      cancelText: '离开',
      onConfirm: () => {},
      onCancel: () => actions.cancelReading(),
    })
  }

  const openSettle = () => {
    if (elapsed <= 0) {
      Toast.show({ content: '还没有开始计时，先读一会儿吧' })
      return
    }
    // 进入结算就把计时停下：填表的时间不算阅读时间
    if (reading.running) actions.pauseReading()
    // 预填进度：以书上已有的页码作为起始页
    if (book && book.currentPage != null && startPage === '') setStartPage(String(book.currentPage))
    setPhase('settle')
  }

  const submit = (skipDetail = false) => {
    const payload = skipDetail
      ? { bookId: null, startPage: null, endPage: null, note: '' }
      : {
          bookId,
          startPage: startPage === '' ? null : Number(startPage),
          endPage: endPage === '' ? null : Number(endPage),
          note,
        }
    const result = actions.finishReading(payload)
    if (result && onFinish) onFinish(result)
  }

  const createBook = () => {
    if (!newBook.title.trim()) {
      Toast.show({ content: '给这本书起个名字吧' })
      return
    }
    actions.addBook({
      title: newBook.title.trim(),
      author: newBook.author.trim(),
      totalPages: newBook.totalPages === '' ? null : Number(newBook.totalPages),
    })
    // addBook 后新书在列表首位
    const created = actions.getState().books[0]
    setBookId(created.id)
    setNewBook({ title: '', author: '', totalPages: '' })
    setBookSheet(false)
    Toast.show({ content: '已经放进书架了' })
  }

  return (
    <div className="reading" role="dialog" aria-modal="true">
      <div className="reading__glow" />

      {phase === 'timer' ? (
        <>
          <div className="reading__top">
            <button type="button" className="fs-iconbtn" onClick={askCancel} aria-label="离开计时">
              <Icon name="left" size={20} />
            </button>
            <button type="button" className="reading__bookchip" onClick={() => setBookSheet(true)}>
              <Icon name="book" size={15} />
              <span className="fs-ellipsis">{book ? book.title : '选择所读的书'}</span>
            </button>
          </div>

          <div className="reading__center">
            <Ring size={252} stroke={10} progress={progress} glow={lit} ticks={12}>
              <div className="reading__clock">
                <div className="reading__time fs-display">{formatClock(elapsed)}</div>
                <div className="reading__state">
                  {lit ? (
                    <>
                      <span className="fs-warm">今天的萤火虫已经亮了</span>
                      <span className="fs-muted fs-tiny">再读 {formatMinutes(toNextPoint)} +1 光点</span>
                    </>
                  ) : (
                    <>
                      <span className="fs-muted-2">再读 {formatMinutes(toLight)} 点亮今天</span>
                      <span className="fs-muted fs-tiny">满 5 分钟就算点亮</span>
                    </>
                  )}
                </div>
              </div>
            </Ring>

            <div className="reading__hint">
              {running ? '屏幕亮着就好，安心读' : '已暂停 · 想继续时再点一下'}
            </div>
          </div>

          <div className="reading__bottom">
            <button
              type="button"
              className="fs-btn reading__pause"
              onClick={() => (running ? actions.pauseReading() : actions.resumeReading())}
            >
              <Icon name={running ? 'pause' : 'play'} size={18} />
              {running ? '暂停' : '继续'}
            </button>
            <button type="button" className="fs-btn fs-btn--primary reading__done" onClick={openSettle}>
              <Icon name="check" size={18} />
              结束阅读
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="reading__top">
            <button type="button" className="fs-iconbtn" onClick={() => setPhase('timer')} aria-label="返回计时">
              <Icon name="left" size={20} />
            </button>
            <div className="reading__bookchip reading__bookchip--static">
              <Icon name="timer" size={15} />
              <span>本次 {formatDuration(elapsed)}</span>
            </div>
          </div>

          <div className="reading__form fs-noscroll">
            <h2 className="reading__formtitle">记一下这一会儿</h2>
            <p className="fs-tiny fs-muted">都可以不填，直接保存也完全没问题。</p>

            <div className="fs-card" style={{ marginTop: 'var(--fs-s4)' }}>
              <button type="button" className="row row--tap shelfpick" onClick={() => setBookSheet(true)}>
                {book ? <BookCover title={book.title} size={44} /> : <div className="shelfpick__empty"><Icon name="book" size={20} /></div>}
                <div className="row__main">
                  <div className="row__title fs-ellipsis">{book ? book.title : '不指定书目'}</div>
                  <div className="row__sub">
                    {book
                      ? book.author || (book.currentPage != null ? `读到第 ${book.currentPage} 页` : '书架里的书')
                      : '点一下从书架里选，或者新增一本'}
                  </div>
                </div>
                <Icon name="right" size={16} className="fs-muted" />
              </button>

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
                  placeholder="一句话就够，写给以后的自己"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ resize: 'none', lineHeight: 1.7 }}
                />
              </div>
              <div className="fs-tiny fs-muted fs-center" style={{ marginTop: 4 }}>
                {note.length} / {NOTE_MAX}
              </div>
            </div>

            <div className="reading__formactions">
              <button type="button" className="fs-btn fs-btn--primary" onClick={() => submit(false)}>
                保存并点亮
              </button>
              <button type="button" className="fs-btn fs-btn--ghost" onClick={() => submit(true)}>
                不填了，直接保存
              </button>
            </div>
          </div>
        </>
      )}

      {/* 选书 / 新增书 */}
      <Sheet visible={bookSheet} onClose={() => setBookSheet(false)} title="所读的书">
        <div className="bookpick">
          <button
            type="button"
            className={`bookpick__item ${!bookId ? 'is-on' : ''}`}
            onClick={() => {
              setBookId(null)
              setBookSheet(false)
            }}
          >
            <div className="shelfpick__empty">
              <Icon name="close" size={18} />
            </div>
            <div className="row__main">
              <div className="row__title">不指定书目</div>
              <div className="row__sub">只是想安静读一会儿也很好</div>
            </div>
          </button>

          {books.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`bookpick__item ${bookId === b.id ? 'is-on' : ''}`}
              onClick={() => {
                setBookId(b.id)
                setBookSheet(false)
              }}
            >
              <BookCover title={b.title} size={44} />
              <div className="row__main">
                <div className="row__title fs-ellipsis">{b.title}</div>
                <div className="row__sub">
                  {b.author || '未填作者'}
                  {b.status === 'finished' ? ' · 已读完' : b.currentPage != null ? ` · 第 ${b.currentPage} 页` : ''}
                </div>
              </div>
              {bookId === b.id ? <Icon name="check" size={16} className="fs-warm" /> : null}
            </button>
          ))}
        </div>

        <div className="fs-hr" />
        <div className="fs-small fs-muted-2" style={{ marginBottom: 8 }}>
          书架上还没有？现在加一本
        </div>
        <div className="fs-field">
          <span className="fs-field__label">书名</span>
          <input
            placeholder="必填"
            value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
          />
        </div>
        <div className="fs-field">
          <span className="fs-field__label">作者</span>
          <input
            placeholder="选填"
            value={newBook.author}
            onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
          />
        </div>
        <div className="fs-field">
          <span className="fs-field__label">总页数</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="选填，填了才能算进度"
            value={newBook.totalPages}
            onChange={(e) => setNewBook({ ...newBook, totalPages: e.target.value })}
          />
        </div>
        <div className="sheet__footer">
          <button type="button" className="fs-btn fs-btn--ghost" onClick={() => setBookSheet(false)}>
            取消
          </button>
          <button type="button" className="fs-btn fs-btn--primary" onClick={createBook}>
            放进书架
          </button>
        </div>
      </Sheet>
    </div>
  )
}
