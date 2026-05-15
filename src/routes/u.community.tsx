import { createFileRoute } from "@tanstack/react-router";
import PublicCommunity from "@/pages/public/PublicCommunity";

export const Route = createFileRoute("/u/community")({
  component: PublicCommunity,
});
