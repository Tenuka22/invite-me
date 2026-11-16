import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { Input } from "@invite-me/ui/components/motion/input";
import { useNavigate } from "@tanstack/react-router";
import { KeyRound, Mail, User } from "lucide-react";
import { type FormEvent, useState } from "react";

import { toast } from "@/components/toaster";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "signup";
type Step = "email" | "code";
type Busy = "email" | "code" | "google" | "passkey";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function LoginForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";
  const emailError =
    email.length > 0 && !EMAIL_PATTERN.test(email) ? "Enter a valid email" : undefined;
  const nameError =
    isSignup && name.trim().length === 0 && step === "email" && email.length > 0
      ? "Enter your name"
      : undefined;

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setStep("email");
    setCode("");
    setError(null);
  }

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    if (isSignup && name.trim().length === 0) {
      setError("Enter your name");
      return;
    }
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
    if (error) {
      setBusy(null);
      setError(error.message ?? "Invalid code");
      return;
    }
    // The OTP sign-in creates the account on first use, with no name.
    // Save the name entered at sign-up.
    if (isSignup) {
      const { error: nameErr } = await authClient.updateUser({ name: name.trim() });
      if (nameErr) {
        setBusy(null);
        setError(nameErr.message ?? "Could not save your name");
        return;
      }
      setBusy("passkey");
      const { error: passkeyError } = await authClient.passkey.addPasskey({
        name: "This device",
      });
      if (passkeyError) {
        toast.error("Passkey not created", { description: "Add one from your profile." });
      }
    }
    setBusy(null);
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

  const title = isSignup ? "Create your account" : "Welcome back";
  const subtitle =
    step === "code"
      ? `Enter the 6-digit code we sent to ${email}.`
      : isSignup
        ? "Verify your email, then set up a passkey."
        : "Log in with an email code, Google, or a passkey.";

  return (
    <div className="flex w-full max-w-sm flex-col gap-6 rounded-3xl bg-card p-6 shadow-xl shadow-black/5 ring-1 ring-border">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Invite Me
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>

        <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1" role="group" aria-label="Mode">
          <StatefulButton
            type="button"
            size="sm"
            variant={isSignup ? "ghost" : "primary"}
            className="w-full"
            disabled={anyBusy}
            onClick={() => switchMode("login")}
          >
            Log in
          </StatefulButton>
          <StatefulButton
            type="button"
            size="sm"
            variant={isSignup ? "primary" : "ghost"}
            className="w-full"
            disabled={anyBusy}
            onClick={() => switchMode("signup")}
          >
            Create account
          </StatefulButton>
        </div>
      </div>

      {step === "email" ? (
        <form noValidate onSubmit={sendCode} className="flex flex-col gap-4">
          {isSignup ? (
            <Input
              label="Name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              leftIcon={<User />}
              disabled={anyBusy}
              value={name}
              onChange={setName}
              error={nameError}
              reserveErrorLine
            />
          ) : null}
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
            disabled={anyBusy}
            state={busy === "email" ? "loading" : "idle"}
            loadingText="Sending code"
          >
            {isSignup ? "Continue with email" : "Email me a code"}
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
            disabled={anyBusy}
            state={busy === "code" || busy === "passkey" ? "loading" : "idle"}
            loadingText={busy === "passkey" ? "Creating passkey" : "Verifying"}
          >
            {isSignup ? "Verify and create account" : "Verify and log in"}
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

      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground" aria-hidden>
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
          icon={<GoogleIcon />}
          onClick={signInWithGoogle}
        >
          {isSignup ? "Sign up with Google" : "Continue with Google"}
        </StatefulButton>
        {isSignup ? null : (
          <StatefulButton
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={anyBusy}
            state={busy === "passkey" ? "loading" : "idle"}
            loadingText="Waiting for passkey"
            icon={<KeyRound className="size-4" />}
            onClick={signInWithPasskey}
          >
            Sign in with a passkey
          </StatefulButton>
        )}
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
