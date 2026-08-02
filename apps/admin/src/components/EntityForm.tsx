import { FormEvent, useEffect, useMemo, useState } from "react";
import type { EntityConfig, Field } from "../config/entities";
import { API_BASE_URL } from "../store/api";
import { ProductImageGallery } from "./ProductImageGallery";
function inputDate(value: unknown, datetime = false) {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  return datetime ? d.toISOString().slice(0, 16) : d.toISOString().slice(0, 10);
}
function parse(field: Field, value: string, checked: boolean) {
  if (field.kind === "boolean") return checked;
  if (field.kind === "number") return value === "" ? null : Number(value);
  if (field.kind === "date" || field.kind === "datetime")
    return value ? new Date(value).toISOString() : null;
  if (field.kind === "tags")
    return value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  if (field.kind === "keyValue") {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return null;
      return parsed
        .map((detail) => ({
          label: String(detail?.label ?? "").trim(),
          value: String(detail?.value ?? "").trim(),
        }))
        .filter((detail) => detail.label && detail.value);
    } catch {
      return null;
    }
  }
  if (field.kind === "imageAltManager") {
    try {
      return JSON.parse(value || "{}");
    } catch {
      return {};
    }
  }
  if (field.kind === "imageGallery") {
    try { const parsed = JSON.parse(value || "[]"); return Array.isArray(parsed) ? parsed.map(String).filter(Boolean).slice(0, 50) : []; } catch { return []; }
  }
  return value || null;
}
function initialValue(field: Field, value: unknown) {
  if (field.kind === "date") return inputDate(value);
  if (field.kind === "datetime") return inputDate(value, true);
  if (field.kind === "tags" && Array.isArray(value)) return value.join(", ");
  if (field.kind === "keyValue" && value && typeof value === "object")
    return JSON.stringify(value);
  if (field.kind === "imageAltManager" && value && typeof value === "object")
    return JSON.stringify(value);
  if (field.kind === "imageGallery" && Array.isArray(value)) return JSON.stringify(value);
  return String(value ?? "");
}
export function EntityForm({
  config,
  initial = {},
  onSubmit,
  submitLabel = "Save",
}: {
  config: EntityConfig;
  initial?: Record<string, unknown>;
  onSubmit: (v: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
}) {
  const [error, setError] = useState("");
  const sections = useMemo(() => {
    const map = new Map<string, Field[]>();
    config.fields
      .filter((x) => !x.hiddenInForm && !x.readOnly)
      .forEach((f) => {
        const s = f.section ?? "Information";
        map.set(s, [...(map.get(s) ?? []), f]);
      });
    return [...map.entries()];
  }, [config]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget),
      body: Record<string, unknown> = {};
    try {
      if (Number(fd.get("galleryUploadPending") ?? 0) > 0) throw new Error("Wait for all gallery images to finish uploading before saving.");
      if (Number(fd.get("galleryUploadFailed") ?? 0) > 0) throw new Error("Remove failed gallery images before saving.");
      for (const f of config.fields.filter(
        (x) => !x.hiddenInForm && !x.readOnly,
      )) {
        const el = e.currentTarget.elements.namedItem(
          f.name,
        ) as HTMLInputElement | null;
        body[f.name] = parse(
          f,
          String(fd.get(f.name) ?? ""),
          Boolean(el?.checked),
        );
        if (f.required && (body[f.name] === null || body[f.name] === "")) {
          throw new Error(`${f.label} is required.`);
        }
        if (
          f.minItems &&
          Array.isArray(body[f.name]) &&
          (body[f.name] as unknown[]).length > 0 &&
          (body[f.name] as unknown[]).length < f.minItems
        ) {
          throw new Error(`${f.label} requires at least ${f.minItems} entries.`);
        }
      }
      if (config.key === "products" && Array.isArray(body.gallery)) {
        const gallery = body.gallery as string[];
        for (let index = 0; index < 50; index++) body[`image${index + 1}`] = gallery[index] ?? null;
        delete body.gallery;
      }
      await onSubmit(body);
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not save the record");
    }
  }
  return (
    <form className="record-form" onSubmit={submit}>
      {sections.map(([section, fields]) => (
        <section className="form-section" key={section}>
          <div className="form-section-title">
            <h2>{section}</h2>
            {config.key === "products" && /^Content · (FR|DE|IT|PT|ES)$/.test(section) && (
              <GenerateSectionFromEnglishButton language={section.slice(-2)} />
            )}
          </div>
          <div className="form-grid">
            {fields.map((f) => (
              <FieldInput
                key={f.name}
                field={f}
                value={initialValue(
                  f,
                  f.kind === "imageAltManager"
                    ? initial.imageAlts
                    : f.kind === "imageGallery"
                      ? Array.from({ length: 50 }, (_, index) => initial[`image${index + 1}`]).filter(Boolean)
                    : initial[f.name],
                )}
                checked={Boolean(initial[f.name])}
              />
            ))}
          </div>
        </section>
      ))}
      {error && <div className="alert error">{error}</div>}
      <div className="form-actions">
        <button className="primary" type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
function FieldInput({
  field,
  value,
  checked,
}: {
  field: Field;
  value: string;
  checked: boolean;
}) {
  const common = { name: field.name, required: field.required };
  if (field.kind === "boolean")
    return (
      <label className="toggle-field">
        <input {...common} type="checkbox" defaultChecked={checked} />
        <span className="toggle" />
        <span>{field.label}</span>
      </label>
    );
  return (
    <label
      className={`form-field ${field.kind === "textarea" || field.kind === "keyValue" || field.kind === "imageGallery" || field.kind === "imageAltManager" ? "wide" : ""}`}
    >
      <span>
        {field.label}
        {field.required && <b> *</b>}
      </span>
      {field.kind === "enum" ? (
        <select {...common} defaultValue={value}>
          <option value="">Select…</option>
          {field.options?.map((o) => (
            <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
              {typeof o === "string" ? o.replaceAll("_", " ") : o.label}
            </option>
          ))}
        </select>
      ) : field.kind === "keyValue" ? (
        <DetailsInput field={field} value={value} />
      ) : field.kind === "imageAltManager" ? (
        <ImageAltManager field={field} value={value} />
      ) : field.kind === "imageGallery" ? (
        <ProductImageGallery name={field.name} value={value} />
      ) : field.kind === "textarea" ? (
        <textarea
          {...common}
          rows={4}
          defaultValue={value}
          placeholder={field.placeholder}
        />
      ) : field.kind === "image" ? (
        <ImageUrlInput field={field} value={value} />
      ) : (
        <input
          {...common}
          defaultValue={value}
          placeholder={
            field.kind === "tags"
              ? "Pool, Family friendly, Medina"
              : field.placeholder
          }
          type={
            field.kind === "password"
              ? "password"
              : field.kind === "number"
                ? "number"
                : field.kind === "date"
                  ? "date"
                  : field.kind === "datetime"
                    ? "datetime-local"
                    : field.kind === "email"
                      ? "email"
                      : field.kind === "phone"
                        ? "tel"
                        : "text"
          }
          step={field.kind === "number" ? "any" : undefined}
        />
      )}{" "}
      {field.kind === "tags" && <small>Separate tags with commas. If provided, add at least {field.minItems ?? 1}.</small>}
    </label>
  );
}

const translatedFieldNames = ["title", "subtitle", "priceTitle", "description", "address"] as const;

function GenerateSectionFromEnglishButton({ language }: { language: string }) {
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function generate(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.closest("form.record-form") as HTMLFormElement | null;
    if (!form) return;
    const formData = new FormData(form);
    const detailsRaw = String(formData.get("detailsEN") ?? "").trim();
    let details: DetailRow[] = [];
    try {
      details = JSON.parse(detailsRaw || "[]");
    } catch {
      setFailed(true);
      setMessage("English details are not valid.");
      return;
    }
    const source = {
      title: String(formData.get("titleEN") ?? "").trim(),
      subtitle: String(formData.get("subtitleEN") ?? "").trim(),
      priceTitle: String(formData.get("priceTitleEN") ?? "").trim(),
      description: String(formData.get("descriptionEN") ?? "").trim(),
      address: String(formData.get("addressEN") ?? "").trim(),
      tags: String(formData.get("tagsEN") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
      details,
    };
    if (!source.title || !source.description) {
      setFailed(true);
      setMessage("Add at least the English title and description first.");
      return;
    }
    setGenerating(true);
    setFailed(false);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/products/translate-content`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLanguage: language.toLowerCase(), source }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Unable to generate this language");
      const content = payload.content ?? {};
      for (const fieldName of translatedFieldNames) {
        const input = form.elements.namedItem(`${fieldName}${language}`) as HTMLInputElement | HTMLTextAreaElement | null;
        if (!input) continue;
        input.value = String(content[fieldName] ?? "");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const tagsInput = form.elements.namedItem(`tags${language}`) as HTMLInputElement | null;
      if (tagsInput) {
        tagsInput.value = Array.isArray(content.tags) ? content.tags.join(", ") : "";
        tagsInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      window.dispatchEvent(new CustomEvent("admin:product-translation", {
        detail: { fieldName: `details${language}`, details: content.details ?? [] },
      }));
      setMessage("Generated — review and edit anything you like.");
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Unable to generate this language");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="translation-action">
      {message && <small className={failed ? "error" : "success"}>{message}</small>}
      <button type="button" className="secondary" disabled={generating} onClick={generate}>
        {generating ? "Generating…" : "Generate from English"}
      </button>
    </div>
  );
}

const altLanguages = ["en", "fr", "de", "it", "pt", "es"] as const;

function ImageAltManager({ field, value }: { field: Field; value: string }) {
  const initial = useMemo(() => {
    try {
      const parsed = JSON.parse(value || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }, [value]);
  const [alts, setAlts] = useState<Record<string, Record<string, string>>>(initial);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  useEffect(() => {
    const reorder = (event: Event) => {
      const mapping = (event as CustomEvent<{ mapping: Record<string, string> }>).detail?.mapping ?? {};
      setAlts(current => {
        const next: Record<string, Record<string, string>> = {};
        if (current.thumbnail) next.thumbnail = current.thumbnail;
        for (const [oldKey, newKey] of Object.entries(mapping)) if (current[oldKey]) next[newKey] = current[oldKey];
        return next;
      });
    };
    window.addEventListener("admin:product-gallery-order", reorder);
    return () => window.removeEventListener("admin:product-gallery-order", reorder);
  }, []);

  async function generate() {
    const form = document.querySelector("form.record-form") as HTMLFormElement | null;
    if (!form) return;
    const formData = new FormData(form);
    let gallery: string[] = [];
    try { const parsed = JSON.parse(String(formData.get("gallery") ?? "[]")); gallery = Array.isArray(parsed) ? parsed.map(String).filter(Boolean).slice(0, 50) : []; } catch { gallery = []; }
    const images = [
      { key: "thumbnail", url: String(formData.get("thumbnail") ?? "").trim() },
      ...gallery.map((url, index) => ({ key: `image${index + 1}`, url })),
    ].filter((image) => image.url);
    if (!images.length) {
      setGenerationError("Add at least one image first.");
      return;
    }
    const content = Object.fromEntries(altLanguages.map((language) => {
      const suffix = language.toUpperCase();
      return [language, {
        title: String(formData.get(`title${suffix}`) ?? "").trim(),
        subtitle: String(formData.get(`subtitle${suffix}`) ?? "").trim(),
        description: String(formData.get(`description${suffix}`) ?? "").trim(),
        tags: String(formData.get(`tags${suffix}`) ?? "").trim(),
        details: String(formData.get(`details${suffix}`) ?? "").trim(),
      }];
    }));
    setGenerating(true);
    setGenerationError("");
    try {
      const response = await fetch(`${API_BASE_URL}/products/generate-alt-text`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, content }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Unable to generate alt text");
      setAlts((current) => {
        const next = { ...current };
        for (const [imageKey, translations] of Object.entries(payload.alts ?? {})) {
          next[imageKey] = { ...(next[imageKey] ?? {}), ...(translations as Record<string, string>) };
        }
        return next;
      });
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Unable to generate alt text");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="image-alt-manager">
      <input type="hidden" name={field.name} value={JSON.stringify(alts)} />
      <div className="image-alt-manager-head">
        <div><b>Visual image alt text by language</b><small>Analyzes each Cloudflare image with the localized product context and creates a distinct, editable alt for every language.</small></div>
        <button type="button" className="secondary" disabled={generating} onClick={generate}>
          {generating ? "Generating…" : "Generate AI suggestions"}
        </button>
      </div>
      {generationError && <small className="flow-error">{generationError}</small>}
      {!Object.keys(alts).length ? (
        <div className="image-alt-empty">No alt text has been generated yet.</div>
      ) : (
        <div className="image-alt-language-list">
          {altLanguages.map((language) => {
            const entries = Object.entries(alts).filter(([, translations]) => translations?.[language]);
            if (!entries.length) return null;
            return <section key={language}>
              <h3>{language.toUpperCase()}</h3>
              <div>{entries.map(([imageKey, translations]) => <label key={imageKey}>
                <span>{imageKey === "thumbnail" ? "Thumbnail" : imageKey.replace("image", "Image ")}</span>
                <input value={translations[language] ?? ""} maxLength={160} onChange={(event) => setAlts((current) => ({
                  ...current,
                  [imageKey]: { ...(current[imageKey] ?? {}), [language]: event.target.value },
                }))} />
              </label>)}</div>
            </section>;
          })}
        </div>
      )}
    </div>
  );
}

function ImageUrlInput({ field, value }: { field: Field; value: string }) {
  const [currentUrl, setCurrentUrl] = useState(value);
  const [imageAvailable, setImageAvailable] = useState(Boolean(value));

  return (
    <div className="image-url-editor">
      <input
        name={field.name}
        required={field.required}
        value={currentUrl}
        placeholder="https://…"
        onChange={(event) => {
          setCurrentUrl(event.target.value);
          setImageAvailable(Boolean(event.target.value.trim()));
        }}
      />
      <span
        className={`image-preview-trigger ${imageAvailable ? "available" : ""}`}
        tabIndex={imageAvailable ? 0 : -1}
        aria-label={imageAvailable ? `Preview ${field.label}` : "Enter an image URL to preview"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.7" />
        </svg>
        {currentUrl.trim() && (
          <span className="image-preview-popover">
            <img
              src={currentUrl}
              alt={`${field.label} preview`}
              onLoad={() => setImageAvailable(true)}
              onError={() => setImageAvailable(false)}
            />
          </span>
        )}
      </span>
    </div>
  );
}

type DetailRow = { label: string; value: string };

function DetailsInput({ field, value }: { field: Field; value: string }) {
  const minimum = field.minItems ?? 1;
  const maximum = field.maxItems ?? 10;
  const initialRows = useMemo(() => {
    let rows: DetailRow[] = [];
    try {
      const parsed = JSON.parse(value || "null");
      if (Array.isArray(parsed)) {
        rows = parsed.map((item) => ({
          label: String(item?.label ?? ""),
          value: String(item?.value ?? ""),
        }));
      } else if (parsed && typeof parsed === "object") {
        rows = Object.entries(parsed).map(([label, detailValue]) => ({
          label,
          value: String(detailValue ?? ""),
        }));
      }
    } catch {
      rows = [];
    }
    while (rows.length < minimum) rows.push({ label: "", value: "" });
    return rows.slice(0, maximum);
  }, [maximum, minimum, value]);
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    function applyTranslation(event: Event) {
      const detail = (event as CustomEvent<{ fieldName: string; details: DetailRow[] }>).detail;
      if (detail?.fieldName !== field.name || !Array.isArray(detail.details)) return;
      const translatedRows = detail.details
        .map((row) => ({ label: String(row?.label ?? ""), value: String(row?.value ?? "") }))
        .slice(0, maximum);
      while (translatedRows.length < minimum) translatedRows.push({ label: "", value: "" });
      setRows(translatedRows);
    }
    window.addEventListener("admin:product-translation", applyTranslation);
    return () => window.removeEventListener("admin:product-translation", applyTranslation);
  }, [field.name, maximum, minimum]);

  function updateRow(index: number, key: keyof DetailRow, nextValue: string) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: nextValue } : row,
      ),
    );
  }

  return (
    <div className="details-editor">
      <input type="hidden" name={field.name} value={JSON.stringify(rows)} />
      {rows.map((row, index) => (
        <div className="detail-editor-row" key={index}>
          <span className="detail-editor-index">{index + 1}</span>
          <input
            value={row.label}
            required={field.required}
            placeholder="Label, e.g. Cuisine"
            onChange={(event) => updateRow(index, "label", event.target.value)}
          />
          <input
            value={row.value}
            required={field.required}
            placeholder="Value, e.g. Moroccan and international"
            onChange={(event) => updateRow(index, "value", event.target.value)}
          />
          <button
            type="button"
            className="detail-editor-remove"
            disabled={rows.length <= minimum}
            onClick={() =>
              setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))
            }
            aria-label={`Remove detail ${index + 1}`}
          >
            ×
          </button>
        </div>
      ))}
      <div className="detail-editor-footer">
        <small>{minimum}–{maximum} label and value pairs.</small>
        <button
          type="button"
          className="secondary"
          disabled={rows.length >= maximum}
          onClick={() => setRows((current) => [...current, { label: "", value: "" }])}
        >
          + Add detail
        </button>
      </div>
    </div>
  );
}
