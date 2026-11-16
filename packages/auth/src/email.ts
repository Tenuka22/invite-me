export type EmailConfig = {
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
};

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(env: EmailConfig, message: EmailMessage) {
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
