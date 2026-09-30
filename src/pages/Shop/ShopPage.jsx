import React, { useMemo, useState } from 'react'
import { Dialog, Toast } from 'antd-mobile'
import { useApp } from '../../store/store'
import { Segmented } from '../../components/ui/Segmented'
import { Sheet } from '../../components/ui/Sheet'
import { Icon } from '../../components/icons/Icons'
import { SHOP_ITEMS } from '../../store/catalog'
import { POINT_BOOK_FINISH, POINT_DAILY_CAP, POINT_LIT } from '../../store/constants'
import './shop.css'

const KINDS = [
  { value: 'firefly', label: '萤火虫' },
  { value: 'theme', label: '书房' },
  { value: 'tree', label: '光合树' },
]

const SLOT = { firefly: 'fireflyColor', theme: 'theme', tree: 'treeSkin' }

/** 光点商店：全部靠坚持获得，不做任何付费 */
export function ShopPage() {
  const { state, derived, actions } = useApp()
  const [kind, setKind] = useState('firefly')
  const [preview, setPreview] = useState(null)

  const items = useMemo(() => SHOP_ITEMS.filter((i) => i.kind === kind), [kind])
  const owned = state.cosmetic.owned

  const isOwned = (id) => owned.includes(id)
  const isActive = (item) => state.cosmetic[SLOT[item.kind]] === item.id

  const buy = (item) => {
    if (isOwned(item.id)) {
      actions.useCosmetic(item.id)
      Toast.show({ content: `已经换成${item.name}了` })
      return
    }
    Dialog.confirm({
      title: `兑换「${item.name}」`,
      content:
        state.points.balance >= item.price
          ? `花 ${item.price} 光点，永久拥有，随时可以换回来。`
          : `还差 ${item.price - state.points.balance} 光点。继续阅读就能攒到。`,
      confirmText: state.points.balance >= item.price ? '兑换' : '继续攒光点',
      cancelText: '再想想',
      onConfirm: () => {
        if (state.points.balance < item.price) return
        const r = actions.redeem(item.id)
        if (r && r.redeemed) {
          Toast.show({ content: `兑换成功，${item.name}已经生效` })
          if (r.newBadges && r.newBadges.length) {
            setTimeout(() => Toast.show({ content: '解锁了新徽章，去荣光看看' }), 1600)
          }
        }
      },
    })
  }

  return (
    <div className="fs-page shop">
      <header className="fs-topbar">
        <div className="fs-grow">
          <h1 className="fs-topbar__title">光点商店</h1>
          <p className="fs-topbar__sub">全部靠阅读积攒，没有别的门路</p>
        </div>
        <div className="shop__balance">
          <Icon name="coin" size={16} />
          <span className="fs-num">{state.points.balance}</span>
        </div>
      </header>

      {/* 获取规则 */}
      <section className="fs-card shop__rules">
        <div className="fs-card__title" style={{ marginBottom: 10 }}>
          <Icon name="info" size={15} />
          光点怎么来
        </div>
        <ul className="shop__rulelist">
          <li>
            <span className="fs-chip fs-chip--accent">点亮</span>每点亮一天 +{POINT_LIT}
          </li>
          <li>
            <span className="fs-chip">时长</span>每多读 5 分钟 +1，单日最多 {POINT_DAILY_CAP}
          </li>
          <li>
            <span className="fs-chip fs-chip--ok">读完书</span>读完一本 +{POINT_BOOK_FINISH}
          </li>
        </ul>
        <p className="fs-tiny fs-muted" style={{ margin: '10px 0 0', lineHeight: 1.8 }}>
          单日封顶是为了防止报复性久读 —— 阅读不是用来赢的，是用来陪你的。
          累计获得 {derived.stats.totalEarned} 光点，已经用掉 {state.points.spent || 0}。
        </p>
      </section>

      <div style={{ margin: 'var(--fs-s4) 0' }}>
        <Segmented value={kind} onChange={setKind} options={KINDS} />
      </div>

      <div className="shop__grid fs-stagger">
        {items.map((item) => {
          const has = isOwned(item.id)
          const active = isActive(item)
          const affordable = state.points.balance >= item.price
          return (
            <article className={`shop__item ${active ? 'is-active' : ''}`} key={item.id}>
              <button type="button" className="shop__previewBtn" onClick={() => setPreview(item)}>
                <ShopPreview item={item} />
              </button>

              <div className="shop__name">{item.name}</div>
              <div className="fs-tiny fs-muted shop__desc">{item.desc}</div>

              <div className="shop__foot">
                {item.price === 0 ? (
                  <span className="fs-chip fs-chip--ok">默认拥有</span>
                ) : has ? (
                  <span className="fs-chip fs-chip--accent">已拥有</span>
                ) : (
                  <span className={`shop__price ${affordable ? '' : 'is-lack'}`}>
                    <Icon name="coin" size={12} />
                    {item.price}
                  </span>
                )}

                <button
                  type="button"
                  className={`fs-btn fs-btn--sm ${active ? 'fs-btn--ghost' : 'fs-btn--primary'}`}
                  onClick={() => buy(item)}
                  disabled={active}
                >
                  {active ? '使用中' : has ? '使用' : '兑换'}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="fs-safe-bottom" />

      {/* 试色 / 试灯 */}
      <Sheet visible={!!preview} onClose={() => setPreview(null)} title={preview ? preview.name : ''}>
        {preview ? (
          <div className="shop__previewSheet">
            <div className={`shop__stage ${preview.kind === 'theme' ? `is-${preview.id}` : ''}`}>
              <div className="shop__stage-glow" />
              {preview.kind === 'theme' ? (
                <>
                  <div className="shop__stage-shelf">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="shop__stage-book" style={{ height: `${40 + i * 12}%` }} />
                    ))}
                  </div>
                  <div className="shop__stage-tree" />
                </>
              ) : null}
              <span className="shop__stage-fly" style={{ '--test-f1': preview.colors ? preview.colors[0] : undefined }}>
                <i />
                <i />
                <i />
              </span>
            </div>

            <p className="fs-small fs-muted-2 fs-center" style={{ marginTop: 'var(--fs-s4)', lineHeight: 1.9 }}>
              {preview.desc}
            </p>

            <div className="sheet__footer">
              <button
                type="button"
                className={`fs-btn ${isOwned(preview.id) ? 'fs-btn--primary' : 'fs-btn--ghost'}`}
                onClick={() => {
                  setPreview(null)
                  buy(preview)
                }}
              >
                {isActive(preview) ? '正在使用' : isOwned(preview.id) ? '换成这个' : `花 ${preview.price} 光点兑换`}
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      {/* 拥有记录 */}
      {owned.length > 1 ? (
        <section className="fs-card" style={{ marginTop: 'var(--fs-s5)' }}>
          <div className="fs-card__title">
            <Icon name="tag" size={15} />
            已经拥有的
            <span className="fs-muted fs-tiny">{owned.length} 件</span>
          </div>
          <div className="fs-row fs-wrap" style={{ gap: 6 }}>
            {owned.map((id) => {
              const item = SHOP_ITEMS.find((i) => i.id === id)
              if (!item) return null
              return (
                <button
                  key={id}
                  type="button"
                  className={`fs-chip ${isActive(item) ? 'fs-chip--accent' : ''}`}
                  onClick={() => actions.useCosmetic(id)}
                >
                  {item.name}
                </button>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}

/** 商品小预览：萤火虫是一点光，主题是一小块夜色，树是一片叶子 */
function ShopPreview({ item }) {
  if (item.kind === 'firefly') {
    return (
      <div className="shop__preview">
        <span
          className="shop__dot fs-breathe"
          style={{
            background: `radial-gradient(circle at 40% 38%, ${item.colors[0]}, ${item.colors[1]} 60%, ${item.colors[2]})`,
            boxShadow: `0 0 12px 3px ${item.colors[1]}, 0 0 30px 10px ${item.colors[2]}`,
          }}
        />
      </div>
    )
  }
  if (item.kind === 'theme') {
    return (
      <div
        className="shop__preview shop__preview--theme"
        style={{ background: `linear-gradient(180deg, ${item.palette.bgTop}, ${item.palette.bgBottom})` }}
      >
        <span className="shop__theme-glow" style={{ background: item.palette.glow }} />
        <Icon name="lamp" size={20} style={{ color: item.palette.accent }} />
      </div>
    )
  }
  return (
    <div className="shop__preview">
      <Icon name="tree" size={34} style={{ color: item.id === 'tree_crystal' ? '#cfe9ff' : item.id === 'tree_glow' ? '#a8f0c8' : '#7fc9a3' }} />
    </div>
  )
}
