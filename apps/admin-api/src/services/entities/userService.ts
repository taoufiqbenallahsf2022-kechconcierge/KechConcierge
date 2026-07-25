import { rules } from "../../config/entities.js";
import { createCrudService, helpers } from "../baseCrudService.js";
export const service = createCrudService(rules["users"], {
  beforeCreate: async (data: any) => {
    if (!data.password)
      throw Object.assign(new Error("password is required"), { status: 400 });
    const passwordHash = await helpers.bcrypt.hash(data.password, 12);
    delete data.password;
    return {
      ...data,
      email:
        typeof data.email === "string"
          ? data.email.trim().toLowerCase()
          : data.email,
      passwordHash,
    };
  },
  beforeUpdate: async (data: any) => {
    if (data.password) {
      data.passwordHash = await helpers.bcrypt.hash(data.password, 12);
      delete data.password;
    }
    if (typeof data.email === "string")
      data.email = data.email.trim().toLowerCase();
    return data;
  },
});
