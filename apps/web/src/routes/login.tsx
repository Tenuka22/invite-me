import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return showSignIn ? (
    <>Sign In</>
    // <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <>Sign Up</>
    // <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
