import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import logger from "./utils/logger";
import Redis from "ioredis";
import RedisStore from "rate-limit-redis";
import errorHandler from "./middleware/errorHandler";

dotenv.config();

const redisClient = new Redis(process.env.REDIS_URL!);
const PORT = process.env.PORT || 5000;

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests / window / IP
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req: express.Request, res: express.Response): void => {
    logger.warn("Rate limit exceeded for IP %s", req.ip);
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  },
  store: new RedisStore({
    sendCommand: (...args: (string | number)[]) =>
      (redisClient.call as any)(...args),
  }),
});

app.use(limiter);

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Hello from TypeScript Express!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled rejection at ${promise}, reason: ${reason}`);
});
