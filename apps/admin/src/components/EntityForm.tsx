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
    const out: Record<string, string> = {};
    value.split("\n").forEach((line) => {
      const i = line.indexOf(":");
      if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });
    return Object.keys(out).length ? out : null;
  }
  return value || null;
}
function initialValue(field: Field, value: unknown) {
  if (field.kind === "date") return inputDate(value);
  if (field.kind === "datetime") return inputDate(value, true);
  if (field.kind === "tags" && Array.isArray(value)) return value.join(", ");
  if (field.kind === "keyValue" && value && typeof value === "object")
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join("\n");
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
            <option key={o} value={o}>
              {o.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      ) : field.kind === "textarea" || field.kind === "keyValue" ? (
        <textarea
          {...common}
          rows={field.kind === "keyValue" ? 5 : 4}
          defaultValue={value}
          placeholder={
            field.kind === "keyValue"
              ? "One detail per line, for example: Bedrooms: 4"
              : field.placeholder
          }
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
      {field.kind === "tags" && <small>Separate tags with commas.</small>}
      {field.kind === "keyValue" && (
        <small>Use “Label: Value”, one detail per line.</small>
      )}
    </label>
  );
}
