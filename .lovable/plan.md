## 问题诊断

控制台报错：
```
Cannot update a component (Transitioner) while rendering a different component (BrowserRouter).
```

原因：当前在 TanStack Start 的 SSR 路由里嵌套了 `react-router-dom` 的 `BrowserRouter`。两套路由都监听浏览器 history／popstate，BrowserRouter 在挂载时调用 `setState`，触发 TanStack 的 Transitioner 在 render 阶段更新，造成无限循环 → 页面白屏（即便是客户端 mounted 后再渲染也救不回来）。

混合方案（splat + BrowserRouter）在这个框架上不可行。修复必须把 `/u/*` 改成原生 TanStack 文件路由。

## 修复方案

### 1. 用文件路由替换 react-router-dom

新建：
- `src/routes/u.tsx` — `/u` 布局路由（包 `<PublicLayout />`，里面用 TanStack 的 `<Outlet />`）
- `src/routes/u.index.tsx` — `/u`（识物 / Scan）
- `src/routes/u.result.tsx` — `/u/result`
- `src/routes/u.community.tsx` — `/u/community`
- `src/routes/u.about.tsx` — `/u/about`

改：
- `src/routes/index.tsx`：`beforeLoad` 直接 `throw redirect({ to: '/u' })`
- `src/routes/$.tsx`：删除（catch-all 改为 `notFoundComponent` 重定向到 `/u`，已经有 root 的 NotFound，可以保留或改成自动跳 `/u`）
- 删除 `src/App.tsx`（不再需要）

### 2. 替换页面里的 react-router-dom 导入

5 个文件把 import 从 `react-router-dom` 换到 `@tanstack/react-router`：
- `Link` → `Link`（API 兼容，`to` 写法一致）
- `NavLink` → `Link` + `activeProps={{ className: '…' }}`
- `useNavigate()` → `useNavigate()`，调用从 `navigate('/u/result', { state })` 改成 `navigate({ to: '/u/result', state })`；其中 `PublicResult` 读取 `location.state` 改用 TanStack 的 `useLocation().state` 或 `Route.useSearch()`/路由 state（保留 history.state 即可）
- `useLocation` → `useLocation`
- `Outlet`（PublicLayout）→ `Outlet`

### 3. 卸载依赖

`bun remove react-router-dom`

### 4. 验证

预览访问 `/` 应跳转到 `/u`，4 个子页可来回切，识物→结果跳转携带数据正常，浏览器控制台无 Transitioner 报错。

## 不在本次范围

- 不动 Edge Functions、数据库、样式、识物业务逻辑
- 不重写页面组件，只换路由 import 与导航 API
- 不动认证/管理端
