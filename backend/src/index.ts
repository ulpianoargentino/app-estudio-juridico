import "./types/express";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config";
import routes from "./routes";
import { errorHandler } from "./middleware/error-handler";

const app = express();

// Security and parsing middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Mount all routes under /api
app.use("/api", routes);

// 404 catch-all for unknown endpoints
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "El recurso solicitado no existe",
    },
  });
});

// Global error handler (must be registered after routes)
app.use(errorHandler);

// Graceful handling of unhandled promise rejections
process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

app.listen(config.port, () => {
  console.log(
    `Server running on port ${config.port} in ${config.nodeEnv} mode`
  );
});

export default app;
