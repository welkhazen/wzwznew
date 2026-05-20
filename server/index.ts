import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
import { env } from "./config/env";
import { assistantRouter } from "./routes/assistant";
import { authRouter } from "./routes/auth";
import { cronRouter } from "./routes/cron";
import { notificationsRouter } from "./routes/notifications";
import { pollsRouter } from "./routes/polls";
import { usersRouter } from "./routes/users";
import { runStreakResetAtUtc, sendStreakAtRiskEmailsUtc } from "./lib/streakCron";
import { requireTrustedOrigin } from "./middleware/requireTrustedOrigin";

const app = express();
const isProduction = env.NODE_ENV === "production";
const port = env.API_PORT;
const corsOrigin = env.CORS_ORIGIN;
const sessionSecret = env.SESSION_SECRET;

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

if (isProduction) {
  app.use((req, res, next) => {
    const forwardedProto = req.headers["x-forwarded-proto"];
    if (forwardedProto !== "https") {
      return res.status(400).json({ error: "HTTPS is required." });
    }

    return next();
  });
}

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());
app.use("/api", requireTrustedOrigin);

app.use(
  session({
    name: "raw.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (_req, res) => {
  return res.status(200).json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/cron", cronRouter);
app.use("/api", pollsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  return res.status(500).json({ error: "Internal server error." });
});

app.listen(port, () => {
  console.info(`Auth API listening on http://localhost:${port}`);
});

if (env.CRON_ENABLED !== "false") {
  let lastResetDate = "";
  let lastRiskEmailDate = "";

  const scheduler = async () => {
    const now = new Date();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    const dayKey = now.toISOString().slice(0, 10);

    if (hour === 0 && minute < 3 && dayKey !== lastResetDate) {
      try {
        const result = await runStreakResetAtUtc();
        lastResetDate = dayKey;
        console.info("cron.streak.reset", result);
      } catch (error) {
        console.error("cron.streak.reset.error", error);
      }
    }

    if (hour === 18 && minute < 3 && dayKey !== lastRiskEmailDate) {
      try {
        const result = await sendStreakAtRiskEmailsUtc();
        lastRiskEmailDate = dayKey;
        console.info("cron.streak.at_risk", result);
      } catch (error) {
        console.error("cron.streak.at_risk.error", error);
      }
    }
  };

  void scheduler();
  setInterval(() => {
    void scheduler();
  }, 60 * 1000);
}
