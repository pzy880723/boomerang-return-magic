# 注册登录 + 「我的」体系策划

## 总体目标
- 不打扰当前游客流：游客继续可以拍、可以看，但**有上限**
- 注册登录后：识别次数无上限、用真实昵称发圈、可点赞 / 评论 / 收藏、有「我的」入口
- 注册方式：**仅手机号验证码登录**（Supabase 默认 Twilio 通道）

---

## 1. 信息架构（底部 Tab 调整）

```
拍一拍   |   中古圈   |   我的（登录后） / 登录（未登录）   |   关于
```

把现有 3 个 Tab 扩展为 4 个：
- 未登录时第 3 个 Tab 文案是「登录」，点了去 `/login`
- 登录后第 3 个 Tab 变「我的」，去 `/me`

---

## 2. 关键页面与路由

| 路由 | 说明 |
|---|---|
| `/login` | 手机号 + 验证码登录（注册 = 首次登录自动建账号） |
| `/me` | 我的入口：头像、昵称、4 个二级入口 |
| `/me/profile` | **我的主页**（头像 + 昵称 + 我发的中古圈帖子，可分享） |
| `/u/$userId` | 任意用户主页（其他人点头像也走这里） |
| `/me/favorites` | 我的收藏 |
| `/me/history` | 我的识别历史 |
| `/me/notifications` | 互动消息（点赞 / 评论 / @我） |
| `/me/settings` | 账号设置（改昵称、改头像、退出登录、注销账号） |

---

## 3. 登录与配额逻辑

### 游客
- 拍照识别：保留现有 `guest_daily_usage` 每日配额
- 当日额度用完时，识别页弹「注册免费解锁无限识别」引导卡 → `/login`
- 中古圈：可看不可发、不可点赞、不可评论、不可收藏 → 触发动作时弹同一引导卡

### 已登录
- 识别次数无上限（移除 `recognize_count` 校验）
- 中古圈发布走新接口，落 `user_id`，`is_guest = false`，`guest_name = null`，展示真实昵称 / 头像
- 可点赞、评论、收藏

---

## 4. 数据模型（新增 / 调整）

新增：
- `profiles(id=user_id, nickname, avatar_url, bio, created_at, updated_at)`  
  注册即触发器自动建一行，默认昵称「中古er + 4位随机」
- `post_likes(user_id, post_id, created_at)` 唯一约束 (user_id, post_id)
- `post_comments(id, post_id, user_id, content, created_at)`
- `post_favorites(user_id, post_id, created_at)`
- `recognition_history(id, user_id, image_url, thumbnail_url, result jsonb, created_at)` ← 登录用户每次识别落一条
- `notifications(id, user_id, type[like|comment], post_id, actor_user_id, content, is_read, created_at)`

调整：
- `community_posts.likes_count / comments_count` 由触发器维护
- 给 `community_posts` 加 `INSERT/UPDATE/DELETE` RLS 给作者本人
- 所有新表开 RLS：本人可读写自己那部分；公共展示走 server function（admin client 投影安全字段）

---

## 5. 后端（TanStack server functions，全部走 `createServerFn`）

- `auth`：用 `supabase.auth.signInWithOtp({ phone })` + `verifyOtp`，浏览器侧直接调 supabase 客户端即可，无需 server function
- `getMyProfile` / `updateMyProfile` （require auth）
- `getUserProfile({ userId })` （public，admin client 投影 nickname/avatar/帖子列表）
- `submitUserPost` （require auth，用 `context.supabase`，作者写自己 user_id）
- `togglePostLike` / `togglePostFavorite` / `addComment` / `deleteMyComment`
- `listMyFavorites` / `listMyHistory` / `listMyNotifications` / `markNotificationRead`
- `recordRecognitionHistory`（登录态每次识别成功后写一条）

`/admin` 删帖逻辑保持现状（service role）。

---

## 6. UI 改造点

- `CameraStage` / `useGuestRecognition`：登录态绕过日额度；额度耗尽弹「登录解锁无限识别」CTA
- `PublicCommunity` 卡片：
  - 顶部头像 + 昵称（游客继续显示「游客」）
  - 右下角加心形（赞）/ 收藏 / 评论数；未登录点击 → `/login`
- 新增 `LoginGate` Hook：未登录触发受限动作时统一弹 sheet 引导
- 发布弹窗里：登录后默认带上自己的昵称（不可改），游客保留现有「游客」展示

---

## 7. 微信登录的处理建议

Lovable Cloud / Supabase 不原生支持微信。三种路径：

1. **现在先不做**（推荐）：仅手机号已能覆盖 95% 微信场景下的用户，因为微信浏览器里也能收短信
2. 后续若你拿到微信开放平台 AppID/Secret，再单独做一期：自建 OAuth 回调 server route + Supabase `signInWithIdToken` 自定义 provider
3. 公众号场景另算（需要服务号 + 模板消息资质）

本次方案按「先做手机号」推进，把微信入口在登录页留一个「微信登录（即将上线）」灰态按钮，避免后续改版。

---

## 8. 实施顺序（建议拆 3 个里程碑）

**M1 · 登录闭环**
- 数据库迁移：profiles 表 + 触发器 + RLS
- `/login` 手机号验证码页（含「微信登录即将上线」灰按钮）
- 启用 Supabase 手机号登录（你后续在 Cloud 后台填 Twilio 凭据）
- `__root.tsx` 集成 `onAuthStateChange` + 顶部右上角头像/登录态切换
- 第 3 个 Tab 切「登录 / 我的」

**M2 · 「我的」与发帖归属**
- `/me` 主入口 + `/me/profile` + `/me/settings`（改昵称、头像、退出）
- `/u/$userId` 公共主页
- 登录态发帖落真实 `user_id`，识别无上限 + 写 `recognition_history`
- `/me/history` 列表

**M3 · 互动闭环**
- 点赞 / 收藏 / 评论 + 计数触发器 + RLS
- `/me/favorites`、`/me/notifications`
- 中古圈卡片接互动按钮 + `LoginGate`

---

## 9. 待你确认
1. 短信 Twilio 凭据由你后续在 Cloud 后台配置（我会在 M1 完成后告诉你具体填哪几项）
2. 默认昵称规则：「中古er + 4位随机数字」是否可以？
3. M1 / M2 / M3 是否一次性全做，还是先做 M1 验证流程？
