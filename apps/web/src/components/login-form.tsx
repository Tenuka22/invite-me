import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { Input } from "@invite-me/ui/components/motion/input";
import { useNavigate } from "@tanstack/react-router";
import { KeyRound, Mail } from "lucide-react";
import { type FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

type Step = "email" | "code";
type Busy = "email" | "code" | "google" | "passkey";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailError =
    email.length > 0 && !EMAIL_PATTERN.test(email) ? "Enter a valid email" : undefined;

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
      setError(error.message ?? "Could not send code");
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
      setError(error.message ?? "Invalid code");
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
    setBusy(null);
    if (error) setError(error.message ?? "Google sign-in failed");
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

  const anyBusy = busy !== null;

  return (
    <div className="flex w-full max-w-sm flex-col gap-5 rounded-3xl border border-border p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Log in</h1>
        <p className="text-sm text-muted-foreground">
          {step === "email"
            ? "Use an email code, Google, or a passkey."
            : `Enter the code we sent to ${email}.`}
        </p>
      </div>

      {step === "email" ? (
        <form noValidate onSubmit={sendCode} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail />}
            disabled={anyBusy}
            value={email}
            onChange={setEmail}
            error={emailError}
            reserveErrorLine
          />
          <StatefulButton
            type="submit"
            size="lg"
            className="w-full"
            state={busy === "email" ? "loading" : "idle"}
            loadingText="Sending code"
          >
            Email me a code
          </StatefulButton>
        </form>
      ) : (
        <form noValidate onSubmit={verifyCode} className="flex flex-col gap-4">
          <Input
            label="Code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            leftIcon={<KeyRound />}
            disabled={anyBusy}
            value={code}
            onChange={setCode}
            reserveErrorLine
          />
          <StatefulButton
            type="submit"
            size="lg"
            className="w-full"
            state={busy === "code" ? "loading" : "idle"}
            loadingText="Verifying"
          >
            Verify and log in
          </StatefulButton>
          <StatefulButton
            type="button"
            variant="ghost"
            size="lg"
            className="w-full"
            disabled={anyBusy}
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
          >
            Use a different email
          </StatefulButton>
        </form>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-2">
        <StatefulButton
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          disabled={anyBusy}
          state={busy === "google" ? "loading" : "idle"}
          loadingText="Redirecting"
          onClick={signInWithGoogle}
        >
          Continue with Google
        </StatefulButton>
        <StatefulButton
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          disabled={anyBusy}
          state={busy === "passkey" ? "loading" : "idle"}
          loadingText="Waiting for passkey"
          onClick={signInWithPasskey}
        >
          Sign in with a passkey
        </StatefulButton>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
