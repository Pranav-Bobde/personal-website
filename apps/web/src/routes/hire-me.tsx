import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/hire-me")({
  beforeLoad: () => {
    throw redirect({ to: "/work", statusCode: 301 });
  },
});
