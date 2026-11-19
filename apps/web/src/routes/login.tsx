import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (data?.session) throw redirect({ to: "/invitations" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "Could not send the code");
    else setCodeSent(true);
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await authClient.signIn.emailOtp({ email, otp });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "Wrong or expired code");
    else await navigate({ to: "/invitations" });
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Log in to InviteMe</h1>
      {codeSent ? (
        <form onSubmit={verify} className="flex flex-col gap-3">
          <p className="text-sm">We sent a code to {email}.</p>
          <label className="flex flex-col gap-1 text-sm">
            Code
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="rounded border px-3 py-2"
            />
          </label>
          <button type="submit" disabled={busy} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
            Log in
          </button>
        </form>
      ) : (
        <form onSubmit={sendCode} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded border px-3 py-2"
            />
          </label>
          <button type="submit" disabled={busy} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
            Send code
          </button>
        </form>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </main>
  );
}
