import { SHOP_MAP } from '../catalog'
import { spendPoints, pointsEntry, withBadges } from './reward'

const KIND_TO_SLOT = {
  firefly: 'fireflyColor',
  theme: 'theme',
  tree: 'treeSkin',
}

/** 兑换：光点余额够就扣掉并永久拥有 */
export function redeem(state, itemId, now) {
  const item = SHOP_MAP[itemId]
  if (!item) return { state, result: null }
  const owned = state.cosmetic.owned.includes(itemId)
  if (owned) return { state: applyCosmetic(state, itemId), result: { item, alreadyOwned: true } }
  if (state.points.balance < item.price) {
    return { state, result: { item, insufficient: true, missing: item.price - state.points.balance } }
  }

  let next = {
    ...state,
    points: spendPoints(state.points, [
      pointsEntry({ at: now, delta: item.price, reason: 'redeem', refId: itemId, note: item.name }),
    ]),
    cosmetic: { ...state.cosmetic, owned: [...state.cosmetic.owned, itemId] },
  }
  next = applyCosmetic(next, itemId)
  const { state: withBadge, fresh } = withBadges(next, now)
  return { state: withBadge, result: { item, redeemed: true, newBadges: fresh } }
}

/** 把已拥有的装扮设为当前使用 */
export function applyCosmetic(state, itemId) {
  const item = SHOP_MAP[itemId]
  if (!item) return state
  const slot = KIND_TO_SLOT[item.kind]
  if (!slot) return state
  if (!state.cosmetic.owned.includes(itemId)) return state
  return { ...state, cosmetic: { ...state.cosmetic, [slot]: itemId } }
}

/** 全部装扮重置为默认（不退还光点，只是换回好看的样子） */
export function resetCosmetic(state) {
  const owned = state.cosmetic.owned
  const pick = (kind, fallback) => owned.find((id) => SHOP_MAP[id] && SHOP_MAP[id].kind === kind) || fallback
  return {
    ...state,
    cosmetic: {
      ...state.cosmetic,
      fireflyColor: pick('firefly', 'firefly_warm'),
      theme: pick('theme', 'theme_ink'),
      treeSkin: pick('tree', 'tree_default'),
    },
  }
}
