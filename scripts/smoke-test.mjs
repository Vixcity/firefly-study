/**
 * 端到端冒烟测试（零依赖，直接驱动本机 Chrome 的 CDP）。
 *
 * 做的事：
 *   1. 起一个无头 Chrome，接上 DevTools Protocol
 *   2. 全程收集 console 报错与未捕获异常
 *   3. 走一遍核心闭环：首次引导 → 加书 → 开始阅读 → 结算点亮 → 光点/萤火虫到账
 *      → 商店兑换 → 徽章解锁 → 刷新后数据仍在
 *   4. 关键节点截图到 .smoke/ 目录，方便肉眼复核
 *
 * 计时相关的验证靠"注入累计时长"完成 —— 总不能真等 5 分钟。
 *
 * 用法：node scripts/smoke-test.mjs [baseUrl]
 */
import { spawn } from 'node:child_process'
import { mkdirSync, existsSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SHOT_DIR = resolve(ROOT, '.smoke')
const BASE = process.argv[2] || 'http://127.0.0.1:5173'
const PORT = 9333

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------- CDP 客户端

class Cdp {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    this.onEvent = () => {}
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve: res, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) reject(new Error(msg.error.message))
        else res(msg.result)
      } else if (msg.method) {
        this.onEvent(msg)
      }
    })
  }

  send(method, params = {}) {
    const id = (this.id += 1)
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new Error(`${method} 超时`))
        }
      }, 30000)
    })
  }

  async eval(expression, { awaitPromise = true } = {}) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
      userGesture: true,
    })
    if (r.exceptionDetails) {
      throw new Error(`页面内异常：${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description || ''}`)
    }
    return r.result.value
  }

  async shot(name) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' })
    const file = resolve(SHOT_DIR, `${name}.png`)
    writeFileSync(file, Buffer.from(r.data, 'base64'))
    return file
  }
}

// ---------------------------------------------------------------- 断言

const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}
const assert = (name, cond, detail) => check(name, !!cond, detail)

// ---------------------------------------------------------------- 主流程

async function main() {
  if (existsSync(SHOT_DIR)) rmSync(SHOT_DIR, { recursive: true, force: true })
  mkdirSync(SHOT_DIR, { recursive: true })

  const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p))
  if (!chromePath) {
    console.error('没有找到 Chrome / Edge，请手动指定浏览器路径')
    process.exit(2)
  }
  console.log(`浏览器：${chromePath}`)

  const profile = resolve(tmpdir(), `fs-smoke-${Date.now()}`)
  const proc = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      '--window-size=390,844',
      'about:blank',
    ],
    { stdio: 'ignore' }
  )

  let ws
  let cdp
  const problems = []

  try {
    // 等 DevTools 端口起来
    let target = null
    for (let i = 0; i < 60 && !target; i += 1) {
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
        const list = await res.json()
        target = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
      } catch {
        await sleep(250)
      }
    }
    if (!target) throw new Error('连不上 Chrome 的调试端口')

    ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((res, rej) => {
      ws.addEventListener('open', res)
      ws.addEventListener('error', rej)
    })
    cdp = new Cdp(ws)

    cdp.onEvent = (msg) => {
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        problems.push(`console.error: ${msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`)
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails
        problems.push(`未捕获异常: ${d.text} ${d.exception?.description || ''}`)
      }
      if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
        problems.push(`log: ${msg.params.entry.text}`)
      }
    }

    await cdp.send('Runtime.enable')
    await cdp.send('Log.enable')
    await cdp.send('Page.enable')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    })

    /** 打开页面并等 React 渲染出来 */
    const open = async (url = BASE) => {
      await cdp.send('Page.navigate', { url })
      for (let i = 0; i < 80; i += 1) {
        await sleep(150)
        const ready = await cdp.eval(
          `!!document.querySelector('.fs-app, .onboard')`,
          { awaitPromise: false }
        )
        if (ready) return true
      }
      return false
    }

    /** 按可见文字点按钮 */
    const clickText = async (text, { exact = false, nth = 0 } = {}) => {
      const ok = await cdp.eval(`(() => {
        const els = [...document.querySelectorAll('button, [role="tab"], .fs-chip, a')]
        const hit = els.filter((e) => {
          const t = (e.innerText || '').trim()
          return ${exact ? `t === ${JSON.stringify(text)}` : `t.includes(${JSON.stringify(text)})`}
        })
        const el = hit[${nth}]
        if (!el) return false
        el.click()
        return true
      })()`)
      await sleep(420)
      return ok
    }

    /** 只点弹窗（Dialog）内部的按钮，避免误点到弹窗后面页面上的同字按钮 */
    const clickDialog = async (label) => {
      const ok = await cdp.eval(`(() => {
        const dialog = document.querySelector('.adm-dialog')
        if (!dialog) return false
        const hit = [...dialog.querySelectorAll('button')]
          .find((b) => (b.innerText || '').trim() === ${JSON.stringify(label)})
        if (!hit) return false
        hit.click()
        return true
      })()`)
      await sleep(520)
      return ok
    }

    /** 按 TabBar 切页 */
    const goTab = async (label) => {
      const ok = await cdp.eval(`(() => {
        const tab = [...document.querySelectorAll('.tabbar__item')]
          .find((t) => (t.innerText || '').includes(${JSON.stringify(label)}))
        if (!tab) return false
        tab.click()
        return true
      })()`)
      await sleep(750)
      return ok
    }

    const bodyText = () => cdp.eval('document.body.innerText')

    // ============================================================ 1. 首次引导
    console.log('\n[1] 首次引导')
    // 先落到 App 域名下才有权限清 localStorage；清完再重载，保证是全新用户
    assert('页面渲染成功', await open())
    await cdp.eval(`localStorage.clear()`, { awaitPromise: false })
    await open()
    await sleep(400)
    await cdp.shot('01-onboard')
    let text = await bodyText()
    assert('引导页出现', text.includes('萤火书房'))
    assert('讲清了低门槛', text.includes('读满 5 分钟'))
    assert('讲清了不惩罚', text.includes('漏读不扣分'))
    assert('讲了数据本地保存', text.includes('数据只保存在这台设备上'))

    // ============================================================ 2. 加一本书
    console.log('\n[2] 加一本书')
    assert('点「先加一本想读的书」', await clickText('先加一本想读的书'))
    await sleep(600)
    const added = await cdp.eval(`(() => {
      const btns = [...document.querySelectorAll('.fs-iconbtn')]
      const plus = btns.find((b) => (b.getAttribute('aria-label') || '').includes('新增'))
      if (plus) { plus.click(); return 'sheet' }
      return document.body.innerText.includes('加一本书') ? 'empty-cta' : null
    })()`)
    await sleep(600)
    if (added === 'empty-cta') await clickText('加一本书')
    await cdp.eval(`(() => {
      const setVal = (el, v) => {
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement
        const setter = Object.getOwnPropertyDescriptor(proto.prototype, 'value').set
        setter.call(el, v)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
      const inputs = [...document.querySelectorAll('.fs-sheet input')]
      setVal(inputs[0], '夜航船')
      setVal(inputs[1], '张岱')
      setVal(inputs[2], '120')
      return inputs.length
    })()`)
    await sleep(200)
    await clickText('保存', { exact: true })
    await sleep(700)
    text = await bodyText()
    assert('书已经放进书架', text.includes('夜航船'), text.slice(0, 0))
    await cdp.shot('02-books')

    // ============================================================ 3. 布局与滚动
    console.log('\n[3] 布局：滚动容器与底部 Tab 栏')
    await goTab('书房')
    const layout = await cdp.eval(`JSON.stringify((() => {
      const sc = document.querySelector('.fs-scroll')
      const tb = document.querySelector('.tabbar')
      const tbr = tb.getBoundingClientRect()
      return {
        viewportH: window.innerHeight,
        scrollClientH: sc.clientHeight,
        scrollHeight: sc.scrollHeight,
        scrollable: sc.scrollHeight - sc.clientHeight,
        tabbarTop: Math.round(tbr.top),
        tabbarBottom: Math.round(tbr.bottom),
        tabbarInFlow: getComputedStyle(tb).position !== 'fixed',
      }
    })())`)
    const L = JSON.parse(layout)
    assert('滚动容器拿到确定高度（内容可滚动）', L.scrollable > 0, `可滚动 ${L.scrollable}px`)
    assert(
      'Tab 栏在 flex 流里，且正好贴在视口底部',
      L.tabbarInFlow && Math.abs(L.tabbarBottom - L.viewportH) <= 1,
      `bottom=${L.tabbarBottom} viewport=${L.viewportH}`
    )
    assert(
      '滚动区高度 = 视口高度 − Tab 栏高度（内容不会被遮住）',
      Math.abs(L.scrollClientH - L.tabbarTop) <= 1,
      `scroll=${L.scrollClientH} tabbarTop=${L.tabbarTop}`
    )

    // 滚到底，最后一个元素必须完整露在 Tab 栏之上
    await cdp.eval(`(() => { const sc = document.querySelector('.fs-scroll'); sc.scrollTop = sc.scrollHeight })()`)
    await sleep(700)
    const atBottom = await cdp.eval(`JSON.stringify((() => {
      const sc = document.querySelector('.fs-scroll')
      const items = [...sc.querySelectorAll('.fs-page > *')]
      const last = items[items.length - 1]
      const r = last.getBoundingClientRect()
      const tbr = document.querySelector('.tabbar').getBoundingClientRect()
      return { lastBottom: Math.round(r.bottom), tabbarTop: Math.round(tbr.top) }
    })())`)
    const B = JSON.parse(atBottom)
    assert('滚到底后末尾元素完整可见（没被 Tab 栏压住）', B.lastBottom <= B.tabbarTop + 1, `${B.lastBottom} <= ${B.tabbarTop}`)
    await cdp.shot('03-layout-bottom')
    await cdp.eval(`(() => { document.querySelector('.fs-scroll').scrollTop = 0 })()`)
    await sleep(400)

    // ============================================================ 4. 新手引导巡览
    console.log('\n[4] 新手引导巡览')
    await sleep(600)
    const tourAppeared = await cdp.eval(`!!document.querySelector('.tour')`)
    assert('首次进入书房时出现新手引导', tourAppeared)
    const steps = await cdp.eval(`document.querySelectorAll('.tour__dot').length`)
    assert('引导是多步的（指着真实界面讲）', steps >= 5, `${steps} 步`)
    await cdp.shot('04-tour-step1')

    let walked = 0
    let tourOk = true
    for (let i = 0; i < steps + 1; i += 1) {
      const state = await cdp.eval(`JSON.stringify((() => {
        const card = document.querySelector('.tour__card')
        const hole = document.querySelector('.tour__hole')
        const next = document.querySelector('.tour__next')
        if (!card || !next) return { gone: true }
        const cr = card.getBoundingClientRect()
        const hr = hole && hole.style.display !== 'none' ? hole.getBoundingClientRect() : null
        // 说明卡不能压在它高亮的那个元素上
        const overlap = hr ? !(cr.bottom <= hr.top + 1 || cr.top >= hr.bottom - 1) : false
        return {
          title: document.querySelector('.tour__title').innerText,
          inViewport: cr.top >= -1 && cr.bottom <= window.innerHeight + 1,
          overlap,
          next: next.innerText.replace(/\\s+/g, ''),
        }
      })())`)
      const st = JSON.parse(state)
      if (st.gone) break
      walked += 1
      if (!st.inViewport || st.overlap) {
        tourOk = false
        console.log(`      ✗ 第 ${walked} 步（${st.title}）位置异常 inViewport=${st.inViewport} overlap=${st.overlap}`)
      }
      if (walked === 2 || walked === steps) await cdp.shot(`04-tour-step${walked}`)
      await cdp.eval(`(() => { document.querySelector('.tour__next').click() })()`)
      await sleep(750)
    }
    assert('每一步的说明卡都在屏幕内、且不遮挡高亮元素', tourOk)
    assert('走完所有步骤后引导自动关闭', !(await cdp.eval(`!!document.querySelector('.tour')`)), `共走 ${walked} 步`)
    assert(
      '进度已记录（不会每次进来都弹）',
      await cdp.eval(`JSON.parse(localStorage.getItem('firefly-study:v1')).tour.done === true`)
    )

    // ============================================================ 5. 开始阅读
    console.log('\n[5] 开始阅读（计时）')
    const readingBook = await cdp.eval(`(() => document.querySelector('.study__cta')?.innerText.trim() || '')()`)
    assert('书房页有开始阅读入口', readingBook.includes('开始阅读'), readingBook)

    // 一次性点中主 CTA（比按文字找更稳）
    const clicked = await cdp.eval(`(() => {
      const cta = document.querySelector('.study__cta')
      if (!cta) return false
      cta.click()
      return true
    })()`)
    assert('点「开始阅读」', clicked)
    await sleep(900)
    text = await bodyText()
    assert('进入全屏计时', text.includes('结束阅读') && text.includes('暂停'))
    assert('显示了 5 分钟门槛提示', text.includes('点亮今天'))
    await cdp.shot('03-timer-running')

    const t1 = await cdp.eval(`document.querySelector('.reading__time')?.innerText || ''`)
    await sleep(2200)
    const t2 = await cdp.eval(`document.querySelector('.reading__time')?.innerText || ''`)
    assert('计时器在走', t1 && t1 !== t2, `${t1} → ${t2}`)

    assert('暂停可用', await clickText('暂停', { exact: true }))
    const tp1 = await cdp.eval(`document.querySelector('.reading__time')?.innerText || ''`)
    await sleep(1600)
    const tp2 = await cdp.eval(`document.querySelector('.reading__time')?.innerText || ''`)
    assert('暂停后计时停住', !!tp1 && tp1 === tp2, `${tp1} = ${tp2}`)

    // 注入累计时长：把"已经读了 6 分钟"写进本地状态，然后重载
    console.log('\n[6] 结算与点亮（注入 6 分钟累计时长）')
    await cdp.eval(`(() => {
      const key = 'firefly-study:v1'
      const s = JSON.parse(localStorage.getItem(key))
      s.reading.accumulatedSec = 6 * 60
      s.reading.running = false
      s.reading.runningSince = null
      localStorage.setItem(key, JSON.stringify(s))
      return true
    })()`)
    await open()
    await sleep(700)
    text = await bodyText()
    assert('恢复计时后显示已点亮', text.includes('今天的萤火虫已经亮了'), '')
    await cdp.shot('04-timer-lit')

    assert('点「结束阅读」', await clickText('结束阅读'))
    await sleep(700)
    text = await bodyText()
    assert('进入结算表单', text.includes('记一下这一会儿'))
    assert('结算页允许不填', text.includes('都可以不填'))

    // 填一点内容：选书 + 感想
    await cdp.eval(`(() => {
      const setVal = (el, v) => {
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement
        Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, v)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
      const ta = document.querySelector('.fs-sheet textarea')
      if (ta) setVal(ta, '今晚读到一段很好的文字')
      const nums = [...document.querySelectorAll('.fs-sheet input[type=number]')]
      if (nums[0]) setVal(nums[0], '1')
      if (nums[1]) setVal(nums[1], '42')
      return true
    })()`)
    // 打开选书弹层，挑一本
    await cdp.eval(`(() => {
      const pick = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').includes('不指定书目') || (b.innerText||'').includes('夜航船'))
      if (pick) pick.click()
      return true
    })()`)
    await sleep(600)
    await cdp.eval(`(() => {
      const item = [...document.querySelectorAll('.bookpick__item')].find((b) => (b.innerText || '').includes('夜航船'))
      if (item) item.click()
      return !!item
    })()`)
    await sleep(400)

    // 重新填感想（弹层关闭后表单还在）
    await cdp.eval(`(() => {
      const ta = document.querySelector('.reading__form textarea')
      if (!ta) return false
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, '今晚读到一段很好的文字')
      ta.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    })()`)
    await sleep(200)
    assert('点「保存并点亮」', await clickText('保存并点亮'))
    await sleep(1400)
    text = await bodyText()
    assert('出现点亮动画', text.includes('点亮了一只萤火虫'))
    assert('显示了光点收益', text.includes('光点'), '')
    await cdp.shot('05-reward')

    // 从结算结果里取到实际光点数
    const gained = await cdp.eval(`(() => {
      const m = document.body.innerText.match(/\\+(\\d+)/)
      return m ? Number(m[1]) : 0
    })()`)
    assert('光点入账（点亮 10 + 时长 1）', gained === 11, `实得 +${gained}`)
    assert('解锁了初亮徽章', text.includes('初亮') || text.includes('新徽章'))

    console.log('\n[7] 回到书房')
    assert('点「回到书房」', await clickText('回到书房'))
    await sleep(1000)
    text = await bodyText()
    assert('书房出现萤火虫', text.includes('1 只萤火虫'), '')
    assert('顶部光点余额正确', text.includes('11'))
    assert('今天标记为已点亮', text.includes('已点亮'))
    assert('连击变为 1 天', (await cdp.eval(`document.querySelector('.study__streak-num')?.innerText || ''`)).includes('1'))
    assert('光合树显示阶数', text.includes('光合树'))
    await cdp.shot('06-study-lit')

    // ============================================================ 6. 数据持久化
    console.log('\n[8] 刷新后数据不丢')
    await open()
    await sleep(600)
    text = await bodyText()
    assert('刷新后萤火虫还在', text.includes('1 只萤火虫'))
    assert('刷新后今天仍是已点亮', text.includes('已点亮'))

    // ============================================================ 7. 商店兑换
    console.log('\n[9] 光点商店兑换')
    await cdp.eval(`(() => {
      const tab = [...document.querySelectorAll('.tabbar__item')].find((t) => (t.innerText || '').includes('商店'))
      if (tab) tab.click()
      return !!tab
    })()`)
    await sleep(700)
    text = await bodyText()
    assert('进入商店', text.includes('光点怎么来'))
    await cdp.shot('07-shop')

    // 光点不够时应该给出"还差多少"
    await cdp.eval(`(() => {
      const btn = [...document.querySelectorAll('.shop__item .fs-btn')].find((b) => (b.innerText || '').includes('兑换'))
      if (btn) btn.click()
      return !!btn
    })()`)
    await sleep(500)
    text = await bodyText()
    assert('光点不够时提示还差多少', text.includes('还差') || text.includes('继续攒光点'))
    // 只点弹窗里的"再想想"，不要误点到页面上后面的按钮
    assert('弹窗可以关掉', await clickDialog('再想想'))

    // 给足光点再兑换
    await cdp.eval(`(() => {
      const key = 'firefly-study:v1'
      const s = JSON.parse(localStorage.getItem(key))
      s.points.balance = 400
      s.points.totalEarned = 400
      localStorage.setItem(key, JSON.stringify(s))
      return true
    })()`)
    await open()
    await sleep(600)
    await cdp.eval(`(() => {
      const tab = [...document.querySelectorAll('.tabbar__item')].find((t) => (t.innerText || '').includes('商店'))
      if (tab) tab.click()
      return !!tab
    })()`)
    await sleep(600)
    await cdp.eval(`(() => {
      const btn = [...document.querySelectorAll('.shop__item .fs-btn')].find((b) => (b.innerText || '').includes('兑换'))
      if (btn) btn.click()
      return !!btn
    })()`)
    await sleep(600)

    assert('确认弹窗点「兑换」', await clickDialog('兑换'))
    await sleep(900)
    text = await bodyText()
    assert('兑换成功并自动生效', text.includes('使用中') || text.includes('已拥有'))
    const themeApplied = await cdp.eval(`document.documentElement.getAttribute('data-firefly')`)
    assert('萤火虫配色已切换', themeApplied && themeApplied !== 'firefly_warm', themeApplied)
    await cdp.shot('08-shop-owned')

    // ============================================================ 10. 徽章页
    console.log('\n[10] 荣光与报告')
    await cdp.eval(`(() => {
      const tab = [...document.querySelectorAll('.tabbar__item')].find((t) => (t.innerText || '').includes('荣光'))
      if (tab) tab.click()
      return !!tab
    })()`)
    await sleep(800)
    text = await bodyText()
    assert('徽章墙渲染', text.includes('追光者'))
    assert('显示已获得徽章', text.includes('初亮'))
    assert('未获得徽章显示进度', text.includes('还差'))
    await cdp.shot('09-badges')

    await cdp.eval(`(() => {
      const tab = [...document.querySelectorAll('.tabbar__item')].find((t) => (t.innerText || '').includes('报告'))
      if (tab) tab.click()
      return !!tab
    })()`)
    await sleep(800)
    text = await bodyText()
    assert('报告页渲染', text.includes('累计阅读') || text.includes('从开始到现在'))
    assert('出现温暖文案', text.includes('萤火虫') || text.includes('微光'))
    await cdp.shot('10-report')

    // 生成分享卡
    assert('点「生成分享卡」', await clickText('生成分享卡'))
    await sleep(1600)
    const cardOk = await cdp.eval(`(() => !!document.querySelector('.report__cardimg') && document.querySelector('.report__cardimg').src.startsWith('data:image/png'))()`)
    assert('分享卡片生成成功', cardOk)
    await cdp.shot('11-sharecard')

    // ============================================================ 11. 设置与导出
    console.log('\n[11] 设置与备份')
    await cdp.eval(`(() => {
      const tab = [...document.querySelectorAll('.tabbar__item')].find((t) => (t.innerText || '').includes('书房'))
      if (tab) tab.click()
      return !!tab
    })()`)
    await sleep(600)
    await cdp.eval(`(() => {
      const s = [...document.querySelectorAll('.fs-iconbtn')].find((b) => (b.getAttribute('aria-label') || '').includes('设置'))
      if (s) s.click()
      return !!s
    })()`)
    await sleep(700)
    text = await bodyText()
    assert('设置弹层打开', text.includes('每日提醒'))
    assert('提醒默认关闭', await cdp.eval(`(() => {
      const sw = document.querySelector('.adm-switch')
      return sw ? !sw.classList.contains('adm-switch-checked') : false
    })()`))
    assert('讲了数据只在本机', text.includes('数据只在这台设备上'))
    await cdp.shot('12-settings')

    // 导出应该真的触发一次下载（这里只验证按钮在 & 备份内容可解析）
    const exportOk = await cdp.eval(`(() => {
      const s = localStorage.getItem('firefly-study:v1')
      if (!s) return false
      const d = JSON.parse(s)
      return Array.isArray(d.sessions) && d.sessions.length > 0 && !!d.dayIndex === false
    })()`)
    assert('本地数据结构完整且含会话', exportOk)

    await sleep(300)

    // ============================================================ 12. 控制台干净
    console.log('\n[12] 控制台')
    const realProblems = problems.filter(
      (p) => !p.includes('favicon') && !p.includes('DevTools') && !p.includes('Download the React DevTools')
    )
    assert('没有 console 报错 / 未捕获异常', realProblems.length === 0, realProblems.slice(0, 4).join(' | '))

    // ============================================================ 汇总
    const failed = results.filter((r) => !r.ok)
    console.log(`\n${'='.repeat(58)}`)
    console.log(`通过 ${results.length - failed.length} / ${results.length}`)
    if (failed.length) {
      console.log('\n未通过：')
      failed.forEach((f) => console.log(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ''}`))
    }
    console.log(`截图目录：${SHOT_DIR}`)
    console.log('='.repeat(58))
    process.exitCode = failed.length ? 1 : 0
  } catch (e) {
    console.error('\n冒烟测试中断：', e.message)
    if (problems.length) console.error('页面报错：\n' + problems.slice(0, 8).join('\n'))
    process.exitCode = 1
  } finally {
    try {
      ws?.close()
    } catch {
      /* ignore */
    }
    proc.kill()
    await sleep(300)
  }
}

main()
