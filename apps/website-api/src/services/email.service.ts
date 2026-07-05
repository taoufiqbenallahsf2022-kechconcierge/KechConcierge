import { Resend } from "resend";
import { getVerificationEmailTranslation } from "../i18n/verification-email-translations";

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

  const t = getVerificationEmailTranslation(params.language);
  const verificationUrl = buildVerificationUrl(params.token, params.language);

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [params.email],
    subject: t.verifySubject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <p style="font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #c2410c;">
          ${t.eyebrow}
        </p>

        <h1 style="color: #18181b; margin-top: 8px;">
          ${t.title}
        </h1>

        <p style="color: #52525b; font-size: 15px; line-height: 24px;">
          ${t.line1}
        </p>

        <p style="color: #52525b; font-size: 15px; line-height: 24px;">
          ${t.line2}
        </p>

        <a href="${verificationUrl}"
           style="display: inline-block; margin-top: 16px; padding: 14px 22px; background: #ea580c; color: white; text-decoration: none; border-radius: 14px; font-weight: bold;">
          ${t.button}
        </a>

        <p style="color: #71717a; font-size: 13px; line-height: 22px; margin-top: 24px;">
          ${t.fallback}
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