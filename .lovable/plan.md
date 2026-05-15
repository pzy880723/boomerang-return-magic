## 问题诊断

在 390×595 这种典型手机视口下，当前 `GuestOnboarding` 有几个明显问题：

1. **高亮目标可能在视口外不滚动**：`onboard-start-camera`（启动摄像头按钮）和 `onboard-multi-mode`（模式切换 Tab）都在 `CameraStage` 内部，位于较长的 Hero 之下。打开页面时这两个目标常常需要向下滚动才能看到，但 `GuestOnboarding` 只 `getBoundingClientRect`，不会主动滚动到目标 → 用户只看到一片黑屏 + 飘在顶上的气泡，找不到挖洞高亮。
2. **气泡可能超出视口**：气泡 `top` / `bottom` 计算后没有夹到视口范围内，placement='top' 时如果目标靠上、气泡较高，会顶到状态栏甚至被截断；placement='bottom' 时如果目标靠下，气泡会掉出屏幕底部。
3. **居中插画卡（第 3、4 步）在小屏太挤**：固定 `w-[min(22rem,...)]` + 居中，配合图标 + 标题 + 描述 + 两个按钮，垂直空间紧张时没有 `max-height` 与滚动兜底。
4. **未考虑 safe-area**：iPhone 底部 home indicator / 顶部刘海会再吃掉 ~30-40px，bubble 可能压在系统手势区。
5. **小细节**：Skip / 下一步按钮在窄屏 320px 上略显拥挤；进度点容易被标题挤换行。

## 实施方案（仅改 `src/components/public/GuestOnboarding.tsx`）

**A. 切换步骤时自动滚动目标到视口中央**

`useLayoutEffect` 中：拿到目标元素后，先 `el.scrollIntoView({ behavior: 'smooth', block: 'center' })`，再延迟 ~250ms 二次 `measure()` 拿到最终位置，避免读到滚动前的旧 rect。`window` 不存在或 `targetId` 为空时跳过。

**B. 气泡定位夹到视口安全区**

引入常量 `SAFE_TOP = 12`、`SAFE_BOTTOM = 16 + env(safe-area-inset-bottom)`（用 CSS `paddingBottom: 'max(env(safe-area-inset-bottom), 0px)'` 在容器上托底，JS 里用固定 16）。

- 用 `ref` 测气泡自身 `offsetHeight`（`useLayoutEffect`），存为 `bubbleH`。
- 计算 `bottomPlacementTop = hi.top + hi.height + 12`，若 `bottomPlacementTop + bubbleH > vh - SAFE_BOTTOM`，自动翻转为 top；反之亦然。两边都放不下时，降级为底部贴边的 sheet 样式：`bottom: SAFE_BOTTOM`，`top: auto`，并对气泡内容套 `max-height: 60vh; overflow-y:auto`。
- placement 计算用 `bubbleH` 而不是固定的 220px 经验值。

**C. 居中插画卡兜底滚动**

无 `targetId` 的步骤使用 `top: 50%` 居中。增加 `max-height: calc(100vh - 2 * SAFE_TOP)`，超出时内部滚动；按钮区改为 `sticky bottom-0 bg-background pt-2`，确保 CTA 永远可见。

**D. 窄屏样式与可读性**

- 气泡宽度从 `w-[min(22rem, calc(100vw-2rem))]` 调整为 `w-[min(22rem, calc(100vw-1.5rem))]`，留更小左右边距。
- 头部「步骤计数 + 进度点」改为 `flex-wrap` 并把进度点放在自己的一行尾部，避免在 320px 上挤换行。
- 「跳过 / 下一步」按钮区域加 `min-h-9`，按钮 `size="sm"` 不变；当只剩 1 步时把「跳过」隐藏，仅留「开始体验」更聚焦。

**E. 高亮挖洞的 padding 适配小屏**

`PADDING` 在视口宽度 < 400px 时降为 6（默认 8），避免对 Tab 这种贴边元素挖出视口外的洞导致整屏全黑。

## 不改的内容

- `PublicScan.tsx` 的步骤定义、`targetId`、文案均保持不变。
- `CameraStage.tsx` 不动。
- 设计 token / 颜色不动，只调结构与定位逻辑。

## 验证

完成后在 390×595 与 360×640 两个常见手机视口下走一遍 4 步引导，确认：每一步高亮元素可见、气泡完整在屏内、底部按钮不被 home indicator 遮挡、居中插画卡在 595 高度下不溢出。
