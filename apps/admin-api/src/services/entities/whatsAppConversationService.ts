import { rules } from "../../config/entities.js";
import { createCrudService, helpers } from "../baseCrudService.js";
export const service = createCrudService(rules["whatsapp-conversations"], {
  includeOne: { messages: { orderBy: { sentAt: "asc" } } },
});
