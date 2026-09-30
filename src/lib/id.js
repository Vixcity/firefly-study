/** 生成短 id：优先用 crypto.randomUUID，降级到时间戳 + 随机串 */
export function uid(prefix = '') {
  let core
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    core = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  } else {
    core = (
      Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
    ).slice(0, 16)
  }
  return prefix ? `${prefix}_${core}` : core
}

/** 稳定的数值种子（用于根据书名生成封面配色），同样的输入永远得到同样的结果 */
export function seedOf(text = '') {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}
