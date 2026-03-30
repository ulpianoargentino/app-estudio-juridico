import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import routes from "./routes";
import { errorHandler } from "./middleware/error-handler";

const app = express();

// Security and parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// API routes
app.use("/api", routes);

// Error handling — must be registered after routes
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(
    `Server running on port ${config.port} [${config.nodeEnv}]`
  );
});

export default app;
