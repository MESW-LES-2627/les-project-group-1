import { Resend } from "resend";

/**
 * Resend Email Service 
 * 
 * Initializes the Resend API client and provides a funciton to send emails using the Resend servide.
 */

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    html,
  });
  if (error) throw new Error(error.message);
}