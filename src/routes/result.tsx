import { createFileRoute } from "@tanstack/react-router";
import PublicResult from "@/pages/public/PublicResult";

export const Route = createFileRoute("/result")({
  component: PublicResult,
});
