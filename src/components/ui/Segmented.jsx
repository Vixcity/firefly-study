import React from 'react'

/** 分段选择：报告页的"本周 / 本月"，商店页的分类切换 */
export function Segmented({ value, options = [], onChange, size = 'md' }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className={`seg seg--${size}`} role="tablist">
      <div
        className="seg__thumb"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(${idx * 100}%)`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={`seg__item ${o.value === value ? 'is-active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
