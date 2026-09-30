import dayjs from 'dayjs'
import { makeRng, rngRange } from './rand'
import { formatDayLabel } from './format'

/**
 * 生成分享卡片。
 * 用 canvas 画一张夜书房风格的图：数据 + 一点点场景 + 一句温暖的话。
 * 不依赖任何图片资源，直接导出 PNG。
 */

const W = 900
const H = 1200

/** 读取主题色（从 :root 上算好的 CSS 变量里取，保证和界面一致） */
function themeColors() {
  const cs = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
  const get = (name, fallback) => {
    const v = cs ? cs.getPropertyValue(name).trim() : ''
    return v || fallback
  }
  return {
    f1: get('--fs-f1', '#ffe9b0'),
    f2: get('--fs-f2', '#ffd98a'),
    f3: get('--fs-f3', '#f2b94b'),
    accent: get('--fs-accent', '#ffd98a'),
    leaf: get('--fs-leaf', '#7fc9a3'),
  }
}

export function renderShareCard({ range, copy, title = '萤火书房' }) {
  const c = themeColors()
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // ---- 背景 ----
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#141d33')
  bg.addColorStop(0.5, '#0a0f1c')
  bg.addColorStop(1, '#05070e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(W * 0.72, H * 0.24, 20, W * 0.72, H * 0.24, W * 0.72)
  glow.addColorStop(0, `${hexA(c.accent, 0.22)}`)
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // ---- 书架剪影：压到底部做背景，别抢文字的戏 ----
  const shelfTop = H * 0.72
  const shelfH = H * 0.19
  ctx.save()
  ctx.globalAlpha = 0.26
  for (let row = 0; row < 3; row += 1) {
    const y = shelfTop + (row * shelfH) / 3
    ctx.fillStyle = 'rgba(96,74,54,0.8)'
    ctx.fillRect(56, y + (shelfH / 3) * 0.8, W - 112, 5)
    let x = 70
    const rng = makeRng(`share-shelf-${row}`)
    while (x < W - 76) {
      const bw = rngRange(rng, 12, 24)
      const bh = rngRange(rng, (shelfH / 3) * 0.42, (shelfH / 3) * 0.76)
      const hue = Math.floor(rngRange(rng, 0, 360))
      ctx.fillStyle = `hsl(${hue} 20% 30%)`
      ctx.fillRect(x, y + (shelfH / 3) * 0.8 - bh, bw, bh)
      x += bw + 5
    }
  }
  ctx.restore()

  // ---- 萤火虫 ----
  const rngFly = makeRng(`share-${range.startKey}-${range.endKey}`)
  const count = Math.max(6, Math.min(30, range.litDays))
  for (let i = 0; i < count; i += 1) {
    // 偏向左侧书房区，且都落在上半部分（下半部分留给文案）
    const fx = W * 0.06 + Math.pow(rngFly(), 1.4) * W * 0.8
    const fy = rngRange(rngFly, H * 0.07, H * 0.5)
    const r = rngRange(rngFly, 3, 7)
    const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r * 7)
    g.addColorStop(0, hexA(c.f1, 1))
    g.addColorStop(0.24, hexA(c.f2, 0.6))
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(fx, fy, r * 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = c.f1
    ctx.beginPath()
    ctx.arc(fx, fy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // 文字区域压暗，保证可读
  const vig = ctx.createLinearGradient(0, H * 0.5, 0, H)
  vig.addColorStop(0, 'rgba(4,6,12,0)')
  vig.addColorStop(0.42, 'rgba(4,6,12,0.86)')
  vig.addColorStop(1, 'rgba(4,6,12,0.96)')
  ctx.fillStyle = vig
  ctx.fillRect(0, H * 0.5, W, H * 0.5)

  const font = (size, weight = '400') => `${weight} ${size}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`

  // ---- 头部 ----
  ctx.fillStyle = c.accent
  ctx.font = font(26, '500')
  ctx.textAlign = 'left'
  ctx.fillText(title, 72, 108)

  ctx.fillStyle = 'rgba(244,236,216,0.5)'
  ctx.font = font(22)
  ctx.fillText(
    `${formatDayLabel(range.startKey)} — ${formatDayLabel(range.endKey)}`,
    72,
    148
  )

  // 右上角的月亮
  ctx.fillStyle = 'rgba(242,240,228,0.9)'
  ctx.beginPath()
  ctx.arc(W - 108, 118, 26, 0, Math.PI * 2)
  ctx.fill()
  const mg = ctx.createRadialGradient(W - 108, 118, 10, W - 108, 118, 88)
  mg.addColorStop(0, 'rgba(242,240,228,0.28)')
  mg.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = mg
  ctx.beginPath()
  ctx.arc(W - 108, 118, 88, 0, Math.PI * 2)
  ctx.fill()

  // ---- 主数据（口径和界面/文案保持一致，不足一分钟不进位）----
  const hours = range.totalSec / 3600
  const big = hours >= 1 ? hours.toFixed(hours >= 10 ? 0 : 1) : String(Math.floor(range.totalSec / 60))
  const bigUnit = hours >= 1 ? '小时' : '分钟'

  ctx.fillStyle = '#f4ecd8'
  ctx.font = font(132, '600')
  ctx.fillText(big, 72, 400)
  const bigW = ctx.measureText(big).width
  ctx.font = font(34, '400')
  ctx.fillStyle = 'rgba(244,236,216,0.62)'
  ctx.fillText(bigUnit, 72 + bigW + 16, 400)

  // ---- 三个次要数据 ----
  const stats = [
    { label: '点亮萤火虫', value: String(range.litDays), unit: '只' },
    { label: '读完书目', value: String(range.finishedBooks), unit: '本' },
    { label: '最长单次', value: String(Math.round(range.longestSessionSec / 60)), unit: '分钟' },
  ]
  stats.forEach((s, i) => {
    const x = 72 + i * 250
    ctx.fillStyle = 'rgba(244,236,216,0.45)'
    ctx.font = font(22)
    ctx.fillText(s.label, x, 490)

    ctx.font = font(56, '600')
    ctx.fillStyle = c.accent
    ctx.fillText(s.value, x, 556)
    const valueW = ctx.measureText(s.value).width

    ctx.fillStyle = 'rgba(244,236,216,0.5)'
    ctx.font = font(22)
    ctx.fillText(s.unit, x + valueW + 8, 556)
  })

  // 分隔线
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(72, 610)
  ctx.lineTo(W - 72, 610)
  ctx.stroke()

  // ---- 温暖文案 ----
  ctx.fillStyle = 'rgba(244,236,216,0.88)'
  ctx.font = font(30)
  wrapText(ctx, copy, 72, 676, W - 144, 46)

  // ---- 页脚 ----
  ctx.fillStyle = 'rgba(244,236,216,0.32)'
  ctx.font = font(20)
  ctx.fillText(`萤火书房 · ${dayjs().format('YYYY.MM.DD')} 生成`, 72, H - 62)

  // 底部一句话
  ctx.fillStyle = hexA(c.accent, 0.75)
  ctx.font = font(22)
  ctx.textAlign = 'right'
  ctx.fillText('点亮一只萤火虫，书房就亮一点', W - 72, H - 62)
  ctx.textAlign = 'left'

  return canvas.toDataURL('image/png')
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = String(text).split('')
  let line = ''
  let lineY = y
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, lineY)
      line = ch
      lineY += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, lineY)
  return lineY
}

/** #RRGGBB + alpha -> rgba() */
function hexA(hex, alpha) {
  const h = String(hex).replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full.slice(0, 6) || 'ffd98a', 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}

/** 下载 dataURL 为文件 */
export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** 优先用系统分享（可以分享到微信），不支持就退回下载 */
export async function shareOrDownload(shareText, dataUrl, filename) {
  try {
    if (navigator.canShare) {
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], filename, { type: 'image/png' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText })
        return 'shared'
      }
    }
    if (navigator.share) {
      await navigator.share({ text: shareText })
      return 'shared'
    }
  } catch {
    /* 用户取消或不支持，都退回下载 */
  }
  downloadDataUrl(dataUrl, filename)
  return 'downloaded'
}
