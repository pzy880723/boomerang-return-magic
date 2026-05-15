import { createFileRoute } from "@tanstack/react-router";
import MePage from "@/pages/me/MePage";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "我的 · 中古识物" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MePage,
});
