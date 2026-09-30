import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Toast } from 'antd-mobile'
import { useApp } from './store/store'
import { useThemeSync } from './hooks/useThemeSync'
import { useReminder } from './hooks/useReminder'
import { TabBar } from './components/layout/TabBar'
import { ReadingFlow } from './components/ReadingFlow'
import { RewardOverlay } from './components/RewardOverlay'
import { TourOverlay } from './components/TourOverlay'
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

      {/* 新手引导巡览：首屏引导看完之后，在书房里指着真实界面走一遍。
          引导的每一步都指向书房页的元素，所以只在书房页出现 ——
          如果用户第一步选了"先加一本书"，就先让他去书库，回到书房时再引导。 */}
      {state.onboarded && !state.tour.done && tab === 'study' ? (
        <TourOverlay
          onDone={() => {
            actions.finishTour()
            Toast.show({ content: '慢慢来，书房一直在这儿', duration: 2400 })
          }}
        />
      ) : null}

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
