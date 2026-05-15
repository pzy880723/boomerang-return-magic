## 目标

把"拍完 → 干等 1-3 秒 → 跳转"改成"拍完立即跳转 → 结果页骨架 + 渐进文案 → 数据到了无缝填充"，让用户在 AI 思考时一直感受到"事情在发生"。

## 当前流程的问题

```text
拍照 → CameraStage 蒙层等 1-3 秒(narrative steps) → 拿到结果 → 跳 /result
                       ↑ 用户停在相机页，跳转动作发生在结果就绪后
```

虽然 CameraStage 已经有 narrative 步骤，但用户视觉上"卡在相机页"，跳转那一下又要再等 React 渲染整页结果，整体有顿挫感。

## 新流程

```text
拍照 → 立刻把图片写入 sessionStorage 并 navigate('/result') 
     → /result 立刻展示「Reveal 骨架」(模糊大图 + 渐进文案 + 骨架块)
     → 后台 recognize() 完成 → 真结果淡入替换 → 自动开始生成文案
```

CameraStage 的 onRecognize 返回 true 立即收起遮罩；真正的 AI 调用搬到 /result 触发。

## 改动清单

### 1. 新组件：`src/components/recognition/RevealSkeleton.tsx`

骨架页面，结构对齐 GuestProductCard，关键元素：

- **模糊 Hero 图**：用刚拍的照片做 `backdrop-blur-xl + scale-105`，叠一层"扫描线" gradient（accent → transparent，垂直循环位移），传达"AI 正在看图"。
- **顶部叙事条**：复用 SINGLE_STEPS / buildMultiSteps 数据结构（从 CameraStage 抽到 `src/lib/recognitionNarrative.ts`），按 elapsed 时间逐条点亮，已完成项打勾、当前项闪烁、未来项灰色。文案打字机式渐入，营造"AI 在写"的感觉。
- **骨架块**：估值卡 / Meta 网格 / 故事段 / 看点列表 各一组 `bg-muted animate-pulse` 骨架，节奏要错开（每块 `animation-delay` 不同），避免整屏同步呼吸。
- **底部提示**：「通常 2-4 秒，复杂物件可能稍久」+ 取消按钮（返回 `/`）。

### 2. `src/lib/recognitionNarrative.ts`

把 SINGLE_STEPS、buildMultiSteps、currentStepIndex 计算逻辑提到独立模块，CameraStage 与 RevealSkeleton 共用，保证两边步骤一致、文案统一维护。

### 3. `src/pages/public/PublicScan.tsx`

`handleRecognize` 改为：

```typescript
const handleRecognize = async (images: string[]) => {
  sessionStorage.setItem('guest_pending_images', JSON.stringify(images));
  sessionStorage.setItem('guest_result_image', images[0]);
  sessionStorage.removeItem('guest_result'); // 清掉旧结果
  navigate({ to: '/result' });
  return true; // 让 CameraStage 立刻收起遮罩
};
```

不再在 PublicScan 里调 `recognize`，移除对 `useGuestRecognition` 的依赖（remaining 仍然展示，可改用 sessionStorage 缓存的上一次值，命中后再回填）。

### 4. `src/pages/public/PublicResult.tsx`

新增 `pending` 视图状态：

```typescript
type ViewState = 'pending' | 'loading' | 'empty' | 'ready';
```

挂载时优先级：

1. 有 `guest_result` → 直接 ready（用户从历史进入）
2. 有 `guest_pending_images` → 进入 pending：
   - 立刻渲染 `<RevealSkeleton image={image} />`
   - 调用 `recognize(images)`，成功后写 `guest_result`、清掉 `guest_pending_images`、切到 ready 并淡入 `<GuestProductCard>`、启动 generateCaption('xhs')
   - 失败则展示"识别失败 + 重试 + 返回拍照"的失败态（复用现有错误 UI 风格）
3. 都没有 → empty

ready 切换时给整个结果块加 `animate-fade-in`，配合骨架淡出，过渡用 `transition-opacity duration-300`。

### 5. `src/components/recognition/CameraStage.tsx` 微调

- 将叙事步骤数据导入改为从 `src/lib/recognitionNarrative.ts` 引入（不改 UI）。
- 因为 onRecognize 现在立刻 resolve(true)，相机蒙层不会触发——这是预期；删掉 `keepPreviewAfterSuccess` 在 PublicScan 处的判断也无影响。

### 6. 失败态处理

PublicResult 在 pending → 失败时：

- 保留模糊 Hero 图，但骨架替换成「未能识别」卡片
- 提供「再试一次」按钮：重新调 recognize（用 sessionStorage 里的 pending images）
- 提供「重新拍一张」按钮：清掉 pending，回到 `/`

不再跳 toast 后白屏。

## 技术要点

- **图片传递**：base64 已经在 sessionStorage（PublicScan 已 set），RevealSkeleton 直接读取，避免 props 漂移。
- **取消保护**：useEffect 里用 `let cancelled = false` + cleanup，避免组件卸载后 setState 报警。
- **最短停留**：即使缓存命中（hash_cache）瞬间返回，也强制至少展示 600ms 骨架，避免闪烁——比纯 spinner 更体面。
- **样式系统**：所有色值走现有 token（`bg-muted` / `bg-accent/15` / `text-accent` / `bg-gradient-primary`），不引入新颜色。
- **字体**：标题骨架占位高度按 `font-display 26px` 行高对齐，避免数据填充时跳动。
- **动画**：用 styles.css 现有 `animate-pulse` / `animate-fade-in` / `animate-scale-in`，不新增 keyframes。

## 不做的事

- 不重写 CameraStage 的相机逻辑
- 不动结果页除了 pending 态以外的部分（Valuation / 文案 / 分享卡保持原样）
- 不改 edge function、不动数据库
- 不引入新的状态管理库（继续 sessionStorage + 局部 useState）

## 文件改动汇总

- 新增 `src/lib/recognitionNarrative.ts`
- 新增 `src/components/recognition/RevealSkeleton.tsx`
- 改 `src/pages/public/PublicScan.tsx`（handleRecognize 改为乐观跳转）
- 改 `src/pages/public/PublicResult.tsx`（新增 pending 状态 + 在此触发 recognize）
- 改 `src/components/recognition/CameraStage.tsx`（仅迁移叙事数据导入）
