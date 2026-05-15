import { createFileRoute } from "@tanstack/react-router";
import PublicCommunity from "@/pages/public/PublicCommunity";

export const Route = createFileRoute("/community")({
  component: PublicCommunity,
});
