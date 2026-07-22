import express, { Express } from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes";
import authRoutes from "./routes/auth.routes";
import contactRequestRoutes from "./routes/contact-request.routes";
import passwordResetRoutes from "./routes/password-reset.routes";

const app: Express = express();

const allowedOrigins: Record<string, string[] | string> = {
  local: "*",
  test: ["https://staging.moorishconcierge.com", "https://www.staging.moorishconcierge.com"],
  production: [
    "https://moorishconcierge.com",
    "https://www.moorishconcierge.com"
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
  })
);

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/password", passwordResetRoutes);
app.use("/api/contact-requests", contactRequestRoutes);

export default app;