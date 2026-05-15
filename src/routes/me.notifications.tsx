import { createFileRoute } from "@tanstack/react-router";
import MeComingSoon from "@/pages/me/MeComingSoon";

export const Route = createFileRoute("/me/notifications")({
  head: () => ({ meta: [{ title: "互动消息 · 中古识物" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <MeComingSoon title="互动消息" />,
});
