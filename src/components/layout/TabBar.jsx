import React from 'react'
import { Icon } from '../icons/Icons'
import './tabbar.css'

export const TABS = [
  { key: 'study', label: '书房', icon: 'firefly' },
  { key: 'books', label: '书库', icon: 'books' },
  { key: 'badges', label: '荣光', icon: 'medal' },
  { key: 'report', label: '报告', icon: 'chart' },
  { key: 'shop', label: '商店', icon: 'shop' },
]

export function TabBar({ active, onChange, badgeDot = false }) {
  return (
    <nav className="tabbar" role="tablist" aria-label="主导航">
      {TABS.map((t) => {
        const on = active === t.key
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={on}
            className={`tabbar__item ${on ? 'is-active' : ''}`}
            onClick={() => onChange(t.key)}
          >
            <span className="tabbar__icon">
              <Icon name={t.icon} size={22} strokeWidth={on ? 1.9 : 1.6} />
              {badgeDot && t.key === 'badges' ? <i className="tabbar__dot" /> : null}
            </span>
            <span className="tabbar__label">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
