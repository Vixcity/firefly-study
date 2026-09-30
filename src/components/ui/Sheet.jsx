import React from 'react'
import { Popup } from 'antd-mobile'

/** 底部弹层：所有"填写/选择"类操作都走它，保证移动端手感一致 */
export function Sheet({ visible, onClose, title, children, footer, height = 'auto' }) {
  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      onClose={onClose}
      position="bottom"
      closeOnMaskClick
      bodyStyle={{
        borderTopLeftRadius: 'var(--fs-r-lg)',
        borderTopRightRadius: 'var(--fs-r-lg)',
        background: 'linear-gradient(180deg, #121a2c 0%, #0a0f1c 100%)',
        border: '1px solid var(--fs-line)',
        maxHeight: '88dvh',
        overflow: 'auto',
        height,
      }}
    >
      <div className="fs-sheet">
        <div className="fs-sheet__handle" />
        {title ? <h3 className="fs-sheet__title">{title}</h3> : null}
        {children}
        {footer ? <div className="sheet__footer">{footer}</div> : null}
      </div>
    </Popup>
  )
}

/** 居中弹窗（antd-mobile 的 Dialog 包一层统一外观） */
export function CenterCard({ visible, onClose, children, title }) {
  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position="center"
      bodyStyle={{
        borderRadius: 'var(--fs-r-lg)',
        background: 'linear-gradient(180deg, #131b2e 0%, #0a0f1c 100%)',
        border: '1px solid var(--fs-line)',
        width: '84vw',
        maxWidth: '380px',
      }}
    >
      <div className="fs-dialog">
        {title ? <h3 className="fs-dialog__title">{title}</h3> : null}
        {children}
      </div>
    </Popup>
  )
}
