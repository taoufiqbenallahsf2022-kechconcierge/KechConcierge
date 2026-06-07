import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAccountVerificationEmail(params: {
  email: string;
  token: string;
}) {
  const websiteUrl = process.env.WEBSITE_URL || "http://localhost:3000";
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Kech Concierge <onboarding@resend.dev>";

  const verificationUrl = `${websiteUrl}/verify-email?token=${params.token}`;

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [params.email],
    subject: "Verify your Kech Concierge account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <p style="font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #c2410c;">
          Kech Concierge
        </p>

        <h1 style="color: #18181b; margin-top: 8px;">
          Verify your account
        </h1>

        <p style="color: #52525b; font-size: 15px; line-height: 24px;">
          Thank you for creating your Kech Concierge account.
        </p>

        <p style="color: #52525b; font-size: 15px; line-height: 24px;">
          Please click the button below to verify your email address and activate your account.
        </p>

        <a href="${verificationUrl}"
           style="display: inline-block; margin-top: 16px; padding: 14px 22px; background: #ea580c; color: white; text-decoration: none; border-radius: 14px; font-weight: bold;">
          Verify account
        </a>

        <p style="color: #71717a; font-size: 13px; line-height: 22px; margin-top: 24px;">
          If the button does not work, copy and paste this link into your browser:
        </p>

        <p style="word-break: break-all; color: #ea580c; font-size: 13px;">
          ${verificationUrl}
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}