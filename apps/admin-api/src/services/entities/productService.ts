import { rules } from "../../config/entities.js";
import { createCrudService } from "../baseCrudService.js";

const languages = ["EN", "FR", "DE", "IT", "PT", "ES"] as const;

function badRequest(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

async function fetchOpenAI(init: RequestInit) {
  const attempts = 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch("https://api.openai.com/v1/chat/completions", init);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 750));
      }
    }
  }
  const cause = lastError instanceof Error && lastError.cause instanceof Error
    ? lastError.cause.message
    : lastError instanceof Error ? lastError.message : "Connection failed";
  throw Object.assign(
    new Error(`OpenAI could not be reached after ${attempts} attempts: ${cause}`),
    { status: 503, cause: lastError },
  );
}

function requiredText(data: any, field: string) {
  if (typeof data[field] !== "string" || !data[field].trim()) {
    badRequest(`${field} is required.`);
  }
  data[field] = data[field].trim();
}

function normalizeProduct(data: any, requireSchemaFields: boolean) {
  const normalized = { ...data };
  const imageAlts: Record<string, Record<string, string>> =
    normalized.imageAlts && typeof normalized.imageAlts === "object"
      ? { ...normalized.imageAlts }
      : {};
  if (normalized.imageAltsEditor && typeof normalized.imageAltsEditor === "object") {
    for (const [imageKey, translations] of Object.entries(normalized.imageAltsEditor)) {
      if (!/^(thumbnail|image\d+)$/.test(imageKey) || !translations || typeof translations !== "object") continue;
      imageAlts[imageKey] = Object.fromEntries(
        Object.entries(translations as Record<string, unknown>)
          .map(([language, alt]) => [language.toLowerCase(), String(alt ?? "").trim()])
          .filter(([, alt]) => alt),
      );
    }
  }
  delete normalized.imageAltsEditor;
  for (const key of Object.keys(normalized)) {
    if (!/^(thumbnail|image\d+)Alt$/.test(key)) continue;
    const sourceField = key.slice(0, -3);
    const raw = normalized[key];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      imageAlts[sourceField] = Object.fromEntries(
        Object.entries(raw)
          .map(([language, alt]) => [language.toLowerCase(), String(alt ?? "").trim()])
          .filter(([, alt]) => alt),
      );
    }
    delete normalized[key];
  }
  normalized.imageAlts = imageAlts;
  if (requireSchemaFields) {
    requiredText(normalized, "uniqueCode");
    requiredText(normalized, "type");
    requiredText(normalized, "thumbnail");
  } else {
    for (const field of ["uniqueCode", "type", "thumbnail"]) {
      if (field in normalized) requiredText(normalized, field);
    }
  }

  if (normalized.priceEuro !== null && normalized.priceEuro !== undefined && normalized.priceEuro !== "") {
    if (!Number.isFinite(Number(normalized.priceEuro))) {
      badRequest("priceEuro must be a valid number.");
    }
    normalized.priceEuro = Number(normalized.priceEuro);
  }

  for (const language of languages) {
    for (const prefix of [
      "title",
      "subtitle",
      "priceTitle",
      "description",
      "address",
    ]) {
      const field = `${prefix}${language}`;
      if (field in normalized && normalized[field] !== null && normalized[field] !== "") {
        requiredText(normalized, field);
      }
    }

    const tagsField = `tags${language}`;
    if (tagsField in normalized) {
      if (!Array.isArray(normalized[tagsField])) {
        badRequest(`${tagsField} must be a list of tags.`);
      }
      const tags = normalized[tagsField].filter(
        (tag: unknown) => typeof tag === "string" && tag.trim(),
      );
      if (tags.length === 1) {
        badRequest(`${tagsField} requires at least 2 tags when provided.`);
      }
      normalized[tagsField] = tags.map((tag: string) => tag.trim());
    }

    const detailsField = `details${language}`;
    if (!(detailsField in normalized)) continue;
    if (!Array.isArray(normalized[detailsField])) {
      badRequest(`${detailsField} must be a list of details.`);
    }
    if (normalized[detailsField].length > 0 &&
      (normalized[detailsField].length < 3 || normalized[detailsField].length > 10)) {
      badRequest(`${detailsField} requires between 3 and 10 details when provided.`);
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
  beforeCreate: (data) => normalizeProduct(data, true),
  beforeUpdate: (data) => normalizeProduct(data, false),
});

async function downloadProductImage(image: { key: string; url: string }) {
  let url: URL | undefined;
  try {
    url = new URL(image.url);
  } catch {
    badRequest(`${image.key} has an invalid image URL.`);
  }
  if (!url || url.protocol !== "https:" || url.hostname !== "imagedelivery.net") {
    badRequest(`${image.key} must use a public HTTPS imagedelivery.net URL.`);
  }
  const response = await fetch(url, {
    redirect: "error",
    headers: { Accept: "image/webp,image/png,image/jpeg" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw Object.assign(new Error(`Could not download ${image.key} from Cloudflare (${response.status}).`), { status: 502 });
  }
  const mimeType = (String(response.headers.get("content-type") ?? "").split(";")[0] ?? "").toLowerCase();
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(mimeType)) {
    badRequest(`${image.key} returned unsupported content type ${mimeType || "unknown"}.`);
  }
  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize > 10 * 1024 * 1024) badRequest(`${image.key} exceeds the 10 MB analysis limit.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 10 * 1024 * 1024) badRequest(`${image.key} exceeds the 10 MB analysis limit.`);
  return { key: image.key, dataUrl: `data:${mimeType};base64,${bytes.toString("base64")}` };
}

export async function generateProductAltText(body: any) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("AI alt generation is not configured"), { status: 503 });
  }
  const images = (Array.isArray(body?.images) ? body.images : [])
    .map((image: any) => ({ key: String(image?.key ?? ""), url: String(image?.url ?? "").trim() }))
    .filter((image: any) => /^(thumbnail|image\d+)$/.test(image.key) && image.url)
    .slice(0, 51);
  if (!images.length) badRequest("At least one image field is required.");
  const content = body?.content && typeof body.content === "object" ? body.content : {};
  const readyContent = Object.fromEntries(
    languages
      .map((language) => language.toLowerCase())
      .map((language) => [language, content[language]])
      .filter(([, value]: any) =>
        value && value.title && value.subtitle && value.description,
      ),
  );
  if (!Object.keys(readyContent).length) {
    badRequest("Complete title, subtitle and description for at least one language first.");
  }

  const generalContent = Object.fromEntries(
    Object.entries(readyContent).map(([language, value]: [string, any]) => [language, {
      title: String(value.title ?? "").trim(),
      subtitle: String(value.subtitle ?? "").trim(),
      description: String(value.description ?? "").trim(),
    }]),
  );

  const alts: Record<string, Record<string, string>> = {};
  for (let offset = 0; offset < images.length; offset += 5) {
    const batch = await Promise.all(images.slice(offset, offset + 5).map(downloadProductImage));
    const response = await fetchOpenAI({
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_ALT_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
        temperature: 0.15,
        response_format: { type: "json_object" },
        messages: [{
          role: "system",
          content: `Analyze every supplied image and write an accurate, concise HTML alt text for it in each supplied language. Describe what is genuinely visible and use the localized product title, subtitle and description only for context. Correctly identify logos, interiors, exteriors, pools, food, vehicles, people, or other visible subjects. Never add an amenity or fact that is not visible. Avoid keyword stuffing and phrases such as "image of". Maximum 125 characters. Return only JSON shaped {\"alts\":{\"image1\":{\"en\":\"...\",\"fr\":\"...\"}}}.`,
        }, {
          role: "user",
          content: [
            { type: "text", text: `Localized product context: ${JSON.stringify(generalContent)}` },
            ...batch.flatMap((image) => [
              { type: "text", text: `Image field: ${image.key}` },
              { type: "image_url", image_url: { url: image.dataUrl, detail: "low" } },
            ]),
          ],
        }],
      }),
    });
    const payload: any = await response.json();
    if (!response.ok) {
      throw Object.assign(new Error(payload?.error?.message || "OpenAI image analysis failed"), { status: 502 });
    }
    const parsed = JSON.parse(payload?.choices?.[0]?.message?.content || "{}");
    const allowedBatch = new Set(batch.map((image) => image.key));
    for (const [imageKey, translations] of Object.entries(parsed?.alts ?? {})) {
      if (!allowedBatch.has(imageKey)) continue;
      alts[imageKey] = Object.fromEntries(
        Object.entries(translations as Record<string, unknown>)
          .map(([language, alt]) => [language.toLowerCase(), String(alt ?? "").trim().slice(0, 125)] as [string, string])
          .filter(([language, alt]) => language in generalContent && alt),
      );
    }
  }
  if (!Object.keys(alts).length) {
    throw Object.assign(new Error("OpenAI returned no usable alt text"), { status: 502 });
  }
  return { alts };
}

const translationLanguages: Record<string, string> = {
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  es: "Spanish",
};

export async function generateProductTranslation(body: any) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("AI translation is not configured"), { status: 503 });
  }
  const targetLanguage = String(body?.targetLanguage ?? "").toLowerCase();
  const languageName = translationLanguages[targetLanguage];
  if (!languageName) badRequest("Unsupported target language.");
  const source = body?.source && typeof body.source === "object" ? body.source : {};
  const title = String(source.title ?? "").trim();
  const description = String(source.description ?? "").trim();
  if (!title || !description) badRequest("English title and description are required.");

  const safeSource = {
    title,
    subtitle: String(source.subtitle ?? "").trim(),
    priceTitle: String(source.priceTitle ?? "").trim(),
    description,
    address: String(source.address ?? "").trim(),
    tags: (Array.isArray(source.tags) ? source.tags : []).map((tag: unknown) => String(tag).trim()).filter(Boolean).slice(0, 20),
    details: (Array.isArray(source.details) ? source.details : []).map((detail: any) => ({
      label: String(detail?.label ?? "").trim(),
      value: String(detail?.value ?? "").trim(),
    })).filter((detail: any) => detail.label && detail.value).slice(0, 10),
  };

  const response = await fetchOpenAI({
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TRANSLATION_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [{
        role: "system",
        content: `Translate product content from English into ${languageName}. Use simple, natural language. Preserve proper names, addresses, numbers, prices and meaning. Do not add facts, marketing claims or extra details. Translate every non-empty value and preserve empty values, tag count and detail count. Return only JSON shaped {"content":{"title":"","subtitle":"","priceTitle":"","description":"","address":"","tags":[""],"details":[{"label":"","value":""}]}}.`,
      }, {
        role: "user",
        content: JSON.stringify(safeSource),
      }],
    }),
  });
  const payload: any = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error(payload?.error?.message || "OpenAI translation failed"), { status: 502 });
  }
  let generated: any;
  try {
    generated = JSON.parse(payload?.choices?.[0]?.message?.content || "{}").content;
  } catch {
    throw Object.assign(new Error("OpenAI returned an invalid translation"), { status: 502 });
  }
  if (!generated || typeof generated !== "object") {
    throw Object.assign(new Error("OpenAI returned an incomplete translation"), { status: 502 });
  }
  return { content: {
    title: String(generated.title ?? "").trim(),
    subtitle: String(generated.subtitle ?? "").trim(),
    priceTitle: String(generated.priceTitle ?? "").trim(),
    description: String(generated.description ?? "").trim(),
    address: String(generated.address ?? "").trim(),
    tags: (Array.isArray(generated.tags) ? generated.tags : []).map((tag: unknown) => String(tag).trim()).filter(Boolean).slice(0, safeSource.tags.length),
    details: (Array.isArray(generated.details) ? generated.details : []).map((detail: any) => ({
      label: String(detail?.label ?? "").trim(),
      value: String(detail?.value ?? "").trim(),
    })).filter((detail: any) => detail.label && detail.value).slice(0, safeSource.details.length),
  } };
}
