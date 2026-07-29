import {
  Router,
  type Request,
  type Response,
} from "express";

import jwt, {
  type JwtPayload,
} from "jsonwebtoken";

import {
  RequestType,
} from "../../../../packages/database/generated/prisma/client";

import {
  prisma,
} from "../config/prisma";

import {
  sendContactRequestConfirmationEmail,
  sendContactRequestInternalEmail,
} from "../services/email.service";

const router = Router();

type CreateContactRequestBody = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  mobilePhone?: unknown;
  requestType?: unknown;
  subject?: unknown;
  comment?: unknown;

  /*
   * This must contain the language of
   * the contact-form page currently shown.
   */
  language?: unknown;
};

type AccessTokenPayload =
  JwtPayload & {
    id?: string;
    individualId?: string;
  };

function requiredString(
  value: unknown
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const cleanedValue =
    value.trim();

  return cleanedValue.length > 0
    ? cleanedValue
    : null;
}

function optionalString(
  value: unknown
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const cleanedValue =
    value.trim();

  return cleanedValue.length > 0
    ? cleanedValue
    : null;
}

function normalizeLanguage(
  value: unknown
) {
  if (
    typeof value !== "string"
  ) {
    return "en";
  }

  const language =
    value
      .trim()
      .toLowerCase();

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

function isValidEmail(
  email: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function isRequestType(
  value: unknown
): value is RequestType {
  return (
    typeof value === "string" &&
    Object.values(
      RequestType
    ).includes(
      value as RequestType
    )
  );
}

function getBearerToken(
  authorizationHeader?: string
): string | null {
  if (
    !authorizationHeader
  ) {
    return null;
  }

  const [scheme, token] =
    authorizationHeader.split(
      " "
    );

  if (
    scheme?.toLowerCase() !==
      "bearer" ||
    !token
  ) {
    return null;
  }

  return token.trim();
}

async function getIndividualIdFromRequest(
  req: Request
): Promise<string | null> {
  const token =
    getBearerToken(
      req.headers.authorization
    );

  if (!token) {
    return null;
  }

  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "ERROR_JWT_SECRET_MISSING"
    );
  }

  const decoded =
    jwt.verify(
      token,
      jwtSecret
    ) as AccessTokenPayload;

  const individualId =
    typeof decoded.individualId ===
      "string"
      ? decoded.individualId
      : typeof decoded.id ===
          "string"
        ? decoded.id
        : typeof decoded.sub ===
            "string"
          ? decoded.sub
          : null;

  if (!individualId) {
    throw new Error(
      "ERROR_INDIVIDUAL_ID_MISSING_FROM_TOKEN"
    );
  }

  const individual =
    await prisma.individual.findUnique({
      where: {
        id: individualId,
      },

      select: {
        id: true,
      },
    });

  if (!individual) {
    throw new Error(
      "ERROR_INDIVIDUAL_NOT_FOUND"
    );
  }

  return individual.id;
}

router.post(
  "/",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const body =
        req.body as
          CreateContactRequestBody;

      const firstName =
        requiredString(
          body.firstName
        );

      const lastName =
        requiredString(
          body.lastName
        );

      const email =
        requiredString(
          body.email
        );

      const mobilePhone =
        optionalString(
          body.mobilePhone
        );

      const subject =
        optionalString(
          body.subject
        );

      const comment =
        requiredString(
          body.comment
        );

      /*
       * Always use the language of the page
       * where the form was submitted.
       *
       * Do not replace this value with the
       * Individual preferred language.
       */
      const language =
        normalizeLanguage(
          body.language
        );

      if (!firstName) {
        return res.status(400).json({
          code:
            "ERROR_FIRST_NAME_REQUIRED",

          message:
            "First name is required.",
        });
      }

      if (!lastName) {
        return res.status(400).json({
          code:
            "ERROR_LAST_NAME_REQUIRED",

          message:
            "Last name is required.",
        });
      }

      if (!email) {
        return res.status(400).json({
          code:
            "ERROR_EMAIL_REQUIRED",

          message:
            "Email is required.",
        });
      }

      if (
        !isValidEmail(email)
      ) {
        return res.status(400).json({
          code:
            "ERROR_INVALID_EMAIL",

          message:
            "Email address is invalid.",
        });
      }

      if (
        !isRequestType(
          body.requestType
        )
      ) {
        return res.status(400).json({
          code:
            "ERROR_REQUEST_TYPE_INVALID",

          message:
            "Request type is invalid.",
        });
      }

      if (!comment) {
        return res.status(400).json({
          code:
            "ERROR_COMMENT_REQUIRED",

          message:
            "Comment is required.",
        });
      }

      const individualId =
        await getIndividualIdFromRequest(
          req
        );

      const auditUser =
        individualId ||
        "PUBLIC_CONTACT_FORM";

      const normalizedEmail =
        email.toLowerCase();

      const contactRequest =
        await prisma.contactRequest.create({
          data: {
            firstName,
            lastName,

            email:
              normalizedEmail,

            mobilePhone,

            requestType:
              body.requestType,

            subject,

            comment,

            individualId,

            createdBy:
              auditUser,

            updatedBy:
              auditUser,
          },

          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobilePhone: true,
            requestType: true,
            subject: true,
            comment: true,
            individualId: true,
            createdDate: true,
          },
        });

      const emailResults =
        await Promise.allSettled([
          sendContactRequestConfirmationEmail({
            email:
              contactRequest.email,

            firstName:
              contactRequest.firstName,

            requestId:
              contactRequest.id,

            requestType:
              contactRequest.requestType,

            subject:
              contactRequest.subject,

            comment:
              contactRequest.comment,

            /*
             * Confirmation email uses the
             * contact-form page language.
             */
            language,
          }),

          sendContactRequestInternalEmail({
            requestId:
              contactRequest.id,

            firstName:
              contactRequest.firstName,

            lastName:
              contactRequest.lastName,

            email:
              contactRequest.email,

            mobilePhone:
              contactRequest.mobilePhone,

            requestType:
              contactRequest.requestType,

            subject:
              contactRequest.subject,

            comment:
              contactRequest.comment,

            individualId:
              contactRequest.individualId,

            language,

            createdDate:
              contactRequest.createdDate,
          }),
        ]);

      const [
        clientEmailResult,
        internalEmailResult,
      ] = emailResults;

      if (
        clientEmailResult.status ===
        "rejected"
      ) {
        console.error(
          "Unable to send contact confirmation email:",
          clientEmailResult.reason
        );
      }

      if (
        internalEmailResult.status ===
        "rejected"
      ) {
        console.error(
          "Unable to send internal contact notification:",
          internalEmailResult.reason
        );
      }

      const allEmailsSent =
        clientEmailResult.status ===
          "fulfilled" &&
        internalEmailResult.status ===
          "fulfilled";

      return res.status(201).json({
        code:
          allEmailsSent
            ? "CONTACT_REQUEST_CREATED"
            : "CONTACT_REQUEST_CREATED_EMAIL_WARNING",

        message:
          allEmailsSent
            ? "Contact request created successfully."
            : "Contact request created successfully, but one or more email notifications could not be sent.",

        emailNotifications: {
          client:
            clientEmailResult.status ===
            "fulfilled",

          internal:
            internalEmailResult.status ===
            "fulfilled",
        },

        contactRequest,
      });
    } catch (error) {
      console.error(
        "Unable to create contact request:",
        error
      );

      if (
        error instanceof
          jwt.TokenExpiredError
      ) {
        return res.status(401).json({
          code:
            "ERROR_ACCESS_TOKEN_EXPIRED",

          message:
            "The access token has expired.",
        });
      }

      if (
        error instanceof
          jwt.JsonWebTokenError
      ) {
        return res.status(401).json({
          code:
            "ERROR_INVALID_ACCESS_TOKEN",

          message:
            "The access token is invalid.",
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "ERROR_INDIVIDUAL_ID_MISSING_FROM_TOKEN"
      ) {
        return res.status(401).json({
          code:
            "ERROR_INDIVIDUAL_ID_MISSING_FROM_TOKEN",

          message:
            "The access token does not contain an Individual ID.",
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "ERROR_INDIVIDUAL_NOT_FOUND"
      ) {
        return res.status(401).json({
          code:
            "ERROR_INDIVIDUAL_NOT_FOUND",

          message:
            "The connected Individual could not be found.",
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "ERROR_JWT_SECRET_MISSING"
      ) {
        return res.status(500).json({
          code:
            "ERROR_JWT_CONFIGURATION",

          message:
            "JWT configuration is missing.",
        });
      }

      return res.status(500).json({
        code:
          "ERROR_CONTACT_REQUEST_FAILED",

        message:
          "Unable to create contact request.",
      });
    }
  }
);

export default router;