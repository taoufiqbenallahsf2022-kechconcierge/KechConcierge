import { Router, type Request, type Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import {
  RequestType,
} from "../../../../packages/database/generated/prisma/client";

import { prisma } from "../config/prisma";

const router = Router();

type CreateContactRequestBody = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  mobilePhone?: unknown;
  requestType?: unknown;
  subject?: unknown;
  comment?: unknown;
};

type AccessTokenPayload = JwtPayload & {
  id?: string;
  individualId?: string;
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

function optionalString(
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function isRequestType(
  value: unknown
): value is RequestType {
  return (
    typeof value === "string" &&
    Object.values(RequestType).includes(
      value as RequestType
    )
  );
}

function getBearerToken(
  authorizationHeader?: string
): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] =
    authorizationHeader.split(" ");

  if (
    scheme?.toLowerCase() !== "bearer" ||
    !token
  ) {
    return null;
  }

  return token.trim();
}

/**
 * Returns:
 *
 * - null when no token is provided;
 * - the connected Individual ID when the token is valid;
 * - throws when a token is provided but invalid.
 */
async function getIndividualIdFromRequest(
  req: Request
): Promise<string | null> {
  const token = getBearerToken(
    req.headers.authorization
  );

  /*
   * Public visitor:
   * no token means the contact request remains
   * unrelated to an Individual.
   */
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

  const decoded = jwt.verify(
    token,
    jwtSecret
  ) as AccessTokenPayload;

  /*
   * Supports the common payload formats:
   *
   * {
   *   individualId: "..."
   * }
   *
   * {
   *   id: "..."
   * }
   *
   * {
   *   sub: "..."
   * }
   */
  const individualId =
    typeof decoded.individualId === "string"
      ? decoded.individualId
      : typeof decoded.id === "string"
        ? decoded.id
        : typeof decoded.sub === "string"
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
        req.body as CreateContactRequestBody;

      const firstName = requiredString(
        body.firstName
      );

      const lastName = requiredString(
        body.lastName
      );

      const email = requiredString(
        body.email
      );

      const mobilePhone = optionalString(
        body.mobilePhone
      );

      const subject = optionalString(
        body.subject
      );

      const comment = requiredString(
        body.comment
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

      if (!isValidEmail(email)) {
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

      /*
       * Authenticated request:
       * Individual ID comes from the verified JWT.
       *
       * Public request:
       * individualId remains null.
       */
      const individualId =
        await getIndividualIdFromRequest(
          req
        );

      const auditUser =
        individualId ||
        "PUBLIC_CONTACT_FORM";

      const contactRequest =
        await prisma.contactRequest.create({
          data: {
            firstName,
            lastName,

            email:
              email.toLowerCase(),

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

      return res.status(201).json({
        code:
          "CONTACT_REQUEST_CREATED",

        message:
          "Contact request created successfully.",

        contactRequest,
      });
    } catch (error) {
      console.error(
        "Unable to create contact request:",
        error
      );

      if (
        error instanceof jwt.JsonWebTokenError
      ) {
        return res.status(401).json({
          code:
            "ERROR_INVALID_ACCESS_TOKEN",

          message:
            "The access token is invalid.",
        });
      }

      if (
        error instanceof jwt.TokenExpiredError
      ) {
        return res.status(401).json({
          code:
            "ERROR_ACCESS_TOKEN_EXPIRED",

          message:
            "The access token has expired.",
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