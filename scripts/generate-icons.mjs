/**
 * 生成 PWA 图标（纯 Node，无第三方依赖）。
 *
 * 图标的画面就是一个"萤火虫光点 + 一圈微光"，跟 App 内的品牌标记一致。
 * 用法：node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../public')

// ---------------------------------------------------------------- PNG 编码

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------------------------------------------------------------- 绘制

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const mix = (a, b, t) => a + (b - a) * t

/** 把 0~1 的三个分量打包成 0~255 */
const px = (r, g, b, a) => [Math.round(clamp(r) * 255), Math.round(clamp(g) * 255), Math.round(clamp(b) * 255), Math.round(clamp(a) * 255)]

const COL = {
  bgTop: [0.055, 0.078, 0.145],
  bgBottom: [0.018, 0.026, 0.05],
  f1: [1.0, 0.914, 0.69],
  f2: [1.0, 0.851, 0.541],
  f3: [0.949, 0.725, 0.294],
}

/** 加一层光（additive，模拟辉光） */
function addGlow(acc, dist, radius, color, strength) {
  if (dist >= radius) return
  const t = 1 - dist / radius
  const k = t * t * strength
  acc[0] += color[0] * k
  acc[1] += color[1] * k
  acc[2] += color[2] * k
}

/**
 * @param size 画布边长
 * @param maskable 是否生成"可裁切"版本（不留圆角、主体缩小到安全区）
 */
function drawIcon(size, maskable = false) {
  const buf = Buffer.alloc(size * size * 4)
  const safe = maskable ? 0.78 : 1
  const cornerR = maskable ? 0 : size * 0.225

  // 主体参数（maskable 时整体缩小）
  const cx = size * 0.5
  const cy = size * 0.5
  const bodyRy = size * 0.115 * safe
  const bodyRx = size * 0.085 * safe

  const dots = [
    { x: 0.28, y: 0.3, r: 0.03 },
    { x: 0.74, y: 0.36, r: 0.024 },
    { x: 0.66, y: 0.72, r: 0.02 },
  ]

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x + 0.5) / size
      const v = (y + 0.5) / size

      // 1) 底色：上深下更深的夜色
      const t = clamp(v)
      const acc = [
        mix(COL.bgTop[0], COL.bgBottom[0], t),
        mix(COL.bgTop[1], COL.bgBottom[1], t),
        mix(COL.bgTop[2], COL.bgBottom[2], t),
      ]

      // 2) 墙面上的大范围暖光
      const dRoom = Math.hypot(u - 0.5, v - 0.42)
      addGlow(acc, dRoom, 0.6, COL.f3, 0.12)

      // 3) 萤火虫的辉光（收得紧一点，读起来才像"一个光点"）
      const dx = (u - 0.5) * (size / size)
      const dyV = v - 0.5
      const dBody = Math.hypot((dx * size) / (bodyRx * 1), (dyV * size) / (bodyRy * 1))
      const dCenter = Math.hypot(u - 0.5, v - 0.5)
      addGlow(acc, dCenter, 0.32 * safe, COL.f2, 0.7)
      addGlow(acc, dCenter, 0.15 * safe, COL.f1, 1.05)

      // 4) 一点更实的虫body
      if (dBody < 1.9) {
        const k = clamp(1 - Math.abs(dBody - 0.85) / 1.05)
        acc[0] = mix(acc[0], COL.f1[0], k * 0.85)
        acc[1] = mix(acc[1], COL.f1[1], k * 0.85)
        acc[2] = mix(acc[2], COL.f1[2], k * 0.85)
      }

      // 5) 环绕的微光圆环
      const dRing = Math.abs(Math.hypot(u - 0.5, v - 0.5) - 0.33 * safe)
      if (dRing < 0.012) {
        const k = (1 - dRing / 0.012) * 0.22
        acc[0] = mix(acc[0], COL.f2[0], k)
        acc[1] = mix(acc[1], COL.f2[1], k)
        acc[2] = mix(acc[2], COL.f2[2], k)
      }

      // 6) 零散的小光点
      for (const d of dots) {
        const dd = Math.hypot(u - d.x, v - d.y) / (d.r * safe)
        addGlow(acc, dd, 3.2, COL.f2, 0.42)
        if (dd < 1) {
          acc[0] = mix(acc[0], COL.f1[0], 0.9)
          acc[1] = mix(acc[1], COL.f1[1], 0.9)
          acc[2] = mix(acc[2], COL.f1[2], 0.9)
        }
      }

      // 7) 圆角裁切（非 maskable 版本）
      let alpha = 1
      if (cornerR > 0) {
        const rx = Math.min(x + 0.5, size - x - 0.5)
        const ry = Math.min(y + 0.5, size - y - 0.5)
        if (rx < cornerR && ry < cornerR) {
          const d = Math.hypot(cornerR - rx, cornerR - ry)
          alpha = clamp(cornerR - d + 0.5)
        }
      }

      const [r, g, b, a] = px(acc[0], acc[1], acc[2], alpha)
      const i = (y * size + x) * 4
      buf[i] = r
      buf[i + 1] = g
      buf[i + 2] = b
      buf[i + 3] = a
    }
  }
  return encodePng(size, size, buf)
}

mkdirSync(OUT_DIR, { recursive: true })
mkdirSync(resolve(OUT_DIR, 'icons'), { recursive: true })

const targets = [
  [resolve(OUT_DIR, 'icons/icon-192.png'), 192, false],
  [resolve(OUT_DIR, 'icons/icon-512.png'), 512, false],
  [resolve(OUT_DIR, 'icons/maskable-512.png'), 512, true],
  [resolve(OUT_DIR, 'apple-touch-icon.png'), 180, false],
  [resolve(OUT_DIR, 'icons/icon-64.png'), 64, false],
]

for (const [file, size, maskable] of targets) {
  writeFileSync(file, drawIcon(size, maskable))
  console.log(`已生成 ${file.replace(resolve(__dirname, '..'), '.')} (${size}px${maskable ? ', maskable' : ''})`)
}
