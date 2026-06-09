import express, { Express } from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes";
import authRoutes from "./routes/auth.routes";

const app: Express = express();

const allowedOrigins: Record<string, string[] | string> = {
  local: "*",
  test: ["https://staging.moorlytravels.com"],
  production: [
    "https://moorlytravels.com",
    "https://www.moorlytravels.com",
  ],
};

const currentEnv = process.env.NODE_ENV || "local";

console.log(currentEnv);

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

export default app;