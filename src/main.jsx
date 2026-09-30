// 必须最先引入：给 antd-mobile 打上 React 19 兼容补丁
import './lib/antdReact19'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './store/store'
import { Shell } from './App'

import './styles/tokens.css'
import './styles/base.css'
import './styles/animations.css'
import './styles/antd-mobile-override.css'
import './components/ui/ui.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <Shell />
    </AppProvider>
  </React.StrictMode>
)
