## 根因

`CameraStage` 在用户按快门或选完文件后，要在主线程同步跑完一连串重活，才会触发父级的 `navigate('/result')`：

- **上传路径**：`FileReader.readAsDataURL`（200-800ms）→ `compressImage`（把整张 4000×3000 的手机原图 decode 到 `<Image>`、画到 canvas、再 `toDataURL('jpeg')`，中端手机 1-2.5s）→ 才 `setCapturedImage` → `runRecognize` → `onRecognize`(navigate)。整个过程 UI 没有任何反馈，用户看到的就是「点了上传 → 卡住 → 突然跳走」。
- **拍照路径**：`grabFrame` 本身的 JPEG 编码 100-300ms 可以接受，但 `runRecognize` 在 `await onRecognize` 后还有 `setForceAllDone(true)` + `await setTimeout(260)`，由于父级 `onRecognize` 同步返回，这 260ms 全部累在跳转动画上。

也就是说"卡顿"主要来自压缩与不必要的完成动画 delay，与网络或 AI 无关。

## 修复方案

只改 3 个文件：`src/components/recognition/CameraStage.tsx`、`src/lib/imageThumb.ts`、`src/hooks/useGuestRecognition.tsx`。

**1. `src/lib/imageThumb.ts` — 新增通用压缩函数**

新增 `compressDataUrl(src, { maxWidth = 1024, quality = 0.7 }): Promise<string>`，复用现有 `loadImage`。这是把 CameraStage 里的 `compressImage` 抽成共享 util，给「识别前」用。

**2. `src/components/recognition/CameraStage.tsx` — 不在拍摄/上传链路里做压缩**

- 删除内部的 `compressImage`。
- `handleFileUpload`：FileReader 读完就 `setCapturedImage(raw)`、立刻 `runRecognize([raw])`，不再 `await compressImage`。多张模式同理：读完即入列展示。
- `grabFrame` 保留现状（video 帧 640×Q0.62，本身就很小，无感知开销）。
- `runRecognize` 内部，成功后把「`setForceAllDone(true)` + `await setTimeout(260)` + `setIsRecognizing(false)`」这段，仅在 `keepPreviewAfterSuccess === true`（店员版场景）时执行；游客版（`keepPreviewAfterSuccess=false`）直接 `setIsRecognizing(false)` 不等动画——页面已经在跳走，260ms 完全是浪费。

**3. `src/hooks/useGuestRecognition.tsx` — 在发请求前压缩**

`recognize` 调用 `supabase.functions.invoke` 之前，对 `imageBase64` / `images` 做一次 `compressDataUrl(src, { maxWidth: 1024, quality: 0.7 })`（多张并行 `Promise.all`）。压缩此时发生在 `/result` 页面 RevealSkeleton 已经显示的"AI 思考"阶段，用户视觉上完全无感。`computeImageHash` 也用压缩后的 base64，体积更小、计算更快。

## 不改的内容

- PublicScan / PublicResult 的渲染逻辑、RevealSkeleton 骨架 UI、ProductCard 与分享文案
- Edge function、AI 模型、缓存
- CameraStage 视觉、引导提示

## 验证

在 390×595 视口下：
1. 「上传」一张未压缩的手机原图：点击后立刻看到照片 + 跳到结果页骨架，无相机界面停留；几秒后展示真实结果。
2. 「启动摄像头」拍一张：按下快门到结果页骨架的过渡感觉为「即时」（< 200ms）。
3. 多角度合并上传 3 张：3 张都立刻入列、点「完成」立刻跳转，结果页显示"读取 3 张图..."骨架。
