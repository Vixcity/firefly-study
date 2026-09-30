# 萤火书房

> 点亮一只萤火虫，书房就亮一点。

一个移动端阅读习惯养成 App：**每一次阅读都会让书房更亮一点**。
没有排行榜、没有付费、没有"你已断签"的指责 —— 连击中断只是"萤火虫休息了一下"。

- 形态：单页 H5 / PWA（可添加到手机主屏、离线可用）
- 技术：React 19 + Vite 8 + antd-mobile 5 + dayjs + vite-plugin-pwa
- 数据：全部存在浏览器本地（`localStorage`），无后端、无登录，支持导出 JSON 备份

---

## 快速开始

```bash
npm install
npm run dev          # 打开 http://localhost:5173
```

其他命令：

```bash
npm run build        # 生产构建（含 Service Worker）
npm run preview      # 本地预览构建产物
npm run test         # 规则层单元测试（42 个用例）
npm run test:e2e     # 端到端冒烟测试（需先跑起 dev 或 preview，用本机 Chrome 无头驱动）
npm run icons        # 重新生成 PWA 图标（纯 Node，无依赖）
```

## 手机上怎么用

**方式一：同一局域网直接访问（最快）**

```bash
npm run dev -- --host      # 或 npm run preview -- --host
```

终端会打印形如 `http://192.168.1.23:5173` 的地址（Network 那一行），
手机连同一个 Wi-Fi，浏览器打开即可。

> 注意：用 IP 访问时**不能离线缓存**，因为 Service Worker 只在安全上下文
> （`localhost` 或 https）下才会注册。功能完全正常，只是没有离线能力。

**方式二：加到手机主屏（推荐，像原生 App）**

- **iOS Safari**：打开页面 → 分享 → 「添加到主屏幕」
- **Android Chrome**：打开页面 → 右上角菜单 → 「添加到主屏幕」

添加后从主屏图标进入就是全屏无地址栏的 App 形态。

**方式三：部署成 https 站点**（Vercel / Netlify / GitHub Pages 均可）

```bash
npm run build          # 产物在 dist/，直接整目录上传即可
```

因为构建时 `base: './'` 用的是相对路径，放在任意子目录都能跑。此时离线缓存完全生效，
第一次打开之后即使断网也能用。

## 数据与备份

数据**只保存在这台设备的浏览器里**，不会上传到任何服务器。所以：

- 换手机 / 换浏览器 / 清理浏览器数据 → 数据会丢
- 想留底：**设置 → 导出 JSON 备份**，会下载一个 `萤火书房备份-日期.json`
- 换设备：在新设备上 **设置 → 导入备份**，选择那个 JSON 即可

## 核心玩法（术语与实现一致）

| 功能 | App 内叫法 | 规则 |
|---|---|---|
| 完成当日阅读 | **点亮** | 当日累计读满 **5 分钟**就算，生成一只萤火虫 |
| 连续阅读天数 | **萤火连击** | 中断不清零历史数据与最佳纪录，只重新数当前连击 |
| 连击保护 | **休憩卡** | 每月自动发 1 张（上限 3 张），漏读当天自动消耗护住连击，不发奖励 |
| 积分 | **光点** | 点亮 +10；每多读 5 分钟 +1；单日封顶 100；读完一本书 +50 |
| 陪伴物 | **光合树** | 每累计满 1 小时长一阶，共 10 阶；只长不落，久未阅读只是"睡着" |
| 等级 | **追光者 → 聚光者 → 提灯人 → 明月学士** | 由累计获得的光点决定，消费不掉级 |

**绝不惩罚**具体落在这几处：不存在扣分逻辑、连击中断不删任何历史、光合树不退化、
撤回记录只退光点余额而不降等级、提醒文案是"书房里的萤火虫想你了"而不是催打卡，
并且**今天已经点亮过就不再提醒**。

## 目录结构

```
src/
├─ main.jsx                 入口（第一行先给 antd-mobile 打 React 19 兼容补丁）
├─ App.jsx                  外壳：底部导航 + 5 个页面 + 计时/点亮/设置三个浮层
├─ styles/                  设计令牌 / 基础样式 / 动画库 / antd-mobile 外观微调
├─ store/
│  ├─ store.jsx             状态容器（ref + 版本号，业务计算在 React 更新周期之外）
│  ├─ storage.js            localStorage 读写、版本迁移、导出/导入、损坏兜底
│  ├─ initialState.js       全新用户的初始状态
│  ├─ selectors.js          派生统计、等级、报表区间、房间亮度
│  ├─ constants.js          所有规则数值与文案（改规则只动这一个文件）
│  ├─ catalog.js            徽章 21 枚 + 光点商店目录
│  └─ rules/                纯函数规则层（42 个单测覆盖）
│     ├─ points.js          光点计算（含单日封顶）
│     ├─ daily.js           按天聚合、点亮时刻
│     ├─ streak.js          连击结算、休憩卡、历史最佳
│     ├─ tree.js            光合树成长
│     ├─ badges.js          徽章判定与进度
│     ├─ timer.js           阅读计时状态机
│     ├─ session.js         结束阅读 → 结算 → 发奖励（核心闭环）
│     ├─ books.js           书籍增删改、读完、记录修正
│     ├─ shop.js            兑换与装扮生效
│     └─ reward.js          统一的奖励/徽章入口
├─ components/
│  ├─ scene/                书房场景：StudyScene / Firefly / PhotoTree + scene.css
│  ├─ icons/Icons.jsx       自绘 SVG 图标集（含品牌标记 FireflyMark）
│  ├─ ui/                   Ring / DayDots / BarChart / Segmented / Sheet / BookCover
│  ├─ DayDetailSheet.jsx    某一天的阅读详情（可修正、可撤回）
│  ├─ ReadingFlow.jsx       全屏计时 + 结算表单
│  ├─ RewardOverlay.jsx     点亮时刻的仪式感
│  └─ layout/TabBar.jsx     底部导航
├─ pages/                   书房 / 书库 / 荣光 / 报告 / 商店 / 设置 / 引导
├─ hooks/                   useNow / useThemeSync / useReminder
└─ lib/                     date / format / id / rand / shareCard / antdReact19
```

更详细的设计取舍见 [DESIGN.md](./DESIGN.md)。

## 验证

```bash
npm run test        # 规则层：光点封顶、连击与休憩卡、光合树、徽章、闭环、报表区间
npm run dev         # 另开一个终端
npm run test:e2e    # 端到端：驱动本机 Chrome 走完整闭环，截图输出到 .smoke/
```

冒烟测试会真实走一遍：首次引导 → 加书 → 开始/暂停计时 → 结算点亮 → 光点入账 →
萤火虫出现在书架 → 刷新后数据仍在 → 商店兑换并生效 → 徽章墙 → 报告与分享卡 → 设置与备份，
并断言浏览器控制台**没有报错**。计时相关的用例通过注入累计时长完成（不必真等 5 分钟）。

## 浏览器支持

- iOS Safari 15+ / Android Chrome 90+
- 桌面 Chrome / Edge / Safari 也可用（页面会居中成手机宽度）
- 用到了 `color-mix()`，不支持时会自动退回等价的 `rgba()` 兜底色

## 已知限制

1. **提醒只能在页面开着时生效** —— 纯前端没有服务端推送，无法在关掉浏览器后定时唤醒。
   设置页里如实说明了这一点。
2. **局域网 http 访问时不能离线** —— Service Worker 需要安全上下文。
3. 数据只在本机，换设备请用导出/导入备份。
