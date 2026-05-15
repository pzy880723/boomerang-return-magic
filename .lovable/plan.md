## 方案
采用 **A 方案：最小改动**——在 TanStack Start 里用 splat 路由 `src/routes/$.tsx` 包一层 `react-router-dom` 的 `<BrowserRouter>` + `<Routes>`，把源项目 `/u/*` 几乎 1:1 复制过来；后端继续用 Supabase Edge Functions（与源项目同款）。这样代码改动最少，最容易跑通。

源项目 ID `bef32724-503e-467a-af03-2062176cf921`。

## 一、TanStack Start 路由壳
- `src/routes/__root.tsx`：保留最小 shell（QueryClientProvider + Toaster + Sonner + TooltipProvider + Outlet + ErrorBoundary）
- `src/routes/index.tsx`：直接 `<Navigate to="/u" />`（指向游客版首页）
- `src/routes/$.tsx`（splat）：内部挂载 `<BrowserRouter><Routes>…/u/*…</Routes></BrowserRouter>`，承接所有 `/u`、`/u/result`、`/u/community`、`/u/about`、404
  - 这样 TanStack 的文件路由只占根 + index + splat 三个，剩下全交给 react-router-dom，避免重写所有 `useNavigate / NavLink / Link`

## 二、需要复制 / 创建的源文件（保持源路径）

### lib（业务工具）
- `src/lib/shareCopy.ts`
- `src/lib/utils.ts` ✅ 已建
- `src/lib/imageHash.ts` ✅ 已建
- `src/lib/imageThumb.ts` ✅ 已建
- `src/lib/script.ts` ✅ 已建
- `src/lib/chunkLoadRecovery.ts` ✅ 已建

### types
- `src/types/index.ts`（CATEGORY_LABELS / ProductCategory / RecognitionResult 等）

### hooks
- `src/hooks/useGuestRecognition.tsx`
- `src/hooks/use-toast.ts`（shadcn 标准 hook）

### components/ui（缺失补齐）
- `src/components/ui/toast.tsx`
- `src/components/ui/toaster.tsx`
- (sonner.tsx 已存在)

### 业务组件
- `src/components/system/ErrorBoundary.tsx`
- `src/components/recognition/CameraStage.tsx`
- `src/components/recognition/GuestProductCard.tsx`
- `src/components/public/GuestOnboarding.tsx`
- `src/components/layout/PublicLayout.tsx`

### 页面
- `src/pages/public/PublicScan.tsx`
- `src/pages/public/PublicResult.tsx`
- `src/pages/public/PublicCommunity.tsx`
- `src/pages/public/PublicAbout.tsx`

## 三、Edge Functions（直接 1:1 复制源项目）
- `supabase/functions/recognize-product-public/index.ts`
- `supabase/functions/submit-public-post/index.ts`
- `supabase/functions/generate-share-copy/index.ts`
- `supabase/config.toml`：为这 3 个函数加 `verify_jwt = false`

依赖的 secrets：`LOVABLE_API_KEY` ✅ 已配置；`GUEST_IP_SALT` 可选（不配走默认）。

依赖的表：`community_posts` / `guest_daily_usage` / `app_settings` / `product-images` storage ✅ 已迁移。

> 注意 `recognize-product-public` 还会读 `products` 表做 hash 缓存。新项目没有 `products` 表，需要在函数里把 `from('products')` 命中段做容错（catch 后继续走 AI），或者建一张极简的占位 `products` 表（只用作未来共享缓存）。**采用容错方案**——改两行：把 hash 命中查询包在 try/catch 里，查询失败直接跳过缓存。

## 四、其他
- `package.json` 已加 `react-router-dom`、`@radix-ui/react-toast` ✅
- `src/styles.css` 已 port ✅
- `src/assets/boomer-off-vintage-logo.png`、`shop-wechat-qr.png` ✅

## 五、验收
1. 预览页直接 `/` → 跳到 `/u`，看到「拍一拍」首页 + 引导浮层
2. `/u/community` 能拉到（空）列表，不报错
3. `/u/about` 静态页可见
4. 点拍照按钮能调起摄像头（需 https，预览域名满足）；调用 `recognize-product-public` 走 AI；返回结果后跳 `/u/result`
5. `/u/result` 能渲染卡片，`generate-share-copy` 出文案；点「匿名分享到中古圈」走 `submit-public-post` 写库

## 不做
- 不迁店员/admin/auth/portal/library
- 不做 TanStack 原生路由化重写（之后想 SEO 再做 B 方案）
- 不删 `community_posts` 的 `Public posts readable by anon` 策略（已经按公开策略建好）
