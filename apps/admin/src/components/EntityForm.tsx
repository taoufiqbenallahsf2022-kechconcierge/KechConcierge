import { FormEvent, useMemo, useState } from "react";
import type { EntityConfig, Field } from "../config/entities";
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
  return value || null;
}
function initialValue(field: Field, value: unknown) {
  if (field.kind === "date") return inputDate(value);
  if (field.kind === "datetime") return inputDate(value, true);
  if (field.kind === "tags" && Array.isArray(value)) return value.join(", ");
  if (field.kind === "keyValue" && value && typeof value === "object")
    return JSON.stringify(value);
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
          (body[f.name] as unknown[]).length < f.minItems
        ) {
          throw new Error(`${f.label} requires at least ${f.minItems} entries.`);
        }
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
          <h2>{section}</h2>
          <div className="form-grid">
            {fields.map((f) => (
              <FieldInput
                key={f.name}
                field={f}
                value={initialValue(f, initial[f.name])}
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
      className={`form-field ${field.kind === "textarea" || field.kind === "keyValue" ? "wide" : ""}`}
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
      ) : field.kind === "textarea" ? (
        <textarea
          {...common}
          rows={4}
          defaultValue={value}
          placeholder={field.placeholder}
        />
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
      {field.kind === "image" && value && (
        <img className="form-image-preview" src={value} alt="Preview" />
      )}
      {field.kind === "tags" && <small>Separate tags with commas. At least {field.minItems ?? 1} are required.</small>}
    </label>
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
