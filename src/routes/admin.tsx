import { createFileRoute } from "@tanstack/react-router";
import AdminConsole from "@/pages/admin/AdminConsole";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "管理后台" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminConsole,
});
