import "dotenv/config";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { startAutomationScheduler } from "./automation/scheduler.js";
const port = Number(process.env.PORT ?? 8081);
const server = app.listen(port, () =>
  console.log(`Moorish Admin API: http://localhost:${port}`),
);
const stopScheduler = startAutomationScheduler();
async function close() {
  stopScheduler();
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
