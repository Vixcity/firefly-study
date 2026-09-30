/**
 * 《萤火书房》规则常量 —— 所有数值集中在这里，改规则只改这一个文件。
 * 设计铁律：绝不惩罚用户。这里不存在任何"扣分 / 清零 / 失败"的规则。
 */

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
