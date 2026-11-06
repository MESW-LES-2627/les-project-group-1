import { Resend } from "resend";
import { env } from "../config/env";

const resend = new Resend(env.resendApiKey);

export async function sendEmail(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send({ from: env.emailFrom, to, subject, html });
  if (error) throw new Error(error.message);
}
