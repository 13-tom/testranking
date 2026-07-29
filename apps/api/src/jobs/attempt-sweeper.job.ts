import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { submitAttempt } from "../services/test-attempt.service.js";

// docs/12_Product_Decisions.md BR-027 — the documented authoritative
// guarantee that no attempt is ever left stuck STARTED past its
// expiresAt, even if the student's client disconnected permanently.
//
// This function is fully implemented and correct, but its periodic
// registration (see apps/api/src/index.ts) is commented out: Render's
// free-tier single web process spins down on inactivity, so a naive
// setInterval here would not reliably fire while the dyno is asleep.
//
// The lazy check in test-attempt.service.ts's ensureAttemptFreshRow()
// (invoked from every attempt read/write path — getAttempt, saveAnswer,
// submitAttempt, autoSubmitAttempt, getAttemptResult, startAttempt)
// provides the same "no student is ever stuck on an expired attempt"
// guarantee in practice on this infra, because the guarantee only needs
// to hold by the time someone next looks at the attempt.
//
// TO ACTIVATE on real infra (a paid Render worker/dyno, or any host that
// stays warm): uncomment the registration in index.ts, OR — better — run
// this file as a separate Render "Background Worker" service, OR wire a
// Render Cron Job / external scheduler to call an authenticated internal
// endpoint that invokes sweepExpiredAttempts().
export async function sweepExpiredAttempts(): Promise<{ swept: number }> {
  const expired = await prisma.testAttempt.findMany({
    where: { status: "STARTED", expiresAt: { lt: new Date() } },
    select: { id: true, studentId: true },
  });

  for (const attempt of expired) {
    await submitAttempt(attempt.id, attempt.studentId, "AUTO_SUBMITTED").catch((err) => {
      logger.error({ err, attemptId: attempt.id }, "sweeper: failed to auto-submit expired attempt");
    });
  }

  return { swept: expired.length };
}
