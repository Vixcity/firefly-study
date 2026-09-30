import { unstableSetRender } from 'antd-mobile'
import { createRoot } from 'react-dom/client'

/**
 * antd-mobile v5 的 React 19 兼容补丁。
 *
 * 背景：antd-mobile v5 内部的 Toast / Dialog / Popup 这类"命令式弹层"
 * 还在用 React 16 时代的 ReactDOM.render 与 unmountComponentAtNode，
 * 这两个 API 在 React 19 里已经被删除，会直接抛
 * `unmountComponentAtNode is not a function`。
 *
 * antd-mobile 官方给了这个补丁钩子（见 https://mobile.ant.design/guide/v5-for-19），
 * 用它把内部渲染换成 React 19 的 createRoot。
 * 必须在任何组件渲染之前调用，所以放在 main.jsx 的最顶部引入。
 */
unstableSetRender((node, container) => {
  if (!container._reactRoot) {
    container._reactRoot = createRoot(container)
  }
  const root = container._reactRoot
  root.render(node)
  return async () => {
    // 等一帧再卸载，避免和 React 的批处理打架
    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
    root.unmount()
    container._reactRoot = null
  }
})
