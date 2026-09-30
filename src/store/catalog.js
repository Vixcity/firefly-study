/**
 * 徽章、等级字形与光点商店的目录数据。
 * 全部内容只能靠坚持获得，不做任何付费。
 */

export const BADGE_GROUPS = ['起步', '连击', '时长', '阅读', '习惯', '收藏']

/**
 * 徽章目录（20 枚）
 * ctx 为派生统计，见 store/selectors.js 的 deriveStats()
 * glyph 对应 components/icons 里自绘的 SVG 名字
 */
export const BADGES = [
  {
    id: 'first_light',
    name: '初亮',
    group: '起步',
    glyph: 'firefly',
    desc: '第一次点亮萤火虫',
    check: (c) => c.litDays >= 1,
  },
  {
    id: 'spark_three',
    name: '微光初成',
    group: '连击',
    glyph: 'spark',
    desc: '萤火连击达到 3 天',
    check: (c) => c.bestStreak >= 3,
  },
  {
    id: 'tower_seven',
    name: '聚光成塔',
    group: '连击',
    glyph: 'tower',
    desc: '萤火连击达到 7 天',
    check: (c) => c.bestStreak >= 7,
  },
  {
    id: 'persist_thirty',
    name: '持之以恒',
    group: '连击',
    glyph: 'calendar',
    desc: '萤火连击达到 30 天',
    check: (c) => c.bestStreak >= 30,
  },
  {
    id: 'river_hundred',
    name: '百日灯河',
    group: '连击',
    glyph: 'river',
    desc: '萤火连击达到 100 天',
    check: (c) => c.bestStreak >= 100,
  },
  {
    id: 'rest_keeper',
    name: '安心休憩',
    group: '连击',
    glyph: 'restcard',
    desc: '第一次用休憩卡护住连击',
    check: (c) => c.restedDays >= 1,
  },
  {
    id: 'deep_plow',
    name: '深耕',
    group: '时长',
    glyph: 'plow',
    desc: '单次阅读满 60 分钟',
    check: (c) => c.longestSessionSec >= 60 * 60,
  },
  {
    id: 'one_sitting',
    name: '一鼓作气',
    group: '时长',
    glyph: 'bolt',
    desc: '单日累计阅读满 60 分钟',
    check: (c) => c.maxDaySec >= 60 * 60,
  },
  {
    id: 'ten_hours',
    name: '久久为功',
    group: '时长',
    glyph: 'hourglass',
    desc: '累计阅读满 10 小时',
    check: (c) => c.totalSec >= 10 * 3600,
  },
  {
    id: 'fifty_hours',
    name: '五十时灯火',
    group: '时长',
    glyph: 'lamp',
    desc: '累计阅读满 50 小时',
    check: (c) => c.totalSec >= 50 * 3600,
  },
  {
    id: 'hundred_hours',
    name: '百时长明',
    group: '时长',
    glyph: 'moon',
    desc: '累计阅读满 100 小时',
    check: (c) => c.totalSec >= 100 * 3600,
  },
  {
    id: 'night_reader',
    name: '夜读者',
    group: '习惯',
    glyph: 'moon',
    desc: '在 22 点之后完成一次阅读',
    check: (c) => c.nightReads >= 1,
  },
  {
    id: 'morning_reader',
    name: '晨读书香',
    group: '习惯',
    glyph: 'sun',
    desc: '在 7 点之前完成一次阅读',
    check: (c) => c.earlyReads >= 1,
  },
  {
    id: 'five_am',
    name: '晨光同行',
    group: '习惯',
    glyph: 'sunrise',
    desc: '在早上 5~8 点之间阅读满 5 天',
    check: (c) => c.morningLitDays >= 5,
  },
  {
    id: 'note_keeper',
    name: '拾字成句',
    group: '习惯',
    glyph: 'pen',
    desc: '写下 10 条阅读感想',
    check: (c) => c.notesCount >= 10,
  },
  {
    id: 'finish_one',
    name: '阅毕',
    group: '阅读',
    glyph: 'bookcheck',
    desc: '读完 1 本书',
    check: (c) => c.finishedBooks >= 1,
  },
  {
    id: 'finish_five',
    name: '书海拾贝',
    group: '阅读',
    glyph: 'shell',
    desc: '读完 5 本书',
    check: (c) => c.finishedBooks >= 5,
  },
  {
    id: 'thousand_pages',
    name: '万页征程',
    group: '阅读',
    glyph: 'pages',
    desc: '累计阅读满 1000 页',
    check: (c) => c.totalPages >= 1000,
  },
  {
    id: 'lit_thirty',
    name: '萤火满室',
    group: '收藏',
    glyph: 'jar',
    desc: '累计点亮 30 天',
    check: (c) => c.litDays >= 30,
  },
  {
    id: 'point_thousand',
    name: '光点盈门',
    group: '收藏',
    glyph: 'coin',
    desc: '累计获得 1000 光点',
    check: (c) => c.totalEarned >= 1000,
  },
  {
    id: 'collector',
    name: '拾光者',
    group: '收藏',
    glyph: 'shell',
    desc: '第一次在光点商店兑换',
    check: (c) => c.redeemedCount >= 1,
  },
]

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.id, b]))

/**
 * 光点商店目录
 * kind: 'firefly' 萤火虫配色 | 'theme' 书房主题 | 'tree' 光合树形态
 * free: 默认拥有，不消耗光点
 */
export const SHOP_ITEMS = [
  // ---- 萤火虫配色 ----
  {
    id: 'firefly_warm',
    kind: 'firefly',
    name: '暖黄',
    desc: '书房最初的那一点光',
    price: 0,
    free: true,
    colors: ['#FFE9B0', '#FFD98A', '#F2B94B'],
  },
  {
    id: 'firefly_cyan',
    kind: 'firefly',
    name: '青蓝',
    desc: '像雨后的夜空，安静又清透',
    price: 120,
    colors: ['#CFF6FF', '#7EE0F5', '#2FA8C8'],
  },
  {
    id: 'firefly_ember',
    kind: 'firefly',
    name: '橙红',
    desc: '炉火边读书的温度',
    price: 120,
    colors: ['#FFD3AE', '#FF9E5E', '#E0632F'],
  },
  {
    id: 'firefly_violet',
    kind: 'firefly',
    name: '紫罗兰',
    desc: '黄昏最后一点点霞光',
    price: 160,
    colors: ['#E7D6FF', '#B98CF0', '#7A47C9'],
  },
  {
    id: 'firefly_mint',
    kind: 'firefly',
    name: '薄荷绿',
    desc: '窗台上新叶的颜色',
    price: 160,
    colors: ['#D6FBE6', '#82E8B4', '#35A972'],
  },
  {
    id: 'firefly_sakura',
    kind: 'firefly',
    name: '樱粉',
    desc: '春日读书时的暖风',
    price: 200,
    colors: ['#FFE1EC', '#FFA8C6', '#E0638F'],
  },
  {
    id: 'firefly_aurora',
    kind: 'firefly',
    name: '极光',
    desc: '只在很长很长的坚持之后出现',
    price: 260,
    colors: ['#D8FFF4', '#7BF0D8', '#4FA8FF'],
  },

  // ---- 书房主题 ----
  {
    id: 'theme_ink',
    kind: 'theme',
    name: '墨色',
    desc: '最初的书房，安静得很刚好',
    price: 0,
    free: true,
    palette: {
      bgTop: '#17203A',
      bgBottom: '#070A15',
      glow: 'rgba(255, 217, 138, 0.16)',
      accent: '#FFD98A',
    },
  },
  {
    id: 'theme_forest',
    kind: 'theme',
    name: '森林',
    desc: '藤蔓爬满书架的夜晚',
    price: 180,
    palette: {
      bgTop: '#12261F',
      bgBottom: '#060E0B',
      glow: 'rgba(150, 240, 190, 0.16)',
      accent: '#96E8B4',
    },
  },
  {
    id: 'theme_starry',
    kind: 'theme',
    name: '星空',
    desc: '抬头就能看见银河的书房',
    price: 220,
    palette: {
      bgTop: '#141B3C',
      bgBottom: '#05060F',
      glow: 'rgba(170, 190, 255, 0.18)',
      accent: '#AFC4FF',
    },
  },
  {
    id: 'theme_rain',
    kind: 'theme',
    name: '雨夜',
    desc: '雨点在窗外，书在手里',
    price: 200,
    palette: {
      bgTop: '#101C2B',
      bgBottom: '#050A11',
      glow: 'rgba(160, 210, 255, 0.16)',
      accent: '#9FD0FF',
    },
  },

  // ---- 光合树形态 ----
  {
    id: 'tree_default',
    kind: 'tree',
    name: '原色',
    desc: '干净的一株小树',
    price: 0,
    free: true,
  },
  {
    id: 'tree_glow',
    kind: 'tree',
    name: '流光',
    desc: '枝叶上淌着细细的光',
    price: 240,
  },
  {
    id: 'tree_crystal',
    kind: 'tree',
    name: '琉璃',
    desc: '半透明的枝叶，像玻璃做的',
    price: 300,
  },
]

export const SHOP_MAP = Object.fromEntries(SHOP_ITEMS.map((i) => [i.id, i]))

/** 默认拥有 / 默认使用的装扮 */
export const DEFAULT_COSMETIC = {
  owned: SHOP_ITEMS.filter((i) => i.free).map((i) => i.id),
  fireflyColor: 'firefly_warm',
  theme: 'theme_ink',
  treeSkin: 'tree_default',
}
