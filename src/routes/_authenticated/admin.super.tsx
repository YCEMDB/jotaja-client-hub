import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/super")({
  beforeLoad: () => {
    throw redirect({ to: "/super" });
  },
});
