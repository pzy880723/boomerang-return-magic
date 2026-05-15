import { createFileRoute } from "@tanstack/react-router";
import MeComingSoon from "@/pages/me/MeComingSoon";

export const Route = createFileRoute("/me/history")({
  head: () => ({ meta: [{ title: "识别历史 · 中古识物" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <MeComingSoon title="识别历史" />,
});
