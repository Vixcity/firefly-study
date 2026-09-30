/**
 * 自绘 SVG 图标集。
 * 全部走 stroke="currentColor" 的线性风格（圆形端点、1.6 粗细），
 * 保证在暗色背景上都有一致的观感，也方便跟着 --fs-accent 变色。
 */

const P = {
  // ---------------- 书房相关 ----------------
  firefly: (
    <>
      {/* 两片翅膀：用椭圆旋转出来，比弧线更像一只虫 */}
      <ellipse cx="9" cy="11.6" rx="4.7" ry="2.2" transform="rotate(-26 9 11.6)" />
      <ellipse cx="15" cy="11.6" rx="4.7" ry="2.2" transform="rotate(26 15 11.6)" />
      {/* 身体与头 */}
      <ellipse cx="12" cy="15.2" rx="2.5" ry="3.7" />
      <circle cx="12" cy="10.2" r="1.5" />
      {/* 触角 */}
      <path d="M11.2 9.1 10.5 7.3M12.8 9.1l.7-1.8" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3l1.7 5.5L19 10l-5.3 1.5L12 17l-1.7-5.5L5 10l5.3-1.5z" />
      <path d="M18.5 16.5l.7 2.2 2.3.8-2.3.8-.7 2.2-.7-2.2-2.3-.8 2.3-.8z" />
    </>
  ),
  moon: <path d="M20 14.8A8.3 8.3 0 0 1 9.2 4 8.6 8.6 0 1 0 20 14.8z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.1" />
      <path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5" />
    </>
  ),
  sunrise: (
    <>
      <path d="M12 3.5v4.2M6.4 8.1l3 3M17.6 8.1l-3 3M2.6 16.6h18.8M5 20.4h14" />
      <path d="M8.2 16.6a3.8 3.8 0 0 1 7.6 0" />
    </>
  ),
  tree: (
    <>
      <path d="M12 21v-6.2" />
      <path d="M12 14.8c0-3-2.4-5.5-5.5-5.5 0 3 2.5 5.5 5.5 5.5z" />
      <path d="M12 14.8c0-3.6 2.9-6.5 6.5-6.5 0 3.6-2.9 6.5-6.5 6.5z" />
    </>
  ),
  plow: (
    <>
      <path d="M12 21v-5" />
      <path d="M12 16c0-2.6-2.1-4.7-4.7-4.7 0 2.6 2.1 4.7 4.7 4.7z" />
      <path d="M12 16c0-3.2 2.5-5.7 5.7-5.7 0 3.2-2.5 5.7-5.7 5.7z" />
      <path d="M12 11.3V4.5" />
    </>
  ),
  jar: (
    <>
      <path d="M8.4 3.4h7.2M7 7.2h10v10.2a3.4 3.4 0 0 1-3.4 3.4h-3.2A3.4 3.4 0 0 1 7 17.4z" />
      <circle cx="12" cy="13.4" r="1.5" />
      <path d="M8.6 4.6l-1 2.6M15.4 4.6l1 2.6" />
    </>
  ),
  lamp: (
    <>
      <path d="M9.2 3.4h5.6l1.6 4.2H7.6z" />
      <path d="M12 7.6v2.6" />
      <circle cx="12" cy="14.2" r="3" />
      <path d="M9.4 20.6h5.2M12 17.2v3.4" />
    </>
  ),
  tower: (
    <>
      <path d="M12 3.2l3.6 5.4H8.4z" />
      <path d="M8.4 8.6h7.2M7.2 12.6h9.6M6 16.6h12M4.6 20.6h14.8" />
    </>
  ),
  river: (
    <>
      <path d="M2.8 8.6c2.5-2.4 5-2.4 7.5 0s5 2.4 7.5 0 2.5-1.4 3.4-.6" />
      <path d="M2.8 13.4c2.5-2.4 5-2.4 7.5 0s5 2.4 7.5 0 2.5-1.4 3.4-.6" />
      <path d="M2.8 18.2c2.5-2.4 5-2.4 7.5 0s5 2.4 7.5 0 2.5-1.4 3.4-.6" />
    </>
  ),

  // ---------------- 书籍 ----------------
  book: (
    <>
      <path d="M12 6.6C10.5 5.3 8.4 4.6 6 4.6H3.8v13H6c2.4 0 4.5.7 6 2 1.5-1.3 3.6-2 6-2h2.2v-13H18c-2.4 0-4.5.7-6 2z" />
      <path d="M12 6.6v13" />
    </>
  ),
  books: (
    <>
      <path d="M4 3.4h3.6v17.2H4zM10.2 3.4h3.6v17.2h-3.6z" />
      <path d="M16.8 4.4l3.6.9-4.2 15.5-3.4-.9z" />
    </>
  ),
  bookcheck: (
    <>
      <path d="M12 7C10.6 5.7 8.5 5 6.2 5H4v12.6h2.2c2.3 0 4.4.7 5.8 2 1.4-1.3 3.5-2 5.8-2H20V5h-2.2" />
      <path d="M9.2 12.4l2.2 2.2 4.4-4.4" />
    </>
  ),
  pages: (
    <>
      <path d="M7.4 3.4h11.2v17.2H7.4z" />
      <path d="M4.4 6.4v14.2h3M10.6 7.6h4.8M10.6 11.4h4.8" />
    </>
  ),
  shell: (
    <>
      <path d="M12 3.2c4 0 7.2 3.5 7.2 7.7 0 3-1.4 5-3 6.4H7.8c-1.6-1.4-3-3.4-3-6.4 0-4.2 3.2-7.7 7.2-7.7z" />
      <path d="M12 3.2c-2 2-3 4.7-3 7.7 0 2.4.4 4.6 1.2 6.4M12 3.2c2 2 3 4.7 3 7.7 0 2.4-.4 4.6-1.2 6.4" />
      <path d="M6.4 20.8h11.2" />
    </>
  ),

  // ---------------- 成长 / 奖励 ----------------
  medal: (
    <>
      <circle cx="12" cy="14.4" r="5.2" />
      <path d="M9.4 3.4l2 5.4M14.6 3.4l-2 5.4" />
      <path d="M12 12.6l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" />
    </>
  ),
  trophy: (
    <>
      <path d="M8.2 3.6h7.6v5.2a3.8 3.8 0 0 1-7.6 0z" />
      <path d="M8.2 4.8H5.4v2.1a3 3 0 0 0 3 3M15.8 4.8h2.8v2.1a3 3 0 0 1-3 3" />
      <path d="M12 12.6v4.2M9 20.4h6" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.6v8.8M9.6 10h4.8M9.6 14h4.8" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5.4" width="18" height="13.2" rx="3.2" />
      <path d="M3 10h18M6.8 14.6h3.4" />
      <circle cx="15.6" cy="14.6" r="1.2" />
    </>
  ),
  bolt: <path d="M13.4 2.6L5.6 13.2h4.8l-1 8.2 7.8-10.6h-4.8z" />,
  hourglass: (
    <>
      <path d="M6.8 3.2h10.4M6.8 20.8h10.4" />
      <path d="M8.2 3.2v4.2L12 12l3.8-4.6V3.2M8.2 20.8v-4.2L12 12l3.8 4.6v4.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.4" y="5" width="17.2" height="15.6" rx="3.2" />
      <path d="M3.4 10h17.2M8 3.2v4M16 3.2v4" />
      <path d="M8.4 14.2l1.6 1.6 3-3" />
    </>
  ),

  // ---------------- 功能 ----------------
  chart: (
    <>
      <path d="M3.4 20.6h17.2" />
      <path d="M6.8 20.6V12M12 20.6V5.4M17.2 20.6v-5.4" />
    </>
  ),
  shop: (
    <>
      <path d="M5 8h14l-1.1 12.2H6.1z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  tag: (
    <>
      <path d="M4 11.4V5a1 1 0 0 1 1-1h6.4l8.6 8.6-7.4 7.4z" />
      <circle cx="8.2" cy="8.2" r="1.4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.4 5.4l1.9 1.9M16.7 16.7l1.9 1.9M18.6 5.4l-1.9 1.9M7.3 16.7l-1.9 1.9" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.4" r="7.6" />
      <path d="M12 9.6v3.8l2.6 1.8M9.4 3.2h5.2M12 3.2v2.6" />
    </>
  ),
  play: <path d="M8.4 5.6l10 6.4-10 6.4z" />,
  pause: <path d="M9.4 5.4v13.2M14.6 5.4v13.2" />,
  stop: <rect x="6.2" y="6.2" width="11.6" height="11.6" rx="2.6" />,
  plus: <path d="M12 5.2v13.6M5.2 12h13.6" />,
  minus: <path d="M5.2 12h13.6" />,
  close: <path d="M6.2 6.2l11.6 11.6M17.8 6.2L6.2 17.8" />,
  check: <path d="M5 12.6l4.6 4.6L19 7" />,
  right: <path d="M9.2 5l7 7-7 7" />,
  left: <path d="M14.8 5l-7 7 7 7" />,
  up: <path d="M5 14.8l7-7 7 7" />,
  down: <path d="M5 9.2l7 7 7-7" />,
  pen: (
    <>
      <path d="M4 20.2l1-4.4L16.2 4.6a2.2 2.2 0 0 1 3.2 3.2L8.4 19.2z" />
      <path d="M14.4 6.4l3.2 3.2" />
    </>
  ),
  Note: null,
  share: (
    <>
      <path d="M12 15.4V3.6M8 7.6l4-4 4 4" />
      <path d="M5 14v5.4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V14" />
    </>
  ),
  download: <path d="M12 3.4v11.8M7.6 11l4.4 4.4L16.4 11M4.6 20.4h14.8" />,
  upload: <path d="M12 20.6V8.8M7.6 13.2l4.4-4.4 4.4 4.4M4.6 3.6h14.8" />,
  trash: (
    <>
      <path d="M4.6 7h14.8M9.6 7V4.6h4.8V7" />
      <path d="M6.6 7l.9 13.2h9l.9-13.2M10.4 10.6v6M13.6 10.6v6" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20.2h4.2L19 9.4a2.2 2.2 0 0 0-3.2-3.2L5 17z" />
      <path d="M14.6 7.4l3.2 3.2" />
    </>
  ),
  heart: (
    <path d="M12 20.4c-1.4-1-7.4-4.9-7.4-9.6a4.2 4.2 0 0 1 7.4-2.7 4.2 4.2 0 0 1 7.4 2.7c0 4.7-6 8.6-7.4 9.6z" />
  ),
  flame: (
    <path d="M12 21c3.2 0 5.4-2.2 5.4-5.1 0-4.4-5.4-9.9-5.4-9.9S6.6 11.5 6.6 15.9c0 2.9 2.2 5.1 5.4 5.1z" />
  ),
  dot: <circle cx="12" cy="12" r="3.2" />,
  more: (
    <>
      <circle cx="5.4" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="18.6" cy="12" r="1.4" />
    </>
  ),
  filter: <path d="M4 6.4h16M7 12h10M10 17.6h4" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 11v5.4M12 7.8v.2" />
    </>
  ),
  bell: (
    <>
      <path d="M6.6 10.4a5.4 5.4 0 0 1 10.8 0c0 4 1.6 5.4 1.6 5.4H5s1.6-1.4 1.6-5.4z" />
      <path d="M10.2 19a2 2 0 0 0 3.6 0" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.4l7 2.6v5.6c0 4-3 7.4-7 9-4-1.6-7-5-7-9V6z" />
      <path d="M9.2 12.2l2 2 3.6-3.8" />
    </>
  ),
  undo: (
    <>
      <path d="M4.4 9.4h9.8a5.3 5.3 0 1 1 0 10.6H8.8" />
      <path d="M8 5.6L4.4 9.4 8 13.2" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M14.9 9.1l-1.6 4.2-4.2 1.6 1.6-4.2z" />
    </>
  ),
}

P.Note = <path d="M12 3.4h9v17.2H3V7.4z" />

export const ICON_NAMES = Object.keys(P)

/**
 * 线性图标
 * @param name 图标名，见 ICON_NAMES
 */
export function Icon({ name, size = 22, className, style, strokeWidth = 1.6 }) {
  const node = P[name] || P.dot
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'block', flex: 'none', ...style }}
      aria-hidden="true"
      focusable="false"
    >
      {node}
    </svg>
  )
}

/** 品牌标记：一点萤火 + 一圈微光，用在顶部与引导页 */
export function FireflyMark({ size = 28, className, style }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', ...style }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="fs-mark-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--fs-f1)" stopOpacity="0.95" />
          <stop offset="45%" stopColor="var(--fs-f2)" stopOpacity="0.42" />
          <stop offset="100%" stopColor="var(--fs-f2)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#fs-mark-glow)" />
      <ellipse cx="24" cy="26" rx="4.6" ry="5.6" fill="var(--fs-f1)" />
      <ellipse cx="24" cy="25.4" rx="9.4" ry="3.4" fill="var(--fs-f2)" opacity="0.5" />
      <path
        d="M24 20.4V13M20.6 13.6 24 10.4l3.4 3.2"
        stroke="var(--fs-f2)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="24" cy="26" r="12" fill="none" stroke="var(--fs-f2)" strokeOpacity="0.22" />
    </svg>
  )
}
