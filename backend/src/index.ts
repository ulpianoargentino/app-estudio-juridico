import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import routes from "./routes";
import { errorHandler } from "./middleware/error-handler";

const app = express();

// Security and parsing middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

// Mount all routes under /api
app.use("/api", routes);

// Global error handler (must be registered after routes)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(
    `Server running on port ${config.port} in ${config.nodeEnv} mode`
  );
});

export default app;
