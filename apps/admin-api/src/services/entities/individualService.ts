import { rules } from "../../config/entities.js";
import { createCrudService } from "../baseCrudService.js";
import { randomBytes } from "node:crypto";
function generateAdminIndividualId() {
  return `00IA${randomBytes(7).toString("hex").toUpperCase()}`;
}
function normalizedProfile(data: any) {
  const language = String(data.language ?? "").trim().toLowerCase();
  const country = data.country ? String(data.country).trim().toUpperCase() : null;
  if (!language) throw Object.assign(new Error("Language is required"), { status: 400 });
  if (country && !/^[A-Z]{3}$/.test(country))
    throw Object.assign(new Error("Country must be a three-letter ISO code"), { status: 400 });
  return { ...data, language, country };
}
export const service = createCrudService(rules["individuals"], {
  includeOne: {
    pageVisits: { take: 50, orderBy: { visitDate: "desc" } },
    chats: { take: 50, orderBy: { updatedDate: "desc" } },
    contactRequests: { take: 50, orderBy: { createdDate: "desc" } },
    leads: true,
    prospects: true,
    accounts: true,
    consents: true,
  },
  sanitize: ["source"],
  beforeCreate: (data: any) => ({
    ...normalizedProfile(data),
    manualEmail: data.email?.trim().toLowerCase() || data.manualEmail?.trim().toLowerCase() || null,
    email: null,
    id: generateAdminIndividualId(),
    source: "SYSTEM",
    consents: {
      create: ["EMAIL", "SMS", "WHATSAPP", "PHONE"].map((channel) => ({
        channel,
        channelStatus: "OPTIN",
        createdBy: "SYSTEM",
        updatedBy: "SYSTEM",
      })),
    },
  }),
  beforeUpdate: (data: any) => {
    const { email: _accountEmail, ...editable } = data;
    return normalizedProfile({
      ...editable,
      ...(Object.prototype.hasOwnProperty.call(editable, "manualEmail")
        ? { manualEmail: editable.manualEmail?.trim().toLowerCase() || null }
        : {}),
    });
  },
});
