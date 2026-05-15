import { createFileRoute } from "@tanstack/react-router";
import MeComingSoon from "@/pages/me/MeComingSoon";

export const Route = createFileRoute("/me/favorites")({
  head: () => ({ meta: [{ title: "我的收藏 · 中古识物" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <MeComingSoon title="我的收藏" />,
});
