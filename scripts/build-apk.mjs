/**
 * 用 Gradle wrapper 打一个 debug APK（能直接装到手机上）。
 *
 *   npm run android:apk        # = build:native + cap sync + 这个脚本
 *
 * 前置条件（本机编包才需要；走 GitHub Actions 的话不用管）：
 *   1. JDK 21      —— Capacitor 8 的 android 工程编译级别是 Java 21，17 编不过
 *   2. Android SDK —— 设好 ANDROID_HOME，或者用 Android Studio 打开一次让它生成 local.properties
 *
 * 打 release 包（要签名）不在这个脚本里：
 *   cd android && ./gradlew assembleRelease
 * 首次需要自己生成 keystore 并配 signingConfigs，见 README 的「安卓 APK」一节。
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ANDROID_DIR = resolve(ROOT, 'android')
const isWin = process.platform === 'win32'
const WRAPPER = isWin ? 'gradlew.bat' : './gradlew'
const APK = resolve(ANDROID_DIR, 'app/build/outputs/apk/debug/app-debug.apk')

function fail(msg, hint) {
  console.error(`\n✗ ${msg}`)
  if (hint) console.error(`  ${hint}`)
  process.exit(1)
}

if (!existsSync(ANDROID_DIR)) {
  fail('还没有 android/ 工程', '先跑一次：npx cap add android（或者 npm run android:sync 会自动补上 web 产物）')
}
if (!existsSync(resolve(ANDROID_DIR, isWin ? 'gradlew.bat' : 'gradlew'))) {
  fail('找不到 Gradle wrapper', 'android/ 工程不完整，重新跑 npx cap add android')
}

// ---- 环境自检：先给出人话，别让用户去看 Gradle 那一大段报错 ----
const javaProbe = spawnSync(isWin ? 'java.exe' : 'java', ['-version'], { encoding: 'utf8' })
if (javaProbe.error) {
  fail(
    '没找到 java —— 本机编包需要 JDK 21',
    '装一个 JDK 21（Temurin / Android Studio 自带），并设好 JAVA_HOME'
  )
}
const javaVersion = `${javaProbe.stderr || ''}${javaProbe.stdout || ''}`
const major = Number((javaVersion.match(/version "(\d+)/) || [])[1] || 0)
if (major && major < 21) {
  fail(
    `当前 JDK 是 ${major}，但 android 工程的编译级别是 Java 21`,
    '换成 JDK 21 再跑。注意：DevEco Studio 自带的 JBR 是 17，编不了这个工程'
  )
}
if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT && !existsSync(resolve(ANDROID_DIR, 'local.properties'))) {
  fail(
    '没找到 Android SDK',
    '装 Android Studio（会自动配好），或把命令行工具装到某处后设置 ANDROID_HOME'
  )
}

console.log(`\n用 ${WRAPPER} 打 debug APK…（第一次跑会下载 Gradle 和依赖，比较慢）\n`)
const res = spawnSync(WRAPPER, ['assembleDebug'], {
  cwd: ANDROID_DIR,
  stdio: 'inherit',
  shell: isWin, // Windows 上 gradlew.bat 需要 shell 才能执行
})

if (res.status !== 0) fail('Gradle 构建失败', '看上面的报错；常见原因是 SDK 缺 platform/build-tools，或 JDK 版本不对')

if (!existsSync(APK)) fail('Gradle 跑完了但没找到 APK', APK)

console.log(`\n✓ APK 打好了：${APK}`)
console.log('  装到手机：数据线连上 → adb install -r "<上面这个路径>"')
console.log('  或者直接把这个文件发到手机上点安装（需要允许安装未知来源）\n')
