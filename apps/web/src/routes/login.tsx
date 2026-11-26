import { createFileRoute } from "@tanstack/react-router";

import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="host-app flex min-h-svh flex-col">
      <header className="mx-auto w-full max-w-6xl px-4 py-5">
        <Brand />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <LoginForm />
      </main>
    </div>
  );
}
