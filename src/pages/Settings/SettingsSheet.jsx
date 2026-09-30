import React, { useEffect, useRef, useState } from 'react'
import { Dialog, Switch, Toast } from 'antd-mobile'
import dayjs from 'dayjs'
import { useApp } from '../../store/store'
import { Sheet } from '../../components/ui/Sheet'
import { Icon } from '../../components/icons/Icons'
import { REMINDER_COPIES } from '../../store/constants'
import { exportFileName, exportState, importState, storageAvailable } from '../../store/storage'
import { downloadDataUrl } from '../../lib/shareCard'
import './settings.css'

/** 设置：温柔提醒、动效、数据备份 */
export function SettingsSheet({ visible, onClose }) {
  const { state, actions, storageWarning } = useApp()
  const { settings } = state
  const fileRef = useRef(null)
  const [time, setTime] = useState(settings.reminderTime)

  useEffect(() => {
    setTime(settings.reminderTime)
  }, [settings.reminderTime])

  const toggleReminder = async (on) => {
    if (on) {
      // 顺带申请一次浏览器通知权限（被拒绝也不影响页面内提醒）
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          await Notification.requestPermission()
        }
      } catch {
        /* 忽略 */
      }
    }
    actions.updateSettings({ reminderEnabled: on })
    if (on) Toast.show({ content: '到点会轻轻提醒你，今天读过就不再打扰' })
  }

  const doExport = () => {
    const text = exportState(state)
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    downloadDataUrl(url, exportFileName())
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    Toast.show({ content: '备份已经导出' })
  }

  const doImport = async (file) => {
    if (!file) return
    const text = await file.text()
    const res = importState(text)
    if (!res.ok) {
      Toast.show({ content: res.error })
      return
    }
    Dialog.confirm({
      content: '导入会用备份里的数据覆盖当前数据，确定吗？',
      confirmText: '导入',
      cancelText: '取消',
      onConfirm: () => {
        actions.importState(res.state)
        Toast.show({ content: '已经恢复好了' })
      },
    })
  }

  const askReset = () => {
    Dialog.confirm({
      content: '会清空这台设备上的所有阅读记录、光点与徽章。这个操作没法撤销，建议先导出备份。',
      confirmText: '导出后清空',
      cancelText: '再想想',
      onConfirm: () => {
        const text = exportState(state)
        const blob = new Blob([text], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        downloadDataUrl(url, exportFileName())
        setTimeout(() => URL.revokeObjectURL(url), 4000)
        Dialog.confirm({
          content: '备份已经导出。现在清空全部数据吗？',
          confirmText: '清空',
          cancelText: '算了',
          onConfirm: () => {
            actions.resetAll()
            onClose()
            Toast.show({ content: '书房已经重新收拾好了' })
          },
        })
      },
    })
  }

  const nextCopy = REMINDER_COPIES[(settings.reminderCopyIndex || 0) % REMINDER_COPIES.length]
  const today = dayjs().format('YYYY-MM-DD')

  return (
    <Sheet visible={visible} onClose={onClose} title="设置">
      {/* ---- 温柔提醒 ---- */}
      <section className="settings__block">
        <div className="row">
          <div className="row__glyph">
            <Icon name="bell" size={17} />
          </div>
          <div className="row__main">
            <div className="row__title">每日提醒</div>
            <div className="row__sub">文案温柔，不催不逼；今天读过就不再打扰</div>
          </div>
          <Switch checked={settings.reminderEnabled} onChange={toggleReminder} />
        </div>

        {settings.reminderEnabled ? (
          <>
            <div className="fs-field">
              <span className="fs-field__label">提醒时间</span>
              <input
                type="time"
                className="settings__time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value)
                  actions.updateSettings({ reminderTime: e.target.value })
                }}
              />
            </div>
            <div className="settings__copyPreview">
              <Icon name="firefly" size={15} />
              <span>{nextCopy}</span>
            </div>
            <p className="fs-tiny fs-muted" style={{ lineHeight: 1.8 }}>
              提醒文案会轮换，都是这一类语气。老实说一句：网页版只有在书房的页面开着时才能提醒你，
              想要关掉浏览器也能收到通知，可以把它添加到手机主屏，或者用系统的专注模式配合。
            </p>
          </>
        ) : null}
      </section>

      {/* ---- 新手引导 ---- */}
      <section className="settings__block">
        <div className="row">
          <div className="row__glyph">
            <Icon name="compass" size={17} />
          </div>
          <div className="row__main">
            <div className="row__title">新手引导</div>
            <div className="row__sub">再看一遍书房里每个角落是做什么的</div>
          </div>
          <button
            type="button"
            className="fs-btn fs-btn--ghost fs-btn--sm"
            onClick={() => {
              onClose()
              actions.restartTour()
            }}
          >
            重看
          </button>
        </div>
      </section>

      {/* ---- 动效 ---- */}
      <section className="settings__block">
        <div className="row">
          <div className="row__glyph">
            <Icon name="spark" size={17} />
          </div>
          <div className="row__main">
            <div className="row__title">减少动效</div>
            <div className="row__sub">萤火虫不再飘动，更省电，老机器更顺</div>
          </div>
          <Switch
            checked={settings.reduceMotion}
            onChange={(v) => actions.updateSettings({ reduceMotion: v })}
          />
        </div>
      </section>

      {/* ---- 数据 ---- */}
      <section className="settings__block">
        <div className="row">
          <div className="row__glyph">
            <Icon name="shield" size={17} />
          </div>
          <div className="row__main">
            <div className="row__title">数据只在这台设备上</div>
            <div className="row__sub">
              {storageAvailable() ? '没有账号、没有服务器，不上传任何内容' : '当前浏览器不允许本地存储，数据可能不会保留'}
            </div>
          </div>
        </div>

        <div className="settings__ops">
          <button type="button" className="fs-btn fs-btn--ghost" onClick={doExport}>
            <Icon name="download" size={16} />
            导出 JSON 备份
          </button>
          <button type="button" className="fs-btn fs-btn--ghost" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={16} />
            导入备份
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            doImport(e.target.files && e.target.files[0])
            e.target.value = ''
          }}
        />

        <div className="settings__summary fs-tiny fs-muted">
          <span>阅读记录 {state.sessions.length} 条</span>
          <span>书架 {state.books.length} 本</span>
          <span>点亮 {(state.streak && state.streak.best) || 0} 天最佳连击</span>
        </div>

        {storageWarning ? (
          <p className="fs-tiny settings__warn">
            本地存储写入失败，可能是空间满了。建议立刻导出一份备份。
          </p>
        ) : null}

        <button type="button" className="fs-btn fs-btn--ghost fs-btn--danger fs-btn--block settings__reset" onClick={askReset}>
          <Icon name="trash" size={16} />
          清空所有数据
        </button>
      </section>

      {/* ---- 关于 ---- */}
      <section className="settings__block">
        <div className="row">
          <div className="row__glyph">
            <Icon name="info" size={17} />
          </div>
          <div className="row__main">
            <div className="row__title">萤火书房</div>
            <div className="row__sub">
              点亮一只萤火虫，书房就亮一点 · 今天 {today}
            </div>
          </div>
        </div>
        <p className="fs-tiny fs-muted settings__about">
          这里的每一条规则都是正向的：漏读不扣分、连击不清零、光合树不枯萎。
          唯一的目的是让你愿意回来坐一会儿。
        </p>
      </section>
    </Sheet>
  )
}
