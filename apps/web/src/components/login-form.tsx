import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { Input } from "@invite-me/ui/components/motion/input";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

type Step = "email" | "code";
type Busy = "email" | "code" | "google" | "passkey";

export function LoginForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy("email");
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    setBusy(null);
    if (error) {
      setError(error.message ?? "Could not send the code");
      return;
    }
    setStep("code");
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy("code");
    const { error } = await authClient.signIn.emailOtp({ email, otp: code });
    setBusy(null);
    if (error) {
      setError(error.message ?? "Invalid or expired code");
      return;
    }
    await navigate({ to: "/profile" });
  }

  async function signInWithGoogle() {
    setError(null);
    setBusy("google");
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/profile`,
    });
    if (error) {
      setBusy(null);
      setError(error.message ?? "Google sign-in failed");
    }
  }

  async function signInWithPasskey() {
    setError(null);
    setBusy("passkey");
    const { error } = await authClient.signIn.passkey();
    setBusy(null);
    if (error) {
      setError(error.message ?? "Passkey sign-in failed");
      return;
    }
    await navigate({ to: "/profile" });
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
        <p className="text-sm text-muted-foreground">
          Use an email code, Google, or a passkey.
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={setEmail}
          />
          <StatefulButton
            type="submit"
            className="w-full"
            state={busy === "email" ? "loading" : "idle"}
          >
            Email me a code
          </StatefulButton>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to {email}.
          </p>
          <Input
            label="Code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={setCode}
          />
          <StatefulButton
            type="submit"
            className="w-full"
            state={busy === "code" ? "loading" : "idle"}
          >
            Verify code
          </StatefulButton>
          <button
            type="button"
            className="text-sm text-muted-foreground underline"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
          >
            Use a different email
          </button>
        </form>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-3">
        <StatefulButton
          type="button"
          variant="outline"
          className="w-full"
          onClick={signInWithGoogle}
          state={busy === "google" ? "loading" : "idle"}
        >
          Continue with Google
        </StatefulButton>
        <StatefulButton
          type="button"
          variant="outline"
          className="w-full"
          onClick={signInWithPasskey}
          state={busy === "passkey" ? "loading" : "idle"}
        >
          Sign in with a passkey
        </StatefulButton>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
