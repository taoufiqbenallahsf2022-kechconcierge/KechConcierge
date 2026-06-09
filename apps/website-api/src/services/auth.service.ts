import crypto from "crypto";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config/prisma";
import { sendAccountVerificationEmail } from "./email.service";
import { generateIndividualId, generateLeadId } from "../utils/id-generator";

type SignupInput = {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  countryCode?: string;
  mobilePhone?: string;
  password: string;
  language: string;
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
      code: "EMAIL_ALREADY_USED",
      message: "This email is already used.",
    };
  }

  const token = crypto.randomBytes(32).toString("hex");

  const tokenExpiresAt = new Date();
  tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 30);

  const passwordHash = await bcrypt.hash(input.password, 10);
  const fullPhoneNumber = normalizePhone(input.countryCode, input.mobilePhone);

  const result = await prisma.$transaction(async (tx) => {
    const individual = await tx.individual.create({
      data: {
        id: generateIndividualId(),

        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        mobilePhone: fullPhoneNumber,
        passwordHash,
        country: input.country,

        authProvider: "EMAIL",

        language: input.language || "EN",
        source: "WEBSITE_SIGNUP",

        isActive: false,
        emailVerified: false,

        emailVerificationToken: token,
        emailVerificationTokenExpiresAt: tokenExpiresAt,

        createdBy: "SYSTEM",
        updatedBy: "SYSTEM",
      },
    });

    const lead = await tx.lead.create({
      data: {
        id: generateLeadId(),

        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        mobilePhone: fullPhoneNumber,

        language: input.language || "EN",
        source: "WEBSITE_SIGNUP",
        statusDescription: "Account created. Waiting for email verification.",

        individualId: individual.id,

        createdBy: "SYSTEM",
        updatedBy: "SYSTEM",
      },
    });

    return {
      individual,
      lead,
    };
  });

  await sendAccountVerificationEmail({
    email,
    token,
  });

  return {
    success: true,
    message: "Verification email sent.",
    individualId: result.individual.id,
    leadId: result.lead.id,
  };
}

export async function verifyIndividualEmail(token: string) {
  const individual = await prisma.individual.findFirst({
    where: {
      emailVerificationToken: token,
    },
  });

  if (!individual) {
    return {
      success: false,
      statusCode: 404,
      code: "INVALID_TOKEN",
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
      code: "TOKEN_EXPIRED",
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
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
      updatedBy: "SYSTEM",
    },
  });

  return {
    success: true,
    message: "Email verified successfully.",
  };
}

export async function googleSignup(idToken: string, language?: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email || !payload.sub) {
    return {
      success: false,
      statusCode: 400,
      code: "INVALID_GOOGLE_TOKEN",
      message: "Invalid Google token.",
    };
  }

  const email = normalizeEmail(payload.email);
  const googleId = payload.sub;

  const existingIndividual = await prisma.individual.findFirst({
    where: {
      OR: [{ email }, { googleId }],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      emailVerified: true,
    },
  });

  if (existingIndividual) {
    return {
      success: true,
      message: "Google account already exists.",
      individual: existingIndividual,
      created: false,
    };
  }

  const firstName = payload.given_name || "Google";
  const lastName = payload.family_name || "User";

  const result = await prisma.$transaction(async (tx) => {
    const individual = await tx.individual.create({
      data: {
        id: generateIndividualId(),

        firstName,
        lastName,
        email,

        googleId,
        authProvider: "GOOGLE",

        passwordHash: null,

        language: language || "EN",
        source: "GOOGLE_SIGNUP",

        isActive: true,
        emailVerified: true,

        createdBy: "SYSTEM",
        updatedBy: "SYSTEM",
      },
    });

    const lead = await tx.lead.create({
      data: {
        id: generateLeadId(),

        firstName,
        lastName,
        email,

        language: language || "EN",
        source: "GOOGLE_SIGNUP",
        statusDescription: "Lead created from Google signup.",

        individualId: individual.id,

        createdBy: "SYSTEM",
        updatedBy: "SYSTEM",
      },
    });

    return {
      individual,
      lead,
    };
  });

  return {
    success: true,
    message: "Google signup completed.",
    individual: {
      id: result.individual.id,
      email: result.individual.email,
      firstName: result.individual.firstName,
      lastName: result.individual.lastName,
      isActive: result.individual.isActive,
      emailVerified: result.individual.emailVerified,
    },
    leadId: result.lead.id,
    created: true,
  };
}