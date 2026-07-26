import { prisma } from "../config/prisma";

function validId(value: string, label: string) {
  const normalized = value.trim();
  if (normalized.length < 16 || normalized.length > 100)
    throw Object.assign(new Error(`${label} is invalid`), { status: 400 });
  return normalized;
}

export async function ensureVisitorJourney(visitorIdRaw: string, journeyIdRaw: string) {
  const visitorId = validId(visitorIdRaw, "Visitor ID");
  const journeyId = validId(journeyIdRaw, "Journey ID");
  const journey = await prisma.visitorJourney.upsert({
    where: { id: journeyId },
    create: { id: journeyId, visitorId },
    update: {},
  });
  if (journey.visitorId !== visitorId)
    throw Object.assign(new Error("Journey does not belong to this visitor"), { status: 409 });
  return journey;
}

export async function claimVisitorJourney(
  visitorIdRaw: string | undefined,
  journeyIdRaw: string | undefined,
  individualId: string,
) {
  if (!visitorIdRaw || !journeyIdRaw) return { claimed: false };
  const visitorId = validId(visitorIdRaw, "Visitor ID");
  const journeyId = validId(journeyIdRaw, "Journey ID");

  return prisma.$transaction(async tx => {
    const current = await tx.visitorJourney.upsert({
      where: { id: journeyId },
      create: { id: journeyId, visitorId },
      update: {},
    });
    if (current.visitorId !== visitorId)
      throw Object.assign(new Error("Journey does not belong to this visitor"), { status: 409 });
    if (current.individualId && current.individualId !== individualId)
      return { claimed: false, conflict: true, pageVisits: 0, chats: 0 };

    const individual = await tx.individual.findUnique({
      where: { id: individualId },
      select: {
        id: true,
        leads: { take: 1, orderBy: { updatedDate: "desc" }, select: { id: true } },
        prospects: { take: 1, orderBy: { updatedDate: "desc" }, select: { id: true } },
        accounts: { take: 1, orderBy: { updatedDate: "desc" }, select: { id: true } },
      },
    });
    if (!individual)
      throw Object.assign(new Error("Individual not found"), { status: 404 });

    const accountId = individual.accounts[0]?.id ?? null;
    const prospectId = accountId ? null : (individual.prospects[0]?.id ?? null);
    const leadId = accountId || prospectId ? null : (individual.leads[0]?.id ?? null);
    const pageStage = accountId ? "ACCOUNT" : prospectId ? "PROSPECT" : leadId ? "LEAD" : "ANONYMOUS";
    const chatStage = accountId ? "ACCOUNT" : prospectId ? "PROSPECT" : leadId ? "LEAD" : "INDIVIDUAL";
    const claimedAt = current.claimedAt ?? new Date();

    await tx.visitorJourney.update({
      where: { id: journeyId },
      data: { individualId, claimedAt },
    });
    const pageVisits = await tx.pageVisit.updateMany({
      where: { journeyId, individualId: null },
      data: { individualId, accountId, prospectId, leadId, visitorStage: pageStage },
    });
    const chats = await tx.chat.updateMany({
      where: { journeyId, individualId: null },
      data: { individualId, accountId, prospectId, leadId, participantStage: chatStage, updatedBy: "JOURNEY_CLAIM" },
    });
    return { claimed: true, pageVisits: pageVisits.count, chats: chats.count };
  });
}
