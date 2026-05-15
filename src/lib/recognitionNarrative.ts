/** AI 识别等待时的叙事步骤 —— 让等待"有事在发生"。
 *  CameraStage(已弃用蒙层) 与 RevealSkeleton 共用同一份文案。
 */

export interface NarrativeStep {
  label: string;
  /** 该步骤激活的最早时刻（毫秒，相对识别开始） */
  at: number;
}

export const SINGLE_STEPS: NarrativeStep[] = [
  { label: '正在解析图片细节', at: 0 },
  { label: '正在比对商品知识库', at: 800 },
  { label: '正在全网检索同款资料', at: 1600 },
  { label: '正在整理年代 · 产地 · 故事', at: 2600 },
];

export const buildMultiSteps = (n: number): NarrativeStep[] => [
  { label: `正在对齐 ${n} 张图像`, at: 0 },
  { label: '正在解析每张图的关键特征', at: 700 },
  { label: '正在比对商品知识库', at: 1600 },
  { label: '正在全网检索同款资料', at: 2600 },
  { label: '正在整理年代 · 产地 · 故事', at: 3800 },
];

export function currentStepIndex(steps: NarrativeStep[], elapsed: number): number {
  let idx = 0;
  for (let i = 0; i < steps.length; i++) {
    if (elapsed >= steps[i].at) idx = i;
  }
  return idx;
}
