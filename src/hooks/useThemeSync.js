import { useEffect } from 'react'
import { useApp } from '../store/store'

/**
 * 把装扮与设置同步到 <html> 的 data-* 属性上。
 * 主题 / 萤火虫配色 / 光合树形态都靠 CSS 变量切换，这里只负责打标记，
 * 不在 JS 里拼样式，省掉一整轮重排。
 */
export function useThemeSync() {
  const { state } = useApp()
  const { cosmetic, settings } = state

  useEffect(() => {
    const el = document.documentElement
    el.setAttribute('data-theme', cosmetic.theme)
    el.setAttribute('data-firefly', cosmetic.fireflyColor)
    el.setAttribute('data-tree', cosmetic.treeSkin)
    el.setAttribute('data-motion', settings.reduceMotion ? 'reduce' : 'full')
    el.setAttribute('data-prefers-color-scheme', 'dark')
  }, [cosmetic.theme, cosmetic.fireflyColor, cosmetic.treeSkin, settings.reduceMotion])
}
