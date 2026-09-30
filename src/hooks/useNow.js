import { useEffect, useState } from 'react'

/**
 * 定时刷新 now。
 * enabled=false 时完全不建定时器 —— 只有计时页需要每秒刷新，其他页面不需要。
 */
export function useNow(intervalMs = 1000, enabled = true) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!enabled) return undefined
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, enabled])

  return now
}
