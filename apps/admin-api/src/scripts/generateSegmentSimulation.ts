import { prisma } from "../lib/prisma.js";
import { generateSegmentSimulationData } from "../segments/simulationData.js";

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEGMENT_SIMULATION !== "true") {
    throw new Error("Simulation data is disabled in production. Set ALLOW_SEGMENT_SIMULATION=true only for an intentional sandbox run.");
  }
  const result = await generateSegmentSimulationData("segment-simulation-script");
  console.log("Segment simulation data is ready:");
  for (const [name, count] of Object.entries(result)) console.log(`- ${name}: ${count}`);
}

main()
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
