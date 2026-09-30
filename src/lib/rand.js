/**
 * 可复现的伪随机数。
 * 萤火虫的位置、飘动节奏都由此生成 —— 同一个日期永远得到同一个位置，
 * 刷新页面后萤火虫不会"搬家"。
 */

function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 */
function mulberry32(a) {
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 由字符串种子生成一个随机函数 */
export function makeRng(seed = '') {
  return mulberry32(hashSeed(String(seed)))
}

/** 区间随机 */
export const rngRange = (rng, min, max) => min + rng() * (max - min)

/** 从数组里取一项 */
export const rngPick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length]
