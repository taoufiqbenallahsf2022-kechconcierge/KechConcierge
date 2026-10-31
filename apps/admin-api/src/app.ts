import express from "express";
import cors from "cors";
import { api } from "./routes/index.js";
import { resendWebhookRouter } from "./routes/performanceRoutes.js";
export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(
  cors({
    origin(origin, callback) {
      const allowed = [process.env.ADMIN_URL ?? "http://localhost:8080", process.env.PUBLIC_WEBSITE_URL ?? "http://localhost:3000"];
      callback(null, !origin || allowed.includes(origin));
    },
    credentials: true,
  }),
);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigin = process.env.ADMIN_URL ?? "http://localhost:8080";
  const publicWebsiteOrigin = process.env.PUBLIC_WEBSITE_URL ?? "http://localhost:3000";
  const unsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  const publicPaymentRequest = req.path.startsWith("/api/public/payments/");
  if (unsafeMethod && origin && origin !== allowedOrigin && !(publicPaymentRequest && origin === publicWebsiteOrigin)) {
    return res.status(403).json({ message: "Origin not allowed" });
  }
  next();
});
// Stripe verifies the signature against the exact bytes it sent. This route
// must receive a Buffer before the general JSON parser runs.
app.use(
  "/api/public/stripe/webhook",
  express.raw({ type: "application/json" }),
);
app.use(
  "/api/public/resend/webhook",
  express.raw({ type: "application/json" }),
  resendWebhookRouter,
);
app.use(express.json({ limit: "2mb" }));
app.use("/api", api);
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res
      .status(err.status ?? 500)
      .json({ message: err.message ?? "Internal server error" });
  },
);
