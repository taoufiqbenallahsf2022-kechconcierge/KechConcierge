import { Request, Response } from "express";
import {
  checkEmailAvailability,
  signupIndividual,
  loginIndividual,
  verifyIndividualEmail,
  googleAuth,
} from "../services/auth.service";

export async function checkEmail(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({
        code: "ERROR_INVALID_EMAIL",
        message: "Valid email is required.",
      });
    }

    const result = await checkEmailAvailability(email);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      code: "ERROR_CHECK_EMAIL_FAILED",
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
      countryCode,
      mobilePhone,
      country,
      password,
      language,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        code: "ERROR_SIGNUP_REQUIRED_FIELDS",
        message: "First name, last name, email and password are required.",
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        code: "ERROR_INVALID_EMAIL",
        message: "Valid email is required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        code: "ERROR_PASSWORD_TOO_SHORT",
        message: "Password must contain at least 6 characters.",
      });
    }
    
    const result = await signupIndividual({
      firstName,
      lastName,
      email,
      countryCode,
      mobilePhone,
      country,
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
      message: result.message,
      individualId: result.individualId,
      leadId: result.leadId,
    });

  } catch (error) {
    return res.status(500).json({
      code: "ERROR_SIGNUP_FAILED",
      message: "Unable to create account.",
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        code: "ERROR_LOGIN_REQUIRED_FIELDS",
        message: "Email and password are required.",
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        code: "ERROR_INVALID_EMAIL",
        message: "Valid email is required.",
      });
    }

    const result = await loginIndividual({
      email,
      password,
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        code: result.code,
        message: result.message,
      });
    }

    return res.status(200).json({
      message: result.message,
      accessToken: result.accessToken,
      individual: result.individual,
    });
  } catch (error) {
    return res.status(500).json({
      code: "ERROR_LOGIN_FAILED",
      message: "Unable to login.",
    });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const token = req.query.token;

    console.log('Token in verify Email Method '+token);

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        code: "ERROR_VERIFICATION_TOKEN_REQUIRED",
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
      code: "ERROR_VERIFY_EMAIL_FAILED",
      message: "Unable to verify email.",
    });
  }
}

export async function googleAuthController(req: Request, res: Response) {
  try {
    const { idToken, language, country } = req.body;

    if (!idToken || typeof idToken !== "string") {
      return res.status(400).json({
        code: "ERROR_GOOGLE_TOKEN_REQUIRED",
        message: "Google ID token is required.",
      });
    }

    const result = await googleAuth(idToken, language, country);

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        code: result.code,
        message: result.message,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      code: "ERROR_GOOGLE_AUTH_FAILED",
      message: "Unable to complete Google authentication.",
    });
  }
}