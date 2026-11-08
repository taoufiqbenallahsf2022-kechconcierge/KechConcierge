import { prisma } from "../config/prisma";

export function validVisitorId(value: unknown): value is string {
  return typeof value === "string" && value.length >= 16 && value.length <= 100;
}
export async function recordVisitor(input: {
  visitorId: string; source?: string | null; pageUrl?: string | null; referrer?: string | null;
  userAgent?: string | null; language?: string | null; utmCampaign?: string | null; utmMedium?: string | null;
  firstName?: string | null; lastName?: string | null; email?: string | null; phone?: string | null; individualId?: string | null;
}) {
  if (!validVisitorId(input.visitorId)) return;
  const clean = (value: unknown, max: number) => typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
  const source = clean(input.source, 120)?.toLowerCase() ?? null;
  const known = input.individualId ? await prisma.individual.findUnique({ where: { id: input.individualId }, select: { firstName: true, lastName: true, email: true, manualEmail: true, mobilePhone: true } }) : null;
  const profile = {
    firstName: clean(input.firstName || known?.firstName, 150), lastName: clean(input.lastName || known?.lastName, 150),
    email: clean(input.email || known?.email || known?.manualEmail, 320)?.toLowerCase() ?? null, phone: clean(input.phone || known?.mobilePhone, 100),
  };
  const userAgent = clean(input.userAgent, 1000);
  const visitor = await prisma.visitor.upsert({
    where: { id: input.visitorId },
    create: {
      id: input.visitorId, ...profile, source, lastSource: source,
      landingPage: clean(input.pageUrl, 2000), referrer: clean(input.referrer, 2000), userAgent,
      language: clean(input.language, 100), deviceType: userAgent ? /mobile|android|iphone|ipad/i.test(userAgent) ? "mobile" : "desktop" : null,
      utmCampaign: clean(input.utmCampaign, 200), utmMedium: clean(input.utmMedium, 100),
    },
    update: { lastSeenAt: new Date(), ...(source ? { lastSource: source } : {}), ...(userAgent ? { userAgent, deviceType: /mobile|android|iphone|ipad/i.test(userAgent) ? "mobile" : "desktop" } : {}), ...Object.fromEntries(Object.entries(profile).filter(([, value]) => value !== null)) },
  });
  if (source && !visitor.source) await prisma.visitor.updateMany({ where: { id: visitor.id, source: null }, data: { source } });
  if (input.pageUrl && !visitor.landingPage) await prisma.visitor.updateMany({ where: { id: visitor.id, landingPage: null }, data: { landingPage: clean(input.pageUrl, 2000), referrer: clean(input.referrer, 2000), userAgent, language: clean(input.language, 100), utmCampaign: clean(input.utmCampaign, 200), utmMedium: clean(input.utmMedium, 100) } });
  if (input.individualId) {
    await prisma.visitorIdentity.upsert({ where: { visitorId_individualId: { visitorId: visitor.id, individualId: input.individualId } }, create: { visitorId: visitor.id, individualId: input.individualId }, update: {} });
    if (visitor.source || source) await prisma.individual.updateMany({ where: { id: input.individualId, acquisitionSource: null }, data: { acquisitionSource: visitor.source || source } });
  }
}
