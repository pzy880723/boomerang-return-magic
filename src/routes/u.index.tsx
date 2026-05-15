import { createFileRoute } from "@tanstack/react-router";
import PublicScan from "@/pages/public/PublicScan";

export const Route = createFileRoute("/u/")({
  component: PublicScan,
});
