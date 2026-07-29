import {
  Router,
  type Request,
  type Response,
} from "express";

import jwt, {
  type JwtPayload,
} from "jsonwebtoken";

import {
  ChannelStatus,
  ConsentChannel,
} from "../../../../packages/database/generated/prisma/client";

import { prisma } from "../config/prisma";

const router = Router();

type AccessTokenPayload = JwtPayload & {
  id?: string;
  individualId?: string;
};

type UpdateProfileBody = {
  firstName?: unknown;
  lastName?: unknown;
  country?: unknown;
  language?: unknown;
};

type UpdateConsentsBody = {
  consents?: unknown;
};

type ConsentInput = {
  channel: ConsentChannel;
  channelStatus: ChannelStatus;
};

const CONSENT_CHANNELS: ConsentChannel[] = [
  ConsentChannel.EMAIL,
  ConsentChannel.SMS,
  ConsentChannel.WHATSAPP,
  ConsentChannel.PHONE,
];

const SUPPORTED_LANGUAGES = [
  "en",
  "fr",
  "es",
  "pt",
  "it",
  "de",
] as const;

type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[number];

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

function getIndividualIdFromRequest(
  req: Request
): string {
  const token = getBearerToken(
    req.headers.authorization
  );

  if (!token) {
    throw new Error(
      "ERROR_ACCESS_TOKEN_REQUIRED"
    );
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

  return individualId;
}

function isSupportedLanguage(
  value: unknown
): value is SupportedLanguage {
  return (
    typeof value === "string" &&
    SUPPORTED_LANGUAGES.includes(
      value.toLowerCase() as SupportedLanguage
    )
  );
}

function isConsentChannel(
  value: unknown
): value is ConsentChannel {
  return (
    typeof value === "string" &&
    CONSENT_CHANNELS.includes(
      value as ConsentChannel
    )
  );
}

function isChannelStatus(
  value: unknown
): value is ChannelStatus {
  return (
    value === ChannelStatus.OPTIN ||
    value === ChannelStatus.OPTOUT ||
    value === ChannelStatus.UNKNOWN
  );
}

function parseConsents(
  value: unknown
): ConsentInput[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsedConsents: ConsentInput[] = [];

  for (const rawConsent of value) {
    if (
      typeof rawConsent !== "object" ||
      rawConsent === null
    ) {
      return null;
    }

    const candidate = rawConsent as {
      channel?: unknown;
      channelStatus?: unknown;
    };

    if (
      !isConsentChannel(candidate.channel) ||
      !isChannelStatus(
        candidate.channelStatus
      )
    ) {
      return null;
    }

    parsedConsents.push({
      channel: candidate.channel,
      channelStatus:
        candidate.channelStatus,
    });
  }

  const uniqueChannels =
    new Set(
      parsedConsents.map(
        (consent) => consent.channel
      )
    );

  if (
    uniqueChannels.size !==
    parsedConsents.length
  ) {
    return null;
  }

  return parsedConsents;
}

async function individualExists(
  individualId: string
) {
  const individual =
    await prisma.individual.findUnique({
      where: {
        id: individualId,
      },

      select: {
        id: true,
      },
    });

  return Boolean(individual);
}

function handleRouteError(
  error: unknown,
  res: Response
) {
  console.error(
    "Account route error:",
    error
  );

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
    error instanceof Error &&
    error.message ===
      "ERROR_ACCESS_TOKEN_REQUIRED"
  ) {
    return res.status(401).json({
      code:
        "ERROR_ACCESS_TOKEN_REQUIRED",

      message:
        "Authentication is required.",
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
      "ERROR_ACCOUNT_REQUEST_FAILED",

    message:
      "Unable to process the account request.",
  });
}

/**
 * GET /api/account/me
 */
router.get(
  "/me",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const individualId =
        getIndividualIdFromRequest(req);

      const individual =
        await prisma.individual.findUnique({
          where: {
            id: individualId,
          },

          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobilePhone: true,
            country: true,
            language: true,
            authProvider: true,
            isActive: true,
            emailVerified: true,
          },
        });

      if (!individual) {
        return res.status(404).json({
          code:
            "ERROR_INDIVIDUAL_NOT_FOUND",

          message:
            "The connected Individual could not be found.",
        });
      }

      return res.status(200).json({
        code:
          "ACCOUNT_PROFILE_RETRIEVED",

        profile: individual,
      });
    } catch (error) {
      return handleRouteError(
        error,
        res
      );
    }
  }
);

/**
 * PATCH /api/account/me
 *
 * Editable:
 * - firstName
 * - lastName
 * - country
 * - language
 *
 * Read-only:
 * - email
 * - mobilePhone
 */
router.patch(
  "/me",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const individualId =
        getIndividualIdFromRequest(req);

      const body =
        req.body as UpdateProfileBody;

      const firstName =
        requiredString(
          body.firstName
        );

      const lastName =
        requiredString(
          body.lastName
        );

      const country =
        optionalString(
          body.country
        );

      const languageValue =
        requiredString(
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

      if (
        !languageValue ||
        !isSupportedLanguage(
          languageValue
        )
      ) {
        return res.status(400).json({
          code:
            "ERROR_LANGUAGE_INVALID",

          message:
            "The selected language is invalid.",
        });
      }

      if (
        !(await individualExists(
          individualId
        ))
      ) {
        return res.status(404).json({
          code:
            "ERROR_INDIVIDUAL_NOT_FOUND",

          message:
            "The connected Individual could not be found.",
        });
      }

      const profile =
        await prisma.individual.update({
          where: {
            id: individualId,
          },

          data: {
            firstName,
            lastName,
            country,

            language:
              languageValue.toLowerCase(),

            updatedBy:
              individualId,
          },

          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobilePhone: true,
            country: true,
            language: true,
            authProvider: true,
            isActive: true,
            emailVerified: true,
          },
        });

      return res.status(200).json({
        code:
          "ACCOUNT_PROFILE_UPDATED",

        message:
          "Profile updated successfully.",

        profile,
      });
    } catch (error) {
      return handleRouteError(
        error,
        res
      );
    }
  }
);

/**
 * GET /api/account/consents
 */
router.get(
  "/consents",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const individualId =
        getIndividualIdFromRequest(req);

      if (
        !(await individualExists(
          individualId
        ))
      ) {
        return res.status(404).json({
          code:
            "ERROR_INDIVIDUAL_NOT_FOUND",

          message:
            "The connected Individual could not be found.",
        });
      }

      const storedConsents =
        await prisma.consent.findMany({
          where: {
            individualId,
          },

          select: {
            channel: true,
            channelStatus: true,
          },
        });

      const storedConsentMap =
        new Map<
          ConsentChannel,
          ChannelStatus
        >(
          storedConsents.map(
            (consent) => [
              consent.channel,
              consent.channelStatus,
            ]
          )
        );

      const consents =
        CONSENT_CHANNELS.map(
          (channel) => ({
            channel,

            channelStatus:
              storedConsentMap.get(
                channel
              ) ??
              ChannelStatus.UNKNOWN,
          })
        );

      return res.status(200).json({
        code:
          "ACCOUNT_CONSENTS_RETRIEVED",

        consents,
      });
    } catch (error) {
      return handleRouteError(
        error,
        res
      );
    }
  }
);

/**
 * PATCH /api/account/consents
 */
router.patch(
  "/consents",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const individualId =
        getIndividualIdFromRequest(req);

      const body =
        req.body as UpdateConsentsBody;

      const consents =
        parseConsents(
          body.consents
        );

      if (!consents) {
        return res.status(400).json({
          code:
            "ERROR_INVALID_CONSENTS",

          message:
            "The consent payload is invalid.",
        });
      }

      const receivedChannels =
        new Set<ConsentChannel>(
          consents.map(
            (consent) =>
              consent.channel
          )
        );

      const allChannelsProvided =
        CONSENT_CHANNELS.every(
          (channel) =>
            receivedChannels.has(
              channel
            )
        );

      if (!allChannelsProvided) {
        return res.status(400).json({
          code:
            "ERROR_MISSING_CONSENT_CHANNEL",

          message:
            "All consent channels must be provided.",
        });
      }

      if (
        !(await individualExists(
          individualId
        ))
      ) {
        return res.status(404).json({
          code:
            "ERROR_INDIVIDUAL_NOT_FOUND",

          message:
            "The connected Individual could not be found.",
        });
      }

      await prisma.$transaction(
        async (tx) => {
          for (
            const consent of consents
          ) {
            const existingConsent =
              await tx.consent.findFirst({
                where: {
                  individualId,
                  channel:
                    consent.channel,
                },

                select: {
                  id: true,
                },
              });

            if (existingConsent) {
              await tx.consent.update({
                where: {
                  id:
                    existingConsent.id,
                },

                data: {
                  channelStatus:
                    consent.channelStatus,

                  updatedBy:
                    individualId,
                },
              });
            } else {
              await tx.consent.create({
                data: {
                  individualId,

                  channel:
                    consent.channel,

                  channelStatus:
                    consent.channelStatus,

                  createdBy:
                    individualId,

                  updatedBy:
                    individualId,
                },
              });
            }
          }
        }
      );

      const updatedConsents =
        await prisma.consent.findMany({
          where: {
            individualId,
          },

          select: {
            channel: true,
            channelStatus: true,
          },
        });

      const updatedConsentMap =
        new Map<
          ConsentChannel,
          ChannelStatus
        >(
          updatedConsents.map(
            (consent) => [
              consent.channel,
              consent.channelStatus,
            ]
          )
        );

      const completeConsents =
        CONSENT_CHANNELS.map(
          (channel) => ({
            channel,

            channelStatus:
              updatedConsentMap.get(
                channel
              ) ??
              ChannelStatus.UNKNOWN,
          })
        );

      return res.status(200).json({
        code:
          "ACCOUNT_CONSENTS_UPDATED",

        message:
          "Communication preferences updated successfully.",

        consents:
          completeConsents,
      });
    } catch (error) {
      return handleRouteError(
        error,
        res
      );
    }
  }
);

export default router;