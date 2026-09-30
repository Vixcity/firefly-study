import { TREE_MAX_STAGE, TREE_SEC_PER_STAGE, TREE_SLEEP_DAYS, TREE_STAGES } from '../constants'

/** 累计阅读秒数 -> 光合树阶数（每满 1 小时一阶，10 阶封顶） */
export function treeStage(totalSec) {
  return Math.min(TREE_MAX_STAGE, Math.floor(Math.max(0, totalSec) / TREE_SEC_PER_STAGE))
}

export const stageInfo = (stage) => TREE_STAGES[Math.min(TREE_MAX_STAGE, Math.max(0, stage))]

/**
 * 光合树视图。
 * 只随累计总量成长，永不枯萎退化；很久没读只是"睡着"，一读书就醒过来。
 */
export function treeView(totalSec, lastReadAt, now) {
  const stage = treeStage(totalSec)
  const info = stageInfo(stage)
  const maxed = stage >= TREE_MAX_STAGE
  const secIntoStage = Math.max(0, totalSec) - stage * TREE_SEC_PER_STAGE
  const progress = maxed ? 1 : Math.min(1, secIntoStage / TREE_SEC_PER_STAGE)

  let sleeping = false
  if (lastReadAt) {
    sleeping = now - lastReadAt > TREE_SLEEP_DAYS * 24 * 3600 * 1000
  }

  return {
    stage,
    name: info.name,
    hint: info.hint,
    maxed,
    sleeping,
    progress,
    /** 距离下一阶还差多少秒 */
    secToNextStage: maxed ? 0 : TREE_SEC_PER_STAGE - secIntoStage,
    totalHours: totalSec / 3600,
    nextName: maxed ? info.name : stageInfo(stage + 1).name,
  }
}

/** 光合树的总阶数，UI 画刻度用 */
export const TREE_STAGE_COUNT = TREE_STAGES.length
