import React, { useMemo, useState } from 'react'
import { Dialog, Toast } from 'antd-mobile'
import { useApp } from '../../store/store'
import { Sheet } from '../../components/ui/Sheet'
import { Segmented } from '../../components/ui/Segmented'
import { BookCover } from '../../components/ui/BookCover'
import { Icon } from '../../components/icons/Icons'
import { bookStats } from '../../store/selectors'
import { POINT_BOOK_FINISH } from '../../store/constants'
import { formatDuration, formatDurationTight } from '../../lib/format'
import './books.css'

/** 书库：把书架上的书管起来，但不必管得很严 */
export function BooksPage({ onStartReading }) {
  const { state, derived, actions } = useApp()
  const [filter, setFilter] = useState('reading')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

  const books = state.books || []
  const statsOf = (id) => bookStats(state, id)

  const list = useMemo(() => {
    const arr = books.filter((b) => (filter === 'all' ? true : b.status === filter))
    return arr
  }, [books, filter])

  const counts = useMemo(
    () => ({
      reading: books.filter((b) => b.status === 'reading').length,
      finished: books.filter((b) => b.status === 'finished').length,
    }),
    [books]
  )

  const askFinish = (b) => {
    Dialog.confirm({
      content: `把《${b.title}》标记为读完？会加 ${POINT_BOOK_FINISH} 光点。`,
      confirmText: '读完了',
      cancelText: '还没有',
      onConfirm: () => {
        const r = actions.finishBook(b.id)
        if (r) Toast.show({ content: `《${b.title}》读完了，+${POINT_BOOK_FINISH} 光点` })
      },
    })
  }

  const askDelete = (b) => {
    Dialog.confirm({
      content: `要把《${b.title}》从书架拿掉吗？阅读记录会全部保留，已经拿到的光点也不会收回。`,
      confirmText: '拿掉',
      cancelText: '留着',
      onConfirm: () => {
        actions.deleteBook(b.id)
        Toast.show({ content: '已经从书架拿掉了' })
      },
    })
  }

  return (
    <div className="fs-page books">
      <header className="fs-topbar">
        <div className="fs-grow">
          <h1 className="fs-topbar__title">书库</h1>
          <p className="fs-topbar__sub">
            在读 {counts.reading} 本 · 读完 {counts.finished} 本 · 累计 {derived.stats.totalPages} 页
          </p>
        </div>
        <button type="button" className="fs-iconbtn" onClick={() => setAdding(true)} aria-label="新增书籍">
          <Icon name="plus" size={20} />
        </button>
      </header>

      <div style={{ margin: '4px 0 var(--fs-s4)' }}>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'reading', label: `在读 ${counts.reading}` },
            { value: 'finished', label: `已读完 ${counts.finished}` },
            { value: 'all', label: '全部' },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <div className="fs-empty">
          <div className="fs-empty__glyph">
            <Icon name="books" size={30} />
          </div>
          {filter === 'finished'
            ? '还没有读完的书。读着读着，总会读完的。'
            : '书架还空着。加一本在读的，或者干脆先开始阅读也可以。'}
          <div style={{ marginTop: 'var(--fs-s4)' }}>
            <button type="button" className="fs-btn fs-btn--primary fs-btn--sm" onClick={() => setAdding(true)}>
              <Icon name="plus" size={15} />
              加一本书
            </button>
          </div>
        </div>
      ) : (
        <div className="books__list fs-stagger">
          {list.map((b) => {
            const s = statsOf(b.id)
            const pct = s.progress != null ? Math.round(s.progress * 100) : null
            return (
              <article className="fs-card books__item" key={b.id}>
                <div className="fs-row" style={{ alignItems: 'flex-start' }}>
                  <BookCover title={b.title} size={72} />
                  <div className="fs-grow">
                    <div className="fs-row" style={{ gap: 6 }}>
                      <h3 className="books__title fs-ellipsis">{b.title}</h3>
                      {b.status === 'finished' ? <span className="fs-chip fs-chip--ok">已读完</span> : null}
                    </div>
                    <div className="fs-tiny fs-muted">{b.author || '未填作者'}</div>

                    <div className="books__meta">
                      <span>
                        <Icon name="timer" size={12} />
                        {s.totalSec ? formatDurationTight(s.totalSec) : '还没读过'}
                      </span>
                      <span>
                        <Icon name="play" size={12} />
                        {s.sessionCount} 次
                      </span>
                      {b.totalPages != null ? (
                        <span>
                          <Icon name="pages" size={12} />
                          {b.currentPage || 0}/{b.totalPages} 页
                        </span>
                      ) : null}
                      {s.pages ? <span>读过 {s.pages} 页</span> : null}
                    </div>

                    {pct != null ? (
                      <div className="pbar pbar--thin" style={{ marginTop: 8 }}>
                        <div className="pbar__fill" style={{ width: `${pct}%` }} />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="books__ops">
                  <button type="button" className="fs-btn fs-btn--ghost fs-btn--sm" onClick={onStartReading}>
                    <Icon name="play" size={13} />
                    去读
                  </button>
                  {b.status === 'reading' ? (
                    <button type="button" className="fs-btn fs-btn--ghost fs-btn--sm" onClick={() => askFinish(b)}>
                      <Icon name="check" size={13} />
                      标记读完
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="fs-btn fs-btn--ghost fs-btn--sm"
                      onClick={() => actions.unfinishBook(b.id)}
                    >
                      <Icon name="undo" size={13} />
                      标回在读
                    </button>
                  )}
                  <button type="button" className="fs-btn fs-btn--ghost fs-btn--sm" onClick={() => setEditing(b)}>
                    <Icon name="edit" size={13} />
                    编辑
                  </button>
                  <button
                    type="button"
                    className="fs-btn fs-btn--ghost fs-btn--sm fs-btn--danger"
                    onClick={() => askDelete(b)}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* 记录一览：读完的书、读过的时长都在这儿 */}
      {derived.stats.notesCount ? (
        <section className="fs-card" style={{ marginTop: 'var(--fs-s5)' }}>
          <div className="fs-card__title">
            <Icon name="pen" size={16} />
            写下的感想
            <span className="fs-muted fs-tiny">{derived.stats.notesCount} 条</span>
          </div>
          <div className="books__notes">
            {state.sessions
              .filter((s) => (s.note || '').trim())
              .slice(-3)
              .reverse()
              .map((s) => (
                <div className="books__note" key={s.id}>
                  <span className="books__note-date">{s.date.slice(5)}</span>
                  <p>{s.note}</p>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      <div className="fs-safe-bottom" />

      <BookForm
        visible={adding}
        onClose={() => setAdding(false)}
        onSubmit={(data) => {
          actions.addBook(data)
          setAdding(false)
          Toast.show({ content: '已经放进书架了' })
        }}
      />

      <BookForm
        visible={!!editing}
        book={editing}
        onClose={() => setEditing(null)}
        onSubmit={(data) => {
          actions.updateBook(editing.id, data)
          setEditing(null)
          Toast.show({ content: '已经改好了' })
        }}
      />

      {state.books.length === 0 ? (
        <p className="fs-tiny fs-muted fs-center" style={{ marginTop: 'var(--fs-s5)', lineHeight: 1.9 }}>
          提示：加书时填了总页数，才能看到进度条和"万页征程"徽章的进度。
        </p>
      ) : (
        <p className="fs-tiny fs-muted fs-center" style={{ marginTop: 'var(--fs-s5)', lineHeight: 1.9 }}>
          累计读过的页数：{derived.stats.totalPages} 页 · 最长一次 {formatDuration(derived.stats.longestSessionSec)}
        </p>
      )}
    </div>
  )
}

/** 新增 / 编辑书籍 */
function BookForm({ visible, book, onClose, onSubmit }) {
  const [form, setForm] = useState({ title: '', author: '', totalPages: '', currentPage: '' })
  const [lastId, setLastId] = useState(null)

  const key = book ? book.id : 'new'
  if (visible && lastId !== key) {
    setLastId(key)
    setForm({
      title: book ? book.title : '',
      author: book ? book.author || '' : '',
      totalPages: book && book.totalPages != null ? String(book.totalPages) : '',
      currentPage: book && book.currentPage != null ? String(book.currentPage) : '',
    })
  }
  if (!visible) return null

  const submit = () => {
    if (!form.title.trim()) {
      Toast.show({ content: '给这本书起个名字吧' })
      return
    }
    onSubmit({
      title: form.title.trim(),
      author: form.author.trim(),
      totalPages: form.totalPages === '' ? null : Number(form.totalPages),
      ...(form.currentPage === '' ? {} : { currentPage: Number(form.currentPage) }),
    })
  }

  return (
    <Sheet visible onClose={onClose} title={book ? '编辑这本书' : '加一本想读的书'}>
      <div className="fs-field">
        <span className="fs-field__label">书名</span>
        <input
          placeholder="必填"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div className="fs-field">
        <span className="fs-field__label">作者</span>
        <input
          placeholder="选填"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
        />
      </div>
      <div className="fs-field">
        <span className="fs-field__label">总页数</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="选填"
          value={form.totalPages}
          onChange={(e) => setForm({ ...form, totalPages: e.target.value })}
        />
      </div>
      <div className="fs-field">
        <span className="fs-field__label">读到第几页</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="选填"
          value={form.currentPage}
          onChange={(e) => setForm({ ...form, currentPage: e.target.value })}
        />
      </div>
      <div className="sheet__footer">
        <button type="button" className="fs-btn fs-btn--ghost" onClick={onClose}>
          取消
        </button>
        <button type="button" className="fs-btn fs-btn--primary" onClick={submit}>
          保存
        </button>
      </div>
    </Sheet>
  )
}
