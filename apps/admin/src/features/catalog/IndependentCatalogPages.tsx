import { FormEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { EntityCreateView } from "../../components/crm/EntityCreateView";
import { EntityDetailShell } from "../../components/crm/EntityDetailShell";
import { EntityListView } from "../../components/crm/EntityListView";
import { entityMap } from "../../config/entities";
import { API_BASE_URL, useGetOneQuery } from "../../store/api";

const languages = ["EN", "FR", "DE", "IT", "PT", "ES"] as const;
type PlanDomain = "beach-clubs" | "night-clubs" | "activities" | "transportation" | "packs";
const pricingUnits: Record<PlanDomain, Array<{ value: string; label: string }>> = {
  "beach-clubs": [
    { value: "PER_PERSON", label: "Per person" }, { value: "PER_ADULT", label: "Per adult" }, { value: "PER_CHILD", label: "Per child" },
    { value: "PER_SUNBED", label: "Per sunbed" }, { value: "PER_TABLE", label: "Per table" }, { value: "PER_CABANA", label: "Per cabana" },
    { value: "HALF_DAY", label: "Half day" }, { value: "FULL_DAY", label: "Full day" }, { value: "FIXED", label: "Fixed price" },
  ],
  "night-clubs": [
    { value: "PER_PERSON", label: "Per person" }, { value: "PER_TABLE", label: "Per table" }, { value: "FIXED", label: "Fixed price" },
  ],
  packs: [
    { value: "PER_PERSON", label: "Per person" }, { value: "PER_GROUP", label: "Per group" }, { value: "PER_VEHICLE", label: "Per vehicle" },
    { value: "PER_HOUR", label: "Per hour" }, { value: "HALF_DAY", label: "Half day" }, { value: "FULL_DAY", label: "Full day" }, { value: "FIXED", label: "Fixed price" },
  ],
  activities: [
    { value: "PER_PERSON", label: "Per person" }, { value: "PER_ADULT", label: "Per adult" }, { value: "PER_CHILD", label: "Per child" },
    { value: "PER_GROUP", label: "Per group" }, { value: "HALF_DAY", label: "Half day" }, { value: "FULL_DAY", label: "Full day" }, { value: "FIXED", label: "Fixed price" },
  ],
  transportation: [
    { value: "PER_VEHICLE", label: "Per vehicle" }, { value: "PER_PERSON", label: "Per person" }, { value: "PER_HOUR", label: "Per hour" },
    { value: "PER_TRIP", label: "Per trip" }, { value: "HALF_DAY", label: "Half day" }, { value: "FULL_DAY", label: "Full day" }, { value: "FIXED", label: "Fixed price" },
  ],
};
const pricingUnitLabel = (domain: PlanDomain, value?: string) => pricingUnits[domain].find(option => option.value === value)?.label ?? "Not specified";

export function catalogPages(entity: string, supportsPlans = false) {
  const config = entityMap[entity];
  return {
    List: () => <EntityListView entity={entity} config={config} />,
    Create: () => <EntityCreateView entity={entity} config={config} />,
    Detail: () => {
      const { id = "" } = useParams();
      const { data, isLoading, error, refetch } = useGetOneQuery({ entity, id });
      if (isLoading) return <div className="empty-state">Loading record…</div>;
      if (error || !data) return <div className="empty-state">Record not found.</div>;
      const images = Array.isArray(data.images) ? data.images as Array<Record<string, unknown>> : [];
      const imageFields = Object.fromEntries(images.map((image, index) => [`image${index + 1}`, image.url]));
      const relationAlts = Object.fromEntries(images.map((image, index) => [`image${index + 1}`, Object.fromEntries(languages.map(language => [language.toLowerCase(), image[`alt${language}`] ?? ""]))]));
      const formData = { ...data, ...imageFields, imageAlts: data.imageAlts ?? relationAlts };
      return <EntityDetailShell entity={entity} id={id} config={config} data={formData}>
        {supportsPlans && <PlanManager domain={entity as PlanDomain} parentId={id} plans={(data.plans as Plan[]) ?? []} refresh={refetch} />}
      </EntityDetailShell>;
    },
  };
}

type PlanOption = { id: string; order: number; titleEN?: string; titleFR?: string; titleDE?: string; titleIT?: string; titlePT?: string; titleES?: string };
type Plan = { id: string; uniqueCode: string; salePrice: string | number; internalCost?: string | number | null; currency: string; pricingUnit?: string; serviceType?: string; origin?: string; destination?: string; durationMinutes?: number; titleEN?: string; titleFR?: string; titleDE?: string; titleIT?: string; titlePT?: string; titleES?: string; descriptionEN?: string; descriptionFR?: string; descriptionDE?: string; descriptionIT?: string; descriptionPT?: string; descriptionES?: string; options?: PlanOption[] };

function PlanManager({ domain, parentId, plans, refresh }: { domain: PlanDomain; parentId: string; plans: Plan[]; refresh: () => unknown }) {
  const [open, setOpen] = useState(false);
  const [optionPlanId, setOptionPlanId] = useState<string | null>(null);
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [editOptionId, setEditOptionId] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState("");
  async function request(path: string, init: RequestInit) {
    const response = await fetch(`${API_BASE_URL}/${domain}${path}`, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } });
    const payload = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(payload?.message ?? "Unable to save plan");
    return payload;
  }
  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body: Record<string, unknown> = {
      uniqueCode: form.get("uniqueCode"), salePrice: form.get("salePrice"), internalCost: form.get("internalCost"),
      currency: form.get("currency"), pricingUnit: form.get("pricingUnit"), serviceType: form.get("serviceType") || undefined,
      origin: form.get("origin") || undefined, destination: form.get("destination") || undefined,
      durationMinutes: form.get("durationMinutes") ? Number(form.get("durationMinutes")) : undefined,
    };
    for (const language of languages) { body[`title${language}`] = form.get(`title${language}`); body[`description${language}`] = form.get(`description${language}`); }
    try { await request(`/${parentId}/plans`, { method: "POST", body: JSON.stringify(body) }); formElement.reset(); setOpen(false); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create plan"); }
  }
  async function saveOption(planId: string, event: FormEvent<HTMLFormElement>, optionId?: string) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); const body: Record<string, unknown> = {};
    for (const language of languages) body[`title${language}`] = form.get(`title${language}`);
    try { await request(optionId ? `/plan-options/${optionId}` : `/plans/${planId}/options`, { method: optionId ? "PATCH" : "POST", body: JSON.stringify(body) }); formElement.reset(); setOptionPlanId(null); setEditOptionId(null); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save inclusion"); }
  }
  async function translateInclusion(form: HTMLFormElement) {
    const english = (form.elements.namedItem("titleEN") as HTMLInputElement | null)?.value.trim();
    if (!english) { setError("Enter the English inclusion first."); return; }
    setTranslating(true); setError("");
    try {
      await Promise.all(languages.filter(language => language !== "EN").map(async language => {
        const response = await fetch(`${API_BASE_URL}/products/translate-content`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetLanguage: language.toLowerCase(), source: { title: english, description: `Included service: ${english}`, subtitle: "", priceTitle: "", address: "", tags: [], details: [] } }) });
        const payload = await response.json(); if (!response.ok) throw new Error(payload.message ?? `Unable to generate ${language}`);
        const input = form.elements.namedItem(`title${language}`) as HTMLInputElement | null; if (input) input.value = payload.content?.title ?? "";
      }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to translate inclusion"); }
    finally { setTranslating(false); }
  }
  async function updatePlan(planId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const body: Record<string, unknown> = { uniqueCode: form.get("uniqueCode"), salePrice: form.get("salePrice"), internalCost: form.get("internalCost"), currency: form.get("currency"), pricingUnit: form.get("pricingUnit"), serviceType: form.get("serviceType") || undefined, origin: form.get("origin") || undefined, destination: form.get("destination") || undefined, durationMinutes: form.get("durationMinutes") ? Number(form.get("durationMinutes")) : null };
    for (const language of languages) { body[`title${language}`] = form.get(`title${language}`); body[`description${language}`] = form.get(`description${language}`); }
    try { await request(`/plans/${planId}`, { method: "PATCH", body: JSON.stringify(body) }); setEditPlanId(null); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update plan"); }
  }
  return <section className="form-section catalog-plans">
    <div className="form-section-title"><div><div className="eyebrow">Commercial offers</div><h2>Plans</h2></div><button type="button" className="primary" onClick={() => setOpen(value => !value)}>+ Add plan</button></div>
    {error && <div className="alert error">{error}</div>}
    {open && <form className="record-form plan-create" onSubmit={createPlan}>
      <div className="form-grid">
        <label className="form-field"><span>Unique code *</span><input name="uniqueCode" required /></label>
        <label className="form-field"><span>Customer price *</span><input name="salePrice" type="number" min="0" step="0.01" required /></label>
        <label className="form-field"><span>Supplier/internal cost (optional, private)</span><input name="internalCost" type="number" min="0" step="0.01" /><small>What the business pays the supplier. It is never shown on the website; leave empty if you do not track margin.</small></label>
        <label className="form-field"><span>Currency</span><input name="currency" value="EUR" readOnly /></label>
        <label className="form-field"><span>Pricing unit</span><select name="pricingUnit" defaultValue=""><option value="">Select pricing unit…</option>{pricingUnits[domain].map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        {domain === "transportation" && <><label className="form-field"><span>Service type</span><input name="serviceType" placeholder="TRANSFER, FULL_DAY_DRIVER…" /></label><label className="form-field"><span>Origin</span><input name="origin" /></label><label className="form-field"><span>Destination</span><input name="destination" /></label></>}
        {!(["beach-clubs", "night-clubs"] as PlanDomain[]).includes(domain) && <label className="form-field"><span>Duration (minutes)</span><input name="durationMinutes" type="number" min="0" /></label>}
        {languages.map(language => <div className="form-field" key={language}><span>Plan content ({language}){language === "EN" ? " *" : ""}</span><input name={`title${language}`} required={language === "EN"} placeholder={`Title (${language})`} /><textarea name={`description${language}`} required={language === "EN"} placeholder={`Description (${language})`} rows={3} />{language !== "EN" && <button type="button" className="secondary" onClick={async event => { const targetForm = event.currentTarget.closest("form"); if (!targetForm) return; const data = new FormData(targetForm); try { const response = await fetch(`${API_BASE_URL}/products/translate-content`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetLanguage: language.toLowerCase(), source: { title: data.get("titleEN"), description: data.get("descriptionEN"), subtitle: "", priceTitle: "", address: "", tags: [], details: [] } }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.message ?? "Translation failed"); const title = targetForm.elements.namedItem(`title${language}`) as HTMLInputElement | null; const description = targetForm.elements.namedItem(`description${language}`) as HTMLTextAreaElement | null; if (title) title.value = payload.content?.title ?? ""; if (description) description.value = payload.content?.description ?? ""; } catch (cause) { setError(cause instanceof Error ? cause.message : "Translation failed"); } }}>Generate {language} with AI</button>}</div>)}
      </div><div className="form-actions"><button className="primary" type="submit">Create plan</button></div>
    </form>}
    <div className="plan-grid">{plans.map(plan => <article className="plan-admin-card" key={plan.id}>
      <header className="plan-card-head"><div className="plan-card-title"><span className="plan-code">{plan.uniqueCode}</span><h3>{plan.titleEN || plan.titleFR || "Untitled plan"}</h3><div className="plan-badges">{plan.pricingUnit && <span>{pricingUnitLabel(domain, plan.pricingUnit)}</span>}<span>{plan.options?.length ?? 0} inclusions</span></div></div><div className="plan-head-actions"><div className="plan-public-price"><small>Customer price</small><strong>{String(plan.salePrice)} <span>{plan.currency}</span></strong></div><button type="button" className="secondary compact" onClick={() => setEditPlanId(current => current === plan.id ? null : plan.id)}>{editPlanId === plan.id ? "Cancel edit" : "Edit plan"}</button></div></header>
      {editPlanId === plan.id && <form className="plan-edit-form" onSubmit={event => void updatePlan(plan.id, event)}><div className="plan-edit-grid"><label><span>Unique code</span><input name="uniqueCode" defaultValue={plan.uniqueCode} required /></label><label><span>Customer price</span><input name="salePrice" type="number" step="0.01" min="0" defaultValue={plan.salePrice} required /></label><label><span>Private supplier cost</span><input name="internalCost" type="number" step="0.01" min="0" defaultValue={plan.internalCost ?? ""} /></label><label><span>Currency</span><input name="currency" defaultValue={plan.currency} required /></label><label><span>Pricing unit</span><select name="pricingUnit" defaultValue={plan.pricingUnit ?? ""}><option value="">Select pricing unit…</option>{pricingUnits[domain].map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>{domain === "transportation" && <><label><span>Service type</span><input name="serviceType" defaultValue={plan.serviceType ?? ""} /></label><label><span>Origin</span><input name="origin" defaultValue={plan.origin ?? ""} /></label><label><span>Destination</span><input name="destination" defaultValue={plan.destination ?? ""} /></label></>} {domain !== "beach-clubs" && <label><span>Duration (minutes)</span><input name="durationMinutes" type="number" min="0" defaultValue={plan.durationMinutes ?? ""} /></label>}</div><div className="plan-language-editors">{languages.map(language => <details key={language} open={language === "EN"}><summary>{language} content</summary><label><span>Title</span><input name={`title${language}`} defaultValue={plan[`title${language}` as keyof Plan] as string ?? ""} required={language === "EN"} /></label><label><span>Description</span><textarea name={`description${language}`} defaultValue={plan[`description${language}` as keyof Plan] as string ?? ""} rows={3} /></label></details>)}</div><div className="plan-option-actions"><button type="button" className="link-button" onClick={() => setEditPlanId(null)}>Cancel</button><button className="primary" type="submit">Save plan changes</button></div></form>}
      <div className="plan-finance"><div><small>Private supplier cost</small><b>{plan.internalCost == null ? "Not tracked" : `${String(plan.internalCost)} ${plan.currency}`}</b></div>{plan.internalCost != null && <div><small>Estimated margin</small><b>{Math.max(0, Number(plan.salePrice) - Number(plan.internalCost)).toFixed(2)} {plan.currency}</b></div>}</div>
      <div className="plan-inclusions"><div className="plan-subhead"><div><h4>Included in this plan</h4><p>Customer-facing benefits and services</p></div><button type="button" className="secondary compact" onClick={() => setOptionPlanId(current => current === plan.id ? null : plan.id)}>{optionPlanId === plan.id ? "Cancel" : "+ Add inclusion"}</button></div>
        {!!plan.options?.length ? <ul>{plan.options.map(option => <li key={option.id}><span>✓</span><b>{option.titleEN || option.titleFR}</b><div className="inclusion-actions"><button type="button" onClick={() => { setEditOptionId(current => current === option.id ? null : option.id); setOptionPlanId(null); }}>Edit</button><button type="button" className="danger-link" onClick={async () => { if (confirm("Delete this inclusion?")) { await request(`/plan-options/${option.id}`, { method: "DELETE" }); await refresh(); } }}>Delete</button></div>{editOptionId === option.id && <form className="plan-option-composer inclusion-edit" onSubmit={event => void saveOption(plan.id, event, option.id)}><label><span>English inclusion *</span><input name="titleEN" required defaultValue={option.titleEN ?? ""} /></label><button type="button" className="ai-translate-inclusion" disabled={translating} onClick={event => { const form = event.currentTarget.closest("form"); if (form) void translateInclusion(form); }}>{translating ? "Translating…" : "✦ Translate all languages with AI"}</button><details open><summary>Translations</summary><div className="plan-option-translations">{languages.filter(language => language !== "EN").map(language => <label key={language}><span>{language}</span><input name={`title${language}`} defaultValue={option[`title${language}` as keyof PlanOption] as string ?? ""} /></label>)}</div></details><div className="plan-option-actions"><button type="button" className="link-button" onClick={() => setEditOptionId(null)}>Cancel</button><button className="primary" type="submit">Save inclusion</button></div></form>}</li>)}</ul> : <div className="plan-no-options">No inclusions added yet.</div>}
        {optionPlanId === plan.id && <form className="plan-option-composer" onSubmit={event => void saveOption(plan.id, event)}>
          <label><span>English inclusion *</span><input name="titleEN" required placeholder="e.g. Professional private driver" /></label><button type="button" className="ai-translate-inclusion" disabled={translating} onClick={event => { const form = event.currentTarget.closest("form"); if (form) void translateInclusion(form); }}>{translating ? "Translating…" : "✦ Translate all languages with AI"}</button>
          <details><summary>Add translations</summary><div className="plan-option-translations">{languages.filter(language => language !== "EN").map(language => <label key={language}><span>{language}</span><input name={`title${language}`} placeholder={`Translation (${language})`} /></label>)}</div></details>
          <div className="plan-option-actions"><button type="button" className="link-button" onClick={() => setOptionPlanId(null)}>Cancel</button><button className="primary" type="submit">Save inclusion</button></div>
        </form>}
      </div>
      <footer className="plan-card-footer"><span>Plan ID · {plan.id}</span><button className="danger-ghost" type="button" onClick={async () => { if (confirm("Delete this plan and all of its options?")) { await request(`/plans/${plan.id}`, { method: "DELETE" }); await refresh(); } }}>Delete plan</button></footer>
    </article>)}</div>
    {!plans.length && !open && <div className="empty-state">No plans yet. Add the first commercial plan for this object.</div>}
  </section>;
}

export const Villas = catalogPages("villas");
export const Restaurants = catalogPages("restaurants");
export const BeachClubs = catalogPages("beach-clubs", true);
export const NightClubs = catalogPages("night-clubs", true);
export const Packs = catalogPages("packs", true);
export const Activities = catalogPages("activities", true);
export const Transportation = catalogPages("transportation", true);
