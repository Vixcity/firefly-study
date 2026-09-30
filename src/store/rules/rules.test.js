import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { createInitialState } from '../initialState'
import { dayPoints, readingPointsDelta } from './points'
import { buildDay, emptyDay } from './daily'
import { initialStreak, rebuildStreak, rolloverStreak, streakView } from './streak'
import { treeStage, treeView } from './tree'
import { badgeProgress, badgeWall, evaluateBadges } from './badges'
import { applySessionCompletion, discardReading } from './session'
import { addBook, deleteSession, markBookFinished, updateSession } from './books'
import { redeem, applyCosmetic } from './shop'
import { deriveStats, levelOf } from '../selectors'

// ------------------------------------------------------------------ 工具

const T = (date, hhmm) => dayjs(`${date} ${hhmm}`).valueOf()

/** 造一次已经读完的阅读（不走计时器，直接给一个累计秒数） */
function makeReading({ date, minutes, hour = 20, bookId = null, id }) {
  const startedAt = T(date, `${String(hour).padStart(2, '0')}:00`)
  const endedAt = startedAt + minutes * 60 * 1000
  return {
    reading: {
      sessionId: id || `ses_${date}_${hour}_${minutes}`,
      date,
      startedAt,
      accumulatedSec: minutes * 60,
      running: false,
      runningSince: null,
      bookId,
    },
    endedAt,
  }
}

/** 在 state 上模拟"读了 n 分钟" */
function readMinutes(state, { date, minutes, hour = 20, bookId = null, note = '', pages = null }) {
  const { reading, endedAt } = makeReading({ date, minutes, hour, bookId })
  const outcome = applySessionCompletion(
    { ...state, reading },
    {
      now: endedAt,
      bookId,
      note,
      startPage: pages ? pages[0] : null,
      endPage: pages ? pages[1] : null,
    }
  )
  return outcome
}

/** 连续多天每天读 n 分钟 */
function readSeveralDays(state, dates, minutes = 10, hour = 20) {
  let cur = state
  const results = []
  for (const date of dates) {
    const out = readMinutes(cur, { date, minutes, hour })
    cur = out.state
    results.push(out.result)
  }
  return { state: cur, results }
}

const TODAY = '2026-09-30'

// ------------------------------------------------------------------ 光点规则

describe('光点规则', () => {
  it('不满 5 分钟不给点亮分，只给时长分', () => {
    expect(dayPoints(0)).toMatchObject({ lit: false, litPoints: 0, timePoints: 0, total: 0 })
    expect(dayPoints(299)).toMatchObject({ lit: false, timePoints: 0, total: 0 })
    // 刚满 5 分钟就点亮（门槛是"大于等于"），同时拿到 1 点时长分
    expect(dayPoints(300)).toMatchObject({ lit: true, litPoints: 10, timePoints: 1, total: 11 })
  })

  it('读满门槛那一刻的场次被记为点亮时刻', () => {
    // 299 秒还不算点亮
    expect(dayPoints(299).lit).toBe(false)
    expect(buildDay('2026-09-01', [{ id: 'a', startedAt: 0, endedAt: 299000, durationSec: 299 }]).lit).toBe(false)
  })

  it('每多读 5 分钟 +1，单日封顶 100', () => {
    // 30 分钟：点亮 10 + 时长 6 = 16
    expect(dayPoints(30 * 60).total).toBe(16)
    // 顶到封顶：需要 90 点时长分 = 450 分钟
    const capped = dayPoints(450 * 60)
    expect(capped.raw).toBe(100)
    expect(capped.total).toBe(100)
    expect(capped.capped).toBe(true)
    // 再读也不涨
    expect(dayPoints(600 * 60).total).toBe(100)
  })

  it('增量按当日累计的差值计算，永远不会是负数', () => {
    expect(readingPointsDelta(0, 5 * 60 + 1)).toBe(11)
    expect(readingPointsDelta(5 * 60 + 1, 5 * 60 + 1)).toBe(0)
    expect(readingPointsDelta(600 * 60, 0)).toBe(0)
  })
})

// ------------------------------------------------------------------ 当天聚合

describe('当天聚合', () => {
  it('累计时长与点亮时间从会话推导', () => {
    const day = buildDay('2026-09-01', [
      { id: 'a', startedAt: 1000, endedAt: 2000, durationSec: 120 },
      { id: 'b', startedAt: 3000, endedAt: 90000, durationSec: 240 },
    ])
    expect(day.totalSec).toBe(360)
    expect(day.lit).toBe(true)
    // 跨过 300 秒的那一次是第二条
    expect(day.litAt).toBe(90000)
    expect(day.pointsEarned).toBe(11)
  })

  it('保留休憩卡标记', () => {
    const day = buildDay('2026-09-01', [], { rested: true, restedBy: 'card' })
    expect(day).toMatchObject({ rested: true, restedBy: 'card', lit: false, totalSec: 0 })
  })

  it('空日期结构完整', () => {
    expect(emptyDay('2026-09-01')).toMatchObject({ sessionIds: [], pointsEarned: 0 })
  })
})

// ------------------------------------------------------------------ 萤火连击

describe('萤火连击', () => {
  it('首次进入不追究安装之前的日子', () => {
    const streak = initialStreak(TODAY)
    const { streak: next, events } = rolloverStreak(streak, {}, TODAY)
    expect(next.lastSettledDate).toBe('2026-09-29')
    expect(next.current).toBe(0)
    expect(events).toHaveLength(0)
  })

  it('连续点亮 3 天，连击为 3，历史最佳同步', () => {
    let state = createInitialState(T('2026-09-28', '09:00'))
    const days = ['2026-09-28', '2026-09-29', '2026-09-30']
    state = readSeveralDays(state, days, 10).state
    const { streak } = rolloverStreak(state.streak, state.days, '2026-10-01')
    expect(streak.current).toBe(3)
    expect(streak.best).toBe(3)
  })

  it('今天点亮后连击立刻 +1，不用等到明天', () => {
    let state = createInitialState(T('2026-09-28', '09:00'))
    state = readSeveralDays(state, ['2026-09-28', '2026-09-29'], 10).state
    state = { ...state, streak: rolloverStreak(state.streak, state.days, '2026-09-30').streak }
    // 还没读今天
    let view = streakView(state.streak, state.days, '2026-09-30')
    expect(view.current).toBe(2)
    expect(view.todayLit).toBe(false)
    // 今天读了
    state = readMinutes(state, { date: '2026-09-30', minutes: 10 }).state
    view = streakView(state.streak, state.days, '2026-09-30')
    expect(view.current).toBe(3)
    expect(view.todayLit).toBe(true)
  })

  it('休憩卡自动护住连击，且不发当日奖励', () => {
    let state = createInitialState(T('2026-09-27', '09:00'))
    state = readSeveralDays(state, ['2026-09-27', '2026-09-28'], 10).state
    const earnedBefore = state.points.totalEarned
    expect(state.streak.restCards).toBe(1)

    // 只空了一天（9-29）：休憩卡顶上，连击不断
    const r1 = rolloverStreak(state.streak, state.days, '2026-09-30')
    expect(r1.streak.restCards).toBe(0)
    expect(r1.streak.current).toBe(3) // 9-27、9-28 + 被保护的 9-29
    expect(r1.dayPatches['2026-09-29']).toMatchObject({ rested: true, restedBy: 'card' })
    expect(r1.events.some((e) => e.type === 'card-used')).toBe(true)
    expect(state.points.totalEarned).toBe(earnedBefore) // 休憩不发任何奖励
    expect(r1.events.some((e) => e.type === 'paused')).toBe(false)

    // 再空一天（9-30）而手上没卡了：连击从零开始数，但 best 保留
    const days2 = { ...state.days }
    for (const date of Object.keys(r1.dayPatches)) days2[date] = { ...emptyDay(date), ...r1.dayPatches[date] }
    const r2 = rolloverStreak(r1.streak, days2, '2026-10-01')
    expect(r2.streak.current).toBe(0)
    expect(r2.streak.best).toBe(3)
    expect(r2.streak.pausedAt).toBe('2026-09-30')
  })

  it('连击中断不清零历史数据，best 永不减少', () => {
    let state = createInitialState(T('2026-09-20', '09:00'))
    state = readSeveralDays(state, ['2026-09-20', '2026-09-21', '2026-09-22'], 10).state

    // 断更到 9-28：期间靠 1 张休憩卡挡一天，其余日子连击暂停
    const broken = rolloverStreak(state.streak, state.days, '2026-09-28')
    expect(broken.streak.best).toBeGreaterThanOrEqual(3)
    expect(broken.streak.pausedLength).toBeGreaterThanOrEqual(3)
    expect(broken.streak.current).toBe(0)
    // 历史数据一条都没丢
    expect(Object.keys(state.days)).toEqual(
      expect.arrayContaining(['2026-09-20', '2026-09-21', '2026-09-22'])
    )
    // 中断期间给的是温柔提示，不是"失败"
    const pausedView = streakView(broken.streak, state.days, '2026-09-28')
    expect(pausedView.paused).toBe(true)

    // 重新点亮：从再次阅读起重新计数，历史最佳留着
    state = readMinutes({ ...state, streak: broken.streak }, { date: '2026-09-28', minutes: 10 }).state
    const after = rolloverStreak(state.streak, state.days, '2026-09-29')
    const view = streakView(after.streak, state.days, '2026-09-29')
    expect(view.current).toBe(1) // 9-28 是重新开始的第一天
    expect(view.best).toBeGreaterThanOrEqual(4)
    // 续上之后不再显示"休息中"
    expect(view.paused).toBe(false)
  })

  it('每月自动补发一张休憩卡，最多持有 3 张', () => {
    const streak = { ...initialStreak('2026-09-01'), restCards: 3, lastGrantMonth: '2026-09' }
    const { streak: next, events } = rolloverStreak(streak, {}, '2026-10-02')
    expect(next.restCards).toBe(3) // 已满，不再发
    expect(events.some((e) => e.type === 'card-grant')).toBe(false)

    const streak2 = { ...initialStreak('2026-09-01'), restCards: 1, lastGrantMonth: '2026-09' }
    const r2 = rolloverStreak(streak2, {}, '2026-10-02')
    expect(r2.streak.restCards).toBe(2)
    expect(r2.events.some((e) => e.type === 'card-grant')).toBe(true)
  })

  it('重建连击不会重复消耗休憩卡，best 不下降', () => {
    let state = createInitialState(T('2026-09-20', '09:00'))
    state = readSeveralDays(state, ['2026-09-20', '2026-09-21'], 10).state
    const rolled = rolloverStreak(state.streak, state.days, '2026-09-25')
    let after = { ...state, streak: rolled.streak, days: { ...state.days, ...dayPatchesToDays(rolled.dayPatches, state.days) } }
    const best = after.streak.best
    const rebuilt = rebuildStreak(after, '2026-09-25')
    expect(rebuilt.streak.best).toBeGreaterThanOrEqual(best)
    expect(rebuilt.streak.restCards).toBe(after.streak.restCards)
  })

  it('最近 7 天圆点状态：点亮 / 休憩 / 安静', () => {
    let state = createInitialState(T('2026-09-28', '09:00'))
    state = readSeveralDays(state, ['2026-09-28', '2026-09-30'], 10).state
    const view = streakView(state.streak, state.days, '2026-09-30')
    expect(view.recent).toHaveLength(7)
    expect(view.recent.find((d) => d.date === '2026-09-28').status).toBe('lit')
    expect(view.recent.find((d) => d.date === '2026-09-29').status).toBe('quiet')
    expect(view.recent.find((d) => d.date === '2026-09-30').status).toBe('lit')
    expect(view.litDays).toBe(2)
  })
})

function dayPatchesToDays(patches, days) {
  const out = {}
  for (const date of Object.keys(patches)) out[date] = { ...emptyDay(date), ...patches[date] }
  return out
}

// ------------------------------------------------------------------ 光合树

describe('光合树', () => {
  it('每满 1 小时成长一阶，10 阶封顶', () => {
    expect(treeStage(0)).toBe(0)
    expect(treeStage(3599)).toBe(0)
    expect(treeStage(3600)).toBe(1)
    expect(treeStage(9 * 3600)).toBe(9)
    expect(treeStage(100 * 3600)).toBe(9)
  })

  it('只增不减，久未阅读只是"睡着"', () => {
    const now = T('2026-09-30', '21:00')
    const view = treeView(5 * 3600, T('2026-09-20', '21:00'), now)
    expect(view.stage).toBe(5)
    expect(view.sleeping).toBe(true)
    expect(view.progress).toBeCloseTo(0)
    // 睡着的树不会掉阶
    const woke = treeView(5 * 3600, T('2026-09-30', '20:00'), now)
    expect(woke.stage).toBe(5)
    expect(woke.sleeping).toBe(false)
  })
})

// ------------------------------------------------------------------ 徽章

describe('徽章', () => {
  it('首次点亮解锁"初亮"', () => {
    const ctx = { litDays: 1 }
    expect(evaluateBadges({}, ctx)).toContain('first_light')
  })

  it('已解锁的徽章不会再被重复判定，也不会被撤销', () => {
    const unlocked = { first_light: 123 }
    expect(evaluateBadges(unlocked, { litDays: 5 })).not.toContain('first_light')
  })

  it('未解锁徽章显示"还差多少"，口吻不指责', () => {
    const p = badgeProgress('tower_seven', { bestStreak: 4 })
    expect(p.remain).toBe(3)
    expect(p.text).toBe('还差 3 天连击')
    expect(p.ratio).toBeCloseTo(4 / 7)
  })

  it('徽章墙把已获得的排前面', () => {
    const wall = badgeWall({ first_light: 200, spark_three: 100 }, { litDays: 1, bestStreak: 3 })
    expect(wall.got).toHaveLength(2)
    expect(wall.got[0].id).toBe('first_light') // 最近获得的在前
    expect(wall.total).toBeGreaterThanOrEqual(12)
    expect(wall.gotCount + wall.locked.length).toBe(wall.total)
  })
})

// ------------------------------------------------------------------ 完整闭环

describe('完整闭环：阅读 → 点亮 → 光点 → 徽章 → 树 → 连击', () => {
  it('读满 5 分钟完成点亮，一次性拿到点亮分与时长分', () => {
    const state = createInitialState(T(TODAY, '09:00'))
    const { state: next, result } = readMinutes(state, { date: TODAY, minutes: 6 })

    expect(result.newlyLit).toBe(true)
    expect(result.dayLit).toBe(true)
    expect(result.dayTotalSec).toBe(360)
    // 点亮 10 + 时长 floor(360/300)=1
    expect(result.pointsGained).toBe(11)
    expect(result.breakdown).toMatchObject({ lit: 10, time: 1, book: 0 })
    expect(result.newBadges).toContain('first_light')
    expect(next.points.balance).toBe(11)
    expect(next.points.totalEarned).toBe(11)
    expect(next.days[TODAY].lit).toBe(true)
    expect(next.days[TODAY].litAt).toBe(result.litAt)
    expect(next.reading).toBe(null)
    expect(next.tree.totalSec).toBe(360)
    expect(result.treeGrew).toBe(false)
    expect(result.streak.current).toBe(1)
  })

  it('同一天再读一次不会重复给点亮分', () => {
    let state = createInitialState(T(TODAY, '09:00'))
    state = readMinutes(state, { date: TODAY, minutes: 6 }).state
    const { result } = readMinutes(state, { date: TODAY, minutes: 6, hour: 21 })
    expect(result.newlyLit).toBe(false)
    expect(result.breakdown.lit).toBe(0)
    // 累计 720 秒 = 点亮 10 + 时长 2
    expect(result.breakdown.time).toBe(1)
    expect(result.pointsGained).toBe(1)
  })

  it('读满 1 小时，光合树长一阶', () => {
    let state = createInitialState(T(TODAY, '09:00'))
    const out = readMinutes(state, { date: TODAY, minutes: 60 })
    expect(out.result.treeBefore).toBe(0)
    expect(out.result.treeAfter).toBe(1)
    expect(out.result.treeGrew).toBe(true)
  })

  it('读完一本书 +50 光点，并解锁阅毕徽章', () => {
    let state = createInitialState(T(TODAY, '09:00'))
    state = addBook(state, { title: '夜航船', author: '张岱', totalPages: 100, now: T(TODAY, '09:00') })
    const bookId = state.books[0].id
    const { state: next, result } = readMinutes(state, {
      date: TODAY,
      minutes: 30,
      bookId,
      pages: [1, 100],
    })
    expect(result.finishedBookIds).toEqual([bookId])
    expect(result.breakdown.book).toBe(50)
    expect(result.newBadges).toContain('finish_one')
    expect(next.books[0]).toMatchObject({ status: 'finished', currentPage: 100 })
    // 30 分钟 = 16 点阅读分 + 50 书分
    expect(next.points.totalEarned).toBe(66)
  })

  it('手动标记读完只发一次光点', () => {
    let state = createInitialState(T(TODAY, '09:00'))
    state = addBook(state, { title: '雪国', totalPages: null, now: T(TODAY, '09:00') })
    const id = state.books[0].id
    const first = markBookFinished(state, id, T(TODAY, '10:00'))
    expect(first.result.pointsGained).toBe(50)
    const second = markBookFinished(first.state, id, T(TODAY, '11:00'))
    expect(second.result).toBe(null)
    expect(second.state.points.totalEarned).toBe(50)
  })

  it('夜读 / 晨读会解锁对应徽章', () => {
    let state = createInitialState(T(TODAY, '09:00'))
    const night = readMinutes(state, { date: TODAY, minutes: 6, hour: 22 })
    expect(night.result.newBadges).toContain('night_reader')
    let s2 = createInitialState(T('2026-09-29', '09:00'))
    const morning = readMinutes(s2, { date: '2026-09-29', minutes: 6, hour: 6 })
    expect(morning.result.newBadges).toContain('morning_reader')
  })

  it('等级由累计光点决定，且只升不降', () => {
    expect(levelOf(0).level.name).toBe('追光者')
    expect(levelOf(299).level.name).toBe('追光者')
    expect(levelOf(300).level.name).toBe('聚光者')
    expect(levelOf(1000).level.name).toBe('提灯人')
    expect(levelOf(9999).level.name).toBe('明月学士')
    expect(levelOf(9999).progress).toBe(1)
  })

  it('放弃阅读不留痕迹', () => {
    const state = { ...createInitialState(T(TODAY, '09:00')), reading: makeReading({ date: TODAY, minutes: 3 }).reading }
    const next = discardReading(state)
    expect(next.reading).toBe(null)
    expect(next.sessions).toHaveLength(0)
  })
})

// ------------------------------------------------------------------ 数据修正

describe('数据修正', () => {
  it('撤回记录：退回光点余额，但累计获得与等级不动（不惩罚）', () => {
    let state = createInitialState(T(TODAY, '09:00'))
    const out = readMinutes(state, { date: TODAY, minutes: 6 })
    state = out.state
    const before = { earned: state.points.totalEarned, level: levelOf(state.points.totalEarned).level.name }

    const del = deleteSession(state, out.result.sessionId, T(TODAY, '23:00'))
    expect(del.result.refunded).toBe(11)
    expect(del.state.points.balance).toBe(0)
    expect(del.state.points.totalEarned).toBe(before.earned) // 累计获得不回退
    expect(levelOf(del.state.points.totalEarned).level.name).toBe(before.level)
    // 萤火虫熄了（当天不再有点亮），但徽章保留
    expect(del.state.days[TODAY]).toBeUndefined()
    expect(del.state.badges.unlocked.first_light).toBeTruthy()
  })

  it('修正感想与页码会保留记录', () => {
    let state = createInitialState(T(TODAY, '09:00'))
    const out = readMinutes(state, { date: TODAY, minutes: 6 })
    state = updateSession(
      out.state,
      out.result.sessionId,
      { note: '今晚读到很好的一段', startPage: 10, endPage: 42 },
      T(TODAY, '23:00')
    )
    expect(state.sessions[0].note).toBe('今晚读到很好的一段')
    expect(state.sessions[0].endPage).toBe(42)
    expect(state.days[TODAY].totalSec).toBe(360)
    expect(deriveStats(state).totalPages).toBe(32)
  })
})

// ------------------------------------------------------------------ 商店

describe('光点商店', () => {
  it('光点不够时兑换失败并提示还差多少', () => {
    const state = createInitialState(T(TODAY, '09:00'))
    const { result } = redeem(state, 'firefly_cyan', T(TODAY, '10:00'))
    expect(result.insufficient).toBe(true)
    expect(result.missing).toBe(120)
  })

  it('兑换成功扣光点、永久拥有、并自动生效', () => {
    let state = createInitialState(T(TODAY, '09:00'))
    state = { ...state, points: { ...state.points, balance: 500, totalEarned: 500 } }
    const { state: next, result } = redeem(state, 'firefly_cyan', T(TODAY, '10:00'))
    expect(result.redeemed).toBe(true)
    expect(next.points.balance).toBe(380)
    expect(next.points.totalEarned).toBe(500) // 等级不因消费下降
    expect(next.cosmetic.owned).toContain('firefly_cyan')
    expect(next.cosmetic.fireflyColor).toBe('firefly_cyan')
    expect(result.newBadges).toContain('collector')
  })

  it('已拥有的商品再次点击只是"使用"，不再扣费', () => {
    let state = createInitialState(T(TODAY, '09:00'))
    state = { ...state, points: { ...state.points, balance: 500, totalEarned: 500 } }
    state = redeem(state, 'theme_starry', T(TODAY, '10:00')).state
    const balance = state.points.balance
    const again = redeem(state, 'theme_starry', T(TODAY, '11:00'))
    expect(again.result.alreadyOwned).toBe(true)
    expect(again.state.points.balance).toBe(balance)
  })

  it('未拥有的装扮无法直接使用', () => {
    const state = createInitialState(T(TODAY, '09:00'))
    const next = applyCosmetic(state, 'theme_rain')
    expect(next.cosmetic.theme).toBe('theme_ink')
  })

  it('免费默认装扮一开始就可用', () => {
    const state = createInitialState(T(TODAY, '09:00'))
    expect(state.cosmetic.owned).toEqual(
      expect.arrayContaining(['firefly_warm', 'theme_ink', 'tree_default'])
    )
    expect(state.cosmetic.fireflyColor).toBe('firefly_warm')
  })
})

// ------------------------------------------------------------------ 派生统计

describe('派生统计', () => {
  it('累计时长、点亮天数、页数、夜读次数口径一致', () => {
    let state = createInitialState(T('2026-09-25', '09:00'))
    state = addBook(state, { title: '书房一角', totalPages: 300, now: T('2026-09-25', '09:00') })
    const id = state.books[0].id
    state = readSeveralDays(state, ['2026-09-25', '2026-09-26'], 10).state
    state = readMinutes(state, { date: '2026-09-27', minutes: 20, hour: 23, bookId: id, pages: [10, 60] }).state

    const stats = deriveStats(state)
    expect(stats.totalSec).toBe((10 + 10 + 20) * 60)
    expect(stats.litDays).toBe(3)
    expect(stats.sessionsCount).toBe(3)
    expect(stats.nightReads).toBe(1)
    expect(stats.earlyReads).toBe(0)
    expect(stats.totalPages).toBe(50)
    expect(stats.longestSessionSec).toBe(20 * 60)
    expect(stats.maxDaySec).toBe(20 * 60)
    expect(stats.totalEarned).toBe(state.points.totalEarned)
  })

  it('一天读满 100 光点后不再增长（防报复性久读）', () => {
    let state = createInitialState(T(TODAY, '09:00'))
    const out = readMinutes(state, { date: TODAY, minutes: 9 * 60 })
    // 9 小时 = 点亮 10 + 时长 108，但封顶 100
    expect(out.result.pointsGained).toBe(100)
    expect(out.result.breakdown.cappedAway).toBeGreaterThan(0)
  })
})
