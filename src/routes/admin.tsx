import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "管理后台" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="container max-w-screen-sm py-10 space-y-4">
      <h1 className="font-display text-2xl tracking-tight">管理后台</h1>
      <p className="text-sm text-muted-foreground">
        密码验证与中古圈内容管理功能即将上线。
      </p>
      <Link
        to="/"
        className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background"
      >
        返回首页
      </Link>
    </div>
  );
}
