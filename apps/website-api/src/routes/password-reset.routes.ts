import {
  Router,
  type Request,
  type Response,
} from "express";

import crypto from "crypto";
import bcrypt from "bcrypt";

import { prisma } from "../config/prisma";

import {
  sendPasswordResetEmail,
} from "../services/email.service";

const router = Router();

type ForgotPasswordBody = {
  email?: unknown;
  language?: unknown;
};

type ResetPasswordBody = {
  token?: unknown;
  password?: unknown;
  passwordConfirmation?: unknown;
};

function requiredString(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleanedValue = value.trim();

  return cleanedValue.length > 0
    ? cleanedValue
    : null;
}

function normalizeLanguage(
  value: unknown
) {
  if (typeof value !== "string") {
    return "en";
  }

  const language =
    value.toLowerCase();

  if (
    language === "en" ||
    language === "fr" ||
    language === "es" ||
    language === "pt" ||
    language === "it" ||
    language === "de"
  ) {
    return language;
  }

  return "en";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function hashResetToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function createPasswordResetToken() {
  const token =
    crypto.randomBytes(32).toString("hex");

  return {
    plainToken: token,
    hashedToken:
      hashResetToken(token),
  };
}

/**
 * POST /api/auth/forgot-password
 */
router.post(
  "/forgot-password",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const body =
        req.body as ForgotPasswordBody;

      const email =
        requiredString(body.email);

      const language =
        normalizeLanguage(
          body.language
        );

      if (
        !email ||
        !isValidEmail(email)
      ) {
        return res.status(400).json({
          code: "ERROR_INVALID_EMAIL",
          message:
            "A valid email address is required.",
        });
      }

      const normalizedEmail =
        email.toLowerCase();

      const individual =
        await prisma.individual.findUnique({
          where: {
            email: normalizedEmail,
          },

          select: {
            id: true,
            email: true,
            authProvider: true,
            passwordHash: true,
          },
        });

      if (!individual) {
        return res.status(404).json({
          code:
            "ERROR_EMAIL_NOT_FOUND",

          message:
            "No account exists with this email address.",
        });
      }

      if (
        individual.authProvider !==
        "EMAIL"
      ) {
        return res.status(400).json({
          code:
            "ERROR_ACCOUNT_USES_EXTERNAL_PROVIDER",

          message:
            "This account does not use password authentication.",
        });
      }

      if (
        !individual.email ||
        !individual.passwordHash
      ) {
        return res.status(400).json({
          code:
            "ERROR_PASSWORD_RESET_NOT_AVAILABLE",

          message:
            "Password reset is not available for this account.",
        });
      }

      const {
        plainToken,
        hashedToken,
      } = createPasswordResetToken();

      const expirationDate =
        new Date(
          Date.now() +
            30 * 60 * 1000
        );

      await prisma.individual.update({
        where: {
          id: individual.id,
        },

        data: {
          passwordResetToken:
            hashedToken,

          passwordResetTokenExpiresAt:
            expirationDate,

          updatedBy:
            "PASSWORD_RESET_REQUEST",
        },
      });

      try {
        await sendPasswordResetEmail({
          email: individual.email,
          token: plainToken,
          language,
        });
      } catch (emailError) {
        await prisma.individual.update({
          where: {
            id: individual.id,
          },

          data: {
            passwordResetToken: null,

            passwordResetTokenExpiresAt:
              null,

            updatedBy:
              "PASSWORD_RESET_EMAIL_FAILED",
          },
        });

        throw emailError;
      }

      return res.status(200).json({
        code:
          "PASSWORD_RESET_EMAIL_SENT",

        message:
          "A password reset email has been sent.",
      });
    } catch (error) {
      console.error(
        "Unable to request password reset:",
        error
      );

      return res.status(500).json({
        code:
          "ERROR_PASSWORD_RESET_REQUEST_FAILED",

        message:
          "Unable to process the password reset request.",
      });
    }
  }
);

/**
 * POST /api/auth/reset-password
 */
router.post(
  "/reset-password",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const body =
        req.body as ResetPasswordBody;

      const token =
        requiredString(body.token);

      const password =
        requiredString(body.password);

      const passwordConfirmation =
        requiredString(
          body.passwordConfirmation
        );

      if (!token) {
        return res.status(400).json({
          code:
            "ERROR_RESET_TOKEN_REQUIRED",

          message:
            "Reset token is required.",
        });
      }

      if (!password) {
        return res.status(400).json({
          code:
            "ERROR_PASSWORD_REQUIRED",

          message:
            "Password is required.",
        });
      }

      if (
        password.length < 8
      ) {
        return res.status(400).json({
          code:
            "ERROR_PASSWORD_TOO_SHORT",

          message:
            "Password must contain at least 8 characters.",
        });
      }

      if (
        password !==
        passwordConfirmation
      ) {
        return res.status(400).json({
          code:
            "ERROR_PASSWORDS_DO_NOT_MATCH",

          message:
            "Passwords do not match.",
        });
      }

      const hashedToken =
        hashResetToken(token);

      const individual =
        await prisma.individual.findFirst({
          where: {
            passwordResetToken:
              hashedToken,

            passwordResetTokenExpiresAt: {
              gt: new Date(),
            },
          },

          select: {
            id: true,
          },
        });

      if (!individual) {
        return res.status(400).json({
          code:
            "ERROR_RESET_TOKEN_INVALID_OR_EXPIRED",

          message:
            "The reset link is invalid or has expired.",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );

      await prisma.individual.update({
        where: {
          id: individual.id,
        },

        data: {
          passwordHash,

          passwordResetToken: null,
          passwordResetTokenExpiresAt:
            null,

          updatedBy:
            "PASSWORD_RESET",
        },
      });

      return res.status(200).json({
        code:
          "PASSWORD_RESET_SUCCESS",

        message:
          "Password updated successfully.",
      });
    } catch (error) {
      console.error(
        "Unable to reset password:",
        error
      );

      return res.status(500).json({
        code:
          "ERROR_PASSWORD_RESET_FAILED",

        message:
          "Unable to reset the password.",
      });
    }
  }
);

export default router;