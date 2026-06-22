import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function normalizeWebsiteUrl() {
  return (process.env.WEBSITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function buildVerificationUrl(token: string, language?: string) {
  const websiteUrl = normalizeWebsiteUrl();
  const lang = (language || "en").toLowerCase();

  const localePrefix = lang === "en" ? "" : `/${lang}`;

  return `${websiteUrl}${localePrefix}/account/verify?token=${token}`;
}

export async function sendAccountVerificationEmail(params: {
  email: string;
  token: string;
  language?: string;
}) {
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Moorly <onboarding@resend.dev>";

  const verificationUrl = buildVerificationUrl(params.token, params.language);

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [params.email],
    subject: "Verify your Moorly account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <p style="font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #c2410c;">
          Moorly
        </p>

        <h1 style="color: #18181b; margin-top: 8px;">
          Verify your account
        </h1>

        <p style="color: #52525b; font-size: 15px; line-height: 24px;">
          Thank you for creating your Moorly account.
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