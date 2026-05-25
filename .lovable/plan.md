## 目标
导出一份让微信小程序团队（或 AI）能完整复刻「中古识物 BOOMER-OFF」应用的离线文档包，覆盖所有文案、UI、交互逻辑、后端接口、数据库结构、AI Prompt。

## 交付物
在 `/mnt/documents/` 下生成：

```
boomer-off-复刻文档/
├── 00-README.md                  阅读顺序、术语、整体架构图
├── 01-产品说明与文案.md           所有界面文字、品牌、Tab、Toast、空状态文案
├── 02-页面与交互流程.md           每个页面：路由、布局、组件树、用户操作流、状态流转
├── 03-UI设计规范.md               色板（oklch→hex）、字体、圆角、阴影、间距、动效、组件样式
├── 04-数据模型与类型.md           ProductCategory 枚举、RecognitionResult 等所有 TS 类型 → 小程序可用 JSON Schema
├── 05-后端接口与数据库.md         Supabase 表结构、RLS、3 个 Edge Function 的入参/出参/错误码
├── 06-AI识别Prompt与逻辑.md       识别 Prompt 全文、缓存策略、游客次数限制、图片压缩与 hash 算法
├── 07-小程序复刻指引.md           Web→小程序映射：路由、相机、登录（手机号验证码）、分享、本地缓存、tabBar
├── 08-源码全文附录/                所有关键源文件原样导出（.tsx/.ts/.css），按目录归档
└── 09-资源清单.md                 图片资源、字体、第三方依赖、需要申请的密钥（腾讯云短信、Lovable AI 等）
```

## 内容范围

**文案与产品（01）**
- 品牌名「中古识物 / BOOMER-OFF」、Slogan「Tap · Discover」
- 底部导航 4 个 Tab、Header、Logo 五连击进入 admin 的彩蛋
- 拍照页、识别结果页、社区页、登录页、我的页、关于页全部可见文字
- 错误提示、Toast、空状态、加载骨架屏文字

**页面与交互（02）** 逐页拆解：
- `/` PublicScan — 相机/上传 → 调用识别 → 跳转结果
- `/result` PublicResult — GuestProductCard 展示（含已删除「市场参考价」的最新规则）
- `/community` PublicCommunity — 公共瀑布流
- `/login` LoginPage — 手机号验证码（腾讯云短信 + Supabase Auth Hook）
- `/me`、`/me/*` 个人中心子页
- `/about`、`/admin`
- 游客限额、登录后无限识别、分享流程

**UI 设计规范（03）**
- 解析 `src/styles.css` 的 oklch token 并附 hex 近似值
- 字体：Noto Sans SC + Playfair Display
- shadcn 组件改造点（Button/Card/Badge/Drawer 等）
- 渐变 `gradient-surface` / `gradient-accent`、`safe-top` / `safe-bottom` 适配

**数据模型（04）**
- 完整 TS 类型 → 等价小程序数据结构
- 分类枚举 17 类 + 中文标签 + 图标映射（小程序用 iconfont 替代 lucide）

**后端（05）**
- 5 张表完整 DDL、字段含义、RLS、默认值
- 3 个 Edge Function：`recognize-product-public`、`submit-public-post`、`generate-share-copy` 的请求/响应 JSON、错误码、限流逻辑
- profiles 自动创建触发器 `handle_new_user`

**AI 与算法（06）**
- 识别 Edge Function 内的完整 Prompt（系统提示词、JSON Schema、字段语义）
- 图片预处理：`compressDataUrl`（1024px / jpeg 0.7）、`computeImageHash`（pHash 算法源码）
- 缓存命中策略：hash_cache → name_cache → AI 调用
- 游客每日限额（IP hash + guest_daily_usage 表）

**小程序复刻指引（07）**
- Web 路由 → 小程序 pages 映射表
- 浏览器 API → 小程序 API 映射：
  - `<input type=file capture>` → `wx.chooseMedia`
  - `localStorage` → `wx.setStorageSync`
  - `navigator.share` → `onShareAppMessage`
  - `Supabase JS Client` → `wx.request` 直连 REST/Functions URL（含鉴权头写法）
- 登录方案：保持腾讯云短信链路，小程序端用 `wx.login` + 手机号快速验证可作替代方案（二选一说明）
- 样式：Tailwind/oklch → 小程序 rpx + WXSS 变量
- 组件库：shadcn → 自建 / Vant Weapp 对应表

**源码附录（08）**
所有关键文件原样附上（不裁剪、加文件路径标题），含：
- `src/routes/*.tsx` 全部
- `src/pages/**/*.tsx` 全部
- `src/components/recognition/*`、`src/components/public/*`、`src/components/system/*`
- `src/hooks/useAuth.tsx`、`useGuestRecognition.tsx`、`use-toast.ts`
- `src/lib/*`（imageHash、imageThumb、shareCopy、recognitionNarrative、utils）
- `src/types/index.ts`、`src/styles.css`
- `supabase/functions/*/index.ts` 全部
- `src/integrations/supabase/client.ts`（仅参考，不复用）
- shadcn ui 不附（说明用对应小程序组件替代即可）

**资源清单（09）**
- `src/assets/boomer-off-vintage-logo.png` 复制到导出目录
- 依赖列表（package.json 精选）
- 需要的密钥/服务：Lovable AI Gateway（或自备 Gemini/GPT key）、腾讯云短信（SDKAppID/签名/模板/SecretId/SecretKey）、Supabase（或小程序自建后端）

## 实现方式

用 Node 脚本一次性生成所有 .md 文件 + 拷贝源码与 logo + 打 zip：
1. 读取项目内所有目标源文件
2. 用模板字符串生成 9 个 markdown 文档（中文撰写）
3. 把源码以 `### path\n\`\`\`tsx ... \`\`\`` 方式拼入 `08-源码全文附录` 下的分册 md
4. 复制 logo 到 `资源/`
5. `zip -r boomer-off-复刻文档.zip boomer-off-复刻文档/`
6. 通过 `<presentation-artifact>` 同时提供 zip 与一份独立 README

## 不做
- 不重新设计或简化任何功能；忠实记录现状
- 不生成可运行的小程序工程（仅文档+源码参考）
- 不导出 shadcn ui 组件源码（体积大且小程序不复用）
- 不写新代码到项目里
