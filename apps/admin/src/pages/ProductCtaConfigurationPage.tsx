import { useEffect, useState } from "react";
import { API_BASE_URL } from "../store/api";

const categories = { VILLA: "Villas", TRANSPORTATION: "Transportation", SWIMMINGPOOL: "Beach clubs / pools", NIGHTCLUB: "Night clubs", PACK: "Packs", ACTIVITY: "Activities", RESTAURANT: "Restaurants", SPA: "Wellness / spa" };
const languages = { en: "English", fr: "French", de: "German", it: "Italian", pt: "Portuguese", es: "Spanish" };
const fields = { booking: "Booking button", options: "Explore options / prices button", addToTrip: "Add to trip button", optionAction: "Request an option button", optionsTitle: "Options window title" };
type Content = Record<string, Record<string, Record<string, string>>>;

export function ProductCtaConfigurationPage() {
  const [content, setContent] = useState<Content>({});
  const [category, setCategory] = useState("VILLA");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/website-configuration/product-ctas`, { credentials: "include" }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Unable to load CTA configuration");
      if (active) setContent(body.content ?? {});
    }).catch((cause) => { if (active) setError(cause.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function save() {
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${API_BASE_URL}/website-configuration/product-ctas`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Unable to save CTA configuration");
      setContent(body.content); setDirty(false); setNotice("CTA labels saved. Refresh the website to see changes; cached responses can take up to one minute.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save"); }
    finally { setSaving(false); }
  }
  return <div className="website-config-page">
    <header className="pagehead"><div><span className="eyebrow">Website</span><h1>Product CTAs</h1><p>Manage product buttons and option titles in all six languages.</p></div><button className="primary" disabled={loading || saving || !dirty} onClick={() => void save()}>{saving ? "Saving…" : "Save CTA labels"}</button></header>
    {error && <div className="alert error" role="alert">{error}</div>}{notice && <div className="alert info" role="status">{notice}</div>}
    {loading ? <div className="empty-state">Loading CTA labels…</div> : <>
      <div className="toolbar"><label className="form-field"><span>Product category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{Object.entries(categories).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label></div>
      <p className="cta-editor-note">Leave a field empty to use the website’s existing translation. Transportation defaults to “Explore prices”. Labels apply to product pages, sticky booking buttons, and their request windows.</p>
      <div className="cta-language-grid">{Object.entries(languages).map(([locale, name]) => <section className="form-section" key={locale}><h2>{name} · {locale.toUpperCase()}</h2><div className="record-form">{Object.entries(fields).map(([field, title]) => <label className="form-field" key={field}><span>{title}</span><input maxLength={120} value={content[category]?.[locale]?.[field] ?? ""} placeholder="Use default translation" onChange={(event) => {
        const value = event.target.value;
        setContent((current) => ({ ...current, [category]: { ...current[category], [locale]: { ...current[category]?.[locale], [field]: value } } }));
        setDirty(true); setNotice("");
      }} /></label>)}</div></section>)}</div>
    </>}
  </div>;
}
