import { rules } from "../../config/entities.js";
import { createCrudService, helpers } from "../baseCrudService.js";
export const service = createCrudService(rules["chats"], {
  includeOne: { messages: { orderBy: { sendTime: "asc" } } },
});
