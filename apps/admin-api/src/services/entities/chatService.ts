import { rules } from "../../config/entities.js";
import { createCrudService, helpers } from "../baseCrudService.js";
export const service = createCrudService(rules["chats"], {
  includeList: {
    individual: { select: { firstName: true, lastName: true, email: true } },
    _count: {
      select: {
        messages: {
          where: {
            isRead: false,
            senderType: {
              in: ["VISITOR", "INDIVIDUAL", "LEAD", "PROSPECT", "ACCOUNT"],
            },
          },
        },
      },
    },
  },
  includeOne: {
    messages: { orderBy: { sendTime: "asc" } },
    individual: { select: { firstName: true, lastName: true, email: true } },
    advisor: { select: { firstName: true, lastName: true, email: true } },
  },
});
