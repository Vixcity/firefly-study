# 萤火书房

> 点亮一只萤火虫，书房就亮一点。

一个移动端阅读习惯养成 App：**每一次阅读都会让书房更亮一点**。
没有排行榜、没有付费、没有"你已断签"的指责 —— 连击中断只是"萤火虫休息了一下"。

- 形态：单页 H5 / PWA（可添加到手机主屏、离线可用）
- 技术：React 19 + Vite 8 + antd-mobile 5 + dayjs + vite-plugin-pwa
- 数据：全部存在浏览器本地（`localStorage`），无后端、无登录，支持导出 JSON 备份
- 新手引导：首次进入是一屏欢迎页，接着在书房里用**聚光高亮**逐步讲 7 步，随时可从设置重看
- 明暗模式：设置里可选 **自动 / 日间 / 夜间**（默认夜间）。日间是「白天的书房」——
  窗外是蓝天和太阳，屋里照样有萤火虫，只是换了个光。

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

## 打包成安卓 APK

用 Capacitor 把 `dist/` 整个塞进 APK，由 WebView 直接读包内文件 ——
**装完就是离线的**，数据存在手机本机，和浏览器版共用同一套代码与数据结构。

### 方式一：让 GitHub 编（推荐，本机什么都不用装）

推一个 commit 到 `main` 就会自动触发，或者到仓库 **Actions → Android APK → Run workflow** 手动跑。
跑完在那次运行的页面底部下载 **`firefly-study-debug-apk`**，解压出来的 `app-debug.apk`
传到手机点安装即可（需要允许「安装未知来源应用」）。

### 方式二：在本机编

需要两样东西：

| 需要 | 说明 |
|---|---|
| **JDK 21** | Capacitor 8 的 android 工程编译级别是 Java 21，**JDK 17 编不过** |
| **Android SDK** | 装个 Android Studio 最省事（它会自动配好 SDK 和 `local.properties`） |

```bash
npm run android:apk     # = build:native + cap sync android + gradlew assembleDebug
# 产物：android/app/build/outputs/apk/debug/app-debug.apk
```

| 命令 | 干什么 |
|---|---|
| `npm run android:apk` | 一条龙：构建 web 产物 → 同步进 android 工程 → 打 debug APK |
| `npm run android:sync` | 只重新构建并同步（用 Android Studio 手动编之前跑这个） |
| `npm run android:open` | 用 Android Studio 打开 `android/` 工程 |
| `npm run icons` | 重新生成图标，同时写 `public/`（PWA）和 `android/`（mipmap） |

**改了代码一定要重新 sync**，否则 APK 里跑的还是上一次的 web 产物；`android:apk` 已经串好了。

### 两个产物别搞混

| 命令 | 给谁用 | Service Worker |
|---|---|---|
| `npm run build` | 浏览器 / PWA（可加到主屏、离线缓存） | 有 |
| `npm run build:native` | APK | **没有** |

原生构建刻意关掉 SW（见 `vite.config.js`）：在原生壳里 SW 不但没用，
还会把旧资源缓存住 —— 装了新版本 APK 打开还是老界面。

### 正式包 / 签名

上面出的都是 debug 包（自动用 debug keystore 签名，能直接装）。要上应用商店得自己签名：

```bash
cd android
keytool -genkey -v -keystore firefly.keystore -alias firefly -keyalg RSA -keysize 2048 -validity 10000
# 再在 android/app/build.gradle 里配 signingConfigs，然后 ./gradlew assembleRelease
```

### APK 和网页版的差异

- **「导出 JSON 备份」和「生成分享卡」在 APK 里点了不会下载文件**：
  Capacitor 的 WebView 没有实现 `DownloadListener`，`<a download>` / blob 下载会被忽略。
  数据只在这台手机上，所以这个口子比较要紧 —— 要修就得加
  `@capacitor/filesystem` + `@capacitor/share`，把下载改写成"写到应用目录再系统分享"。
- **每日提醒只在应用开着的时候响**（和网页版一样是页面内 Toast）。
  想要真正的系统通知，需要加 `@capacitor/local-notifications` 做本地定时通知。

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
│  ├─ TourOverlay.jsx       新手引导巡览（聚光高亮 + 说明卡）
│  └─ layout/TabBar.jsx     底部导航
├─ pages/                   书房 / 书库 / 荣光 / 报告 / 商店 / 设置 / 引导
├─ hooks/                   useNow / useThemeSync / useScheme / useReminder
└─ lib/                     date / format / id / rand / shareCard / antdReact19
```

### 布局：三层高度链

内容能滚动、Tab 栏永远贴底，靠的是一条**确定高度**的链条，改布局时别把它断掉：

```
html/body      height:100% + overflow:hidden   ← 页面本身不滚动
   └ #root     height:100dvh + overflow:hidden ← 必须给确定高度（用 min-height 会滚不动）
      └ .fs-app          height:100% + flex column
         ├ .fs-scroll    flex:1 + min-height:0 + overflow-y:auto  ← 唯一滚动容器
         └ .tabbar       flex:none（在 flex 流里，不用 position:fixed）
```

这样「滚动区高度 = 视口高度 − Tab 栏高度」是算出来的，不靠 `padding-bottom` 硬猜，
内容不可能被 Tab 栏压住。冒烟测试里有 4 条断言专门守这条链条。

更详细的设计取舍见 [DESIGN.md](./DESIGN.md)。

## 验证

```bash
npm run test        # 规则层：光点封顶、连击与休憩卡、光合树、徽章、闭环、报表区间
npm run dev         # 另开一个终端
npm run test:e2e    # 端到端：驱动本机 Chrome 走完整闭环，截图输出到 .smoke/
```

冒烟测试会真实走一遍：首次引导 → 加书 → **布局与滚动校验** → **7 步新手引导** →
开始/暂停计时 → 结算点亮 → 光点入账 → 萤火虫出现在书架 → 刷新后数据仍在 →
商店兑换并生效 → 徽章墙 → 报告与分享卡 → 设置与备份，
并断言浏览器控制台**没有报错**。计时相关的用例通过注入累计时长完成（不必真等 5 分钟）。

当前共 **42 个单元测试 + 58 项端到端断言**。

## 浏览器支持

- iOS Safari 15+ / Android Chrome 90+
- 桌面 Chrome / Edge / Safari 也可用（页面会居中成手机宽度）
- 用到了 `color-mix()`，不支持时会自动退回等价的 `rgba()` 兜底色

## 已知限制

1. **提醒只能在页面开着时生效** —— 纯前端没有服务端推送，无法在关掉浏览器后定时唤醒。
   设置页里如实说明了这一点。
2. **局域网 http 访问时不能离线** —— Service Worker 需要安全上下文。
3. 数据只在本机，换设备请用导出/导入备份。
