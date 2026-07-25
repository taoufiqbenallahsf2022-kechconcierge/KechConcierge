import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import type { EntityRule } from "../config/entities.js";
type Q = Record<string, string | undefined>;
type Delegate = {
  findMany: (a: any) => Promise<any[]>;
  count: (a: any) => Promise<number>;
  findUnique: (a: any) => Promise<any>;
  create: (a: any) => Promise<any>;
  update: (a: any) => Promise<any>;
  delete: (a: any) => Promise<any>;
};
function d(rule: EntityRule) {
  return (prisma as any)[rule.delegate] as Delegate;
}
function clean(rule: EntityRule, row: any) {
  if (!row) return row;
  const copy = { ...row };
  for (const f of rule.hiddenFields ?? []) delete copy[f];
  return copy;
}
function value(raw: string) {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw === "null") return null;
  return raw;
}
function where(rule: EntityRule, q: Q) {
  const and: any[] = [];
  if (q.search && rule.searchFields.length)
    and.push({
      OR: rule.searchFields.map((f) => ({
        [f]: { contains: q.search, mode: "insensitive" },
      })),
    });
  if (q.filterField && q.filterValue !== undefined) {
    if (!rule.filterFields.includes(q.filterField))
      throw Object.assign(new Error("Unsupported filter field"), {
        status: 400,
      });
    and.push({ [q.filterField]: value(q.filterValue) });
  }
  for (const f of rule.dateFields) {
    const from = q[`${f}From`],
      to = q[`${f}To`];
    if (from || to)
      and.push({
        [f]: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      });
  }
  return and.length ? { AND: and } : {};
}
export function createCrudService(
  rule: EntityRule | undefined,
  options: {
    includeOne?: any;
    beforeCreate?: (b: any) => Promise<any> | any;
    beforeUpdate?: (b: any) => Promise<any> | any;
    sanitize?: string[];
  } = {},
) {
  if (!rule) throw new Error("Unknown entity configuration");
  const delegate = d(rule);
  const sanitize = (body: any) => {
    const data = { ...body };
    for (const f of [
      "id",
      "createdAt",
      "updatedAt",
      "createdDate",
      "updatedDate",
      "createdBy",
      "updatedBy",
      "passwordHash",
      "emailVerificationToken",
      "passwordResetToken",
      ...(options.sanitize ?? []),
    ])
      delete data[f];
    return data;
  };
  return {
    async list(q: Q) {
      const page = Math.max(1, Number(q.page) || 1),
        pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 20)),
        w = where(rule, q);
      const sortField =
        q.sortField &&
        [...rule.filterFields, ...rule.dateFields].includes(q.sortField)
          ? q.sortField
          : (rule.dateFields[0] ?? "id");
      const [items, total] = await Promise.all([
        delegate.findMany({
          where: w,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortField]: q.sortOrder === "asc" ? "asc" : "desc" },
        }),
        delegate.count({ where: w }),
      ]);
      return {
        items: items.map((x) => clean(rule, x)),
        total,
        page,
        pageSize,
        pages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
    async one(id: string) {
      const row = await delegate.findUnique({
        where: { id },
        include: options.includeOne,
      });
      if (!row) throw Object.assign(new Error("Not found"), { status: 404 });
      return clean(rule, row);
    },
    async create(body: any) {
      if (rule.readOnly)
        throw Object.assign(new Error("Read-only entity"), { status: 405 });
      let data = sanitize(body);
      if (options.beforeCreate) data = await options.beforeCreate(data);
      return clean(rule, await delegate.create({ data }));
    },
    async update(id: string, body: any) {
      if (rule.readOnly)
        throw Object.assign(new Error("Read-only entity"), { status: 405 });
      let data = sanitize(body);
      if (options.beforeUpdate) data = await options.beforeUpdate(data);
      return clean(rule, await delegate.update({ where: { id }, data }));
    },
    async remove(id: string) {
      if (rule.readOnly)
        throw Object.assign(new Error("Read-only entity"), { status: 405 });
      await delegate.delete({ where: { id } });
    },
  };
}
export const helpers = { randomUUID, bcrypt };
