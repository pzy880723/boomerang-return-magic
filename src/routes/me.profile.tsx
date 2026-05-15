import { createFileRoute } from "@tanstack/react-router";
import MeComingSoon from "@/pages/me/MeComingSoon";

export const Route = createFileRoute("/me/profile")({
  head: () => ({ meta: [{ title: "我的主页 · 中古识物" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <MeComingSoon title="我的主页" />,
});
