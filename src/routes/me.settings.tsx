import { createFileRoute } from "@tanstack/react-router";
import MeComingSoon from "@/pages/me/MeComingSoon";

export const Route = createFileRoute("/me/settings")({
  head: () => ({ meta: [{ title: "账号设置 · 中古识物" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <MeComingSoon title="账号设置" />,
});
