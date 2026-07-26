import { prisma } from "../lib/prisma.js";
import { executeAutomation } from "./automationEngine.js";
import { nextRunAt } from "./schedule.js";

async function tick() {
  const due = await prisma.audienceAutomation.findMany({ where: { isActive: true, scheduleType: { not: "MANUAL" }, nextRunAt: { lte: new Date() } }, take: 10 });
  for (const automation of due) {
    const now = new Date();
    const claimed = await prisma.audienceAutomation.updateMany({
      where: { id: automation.id, isActive: true, nextRunAt: { lte: now } },
      data: { lastRunAt: now, nextRunAt: nextRunAt(automation, now) },
    });
    if (claimed.count) executeAutomation(automation.id, "SCHEDULER").catch((error) => console.error(`Scheduled automation "${automation.name}" failed:`, error));
  }
}
export function startAutomationScheduler() {
  const timer = setInterval(() => void tick().catch((error) => console.error("Automation scheduler failed:", error)), 30_000);
  void tick().catch((error) => console.error("Automation scheduler failed:", error));
  return () => clearInterval(timer);
}
