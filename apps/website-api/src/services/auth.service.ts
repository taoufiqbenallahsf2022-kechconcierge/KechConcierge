import crypto, { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config/prisma";
import { sendAccountVerificationEmail } from "./email.service";
import { generateIndividualId, generateLeadId } from "../utils/id-generator";
import { generateAccessToken } from "../utils/jwt";
import {
  ConsentChannel,
  ChannelStatus,
} from "../../../../packages/database/generated/prisma/client";

type SignupInput = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode?: string;
  mobilePhone?: string;
  country?: string;
  password: string;
  language?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(countryCode?: string, mobilePhone?: string) {
  const cleanCountryCode = countryCode?.trim() || "";
  const cleanMobilePhone = mobilePhone?.trim() || "";

  if (!cleanMobilePhone) return null;

  return `${cleanCountryCode}${cleanMobilePhone}`;
}

function normalizeCountry(country?: string) {
  const value = country?.trim().toUpperCase() || null;
  return value && /^[A-Z]{3}$/.test(value) ? value : null;
}

function getIndividualStage(individual: any) {

  const individualAccount = individual.accounts?.[0];

  if (individualAccount) {
    return {
      stage: "ACCOUNT",
      stageId: individualAccount.id
    };
  }

  const individualProspect = individual.prospects?.[0];
  if (individualProspect) {
    return {
      stage: "PROSPECT",
      stageId: individualProspect.id
    };
  }

  const individualLead = individual.leads?.[0];
  
  if (individualLead) {
    return {
      stage: "LEAD",
      stageId: individualLead.id,
    };
  }

  return {
    stage: "INDIVIDUAL",
    stageId: individual.id
  };
}

function mapAuthIndividual(individual: any) {
  const stage = getIndividualStage(individual);

  return {
    id: individual.id,
    firstName: individual.firstName,
    lastName: individual.lastName,
    email: individual.email,
    language: individual.language,
    country: individual.country,
    isActive: individual.isActive,
    emailVerified: individual.emailVerified,
    lastSuccessfulLoginDate: individual.lastSuccessfulLoginDate,
    stage: stage.stage,
    stageId: stage.stageId
  };
}

export async function checkEmailAvailability(email: string) {
  const normalizedEmail = normalizeEmail(email);

  const individual = await prisma.individual.findFirst({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      isActive: true,
      emailVerified: true,
    },
  });

  return {
    email: normalizedEmail,
    available: !individual,
  };
}

export async function signupIndividual(input: SignupInput) {
  const email = normalizeEmail(input.email);

  const existingIndividual = await prisma.individual.findFirst({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (existingIndividual) {
    return {
      success: false,
      statusCode: 409,
      code: "ERROR_EMAIL_ALREADY_USED",
    };
  }

  const manuallyCreatedIndividual = await prisma.individual.findUnique({
    where: { manualEmail: email },
    select: { id: true },
  });

  const token = crypto.randomBytes(32).toString("hex");

  const tokenExpiresAt = new Date();
  tokenExpiresAt.setMinutes(
    tokenExpiresAt.getMinutes() + 30
  );

  const passwordHash = await bcrypt.hash(
    input.password,
    10
  );

  const fullPhoneNumber = normalizePhone(
    input.countryCode,
    input.mobilePhone
  );

  const result = await prisma.$transaction(async (tx) => {
    const signupData = {
        id: generateIndividualId(),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        mobilePhone: fullPhoneNumber,
        passwordHash,

        authProvider: "EMAIL",

        country: normalizeCountry(input.country),
        language: input.language?.trim().toLowerCase() || "en",
        source: "WEBSITE_SIGNUP",

        isActive: false,
        emailVerified: false,

        emailVerificationToken: token,
        emailVerificationTokenExpiresAt:
          tokenExpiresAt,

        createdBy: "SYSTEM",
        updatedBy: "SYSTEM",
    };
    const individual = manuallyCreatedIndividual
      ? await tx.individual.update({
          where: { id: manuallyCreatedIndividual.id },
          data: {
            firstName: signupData.firstName,
            lastName: signupData.lastName,
            email,
            mobilePhone: fullPhoneNumber,
            passwordHash,
            authProvider: "EMAIL",
            country: signupData.country,
            language: signupData.language,
            isActive: false,
            emailVerified: false,
            emailVerificationToken: token,
            emailVerificationTokenExpiresAt: tokenExpiresAt,
            updatedBy: "SYSTEM",
          },
        })
      : await tx.individual.create({ data: signupData });

    await tx.consent.createMany({
      data: [
        {
          individualId: individual.id,
          channel: ConsentChannel.EMAIL,
          channelStatus: ChannelStatus.OPTIN,
          createdBy: "WEBSITE_SIGNUP",
          updatedBy: "WEBSITE_SIGNUP",
        },
        {
          individualId: individual.id,
          channel: ConsentChannel.SMS,
          channelStatus: ChannelStatus.OPTIN,
          createdBy: "WEBSITE_SIGNUP",
          updatedBy: "WEBSITE_SIGNUP",
        },
        {
          individualId: individual.id,
          channel: ConsentChannel.WHATSAPP,
          channelStatus: ChannelStatus.OPTIN,
          createdBy: "WEBSITE_SIGNUP",
          updatedBy: "WEBSITE_SIGNUP",
        },
        {
          individualId: individual.id,
          channel: ConsentChannel.PHONE,
          channelStatus: ChannelStatus.OPTIN,
          createdBy: "WEBSITE_SIGNUP",
          updatedBy: "WEBSITE_SIGNUP",
        },
      ],
      skipDuplicates: true,
    });

    return {
      individual,
    };
  });

  try {
    await sendAccountVerificationEmail({
      email,
      token,
      language: input.language?.trim().toLowerCase() || "en",
    });

    return {
      success: true,
      message: "Verification email sent.",
      individualId: result.individual.id,
    };
  } catch (error) {
    console.error(
      "Unable to send verification email:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      code: "ERROR_VERIFICATION_EMAIL_FAILED",
    };
  }
}

export async function loginIndividual(input: LoginInput) {
  const email = normalizeEmail(input.email);

  const individual = await prisma.individual.findFirst({
    where: {
      email,
    },
  });

  if (!individual) {
    return {
      success: false,
      statusCode: 401,
      code: "ERROR_INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    };
  }

  if (!individual.passwordHash) {
    return {
      success: false,
      statusCode: 400,
      code: "ERROR_PASSWORD_LOGIN_NOT_AVAILABLE",
      message: "This account does not use password login.",
    };
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    individual.passwordHash
  );

  if (!passwordMatches) {
    return {
      success: false,
      statusCode: 401,
      code: "ERROR_INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    };
  }

  if (!individual.isActive) {
    return {
      success: false,
      statusCode: 403,
      code: "ERROR_INDIVIDUAL_INACTIVE",
      message: "This account is not active.",
    };
  }

  const updatedIndividual = await prisma.individual.update({
    where: {
      id: individual.id,
    },
    data: {
      lastSuccessfulLoginDate: new Date(),
      updatedBy: "SYSTEM",
    },
    include: {
      leads: true,
      prospects: true,
      accounts: true,
    }
  });

  const accessToken = generateAccessToken({
    individualId: updatedIndividual.id,
    email: updatedIndividual.email || email,
  });

  return {
    success: true,
    message: "Login successful.",
    accessToken,
    individual: mapAuthIndividual(updatedIndividual),
  };
}

export async function verifyIndividualEmail(token: string) {

  const individual = await prisma.individual.findFirst({
    where: {
      emailVerificationToken: token,
    },
  });

  var uid = randomUUID();

  if (!individual) {
    return {
      success: false,
      statusCode: 404,
      code: "ERROR_INVALID_VERIFICATION_TOKEN",
      message: "Invalid verification token.",
    };
  }

  if (individual.emailVerified && individual.isActive) {
    return {
      success: true,
      message: "Email already verified.",
    };
  }

  if (
    !individual.emailVerificationTokenExpiresAt ||
    individual.emailVerificationTokenExpiresAt < new Date()
  ) {
    return {
      success: false,
      statusCode: 400,
      code: "ERROR_VERIFICATION_TOKEN_EXPIRED",
      message: "Verification token expired.",
    };
  }

  await prisma.individual.update({
    where: {
      id: individual.id,
    },
    data: {
      isActive: true,
      emailVerified: true,
      emailVerificationToken: 'Taoufiq',
      emailVerificationTokenExpiresAt: null,
      updatedBy: "SYSTEM",
    },
  });

  return {
    success: true,
    code: 'EMAIL_VERIFIED_SUCCESSFULLY',
    message: "Email verified successfully.",
  };
}

export async function googleAuth(
  idToken: string,
  language?: string,
  country?: string
) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (
    !payload ||
    !payload.email ||
    !payload.sub
  ) {
    return {
      success: false,
      statusCode: 400,
      code: "ERROR_INVALID_GOOGLE_TOKEN",
      message: "Invalid Google token.",
    };
  }

  const email = normalizeEmail(
    payload.email
  );

  const googleId = payload.sub;

  const normalizedLanguage =
    language?.trim().toLowerCase() ||
    "en";

  const normalizedCountry =
    normalizeCountry(country);

  const existingIndividual =
    await prisma.individual.findFirst({
      where: {
        OR: [
          {
            email,
          },
          {
            googleId,
          },
          {
            manualEmail: email,
          },
        ],
      },
    });

  if (existingIndividual) {
    const isManualClaim =
      existingIndividual.manualEmail === email &&
      !existingIndividual.email &&
      !existingIndividual.googleId;
    if (!isManualClaim && !existingIndividual.isActive) {
      return {
        success: false,
        statusCode: 403,
        code: "ERROR_INDIVIDUAL_INACTIVE",
        message:
          "This account is not active.",
      };
    }

    const updatedIndividual =
      await prisma.individual.update({
        where: {
          id: existingIndividual.id,
        },

        data: {
          ...(isManualClaim
            ? {
                firstName: payload.given_name?.trim() || existingIndividual.firstName,
                lastName: payload.family_name?.trim() || existingIndividual.lastName,
                email,
                country: normalizedCountry,
                language: normalizedLanguage,
                authProvider: "GOOGLE",
                isActive: true,
              }
            : {}),
          googleId:
            existingIndividual.googleId ||
            googleId,

          emailVerified: true,

          lastSuccessfulLoginDate:
            new Date(),

          updatedBy: "SYSTEM",
        },
      });

    const accessToken =
      generateAccessToken({
        individualId:
          updatedIndividual.id,

        email:
          updatedIndividual.email ||
          email,
      });

    return {
      success: true,
      message:
        "Google authentication successful.",
      accessToken,
      individual:
        mapAuthIndividual(
          updatedIndividual
        ),
      created: false,
    };
  }

  const firstName =
    payload.given_name?.trim() ||
    "Google";

  const lastName =
    payload.family_name?.trim() ||
    "User";

  const result =
    await prisma.$transaction(
      async (tx) => {
        const individual =
          await tx.individual.create({
            data: {
              id: generateIndividualId(),

              firstName,
              lastName,
              email,

              googleId,
              authProvider: "GOOGLE",

              passwordHash: null,

              country:
                normalizedCountry,

              language:
                normalizedLanguage,

              source: "GOOGLE_AUTH",

              isActive: true,
              emailVerified: true,

              lastSuccessfulLoginDate:
                new Date(),

              createdBy: "SYSTEM",
              updatedBy: "SYSTEM",
            },
          });

        await tx.consent.createMany({
          data: [
            {
              individualId:
                individual.id,

              channel: "EMAIL",
              channelStatus: "OPTIN",

              createdBy:
                "GOOGLE_AUTH",

              updatedBy:
                "GOOGLE_AUTH",
            },
            {
              individualId:
                individual.id,

              channel: "SMS",
              channelStatus: "OPTIN",

              createdBy:
                "GOOGLE_AUTH",

              updatedBy:
                "GOOGLE_AUTH",
            },
            {
              individualId:
                individual.id,

              channel: "WHATSAPP",
              channelStatus: "OPTIN",

              createdBy:
                "GOOGLE_AUTH",

              updatedBy:
                "GOOGLE_AUTH",
            },
            {
              individualId:
                individual.id,

              channel: "PHONE",
              channelStatus: "OPTIN",

              createdBy:
                "GOOGLE_AUTH",

              updatedBy:
                "GOOGLE_AUTH",
            },
          ],
        });

        return {
          individual,
        };
      }
    );

  const accessToken =
    generateAccessToken({
      individualId:
        result.individual.id,

      email:
        result.individual.email ||
        email,
    });

  return {
    success: true,
    message:
      "Google authentication completed.",
    accessToken,
    individual:
      mapAuthIndividual(
        result.individual
      ),
    created: true,
  };
}
