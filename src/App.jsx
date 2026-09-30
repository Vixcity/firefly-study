import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Toast } from 'antd-mobile'
import { useApp } from './store/store'
import { useThemeSync } from './hooks/useThemeSync'
import { useReminder } from './hooks/useReminder'
import { TabBar } from './components/layout/TabBar'
import { ReadingFlow } from './components/ReadingFlow'
import { RewardOverlay } from './components/RewardOverlay'
import { StudyPage } from './pages/Study/StudyPage'
import { BooksPage } from './pages/Books/BooksPage'
import { BadgesPage } from './pages/Badges/BadgesPage'
import { ReportPage } from './pages/Report/ReportPage'
import { ShopPage } from './pages/Shop/ShopPage'
import { SettingsSheet } from './pages/Settings/SettingsSheet'
import { OnboardPage } from './pages/Onboard/OnboardPage'

/**
 * 应用外壳：底部导航 + 五个页面 + 三个全局浮层（计时、点亮、设置）。
 * 页面切换用最朴素的状态管理，不引路由 —— 单页 PWA 不需要那一层。
 */
export function Shell() {
  const { state, derived, actions } = useApp()
  useThemeSync()

  const [tab, setTab] = useState('study')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [reward, setReward] = useState(null)

  // 温柔提醒：页面内提示（关掉浏览器后无法推送，README 有说明）
  useReminder(
    useCallback((copy) => {
      Toast.show({ content: copy, duration: 4200, position: 'top' })
    }, [])
  )

  // 首帧画完就去掉启动遮罩
  useEffect(() => {
    const boot = document.getElementById('boot')
    if (!boot) return
    boot.classList.add('out')
    const t = setTimeout(() => boot.remove(), 520)
    return () => clearTimeout(t)
  }, [])

  const hasNewBadges = useMemo(() => {
    const seen = state.badges.seenAt || 0
    return Object.values(state.badges.unlocked || {}).some((at) => at > seen)
  }, [state.badges])

  const startReading = () => {
    if (state.reading) return
    actions.startReading(state.books.find((b) => b.status === 'reading')?.id || null)
  }

  // 没看过引导页就先看引导页
  if (!state.onboarded) {
    return (
      <>
        <OnboardPage
          onDone={() => {
            actions.finishOnboarding()
            Toast.show({ content: '书房已经为你留好了位置', duration: 2400 })
          }}
          onStart={(withBook) => {
            actions.finishOnboarding()
            if (withBook) setTab('books')
          }}
        />
        <div id="boot-sentinel" hidden />
      </>
    )
  }

  return (
    <div className="fs-app">
      <main className="fs-scroll" key={tab}>
        {tab === 'study' ? (
          <StudyPage
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenShop={() => setTab('shop')}
            onStartReading={startReading}
          />
        ) : null}
        {tab === 'books' ? <BooksPage onStartReading={startReading} /> : null}
        {tab === 'badges' ? <BadgesPage /> : null}
        {tab === 'report' ? <ReportPage /> : null}
        {tab === 'shop' ? <ShopPage /> : null}
      </main>

      <TabBar active={tab} onChange={setTab} badgeDot={hasNewBadges} />

      {/* 全屏沉浸计时 */}
      {state.reading ? <ReadingFlow onFinish={setReward} /> : null}

      {/* 点亮时刻 */}
      {reward ? (
        <RewardOverlay
          result={reward}
          reduceMotion={state.settings.reduceMotion}
          onClose={() => setReward(null)}
          onViewFirefly={() => {
            setReward(null)
            setTab('study')
          }}
        />
      ) : null}

      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
