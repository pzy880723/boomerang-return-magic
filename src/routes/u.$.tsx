import { createFileRoute, redirect } from "@tanstack/react-router";

// 旧路由 /u/* 一律 301 到新扁平路径
export const Route = createFileRoute("/u/$")({
  beforeLoad: ({ params }) => {
    const splat = (params as { _splat?: string })._splat || "";
    const map: Record<string, string> = {
      "": "/",
      "result": "/result",
      "community": "/community",
      "about": "/about",
    };
    throw redirect({ to: map[splat] ?? "/", replace: true });
  },
});
