import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";
import { scanOrphanedEvaluatedAttempts } from "./services/ranking-calculation.service.js";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT}`);
});

// BR-035 point 1: recover any attempts orphaned by a crash between their
// submission transaction committing and the fire-and-forget ranking call
// resolving. Periodic cron re-scan is Sprint 6.3+ (BR-035 point 2).
void scanOrphanedEvaluatedAttempts().catch((err) => logger.error({ err }, "orphaned ranking recovery scan failed"));

// BR-027 background sweeper — disabled on this infra, see the comment in
// apps/api/src/jobs/attempt-sweeper.job.ts for why and how to activate it.
//
// import { sweepExpiredAttempts } from "./jobs/attempt-sweeper.job.js";
// setInterval(() => {
//   sweepExpiredAttempts().catch((err) => logger.error({ err }, "attempt sweeper failed"));
// }, 5 * 60 * 1000);
