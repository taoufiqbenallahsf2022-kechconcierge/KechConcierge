import express from "express";
import cors from "cors";
import { api } from "./routes/index.js";
export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(
  cors({
    origin: process.env.ADMIN_URL ?? "http://localhost:8080",
    credentials: true,
  }),
);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigin = process.env.ADMIN_URL ?? "http://localhost:8080";
  const unsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  if (unsafeMethod && origin && origin !== allowedOrigin) {
    return res.status(403).json({ message: "Origin not allowed" });
  }
  next();
});
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
