import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { sendAccountVerificationEmail } from "./email.service";
import {
  generateIndividualId,
  generateLeadId,
} from "../utils/id-generator";

type SignupInput = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode?: string;
  mobilePhone?: string;
  password: string;
  language?: string;
};

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
      isActive: true,
      emailVerified: true,
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