import crypto, { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config/prisma";
import { sendAccountVerificationEmail } from "./email.service";
import { generateIndividualId, generateLeadId } from "../utils/id-generator";
import { generateAccessToken } from "../utils/jwt";

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
  console.log(individual);
  console.log(individualLead);
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
      message: "This email is already used.",
    };
  }

  const token = crypto.randomBytes(32).toString("hex");

  const tokenExpiresAt = new Date();
  tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 30);

  const passwordHash = await bcrypt.hash(input.password, 10);
  const fullPhoneNumber = normalizePhone(input.countryCode, input.mobilePhone);

  console.log('Token while creating Individual' + token);

  const result = await prisma.$transaction(async (tx) => {
    const individual = await tx.individual.create({
      data: {
        id: generateIndividualId(),

        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        mobilePhone: fullPhoneNumber,
        passwordHash,

        authProvider: "EMAIL",

        country: input.country || null,
        language: input.language || "en",
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

        country: input.country || null,
        language: input.language || "en",
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

  console.log(input.language);

  await sendAccountVerificationEmail({
    email,
    token,
    language: input.language || "en"
  });

  return {
    success: true,
    message: "Verification email sent.",
    individualId: result.individual.id,
    leadId: result.lead.id,
  };
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

  console.log('Token : '+ token);

  const individual = await prisma.individual.findFirst({
    where: {
      emailVerificationToken: token,
    },
  });

  console.log(individual);

  var uid = randomUUID();

  if (!individual) {
    
    console.log("I'm returning this inside Individual Verification "+uid);

    return {
      success: false,
      statusCode: 404,
      code: "ERROR_INVALID_VERIFICATION_TOKEN",
      message: "Invalid verification token.",
    };
  }

  console.log("I'm returning this outside after the return "+uid);

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
    code: 'EMAIL_VERIFIED_SUCCESSFULLY',
    message: "Email verified successfully.",
  };
}

export async function googleAuth(idToken: string, language?: string, country?: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email || !payload.sub) {
    return {
      success: false,
      statusCode: 400,
      code: "ERROR_INVALID_GOOGLE_TOKEN",
      message: "Invalid Google token.",
    };
  }

  const email = normalizeEmail(payload.email);
  const googleId = payload.sub;

  const existingIndividual = await prisma.individual.findFirst({
    where: {
      OR: [{ email }, { googleId }],
    },
  });

  if (existingIndividual) {
    if (!existingIndividual.isActive) {
      return {
        success: false,
        statusCode: 403,
        code: "ERROR_INDIVIDUAL_INACTIVE",
        message: "This account is not active.",
      };
    }

    const updatedIndividual = await prisma.individual.update({
      where: {
        id: existingIndividual.id,
      },
      data: {
        googleId: existingIndividual.googleId || googleId,
        emailVerified: true,
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
      message: "Google authentication successful.",
      accessToken,
      individual: mapAuthIndividual(updatedIndividual),
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

        country: country || null,
        language: language || "en",
        source: "GOOGLE_AUTH",

        isActive: true,
        emailVerified: true,
        lastSuccessfulLoginDate: new Date(),

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

        country: country || null,
        language: language || "en",
        source: "GOOGLE_AUTH",
        statusDescription: "Lead created from Google authentication.",

        individualId: individual.id,

        createdBy: "SYSTEM",
        updatedBy: "SYSTEM",
      },
    });

    return {
      individual: individual,
      lead,
    };
  });

  const accessToken = generateAccessToken({
    individualId: result.individual.id,
    email: result.individual.email || email,
  });

  return {
    success: true,
    message: "Google authentication completed.",
    accessToken,
    individual: mapAuthIndividual(result.individual),
    leadId: result.lead.id,
    created: true,
  };
}