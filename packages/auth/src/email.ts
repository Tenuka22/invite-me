export type EmailConfig = {
  /** "console" logs messages instead of sending. Default when unset. */
  EMAIL_PROVIDER?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
};

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(env: EmailConfig, message: EmailMessage) {
  const provider = env.EMAIL_PROVIDER || "console";

  if (provider === "console") {
    // Dev mock: the body contains the OTP, so it is printed as-is.
    console.log(
      `[email:console] to=${message.to} subject="${message.subject}"\n${message.text}`,
    );
    return;
  }

  if (provider !== "resend") {
    throw new Error(`Unknown EMAIL_PROVIDER "${provider}" (expected "console" or "resend")`);
  }
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error("EMAIL_PROVIDER=resend requires RESEND_API_KEY and EMAIL_FROM");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend request failed (${response.status}): ${await response.text()}`);
  }
}
