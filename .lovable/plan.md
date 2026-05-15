## 目标

按新项目独立的姿态重做页面骨架（不照搬 `/u` 子路径），并把搬过来后失效的相机、上传、多角度、字体一次性修好。

## 一、路由扁平化（删除 `/u` 概念）

新结构（全部根路径）：

```
/            → 识物（首页就是相机/上传）
/community   → 中古圈广场（匿名瀑布流）
/result      → 识别结果（拿 location.state 或 sessionStorage 渲染，无数据则跳回 /）
/about       → 品牌 / 关于 / 微信二维码
```

删除：
- `src/routes/u.tsx`、`u.index.tsx`、`u.result.tsx`、`u.community.tsx`、`u.about.tsx`
- `src/routes/index.tsx` 里的 `beforeLoad → /u` 重定向

新增/改写：
- `src/routes/__root.tsx` 提供顶部 logo + 三 tab 主导航 + `<Outlet />`，不再嵌一层 `/u` layout
- `src/routes/index.tsx` 直接渲染识物页
- `src/routes/community.tsx`、`result.tsx`、`about.tsx`
- 旧 `src/components/layout/PublicLayout.tsx` 合并进 `__root.tsx` 后删除

页面内所有 `<Link to="/u/...">`、`navigate({ to: '/u/...' })` 同步改为根路径。

## 二、修复相机 / 上传 / 多角度

排查到的根因：

1. **预览 iframe 没声明 camera 权限** → `getUserMedia` 在 Lovable 预览环境会被静默拒绝。
   修复：在 `index.html` 里给页面和示例调用加 meta 提示；并在按钮触发失败时降级到「上传」并给清晰 toast（已有 toast，但需要在 `NotAllowedError` 时多说一句"预览环境请改用上传，或在已发布域名打开"）。
   说明：相机本身在已发布域名（HTTPS + 用户手势）能正常工作，预览 iframe 的限制是 Lovable 平台行为，非代码 bug。

2. **`recognize-product-public` 调用链** ：现已部署，但 `useGuestRecognition` 里 `imageHash` 计算依赖 `src/lib/imageHash.ts`，需确认它在浏览器里能跑（不依赖 node crypto）。如有问题用 `crypto.subtle` 重写。

3. **多角度按钮**：`finishMultiCapture` 在已捕获 1 张之后才出现「识别 (n)」按钮（CameraStage line 588-597），逻辑是对的；如果用户看不到，是因为相机没成功启动 → 同问题 1。修好相机即解。

4. **上传按钮**：`fileInputRef.current?.click()` 触发 hidden input；当前实现没问题。但「上传」按钮只在 `!isStreaming && !capturedImage` 时显示——一旦相机启动失败回到默认状态，上传仍可用。验证一遍 toast 错误时不会卡住状态机。

行动：
- 重写 `useGuestRecognition` 里的 hash 计算改用 `crypto.subtle.digest('SHA-256', ...)`，避免 polyfill 问题
- `CameraStage` 在 `getUserMedia` 失败时把错误明确分类（`NotAllowedError` / `NotFoundError` / 协议非 HTTPS / 预览 iframe），文案对应给到「请直接上传图片」的指引
- 在「未启动」空状态下把「启动摄像头」「上传图片」做成同等突出的两个 CTA（当前上传按钮视觉偏弱）

## 三、字体修复

当前问题：`@import url(...fonts.googleapis.com)` 在某些预览/中国大陆网络下加载慢或失败 → 落到 `system-ui` 看起来"字体不对"。

方案：
- 保留 Playfair Display（西文标题）+ Noto Sans SC（中文正文）的搭配（你说"保留现有配色"，字体也保留方向）
- 改用 `<link rel="preconnect">` + 在 `index.html` `<head>` 直接加 `<link rel="stylesheet" href="https://fonts.googleapis.com/...">`，比 CSS `@import` 更早开始下载
- 加 `font-display: swap`（已有）+ `<link rel="preload" as="style">` 提前并行
- 给 `body` 和 `.font-display` 加更完整的中文 fallback：`"PingFang SC", "Microsoft YaHei"`，避免落到 serif 难看

## 四、Edge Functions / 数据库

- 已部署的 3 个函数（`recognize-product-public` / `submit-public-post` / `generate-share-copy`）保留，`config.toml` 已 `verify_jwt = false`，无需改
- `community_posts` / `guest_daily_usage` 表已就绪，本次不动
- 不引入 Supabase Auth / 登录流程，全程匿名

## 五、不做的事

- 不重做配色（你确认保留现 vintage editorial 调性）
- 不改 AI 识别 prompt 与商品分类逻辑
- 不替换底层 `CameraStage` 的取景/快门交互（视觉已经达标），只修错误处理和入口

## 验收

1. `/` 直接看到相机壳子 + 启动/上传两按钮，无任何 `/u` 跳转
2. 点「上传」选图能完整跑完识别 → 跳到 `/result` 看到结果卡片
3. 拒绝摄像头权限后会出现明确的中文提示，并提示改用上传
4. 多角度模式下能连续拍 ≤5 张，点「识别 (n)」走多图识别
5. 中文 + 西文字体在第一屏就正确渲染，不出现回落 serif
6. `/community` 列出已发布的匿名帖子，`/about` 显示品牌信息
