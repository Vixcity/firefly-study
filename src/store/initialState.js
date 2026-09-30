import dayjs from 'dayjs'
import { DEFAULT_COSMETIC } from './catalog'
import { initialStreak } from './rules/streak'

/** 当前数据版本，结构变化时 +1 并在 storage.js 里补一条迁移 */
export const STATE_VERSION = 1

/** 本地存储的键名 */
export const STORAGE_KEY = 'firefly-study:v1'

/** 全新用户的状态 */
export function createInitialState(now = Date.now()) {
  const today = dayjs(now).format('YYYY-MM-DD')
  return {
    version: STATE_VERSION,
    createdAt: now,
    updatedAt: now,
    /** 是否看过首屏引导 */
    onboarded: false,

    /** 原始事实：每一次阅读 */
    sessions: [],
    /** 按天聚合（派生缓存，可由 sessions 重建） */
    days: {},
    /** 书架 */
    books: [],

    /** 光点 */
    points: { balance: 0, spent: 0, totalEarned: 0, ledger: [] },

    /** 萤火连击与休憩卡 */
    streak: initialStreak(today),

    /** 光合树（只增不减） */
    tree: { totalSec: 0, lastReadAt: null, skin: 'tree_default' },

    /** 徽章 */
    badges: { unlocked: {}, seenAt: 0 },

    /** 装扮 */
    cosmetic: { ...DEFAULT_COSMETIC },

    /** 正在进行的阅读（持久化，刷新不丢计时） */
    reading: null,

    /** 设置 */
    settings: {
      reminderEnabled: false,
      reminderTime: '21:30',
      reminderCopyIndex: 0,
      /** 低端机 / 省电模式：关掉大部分常驻动画 */
      reduceMotion: false,
      /** 是否已经在设置里看过"数据只存在本机"的说明 */
      privacyNoted: false,
    },

    /** 温柔提醒的运行时状态（不参与统计） */
    reminder: { lastFiredDate: null },
  }
}
