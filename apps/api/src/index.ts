import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT}`);
});

// BR-027 background sweeper — disabled on this infra, see the comment in
// apps/api/src/jobs/attempt-sweeper.job.ts for why and how to activate it.
//
// import { sweepExpiredAttempts } from "./jobs/attempt-sweeper.job.js";
// setInterval(() => {
//   sweepExpiredAttempts().catch((err) => logger.error({ err }, "attempt sweeper failed"));
// }, 5 * 60 * 1000);
