import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TOUR_STEPS } from '../store/constants'
import { Icon } from './icons/Icons'
import './tour.css'

/**
 * 新手引导巡览。
 *
 * 做法：一层全屏遮罩 + 一个"挖洞"的高亮框，把要讲的那个真实元素圈出来，
 * 旁边跟一张说明卡。每换一步会把目标滚到屏幕中间，再重新量一次位置。
 *
 * 不用第三方引导库：需求很具体（跟着主题变色、能被"减少动效"影响、
 * 要在 520px 的手机容器里居中），自己写反而更可控。
 */
const PAD = 8 // 高亮框比元素大出来的边距

export function TourOverlay({ onDone }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState(null)
  const [place, setPlace] = useState('bottom')
  const [ready, setReady] = useState(false)
  const cardRef = useRef(null)
  const step = TOUR_STEPS[index]
  const last = index === TOUR_STEPS.length - 1

  /** 量一下当前这一步要圈的元素 */
  const measure = useCallback(() => {
    if (!step || !step.target) {
      setRect(null)
      setReady(true)
      return
    }
    const el = document.querySelector(step.target)
    if (!el) {
      setRect(null)
      setReady(true)
      return
    }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step])

  // 换步：先把目标滚进视野，再测量
  useLayoutEffect(() => {
    setReady(false)
    const el = step && step.target ? document.querySelector(step.target) : null
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'auto' })
    }
    // 等一帧让滚动落定
    const raf = requestAnimationFrame(() => {
      measure()
      setReady(true)
    })
    return () => cancelAnimationFrame(raf)
  }, [index, step, measure])

  // 滚动 / 旋屏时跟着重算，别让高亮框跑偏
  useEffect(() => {
    const onChange = () => measure()
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
    }
  }, [measure])

  // 决定说明卡放上面还是下面：空间不够就翻边
  useEffect(() => {
    if (!rect || !ready) return
    const vh = window.innerHeight
    const cardH = cardRef.current ? cardRef.current.offsetHeight : 200
    const below = vh - (rect.top + rect.height + PAD)
    const above = rect.top - PAD
    let next = step.place || 'bottom'
    if (next === 'bottom' && below < cardH + 24 && above > below) next = 'top'
    else if (next === 'top' && above < cardH + 24 && below > above) next = 'bottom'
    setPlace(next)
  }, [rect, ready, step])

  const next = () => (last ? onDone() : setIndex((i) => i + 1))
  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const keyRef = useRef(null)

  // 键盘也能走：方向键切换，Esc 跳过
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'Escape') onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (keyRef.current) keyRef.current.focus()
  })

  if (!step) return null

  const cardStyle = (() => {
    if (!rect) return {}
    const top = place === 'top' ? undefined : rect.top + rect.height + PAD + 14
    const bottom = place === 'top' ? window.innerHeight - rect.top + PAD + 14 : undefined
    return { top, bottom }
  })()

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="新手引导">
      {/* 遮罩 + 挖洞：靠一个超大 box-shadow 把四周压暗，中间留亮 */}
      <div
        className={`tour__hole ${rect ? 'is-active' : ''}`}
        style={
          rect
            ? {
                top: rect.top - PAD,
                left: rect.left - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
              }
            : { display: 'none' }
        }
      />
      {!rect ? <div className="tour__dim" /> : null}

      <div
        className={`tour__card ${rect ? `is-${place}` : 'is-center'} ${ready ? 'is-ready' : ''}`}
        style={cardStyle}
        ref={cardRef}
      >
        <div className="tour__head">
          <span className="tour__step">
            {index + 1} / {TOUR_STEPS.length}
          </span>
          <button type="button" className="tour__skip" onClick={onDone}>
            跳过
          </button>
        </div>

        <h3 className="tour__title">{step.title}</h3>
        <p className="tour__body">{step.body}</p>
        {step.hint ? <p className="tour__hint fs-tiny">{step.hint}</p> : null}

        <div className="tour__foot">
          <div className="tour__dots" aria-hidden="true">
            {TOUR_STEPS.map((s, i) => (
              <span key={s.id} className={`tour__dot ${i === index ? 'is-on' : ''} ${i < index ? 'is-done' : ''}`} />
            ))}
          </div>
          <div className="tour__actions">
            {index > 0 ? (
              <button type="button" className="fs-btn fs-btn--ghost fs-btn--sm" onClick={prev}>
                <Icon name="left" size={14} />
                上一步
              </button>
            ) : null}
            <button
              type="button"
              className="fs-btn fs-btn--primary fs-btn--sm tour__next"
              onClick={next}
              ref={keyRef}
            >
              {last ? '开始使用' : '下一步'}
              {last ? <Icon name="check" size={14} /> : <Icon name="right" size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
