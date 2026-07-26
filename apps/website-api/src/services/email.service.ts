import { Resend } from "resend";

import { getVerificationEmailTranslation } from "../i18n/verification-email-translations";

import { getPasswordResetEmailTranslation } from "../i18n/password-reset-email-translations";
import { getContactRequestEmailTranslation } from "../i18n/contact-request-email-translations";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_LOGO_HTML = `
  <div style="text-align: center; margin: 0 auto 28px;">
    <img
      src="https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/06b8c914-294e-4155-bb81-627ccaf3fa00/public"
      alt="Moorish Concierge"
      width="80"
      style="display: inline-block; width: 80px; max-width: 55%; height: auto; border: 0;"
    />
  </div>
`;

function normalizeWebsiteUrl() {
  return (process.env.WEBSITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function normalizeLanguage(language?: string) {
  const value = (language || "en").trim().toLowerCase();

  if (
    value === "fr" ||
    value === "es" ||
    value === "pt" ||
    value === "it" ||
    value === "de"
  ) {
    return value;
  }

  return "en";
}

function buildVerificationUrl(token: string, language?: string) {
  const websiteUrl = normalizeWebsiteUrl();

  const lang = normalizeLanguage(language);

  const localePrefix = lang === "en" ? "" : `/${lang}`;

  return `${websiteUrl}${localePrefix}/account/verify?token=${encodeURIComponent(
    token,
  )}`;
}

function buildPasswordResetUrl(token: string, language?: string) {
  const websiteUrl = normalizeWebsiteUrl();

  const lang = normalizeLanguage(language);

  const localePrefix = lang === "en" ? "" : `/${lang}`;

  return `${websiteUrl}${localePrefix}/reset-password?token=${encodeURIComponent(
    token,
  )}`;
}

function getFromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL || "Moorish Concierge <onboarding@resend.dev>"
  );
}

function getContactEmail() {
  return process.env.CONTACT_EMAIL || "contact@moorishconcierge.com";
}

function escapeHtml(value?: string | null) {
  if (!value) {
    return "";
  }

  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMultilineText(value?: string | null) {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

export async function sendAccountVerificationEmail(params: {
  email: string;
  token: string;
  language?: string;
}) {
  const t = getVerificationEmailTranslation(params.language);

  const verificationUrl = buildVerificationUrl(params.token, params.language);

  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: [params.email],
    subject: t.verifySubject,

    html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          ${EMAIL_LOGO_HTML}
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

          <a
            href="${verificationUrl}"
            style="display: inline-block; margin-top: 16px; padding: 14px 22px; background: #ea580c; color: white; text-decoration: none; border-radius: 14px; font-weight: bold;"
          >
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

export async function sendPasswordResetEmail(params: {
  email: string;
  token: string;
  language?: string;
}) {
  const t = getPasswordResetEmailTranslation(params.language);

  const resetUrl = buildPasswordResetUrl(params.token, params.language);

  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: [params.email],
    subject: t.subject,

    html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          ${EMAIL_LOGO_HTML}
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

          <a
            href="${resetUrl}"
            style="display: inline-block; margin-top: 16px; padding: 14px 22px; background: #ea580c; color: white; text-decoration: none; border-radius: 14px; font-weight: bold;"
          >
            ${t.button}
          </a>

          <p style="color: #71717a; font-size: 13px; line-height: 22px; margin-top: 24px;">
            ${t.expiry}
          </p>

          <p style="color: #71717a; font-size: 13px; line-height: 22px;">
            ${t.fallback}
          </p>

          <p style="word-break: break-all; color: #ea580c; font-size: 13px;">
            ${resetUrl}
          </p>

          <p style="color: #71717a; font-size: 13px; line-height: 22px; margin-top: 24px;">
            ${t.ignore}
          </p>
        </div>
      `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function sendContactRequestConfirmationEmail(params: {
  email: string;
  firstName: string;
  requestId: string;
  requestType: string;
  subject?: string | null;
  comment: string;
  language?: string;
}) {
  const t = getContactRequestEmailTranslation(params.language);

  const contactEmail = getContactEmail();

  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: [params.email],
    replyTo: contactEmail,
    subject: t.subject,

    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          ${EMAIL_LOGO_HTML}
          <p style="font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #c2410c;">
            ${t.eyebrow}
          </p>

          <h1 style="color: #18181b; margin: 8px 0 0;">
            ${t.title}
          </h1>

          <p style="color: #52525b; font-size: 15px; line-height: 24px; margin-top: 24px;">
            ${t.greeting} ${escapeHtml(params.firstName)},
          </p>

          <p style="color: #52525b; font-size: 15px; line-height: 24px;">
            ${t.line1}
          </p>

          <p style="color: #52525b; font-size: 15px; line-height: 24px;">
            ${t.line2}
          </p>

          <div style="margin-top: 24px; border: 1px solid #fed7aa; border-radius: 18px; background: #fff7ed; padding: 20px;">
            <p style="margin: 0 0 16px; color: #9a3412; font-size: 16px; font-weight: bold;">
              ${t.summaryTitle}
            </p>

            <p style="margin: 8px 0; color: #52525b; font-size: 14px; line-height: 22px;">
              <strong>${t.requestType}:</strong>
              ${escapeHtml(params.requestType)}
            </p>

            ${
              params.subject
                ? `
                  <p style="margin: 8px 0; color: #52525b; font-size: 14px; line-height: 22px;">
                    <strong>${t.subjectLabel}:</strong>
                    ${escapeHtml(params.subject)}
                  </p>
                `
                : ""
            }

            <p style="margin: 8px 0; color: #52525b; font-size: 14px; line-height: 22px;">
              <strong>${t.messageLabel}:</strong><br />
              ${formatMultilineText(params.comment)}
            </p>

            <p style="margin: 14px 0 0; color: #71717a; font-size: 12px; line-height: 20px;">
              <strong>${t.referenceLabel}:</strong>
              ${escapeHtml(params.requestId)}
            </p>
          </div>

          <p style="margin-top: 28px; color: #71717a; font-size: 13px; line-height: 22px;">
            ${t.footer}
          </p>
        </div>
      `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function sendContactRequestInternalEmail(params: {
  requestId: string;
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone?: string | null;
  requestType: string;
  subject?: string | null;
  comment: string;
  individualId?: string | null;
  language?: string;
  createdDate: Date;
}) {
  const contactEmail = getContactEmail();

  const fullName = `${params.firstName} ${params.lastName}`.trim();

  const internalSubject = `New contact request from ${fullName}`;

  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: [contactEmail],
    replyTo: params.email,
    subject: internalSubject,

    html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
          ${EMAIL_LOGO_HTML}
          <p style="font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #c2410c;">
            New contact request
          </p>

          <h1 style="color: #18181b; margin: 8px 0 0;">
            ${escapeHtml(fullName)} is reaching out to you
          </h1>

          <p style="color: #52525b; font-size: 15px; line-height: 24px; margin-top: 20px;">
            A new request has been submitted through the Moorish Concierge contact form.
          </p>

          <div style="margin-top: 24px; border: 1px solid #e4e4e7; border-radius: 18px; background: #fafafa; padding: 20px;">
            <p style="margin: 8px 0; color: #3f3f46; font-size: 14px; line-height: 22px;">
              <strong>Name:</strong>
              ${escapeHtml(fullName)}
            </p>

            <p style="margin: 8px 0; color: #3f3f46; font-size: 14px; line-height: 22px;">
              <strong>Email:</strong>
              <a
                href="mailto:${escapeHtml(params.email)}"
                style="color: #ea580c;"
              >
                ${escapeHtml(params.email)}
              </a>
            </p>

            ${
              params.mobilePhone
                ? `
                  <p style="margin: 8px 0; color: #3f3f46; font-size: 14px; line-height: 22px;">
                    <strong>Phone:</strong>
                    ${escapeHtml(params.mobilePhone)}
                  </p>
                `
                : ""
            }

            <p style="margin: 8px 0; color: #3f3f46; font-size: 14px; line-height: 22px;">
              <strong>Request type:</strong>
              ${escapeHtml(params.requestType)}
            </p>

            ${
              params.subject
                ? `
                  <p style="margin: 8px 0; color: #3f3f46; font-size: 14px; line-height: 22px;">
                    <strong>Subject:</strong>
                    ${escapeHtml(params.subject)}
                  </p>
                `
                : ""
            }

            <p style="margin: 16px 0 0; color: #3f3f46; font-size: 14px; line-height: 22px;">
              <strong>Message:</strong><br />
              ${formatMultilineText(params.comment)}
            </p>
          </div>

          <div style="margin-top: 20px; border-top: 1px solid #e4e4e7; padding-top: 16px;">
            <p style="margin: 5px 0; color: #71717a; font-size: 12px; line-height: 20px;">
              <strong>Request ID:</strong>
              ${escapeHtml(params.requestId)}
            </p>

            <p style="margin: 5px 0; color: #71717a; font-size: 12px; line-height: 20px;">
              <strong>Individual ID:</strong>
              ${escapeHtml(params.individualId || "Public visitor")}
            </p>

            <p style="margin: 5px 0; color: #71717a; font-size: 12px; line-height: 20px;">
              <strong>Language:</strong>
              ${escapeHtml(params.language || "en")}
            </p>

            <p style="margin: 5px 0; color: #71717a; font-size: 12px; line-height: 20px;">
              <strong>Submitted at:</strong>
              ${escapeHtml(params.createdDate.toISOString())}
            </p>
          </div>
        </div>
      `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
