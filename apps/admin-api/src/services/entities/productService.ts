import { rules } from "../../config/entities.js";
import { createCrudService } from "../baseCrudService.js";

const languages = ["EN", "FR", "DE", "IT", "PT", "ES"] as const;

function badRequest(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

function requiredText(data: any, field: string) {
  if (typeof data[field] !== "string" || !data[field].trim()) {
    badRequest(`${field} is required.`);
  }
  data[field] = data[field].trim();
}

function normalizeProduct(data: any) {
  const normalized = { ...data };
  requiredText(normalized, "uniqueCode");
  requiredText(normalized, "type");
  requiredText(normalized, "thumbnail");

  if (
    normalized.priceEuro === null ||
    normalized.priceEuro === undefined ||
    normalized.priceEuro === "" ||
    !Number.isFinite(Number(normalized.priceEuro))
  ) {
    badRequest("priceEuro is required and must be a valid number.");
  }
  normalized.priceEuro = Number(normalized.priceEuro);

  for (const language of languages) {
    for (const prefix of [
      "title",
      "subtitle",
      "priceTitle",
      "description",
      "address",
    ]) {
      requiredText(normalized, `${prefix}${language}`);
    }

    const tagsField = `tags${language}`;
    if (
      !Array.isArray(normalized[tagsField]) ||
      normalized[tagsField].filter(
        (tag: unknown) => typeof tag === "string" && tag.trim(),
      ).length < 2
    ) {
      badRequest(`${tagsField} requires at least 2 tags.`);
    }
    normalized[tagsField] = normalized[tagsField].map((tag: string) =>
      tag.trim(),
    );

    const detailsField = `details${language}`;
    if (
      !Array.isArray(normalized[detailsField]) ||
      normalized[detailsField].length < 3 ||
      normalized[detailsField].length > 10
    ) {
      badRequest(`${detailsField} requires between 3 and 10 details.`);
    }
    normalized[detailsField] = normalized[detailsField].map(
      (detail: unknown, index: number) => {
        if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
          badRequest(`${detailsField}[${index}] must contain a label and value.`);
        }
        const label = String((detail as any).label ?? "").trim();
        const value = String((detail as any).value ?? "").trim();
        if (!label || !value) {
          badRequest(`${detailsField}[${index}] must contain a label and value.`);
        }
        return { label, value };
      },
    );
  }

  return normalized;
}

export const service = createCrudService(rules["products"], {
  beforeCreate: normalizeProduct,
  beforeUpdate: normalizeProduct,
});
