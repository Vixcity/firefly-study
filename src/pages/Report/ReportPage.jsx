import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Toast } from 'antd-mobile'
import { useApp } from '../../store/store'
import { Segmented } from '../../components/ui/Segmented'
import { BarChart } from '../../components/ui/BarChart'
import { Sheet } from '../../components/ui/Sheet'
import { Icon } from '../../components/icons/Icons'
import { reportCopy, reportRanges, rangeStats } from '../../store/selectors'
import { formatDayLabel, formatDuration, formatDurationTight, formatHours } from '../../lib/format'
import { downloadDataUrl, renderShareCard, shareOrDownload } from '../../lib/shareCard'
import './report.css'

/** 报告：周报 / 月报 + 分享卡片 */
export function ReportPage() {
  const { state, derived } = useApp()
  const ranges = useMemo(() => reportRanges(derived.today), [derived.today])
  const [period, setPeriod] = useState('week')
  const [cardUrl, setCardUrl] = useState(null)
  const [busy, setBusy] = useState(false)

  const range =
    period === 'week'
      ? ranges.week
      : period === 'month'
        ? ranges.month
        : period === 'lastWeek'
          ? ranges.lastWeek
          : { label: '全部', start: earliestKey(state), end: derived.today, full: true }

  const stats = useMemo(
    () => (range.start ? rangeStats(state, range.start, range.end) : null),
    [state, range]
  )

  const copy = stats ? reportCopy(stats) : ''

  const makeCard = async () => {
    if (!stats || stats.totalSec <= 0) {
      Toast.show({ content: '这几天还没有阅读记录，先读一会儿再来生成吧' })
      return
    }
    setBusy(true)
    try {
      const url = renderShareCard({ range: stats, copy })
      setCardUrl(url)
    } catch (e) {
      Toast.show({ content: '卡片生成失败了，稍后再试试' })
    } finally {
      setBusy(false)
    }
  }

  const doShare = async () => {
    const text = `萤火书房 · ${range.label}${stats.litDays} 只萤火虫，${Math.round(stats.totalSec / 60)} 分钟。${copy}`
    const r = await shareOrDownload(text, cardUrl, `萤火书房-${range.label}.png`)
    if (r === 'downloaded') Toast.show({ content: '图片已保存到下载目录' })
  }

  return (
    <div className="fs-page report">
      <header className="fs-topbar">
        <div className="fs-grow">
          <h1 className="fs-topbar__title">报告</h1>
          <p className="fs-topbar__sub">
            {range.label}
            {range.start ? ` · ${formatDayLabel(range.start)} 起` : ''}
          </p>
        </div>
      </header>

      <Segmented
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'week', label: '本周' },
          { value: 'month', label: '本月' },
          { value: 'lastWeek', label: '上周' },
          { value: 'all', label: '全部' },
        ]}
      />

      {!stats || stats.totalSec === 0 ? (
        <div className="fs-empty">
          <div className="fs-empty__glyph">
            <Icon name="chart" size={30} />
          </div>
          {copy}
        </div>
      ) : (
        <>
          {/* ---- 主指标 ---- */}
          <section className="fs-card fs-card--glow report__hero">
            <div className="report__hero-label">{range.label}累计阅读</div>
            <div className="report__hero-value">
              <span className="fs-display">{formatHours(stats.totalSec)}</span>
              <span className="report__hero-unit">小时</span>
            </div>
            <div className="fs-tiny fs-muted">{formatDuration(stats.totalSec)}</div>

            <div className="report__grid">
              <Metric label="点亮萤火虫" value={stats.litDays} unit="只" glyph="firefly" />
              <Metric label="读完书目" value={stats.finishedBooks} unit="本" glyph="bookcheck" />
              <Metric label="阅读次数" value={stats.sessionsCount} unit="次" glyph="timer" />
              <Metric
                label="最长单次"
                value={Math.round(stats.longestSessionSec / 60)}
                unit="分钟"
                glyph="bolt"
              />
            </div>

            <p className="report__copy">{copy}</p>

            {stats.restedDays ? (
              <p className="fs-tiny fs-muted report__rest">
                其中 {stats.restedDays} 天用了休憩卡，萤火虫休息了一下，连击没有断。
              </p>
            ) : null}
          </section>

          {/* ---- 每日柱状图 ---- */}
          <section className="fs-card report__chart">
            <div className="fs-card__title">
              <Icon name="chart" size={16} />
              每天读了多久
              <span className="fs-muted fs-tiny">
                最多的一天 {formatDurationTight(Math.max(...stats.dailySeries.map((d) => d.totalSec)))}
              </span>
            </div>
            <BarChart
              data={stats.dailySeries}
              height={104}
              labelEvery={period === 'month' || period === 'all' ? 3 : 1}
            />
          </section>

          {/* ---- 读得最多的书 ---- */}
          {stats.topBooks.length ? (
            <section className="fs-card report__books">
              <div className="fs-card__title">
                <Icon name="books" size={16} />
                这段时间读得最多的
              </div>
              {stats.topBooks.map(({ book, sec }) => (
                <div className="row" key={book.id}>
                  <div className="row__glyph">
                    <Icon name="book" size={17} />
                  </div>
                  <div className="row__main">
                    <div className="row__title fs-ellipsis">{book.title}</div>
                    <div className="row__sub">{book.author || '未填作者'}</div>
                  </div>
                  <span className="row__value">{formatDurationTight(sec)}</span>
                </div>
              ))}
            </section>
          ) : null}

          {/* ---- 分享 ---- */}
          <section className="fs-card report__share">
            <div className="fs-card__title">
              <Icon name="share" size={16} />
              做一张分享卡
            </div>
            <p className="fs-tiny fs-muted" style={{ marginTop: -6, lineHeight: 1.8 }}>
              一张夜书房风格的卡片，带上这段时间的数据和一句话。
            </p>
            <button
              type="button"
              className="fs-btn fs-btn--primary fs-btn--block"
              style={{ marginTop: 'var(--fs-s3)' }}
              onClick={makeCard}
              disabled={busy}
            >
              <Icon name="spark" size={17} />
              {busy ? '正在画卡片…' : '生成分享卡'}
            </button>
          </section>
        </>
      )}

      {/* ---- 累计总结 ---- */}
      <section className="fs-card report__total">
        <div className="fs-card__title">
          <Icon name="lamp" size={16} />
          从开始到现在
        </div>
        <div className="report__total-grid">
          <TotalItem label="累计阅读" value={formatDuration(derived.stats.totalSec)} />
          <TotalItem label="累计点亮" value={`${derived.stats.litDays} 天`} />
          <TotalItem label="读完的书" value={`${derived.stats.finishedBooks} 本`} />
          <TotalItem label="读书页数" value={`${derived.stats.totalPages} 页`} />
          <TotalItem label="历史最佳连击" value={`${derived.stats.bestStreak} 天`} />
          <TotalItem label="最喜欢的时间" value={favoriteTime(state)} />
        </div>
      </section>

      <div className="fs-safe-bottom" />

      <Sheet visible={!!cardUrl} onClose={() => setCardUrl(null)} title="分享卡片">
        {cardUrl ? (
          <>
            <img className="report__cardimg" src={cardUrl} alt="萤火书房分享卡片" />
            <div className="sheet__footer" style={{ flexDirection: 'column' }}>
              <button type="button" className="fs-btn fs-btn--primary" onClick={doShare}>
                <Icon name="share" size={17} />
                保存 / 分享
              </button>
              <button
                type="button"
                className="fs-btn fs-btn--ghost"
                onClick={() => {
                  downloadDataUrl(cardUrl, `萤火书房-${range.label}.png`)
                  Toast.show({ content: '图片已保存到下载目录' })
                }}
              >
                <Icon name="download" size={17} />
                直接下载图片
              </button>
              <button
                type="button"
                className="fs-btn fs-btn--ghost"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(copy)
                    Toast.show({ content: '文案已经复制' })
                  } catch {
                    Toast.show({ content: '复制失败，长按图片保存也可以' })
                  }
                }}
              >
                <Icon name="pen" size={17} />
                只复制文案
              </button>
            </div>
          </>
        ) : null}
      </Sheet>
    </div>
  )
}

function Metric({ label, value, unit, glyph }) {
  return (
    <div className="report__metric">
      <div className="report__metric-label">
        <Icon name={glyph} size={11} />
        {label}
      </div>
      <div className="report__metric-value">
        <span className="fs-display fs-num">{value}</span>
        <span className="report__metric-unit">{unit}</span>
      </div>
    </div>
  )
}

function TotalItem({ label, value }) {
  return (
    <div className="report__total-item">
      <span className="fs-tiny fs-muted">{label}</span>
      <span className="fs-num">{value}</span>
    </div>
  )
}

function earliestKey(state) {
  const keys = Object.keys(state.days || {}).sort()
  if (keys.length) return keys[0]
  return dayjs(state.createdAt || Date.now()).format('YYYY-MM-DD')
}

/** 统计"最常在哪个时段读书"，给用户一点自我观察 */
function favoriteTime(state) {
  const sessions = state.sessions || []
  if (!sessions.length) return '还没有数据'
  const buckets = { 清晨: 0, 上午: 0, 午后: 0, 傍晚: 0, 夜里: 0 }
  for (const s of sessions) {
    const h = new Date(s.endedAt || s.startedAt).getHours()
    if (h < 7) buckets['清晨'] += s.durationSec
    else if (h < 12) buckets['上午'] += s.durationSec
    else if (h < 17) buckets['午后'] += s.durationSec
    else if (h < 21) buckets['傍晚'] += s.durationSec
    else buckets['夜里'] += s.durationSec
  }
  const top = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0]
  return top[1] > 0 ? top[0] : '还没有数据'
}
