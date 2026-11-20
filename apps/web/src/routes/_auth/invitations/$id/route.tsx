import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/invitations/$id")({
  component: Outlet,
});
