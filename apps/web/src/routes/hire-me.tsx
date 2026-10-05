import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/hire-me")({
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301 });
  },
});
