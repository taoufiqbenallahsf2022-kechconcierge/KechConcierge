import { Resend } from "resend";

import {
  getVerificationEmailTranslation,
} from "../i18n/verification-email-translations";

import {
  getPasswordResetEmailTranslation,
} from "../i18n/password-reset-email-translations";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

function normalizeWebsiteUrl() {
  return (
    process.env.WEBSITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function normalizeLanguage(
  language?: string
) {
  const value = (
    language || "en"
  ).toLowerCase();

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

function buildVerificationUrl(
  token: string,
  language?: string
) {
  const websiteUrl =
    normalizeWebsiteUrl();

  const lang =
    normalizeLanguage(language);

  const localePrefix =
    lang === "en"
      ? ""
      : `/${lang}`;

  return `${websiteUrl}${localePrefix}/account/verify?token=${encodeURIComponent(
    token
  )}`;
}

function buildPasswordResetUrl(
  token: string,
  language?: string
) {
  const websiteUrl =
    normalizeWebsiteUrl();

  const lang =
    normalizeLanguage(language);

  const localePrefix =
    lang === "en"
      ? ""
      : `/${lang}`;

  return `${websiteUrl}${localePrefix}/reset-password?token=${encodeURIComponent(
    token
  )}`;
}

function getFromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    "Moorish Concierge <onboarding@resend.dev>"
  );
}

export async function sendAccountVerificationEmail(
  params: {
    email: string;
    token: string;
    language?: string;
  }
) {
  const t =
    getVerificationEmailTranslation(
      params.language
    );

  const verificationUrl =
    buildVerificationUrl(
      params.token,
      params.language
    );

  const { data, error } =
    await resend.emails.send({
      from: getFromEmail(),
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

export async function sendPasswordResetEmail(
  params: {
    email: string;
    token: string;
    language?: string;
  }
) {
  const t =
    getPasswordResetEmailTranslation(
      params.language
    );

  const resetUrl =
    buildPasswordResetUrl(
      params.token,
      params.language
    );

  const { data, error } =
    await resend.emails.send({
      from: getFromEmail(),
      to: [params.email],
      subject: t.subject,

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