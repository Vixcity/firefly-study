import { useEffect, useState } from 'react'

/** 明暗模式的三档取值，和 store/constants.js 里的 COLOR_SCHEMES 一致 */
export const SCHEME_AUTO = 'auto'
export const SCHEME_LIGHT = 'light'
export const SCHEME_DARK = 'dark'

/** 浏览器给不给 matchMedia（老 Safari / 测试环境可能没有） */
function mediaQuery(query) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  try {
    return window.matchMedia(query)
  } catch {
    return null
  }
}

/** 系统当前是不是深色。拿不到信息时按深色算 —— 这间书房本来就是夜晚的 */
export function systemPrefersDark() {
  const mq = mediaQuery('(prefers-color-scheme: dark)')
  return mq ? mq.matches : true
}

/**
 * 把「自动 / 日间 / 夜间」解析成真正生效的 'light' | 'dark'。
 *
 * 自动档会一直挂着系统主题的监听 —— 用户在系统里日落切深色、日出切浅色时，
 * 书房要跟着变，而不是只在打开 App 的那一刻看一眼。
 */
export function useResolvedScheme(scheme) {
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    if (scheme !== SCHEME_AUTO) return undefined
    const mq = mediaQuery('(prefers-color-scheme: dark)')
    if (!mq) return undefined

    const onChange = (e) => setSystemDark(e.matches)
    // 可能在挂监听之前系统就变过一次，先对齐一下再监听
    setSystemDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [scheme])

  if (scheme === SCHEME_LIGHT || scheme === SCHEME_DARK) return scheme
  return systemDark ? SCHEME_DARK : SCHEME_LIGHT
}
