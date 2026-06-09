import { Request, Response } from "express";
import {
  checkEmailAvailability,
  signupIndividual,
  verifyIndividualEmail,
  googleSignup,
} from "../services/auth.service";

export async function checkEmail(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({
        message: "Valid email is required.",
      });
    }

    const result = await checkEmailAvailability(email);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to check email.",
    });
  }
}

export async function signup(req: Request, res: Response) {
  try {
    const {
      firstName,
      lastName,
      email,
      country,
      countryCode,
      mobilePhone,
      password,
      language,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !country || !language) {
      return res.status(400).json({
        code: 'NAME_EMAIL_PASSWORD_LANGUAGE_COUNTRY_REQUIRED', 
        message: "First name, last name, email and password are required.",
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        code: "VALID_EMAIL_REQUIRED",
        message: "Valid email is required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        code: 'PASSWORD_CRITERIA_UNMATCHED',
        message: "Password must contain at least 6 characters.",
      });
    }

    const result = await signupIndividual({
      firstName,
      lastName,
      email,
      country,
      countryCode,
      mobilePhone,
      password,
      language,
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        code: result.code,
        message: result.message,
      });
    }

    return res.status(201).json({
      code: 'INDIVIDUALLEAD_ACCOUNT_CREATED',
      message: result.message,
      individualId: result.individualId,
      leadId: result.leadId,
    });
  } catch (error) {
    return res.status(500).json({
      code: "UNABLE_CREATING_INDIVIDUALLEAD_ACCOUNT",
      message: "Unable to create account.",
    });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const token = req.query.token;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        message: "Verification token is required.",
      });
    }

    const result = await verifyIndividualEmail(token);

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        code: result.code,
        message: result.message,
      });
    }

    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to verify email.",
    });
  }
}

export async function googleSignupController(req: Request, res: Response) {
  try {
    const { idToken, language } = req.body;

    if (!idToken || typeof idToken !== "string") {
      return res.status(400).json({
        message: "Google ID token is required.",
      });
    }

    const result = await googleSignup(idToken, language);

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        code: result.code,
        message: result.message,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to complete Google signup.",
    });
  }
}