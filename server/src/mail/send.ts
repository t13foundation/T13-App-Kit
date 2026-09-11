import { render } from "@react-email/render";
import nodemailer, { type Transporter } from "nodemailer";
import type { ReactElement } from "react";

import { env } from "../env.ts";
import { ResetPassword } from "./templates/reset-password.tsx";
import { VerifyEmail } from "./templates/verify-email.tsx";

let transporter: Transporter | undefined;

function getTransport(): Transporter {
  if (!transporter) {
    const cfg = env();
    transporter = nodemailer.createTransport({
      host: cfg.SMTP_HOST,
      port: cfg.SMTP_PORT,
      secure: cfg.SMTP_SECURE,
      ...(cfg.SMTP_USER ? { auth: { user: cfg.SMTP_USER, pass: cfg.SMTP_PASSWORD ?? "" } } : {}),
    });
  }
  return transporter;
}

async function sendTemplate(to: string, subject: string, element: ReactElement): Promise<void> {
  const html = await render(element);
  const text = await render(element, { plainText: true });
  await getTransport().sendMail({ from: env().MAIL_FROM, to, subject, html, text });
  // Deliberately no logging of recipient, subject, body or URLs.
}

export async function sendVerificationMail(to: string, url: string): Promise<void> {
  await sendTemplate(to, "Potwierdź adres e-mail", VerifyEmail({ appName: env().APP_NAME, url }));
}

export async function sendResetPasswordMail(to: string, url: string): Promise<void> {
  await sendTemplate(to, "Ustaw nowe hasło", ResetPassword({ appName: env().APP_NAME, url }));
}

export async function closeMailTransport(): Promise<void> {
  transporter?.close();
  transporter = undefined;
}
