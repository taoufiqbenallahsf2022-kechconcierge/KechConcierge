import { prisma } from "../lib/prisma.js";

const ABANDON_AFTER_MS = 72 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

export async function abandonInactiveTripCarts(now = new Date()) {
  const inactiveSince = new Date(now.getTime() - ABANDON_AFTER_MS);
  const result = await prisma.tripCart.updateMany({
    where: {
      status: "ACTIVE",
      updatedDate: { lte: inactiveSince },
    },
    data: { status: "ABANDONED" },
  });

  if (result.count > 0) {
    console.log(`Marked ${result.count} inactive trip cart(s) as abandoned.`);
  }

  return result.count;
}

export function startTripCartAbandonmentScheduler() {
  const run = () =>
    void abandonInactiveTripCarts().catch((error) =>
      console.error("Trip cart abandonment job failed:", error),
    );

  // Run once at startup so overdue carts do not wait for the first interval.
  run();
  const timer = setInterval(run, CHECK_INTERVAL_MS);

  return () => clearInterval(timer);
}
