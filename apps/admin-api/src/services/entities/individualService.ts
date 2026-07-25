import { rules } from "../../config/entities.js";
import { createCrudService, helpers } from "../baseCrudService.js";
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
    ...data,
    id: helpers.randomUUID(),
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
});
