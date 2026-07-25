import { rules } from "../../config/entities.js";
import { createCrudService, helpers } from "../baseCrudService.js";
export const service = createCrudService(rules["leads"], {
  beforeCreate: (data: any) => ({ ...data, id: helpers.randomUUID() }),
});
