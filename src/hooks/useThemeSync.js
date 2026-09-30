import { useEffect } from 'react'
import { useApp } from '../store/store'
import { SCHEME_LIGHT, useResolvedScheme } from './useScheme'

/**
 * 把装扮与设置同步到 <html> 的 data-* 属性上。
 * 主题 / 萤火虫配色 / 光合树形态 / 明暗模式都靠 CSS 变量切换，
 * 这里只负责打标记，不在 JS 里拼样式，省掉一整轮重排。
 */
export function useThemeSync() {
  const { state } = useApp()
  const { cosmetic, settings } = state
  /** 「自动」在这里被解析成真正的 light / dark，后面的 CSS 只认这两个值 */
  const scheme = useResolvedScheme(settings.scheme)

  useEffect(() => {
    const el = document.documentElement
    el.setAttribute('data-theme', cosmetic.theme)
    el.setAttribute('data-firefly', cosmetic.fireflyColor)
    el.setAttribute('data-tree', cosmetic.treeSkin)
    el.setAttribute('data-motion', settings.reduceMotion ? 'reduce' : 'full')
    el.setAttribute('data-scheme', scheme)
    // antd-mobile 自己的深色变量挂在 data-prefers-color-scheme 上，跟着一起切
    el.setAttribute('data-prefers-color-scheme', scheme)
    // 地址栏 / 系统 UI 的颜色也跟着走（index.html 里是夜间的兜底值）
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', scheme === SCHEME_LIGHT ? '#F4EEE2' : '#0B1020')
  }, [
    cosmetic.theme,
    cosmetic.fireflyColor,
    cosmetic.treeSkin,
    settings.reduceMotion,
    scheme,
  ])
}

