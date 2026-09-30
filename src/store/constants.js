/**
 * 《萤火书房》规则常量 —— 所有数值集中在这里，改规则只改这一个文件。
 * 设计铁律：绝不惩罚用户。这里不存在任何"扣分 / 清零 / 失败"的规则。
 */

/**
 * 明暗模式：'auto' 跟着系统 | 'light' 日间（白天的书房）| 'dark' 夜间（夜晚的书房）
 * 三种都保留萤火虫 —— 日间只是把房间换成白天，萤火虫照样亮着。
 */
export const COLOR_SCHEMES = [
  { value: 'auto', label: '自动', desc: '跟着系统的深浅色走，日落日出自己换' },
  { value: 'light', label: '日间', desc: '白天的书房：窗户透光，萤火虫还在' },
  { value: 'dark', label: '夜间', desc: '最初的那间夜晚书房' },
]

export const COLOR_SCHEME_VALUES = COLOR_SCHEMES.map((s) => s.value)

/** 默认明暗模式：留在夜间，老用户打开看到的还是原来的书房 */
export const DEFAULT_SCHEME = 'dark'

/** 打卡门槛：当日累计阅读满 5 分钟即点亮一只萤火虫（门槛刻意设低，先让用户赢得起） */
export const LIT_THRESHOLD_SEC = 5 * 60

/** 光点：点亮一次 +10 */
export const POINT_LIT = 10
/** 光点：每多读 5 分钟 +1（按当日累计计算） */
export const POINT_SEC_STEP = 5 * 60
/** 光点：单日（点亮分 + 时长分）封顶 100，防止报复性久读 */
export const POINT_DAILY_CAP = 100
/** 光点：读完一本书 +50（不占当日封顶额度） */
export const POINT_BOOK_FINISH = 50

/** 休憩卡：每月自动发放 1 张 */
export const REST_CARD_MONTHLY = 1
/** 休憩卡：最多持有 3 张 */
export const REST_CARD_MAX = 3

/** 光合树：每累计满 1 小时成长一阶 */
export const TREE_SEC_PER_STAGE = 60 * 60
/** 光合树：最高阶下标（共 10 阶，0 ~ 9） */
export const TREE_MAX_STAGE = 9
/** 光合树：超过这么多天没阅读，只呈现"睡着"状态（不退化、不枯萎） */
export const TREE_SLEEP_DAYS = 7

/** 萤火连击的里程碑 */
export const STREAK_MILESTONES = [7, 30, 100]

/** 感想字数上限 */
export const NOTE_MAX = 140

/** 单次阅读的合理上限（8 小时），超过只按 8 小时计入，避免误开计时器污染数据 */
export const SESSION_MAX_SEC = 8 * 60 * 60

/** 恢复中未结束的会话：超过这个时长视为误开，自动按 8 小时截断 */
export const DANGEROUS_SESSION_SEC = 12 * 60 * 60

/** 等级体系：由累计获得的光点决定 */
export const LEVELS = [
  { id: 'seeker', name: '追光者', min: 0, desc: '书房里刚亮起第一点微光', glyph: 'spark' },
  { id: 'gatherer', name: '聚光者', min: 300, desc: '光点开始聚拢，书房有了暖意', glyph: 'glow' },
  { id: 'lantern', name: '提灯人', min: 1000, desc: '你提着灯，照亮更长的夜', glyph: 'lamp' },
  { id: 'scholar', name: '明月学士', min: 3000, desc: '明月当空，满室生辉', glyph: 'moon' },
]

/** 光合树的 10 阶形态 */
export const TREE_STAGES = [
  { stage: 0, name: '休眠的种子', hint: '在窗台上安静等着' },
  { stage: 1, name: '发芽', hint: '冒出一点新绿' },
  { stage: 2, name: '抽枝', hint: '细枝舒展开来' },
  { stage: 3, name: '长叶', hint: '叶片一片片铺开' },
  { stage: 4, name: '含苞', hint: '花苞鼓起来了' },
  { stage: 5, name: '初绽', hint: '第一朵花开了' },
  { stage: 6, name: '开花', hint: '花朵开始发光' },
  { stage: 7, name: '繁花', hint: '萤火虫愿意落下来' },
  { stage: 8, name: '光果', hint: '结出会亮的小果子' },
  { stage: 9, name: '星辉树', hint: '整棵树都亮起来了' },
]

/** 温柔提醒的轮换文案（禁止"你还没打卡！"式焦虑表达） */
export const REMINDER_COPIES = [
  '书房里的萤火虫想你了',
  '窗台上的光合树在等你回来看看',
  '今晚夜色很好，读两页也好',
  '萤火虫把灯留着呢，你随时都可以来',
  '书房安静着，一本书就在手边',
  '哪怕只读五页，萤火虫也会亮起来',
  '月光落在书架上，等你翻开一页',
  '不着急，想读的时候再来坐一会儿',
]

/** 连击中断（萤火虫休息）时的温柔文案，随机取一条 */
export const PAUSE_COPIES = [
  '萤火虫们休息了一下，继续点亮就能接上连击',
  '这几天萤火虫打了个盹，书房的光还留着',
  '萤火虫歇了歇脚，回来读一会儿吧',
]

/** 空状态 / 引导文案 */
export const EMPTY_COPY = {
  noFirefly: '还没有萤火虫。读满 5 分钟，第一只就会亮起来。',
  noBookReading: '还没有在读的书。加一本，或者直接开始阅读也可以。',
  noBookFinished: '还没有读完的书。读着读着，总会读完的。',
  noNote: '这一天没有留下感想，也很正常。',
  noBadge: '徽章在这里等你慢慢收集。',
  noPoints: '光点还不够，再读几天就会有了。',
  noData: '这几天的书房还比较安静，慢慢来。',
}

/** 语境文案：给报告页一句温暖的话 */
export const REPORT_COPY = {
  empty: '这一页还很安静，去书店里点一盏灯吧。',
  tiny: (min, flies) => `这几天你读了 ${min} 分钟，点亮 ${flies} 只萤火虫。开始，就已经很好了。`,
  small: (min, flies) => `这段时间你阅读了 ${min} 分钟，点亮 ${flies} 只萤火虫。微光汇聚，终成灯河。`,
  big: (min, flies) => `${min} 分钟，${flies} 只萤火虫。书房的灯，一直在你手里。`,
}

/**
 * 新手引导：一步一步指着真实界面讲，而不是再给一张静态介绍页。
 * target 是 CSS 选择器，引导会把它高亮出来；target 为 null 时居中显示。
 * place 只是倾向 —— 空间不够时引导会自己翻到另一边。
 */
export const TOUR_STEPS = [
  {
    id: 'welcome',
    target: null,
    title: '欢迎来到萤火书房',
    body: '这是一间夜晚的书房。每完成一次阅读，就点亮一只萤火虫；读得越多，房间越亮。这里没有排行榜，也没有"你已断签"。',
    hint: '大概 30 秒就能看完，随时可以跳过',
  },
  {
    id: 'cta',
    target: '.study__cta',
    place: 'top',
    title: '从这儿开始读',
    body: '点「开始阅读」进入全屏计时，支持暂停。当日累计读满 5 分钟就算点亮一只萤火虫 —— 门槛刻意设得很低，先让今天赢起来。',
  },
  {
    id: 'streak',
    target: '.study__streak',
    place: 'top',
    title: '萤火连击',
    body: '连续点亮会累加连击。就算漏读，历史记录和历史最佳也不会清零，只是"萤火虫休息了一下"；休憩卡每月自动发一张，漏读当天会帮你护住连击。',
  },
  {
    id: 'tree',
    target: '.study__tree',
    place: 'top',
    title: '光合树',
    body: '这株小树跟着你的累计阅读时长长大，每满 1 小时长一阶，一共 10 阶。它只长不落，很久没来也只是"睡着"，读一会儿就醒过来。',
  },
  {
    id: 'points',
    target: '.study__points',
    place: 'bottom',
    title: '光点',
    body: '点亮 +10，每多读 5 分钟 +1，单日封顶 100，读完一本书 +50。光点在商店里能换萤火虫配色、书房主题和光合树形态，全部靠坚持获得。',
  },
  {
    id: 'tabs',
    target: '.tabbar',
    place: 'top',
    title: '五间屋子',
    body: '书房看萤火虫和连击，书库管你在读的书，荣光收徽章和等级，报告看周月数据并生成分享卡，商店花光点。',
  },
  {
    id: 'settings',
    target: '.study__settings',
    place: 'bottom',
    title: '数据只在你手机上',
    body: '这里没有账号、没有服务器，记录不会上传。右上角设置里可以开「每日提醒」、导出 JSON 备份，也可以随时重看这份引导。',
    hint: '随时能从设置里重看',
  },
]
