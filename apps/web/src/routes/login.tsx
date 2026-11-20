import { Button } from "@invite-me/ui/components/motion/button/base";
import { Input } from "@invite-me/ui/components/motion/input";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Fragment, type FormEvent, type ReactNode, useState } from "react";

import { Logo } from "@/components/logo";
import { LoginSkeleton } from "@/components/page-skeletons";
import { toast } from "@/components/toaster";
import { authClient } from "@/lib/auth-client";
import { ENV } from "@/env.public";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in · Invite Me" }] }),
  validateSearch: (search: Record<string, unknown>): { next?: string } => ({
    next:
      typeof search.next === "string" && search.next.startsWith("/") && !search.next.startsWith("//")
        ? search.next
        : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await authClient.getSession();
    if (data?.session) throw redirect({ href: search.next ?? "/invitations" });
  },
  component: LoginPage,
  loader: fetchMethods,
  pendingComponent: LoginSkeleton,
  pendingMs: 0,
  pendingMinMs: 250,
});

const callbackURL = (next: string) => `${window.location.origin}${next}`;

type Methods = { google: boolean; github: boolean; email: boolean };

/** Ask the server which sign-in methods it can really offer. If it can't be reached, offer only the ones that need no setup. */
async function fetchMethods(): Promise<Methods> {
  try {
    const response = await fetch(`${ENV.VITE_SERVER_URL.replace(/\/$/, "")}/api/methods`);
    if (!response.ok) throw new Error("methods unavailable");
    return (await response.json()) as Methods;
  } catch {
    return { google: false, github: false, email: false };
  }
}

/** The shared field hairline is near-white; keep the edge visible on a white page. */
const FIELD = {
  field: "border-foreground/15 data-[state=focused]:border-foreground/25",
} as const;

type Mode = "code" | "link" | "password" | "passkey";

const METHOD_LABEL: Record<Mode, string> = {
  code: "email code",
  link: "sign-in link",
  password: "password",
  passkey: "passkey",
};

type Fields = { email?: string; password?: string; otp?: string };

function LoginPage() {
  const navigate = useNavigate();
  const { next: returnTo = "/invitations" } = Route.useSearch();
  const methods = Route.useLoaderData();
  const [mode, setMode] = useState<Mode>(methods.email ? "code" : "password");
  const [creating, setCreating] = useState(false);
  const [codeStep, setCodeStep] = useState<"email" | "code">("email");
  const [linkSent, setLinkSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Fields>({});
  const [busy, setBusy] = useState(false);

  function goTo(next: Mode) {
    setMode(next);
    setCodeStep("email");
    setLinkSent(false);
    setErrors({});
    setOtp("");
  }

  function hasEmail(fields: Fields = {}) {
    if (email.trim()) {
      setErrors(fields);
      return true;
    }
    setErrors({ ...fields, email: "Enter your email" });
    return false;
  }

  async function sendCode() {
    if (!hasEmail()) return;
    setBusy(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setBusy(false);
    if (error) {
      toast.error("Could not send the code", { description: error.message });
      return;
    }
    setCodeStep("code");
    setOtp("");
  }

  async function sendLink() {
    if (!hasEmail()) return;
    setBusy(true);
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: callbackURL(returnTo) });
    setBusy(false);
    if (error) {
      toast.error("Could not send the link", { description: error.message });
      return;
    }
    setLinkSent(true);
  }

  async function verifyCode() {
    if (!otp.trim()) {
      setErrors({ otp: "Enter the code from your email" });
      return;
    }
    setBusy(true);
    const { error } = await authClient.signIn.emailOtp({ email, otp });
    setBusy(false);
    if (error) {
      setErrors({ otp: "That code is wrong or has expired" });
      return;
    }
    await navigate({ href: returnTo });
  }

  async function signInWithPassword() {
    const next: Fields = {};
    if (!email.trim()) next.email = "Enter your email";
    if (!password) next.password = "Enter your password";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    const { error } = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (error) {
      toast.error("Could not sign in", {
        description: "Check your email and password, then try again.",
      });
      return;
    }
    await navigate({ href: returnTo });
  }

  async function signInWithPasskey() {
    setBusy(true);
    const { error } = await authClient.signIn.passkey();
    setBusy(false);
    if (error) {
      toast.error("Could not use a passkey", { description: error.message });
      return;
    }
    await navigate({ href: returnTo });
  }

  async function signUpWithPassword() {
    const next: Fields = {};
    if (!email.trim()) next.email = "Enter your email";
    if (password.length < 8) next.password = "Use at least 8 characters";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0] || "Host",
    });
    setBusy(false);
    if (error) {
      toast.error("Could not create the account", {
        description: error.message ?? "Try a different email.",
      });
      return;
    }
    await navigate({ href: returnTo });
  }

  async function signInWithProvider(provider: "google" | "github") {
    const name = provider === "google" ? "Google" : "GitHub";
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: callbackURL(returnTo),
    });
    if (error) {
      toast.error(`Could not sign in with ${name}`, {
        description:
          error.message === "Provider not found"
            ? `${name} sign-in is not configured on this server.`
            : error.message,
      });
    }
  }


  const hint =
    mode === "password"
      ? creating
        ? "Pick a password of at least 8 characters."
        : "The password you set for this account."
      : mode === "passkey"
        ? "Your browser will ask for a fingerprint, face, or security key."
        : mode === "link"
          ? linkSent
            ? `Link sent to ${email}. Open it on this device.`
            : "We'll email you a link that signs you in."
          : codeStep === "code"
            ? `Code sent to ${email}. It expires in five minutes.`
            : "We'll email you a six-digit code.";

  const emailField = (
    <Input
      label="Email"
      type="email"
      value={email}
      onChange={setEmail}
      error={errors.email}
      reserveErrorLine
      autoComplete="email"
      autoCapitalize="none"
      spellCheck={false}
      autoFocus={mode === "code" || mode === "link" || mode === "password"}
      classNames={FIELD}
    />
  );

  const others = (Object.keys(METHOD_LABEL) as Mode[]).filter(
    (option) => option !== mode && (methods.email || (option !== "code" && option !== "link")),
  );

  return (
    <main className="grid min-h-svh place-items-center px-6 py-16">
      <div className="w-full max-w-[20rem]">
        <span className="flex items-center">
          <Logo className="size-6" />
          <span className="sr-only">Invite Me</span>
        </span>

        <h1 className="mt-9 text-2xl font-semibold tracking-[-0.02em]">Sign in</h1>
        <p
          aria-live="polite"
          className="mt-1.5 text-sm leading-6 text-pretty text-muted-foreground"
        >
          {hint}
        </p>

        {mode === "code" && codeStep === "email" && (
          <form onSubmit={submit(sendCode)} noValidate className="mt-7 flex flex-col gap-2">
            {emailField}
            <Button type="submit" size="md" className="w-full" disabled={busy}>
              {busy ? "Sending code…" : "Send code"}
            </Button>
          </form>
        )}

        {mode === "code" && codeStep === "code" && (
          <form onSubmit={submit(verifyCode)} noValidate className="mt-7 flex flex-col gap-2">
            <Input
              label="Code"
              value={otp}
              onChange={setOtp}
              error={errors.otp}
              reserveErrorLine
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              classNames={{ ...FIELD, input: "text-center text-lg tracking-[0.5em]" }}
            />
            <Button type="submit" size="md" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
            <div className="flex flex-wrap items-center gap-x-4">
              <TextButton onClick={() => void sendCode()}>Send a new code</TextButton>
              <TextButton
                onClick={() => {
                  setCodeStep("email");
                  setOtp("");
                  setErrors({});
                }}
              >
                Use a different email
              </TextButton>
            </div>
          </form>
        )}

        {mode === "link" &&
          (linkSent ? (
            <div className="mt-7 flex flex-col gap-2">
              <Button size="md" className="w-full" disabled={busy} onClick={() => void sendLink()}>
                {busy ? "Sending…" : "Send the link again"}
              </Button>
              <TextButton
                onClick={() => {
                  setLinkSent(false);
                  setErrors({});
                }}
              >
                Use a different email
              </TextButton>
            </div>
          ) : (
            <form onSubmit={submit(sendLink)} noValidate className="mt-7 flex flex-col gap-2">
              {emailField}
              <Button type="submit" size="md" className="w-full" disabled={busy}>
                {busy ? "Sending link…" : "Send link"}
              </Button>
            </form>
          ))}

        {mode === "password" && (
          <form
            onSubmit={submit(creating ? signUpWithPassword : signInWithPassword)}
            noValidate
            className="mt-7 flex flex-col gap-2"
          >
            {emailField}
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              reserveErrorLine
              autoComplete={creating ? "new-password" : "current-password"}
              classNames={FIELD}
            />
            <Button type="submit" size="md" className="w-full" disabled={busy}>
              {creating
                ? busy
                  ? "Creating account…"
                  : "Create account"
                : busy
                  ? "Signing in…"
                  : "Sign in"}
            </Button>
            <TextButton
              onClick={() => {
                setCreating((value) => !value);
                setErrors({});
              }}
            >
              {creating ? "Already have an account? Sign in" : "New here? Create an account"}
            </TextButton>
          </form>
        )}

        {mode === "passkey" && (
          <div className="mt-7">
            <Button size="md" className="w-full" disabled={busy} onClick={signInWithPasskey}>
              {busy ? "Waiting for your passkey…" : "Continue with a passkey"}
            </Button>
          </div>
        )}

        {methods.google || methods.github ? (
          <div className={methods.google && methods.github ? "mt-4 grid grid-cols-2 gap-3" : "mt-4 grid gap-3"}>
            {methods.google ? (
              <Button
                variant="outline"
                size="md"
                className="w-full border-foreground/15"
                onClick={() => signInWithProvider("google")}
              >
                <GoogleMark aria-hidden className="size-4" />
                Google
              </Button>
            ) : null}
            {methods.github ? (
              <Button
                variant="outline"
                size="md"
                className="w-full border-foreground/15"
                onClick={() => signInWithProvider("github")}
              >
                <GitHubMark aria-hidden className="size-4" />
                GitHub
              </Button>
            ) : null}
          </div>
        ) : null}

        <p className="mt-6 text-[0.8125rem] leading-6 text-muted-foreground">
          Other ways to sign in:{" "}
          {others.map((option, index) => (
            <Fragment key={option}>
              {index > 0 && <span aria-hidden> · </span>}
              <InlineLink onClick={() => goTo(option)}>{METHOD_LABEL[option]}</InlineLink>
            </Fragment>
          ))}
        </p>
      </div>
    </main>
  );
}

function submit(action: () => Promise<void>) {
  return (event: FormEvent) => {
    event.preventDefault();
    void action();
  };
}

function TextButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mx-1 self-start rounded-sm px-1 py-0.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

function InlineLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-sm text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.17-2 3.44-4.95 3.44-8.56Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.03-6.44-4.75H1.7v2.98A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.56 14.67a7.2 7.2 0 0 1 0-4.6V7.09H1.7a12 12 0 0 0 0 10.56l3.86-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.69 0 3.2.58 4.4 1.72l3.3-3.3C17.7 1.24 15.1 0 12 0 7.35 0 3.32 2.67 1.7 7.09l3.86 2.98C6.46 7.3 9 4.77 12 4.77Z"
      />
    </svg>
  );
}
