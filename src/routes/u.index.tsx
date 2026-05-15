import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/u/")({
  beforeLoad: () => { throw redirect({ to: "/", replace: true }); },
});
