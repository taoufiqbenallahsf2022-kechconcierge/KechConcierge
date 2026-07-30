import express, { Express } from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes";
import authRoutes from "./routes/auth.routes";
import contactRequestRoutes from "./routes/contact-request.routes";
import passwordResetRoutes from "./routes/password-reset.routes";
import accountRoutes from "./routes/account.routes";
import chatRoutes from "./routes/chat.routes";
import pageVisitRoutes from "./routes/page-visit.routes";

const app: Express = express();
app.set("trust proxy", 1);

const allowedOrigins: Record<string, string[] | string> = {
  local: "*",
  test: [
    "https://sandbox.moorishconcierge.com",
    "https://www.sandbox.moorishconcierge.com",
  ],
  production: [
    "https://moorishconcierge.com",
    "https://www.moorishconcierge.com",
  ],
};

const currentEnv = process.env.NODE_ENV || "local";

app.use(
  cors({
    origin: (origin, callback) => {
      if (currentEnv === "local") {
        return callback(null, true);
      }

      if (
        !origin ||
        (Array.isArray(allowedOrigins[currentEnv]) &&
          allowedOrigins[currentEnv].includes(origin))
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  }),
);

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/password", passwordResetRoutes);
app.use("/api/contact-requests", contactRequestRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/page-visits", pageVisitRoutes);

app.use(
  (
    error: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);
    res
      .status(error.status ?? 500)
      .json({ message: error.message ?? "Internal server error" });
  },
);

export default app;
