import { createFileRoute } from "@tanstack/react-router";
import PublicAbout from "@/pages/public/PublicAbout";

export const Route = createFileRoute("/about")({
  component: PublicAbout,
});
