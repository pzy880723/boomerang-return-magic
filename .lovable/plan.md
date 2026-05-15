# 游客版（中古识物）对齐规格 – 实施计划

当前项目已经具备主体骨架（扁平路由 `/` `/community` `/result` `/about`、3 张表、3 个边缘函数），本次按规格书做"对齐 + 补齐 + 修复"，不重写。

## 一、修复阻塞问题

1. **/u 旧链接 404**：用户当前在 `/u`，旧路由已删。在 `__root.tsx` 加客户端兜底：检测 `/u*` 路径时 `navigate('/', { replace: true })`；同时新增 `src/routes/u.tsx` 作 catch-all 重定向，避免直链失败。
2. **摄像头/上传**：复核 `CameraStage` 在沙箱 iframe 下 `getUserMedia` 失败时的回退提示是否生效，必须保证"上传图片"按钮在空状态与摄像头按钮等权重展示，失败 toast 文案明确指向"改用上传图片"。
3. **字体**：确认 `__root.tsx` 已通过 `<link>` 注入 Playfair Display + Noto Sans SC，`styles.css` 字体变量含中文 fallback。

## 二、补齐规格缺失项

### 数据层
- 新增 `recognition_cache` 表（`image_hash unique / result jsonb / hit_count / created_at`），RLS 关闭，仅边缘函数写入。
- 改造 `recognize-product-public`：先查 `recognition_cache`（命中返回 `__pipeline:'hash_cache'` + `hit_count++`），未命中再调 AI 并回写缓存。
- `submit-public-post` 增加 IP 限流（`share_count`，3 次/天）。

### 拍一拍页 (`/`)
- 顶部气泡显示「今日剩余 X 次」（接 `recognize-product-public` 返回的 `remaining`，首屏调一次轻量探测或在首次识别后回填）。
- 首次进入 4 步浮层引导（拍摄 → 多角度 → 自动文案 → 一键分享），`sessionStorage` 记忆已看过。
- 多角度最多 5 张，合并送 AI；本地 pHash（8x8 灰度均值）计算后随请求带 `imageHash`。

### 结果页 (`/result`)
- 三种文案风格切换（小红书 / 朋友圈 / 微信群），本地模板秒出兜底，背后调 `generate-share-copy` AI 改写覆盖。
- 「复制文案」`navigator.clipboard` + toast。
- 「匿名发布到中古圈」按钮明确提示"将以游客身份匿名发布"，调用 `submit-public-post`。
- GuestProductCard 重点突出 `story / appreciation / marketValue / buyReason`。

### 中古圈 (`/community`)
- 类目筛选 chips：日瓷 / 欧瓷 / 动漫玩具 / 奢侈品 / Walkman / CCD / 其他。
- 分页：每页 24，下拉加载更多。
- 卡片只读，点击展开 GuestProductCard 详情（不做点赞/评论）。
- 底部门店微信二维码占位区。

### 关于页 (`/about`)
- 静态：品牌故事 + 三步使用 + 中古圈说明 + 「现在就拍一拍」CTA → `/`。

## 三、UX 收口

- 底部 3 Tab 固定：拍一拍 / 中古圈 / 关于，无登录、无个人中心。
- 顶部仅 logo，去掉一切账号入口。
- 失败用 toast，不弹 modal。
- 100% 简体中文，仅 Hero 字母图形可保留英文。

## 四、明确不做

- 登录注册、点赞评论、收藏历史、店员后台、闲鱼行情、通知签到。

## 技术细节

- 栈保持：TanStack Start + Tailwind v4 + shadcn + Lovable Cloud + Lovable AI Gateway（`google/gemini-2.5-flash`）。
- 边缘函数全部 `verify_jwt = false`（已在 `supabase/config.toml`）。
- pHash 在 `src/lib/imageHash.ts` 已带 SSR 守卫，沿用。
- 新增 `recognition_cache` 通过迁移工具创建。

## 执行顺序

1. 修 `/u` 重定向 + 摄像头/字体复核（无 DB 变更）。
2. 迁移：新增 `recognition_cache` 表。
3. 改 `recognize-product-public` 接缓存，`submit-public-post` 加分享限流。
4. 拍一拍：剩余次数气泡 + 4 步引导 + 多角度 pHash。
5. 结果页：三风格切换 + 匿名发布提示。
6. 中古圈：类目 chips + 分页 24 + 二维码占位。
7. 关于页静态文案对齐。
