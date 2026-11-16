import { createFileRoute } from "@tanstack/react-router";

import { LoginForm } from "@/components/login-form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <LoginForm />
    </main>
  );
}
