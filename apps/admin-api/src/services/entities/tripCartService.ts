import { rules } from "../../config/entities.js";
import { createCrudService } from "../baseCrudService.js";
import { prisma } from "../../lib/prisma.js";

const base = createCrudService(rules["trip-carts"], {
  includeList: { individual: { select: { id: true, firstName: true, lastName: true, email: true } }, _count: { select: { items: true } } },
  includeOne: { individual: { select: { id: true, firstName: true, lastName: true, email: true, mobilePhone: true } }, items: { orderBy: { createdDate: "asc" } } },
});

function present(row: any) {
  const inactiveFor72Hours = row.status === "ACTIVE" && Date.now() - new Date(row.updatedDate).getTime() >= 72 * 60 * 60 * 1000;
  return { ...row, displayStatus: row.status === "SUBMITTED" ? "REQUESTED" : row.status === "ABANDONED" || inactiveFor72Hours ? "ABANDONED" : "FILLED_NOT_REQUESTED", itemCount: row._count?.items ?? row.items?.length ?? 0, individualName: row.individual ? `${row.individual.firstName} ${row.individual.lastName}`.trim() : null };
}

export const service = {
  ...base,
  async list(query: Record<string, string>) { const result = await base.list(query); return { ...result, items: result.items.map(present) }; },
  async one(id: string) {
    const row = present(await base.one(id));
    const contactRequest = row.contactRequestId ? await prisma.contactRequest.findUnique({ where: { id: row.contactRequestId }, select: { id: true, subject: true, email: true, createdDate: true } }) : null;
    return { ...row, contactRequest };
  },
};
