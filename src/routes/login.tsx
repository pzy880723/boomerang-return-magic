import { createFileRoute } from "@tanstack/react-router";
import LoginPage from "@/pages/auth/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "登录 · 中古识物" },
      { name: "description", content: "手机号验证码登录中古识物，免费无限识别中古好物。" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LoginPage,
});
