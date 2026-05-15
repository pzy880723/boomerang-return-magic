import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Camera, Users, Info, User as UserIcon, LogIn } from "lucide-react";

import appCss from "../styles.css?url";
import { cn } from "@/lib/utils";
import logo from "@/assets/boomer-off-vintage-logo.png";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">页面找不到</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          这个链接可能已经失效或被移走了。
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            回到首页
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">页面加载失败</h1>
        <p className="mt-2 text-sm text-muted-foreground">出了点小问题，可以重试一下。</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            重试
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground">
            回到首页
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "中古识物 · BOOMER-OFF" },
      { name: "description", content: "对准中古好物拍一张，AI 1-3 秒读懂年代、产地与背后故事，匿名分享到中古圈。" },
      { property: "og:title", content: "中古识物 · BOOMER-OFF" },
      { property: "og:description", content: "对准中古好物拍一张，AI 1-3 秒读懂年代、产地与背后故事。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

type TabItem = {
  to: "/" | "/community" | "/about" | "/me" | "/login";
  label: string;
  Icon: typeof Camera;
  exact: boolean;
};

function PublicChrome() {
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tapRef = useRef<{ count: number; last: number }>({ count: 0, last: 0 });

  // 登录状态变化 → 失效缓存与路由
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const now = Date.now();
    const within = now - tapRef.current.last < 600;
    tapRef.current.count = within ? tapRef.current.count + 1 : 1;
    tapRef.current.last = now;
    if (tapRef.current.count >= 5) {
      e.preventDefault();
      tapRef.current.count = 0;
      navigate({ to: "/admin" });
    }
  };

  const tabs: TabItem[] = [
    { to: "/", label: "拍一拍", Icon: Camera, exact: true },
    { to: "/community", label: "中古圈", Icon: Users, exact: false },
    user
      ? { to: "/me", label: "我的", Icon: UserIcon, exact: false }
      : { to: "/login", label: "登录", Icon: LogIn, exact: false },
    { to: "/about", label: "关于", Icon: Info, exact: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-surface flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl safe-top">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="flex items-center min-w-0 group">
            <div className="min-w-0 leading-tight">
              <div className="font-display text-[15px] tracking-tight truncate">中古识物</div>
              <div className="text-[10px] text-muted-foreground tracking-[0.18em] uppercase">
                Tap · Discover
              </div>
            </div>
          </Link>
          <Link to="/" className="ml-auto shrink-0" aria-label="中古识物" onClick={handleLogoClick}>
            <img src={logo} alt="中古识物" draggable={false} className="h-9 w-auto object-contain" />
          </Link>
        </div>
      </header>

      <main className="flex-1 pb-20">
        <ErrorBoundary scope="page">
          <Outlet />
        </ErrorBoundary>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/85 backdrop-blur-xl safe-bottom"
        aria-label="底部导航"
      >
        <div className="mx-auto max-w-screen-md px-3">
          <ul className="flex items-stretch justify-around h-14">
            {tabs.map(({ to, label, Icon, exact }) => {
              const active = exact
                ? location.pathname === to
                : location.pathname === to || location.pathname.startsWith(to + "/");
              return (
                <li key={to} className="flex-1">
                  <Link
                    to={to}
                    activeOptions={{ exact }}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-0.5 h-full transition-all",
                      active ? "text-foreground" : "text-muted-foreground/70 hover:text-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-gradient-accent" />
                    )}
                    <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2 : 1.6} />
                    <span className={cn("text-[11px]", active ? "font-semibold" : "font-medium")}>
                      {label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PublicChrome />
      </AuthProvider>
    </QueryClientProvider>
  );
}

