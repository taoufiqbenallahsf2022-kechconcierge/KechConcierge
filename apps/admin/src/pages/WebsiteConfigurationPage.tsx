import { useEffect, useState } from "react";
import { API_BASE_URL } from "../store/api";

type HeroSlide = {
  id: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  buttonUrl: string;
  content: Record<string, HeroText>;
  isActive: boolean;
  order: number;
};

type HeroText = { eyebrow: string; title: string; description: string; buttonLabel: string; altText: string };
type SlideshowSettings = { durationMs: number; transitionMs: number };
const languages = ["en", "fr", "de", "it", "pt", "es"] as const;
const languageNames: Record<string, string> = { en: "English", fr: "French", de: "German", it: "Italian", pt: "Portuguese", es: "Spanish" };
const emptyText = (): HeroText => ({ eyebrow: "Marrakech, Morocco", title: "", description: "", buttonLabel: "Explore", altText: "" });

const blankSlide = (): HeroSlide => ({
  id: crypto.randomUUID(), mediaType: "IMAGE", mediaUrl: "", buttonUrl: "/services",
  content: { en: emptyText() }, isActive: true, order: 0,
});

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/website-configuration${path}`, {
    ...init, credentials: "include", headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (response.status === 401) window.dispatchEvent(new Event("admin:unauthorized"));
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? "Website configuration request failed");
  return body;
}

export function WebsiteConfigurationPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [settings, setSettings] = useState<SlideshowSettings>({ durationMs: 7000, transitionMs: 1000 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [translating, setTranslating] = useState<string | null>(null);
  const [activeLanguages, setActiveLanguages] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void api<{ slides: HeroSlide[]; settings: SlideshowSettings }>("/hero")
      .then((result) => { setSlides(Array.isArray(result.slides) ? result.slides : []); if (result.settings) setSettings(result.settings); })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load configuration"))
      .finally(() => setLoading(false));
  }, []);

  const update = (index: number, patch: Partial<HeroSlide>) => setSlides((current) => current.map((slide, slideIndex) => slideIndex === index ? { ...slide, ...patch } : slide));
  const updateContent = (index: number, language: string, patch: Partial<HeroText>) => setSlides((current) => current.map((slide, slideIndex) => slideIndex === index ? { ...slide, content: { ...slide.content, [language]: { ...(slide.content?.[language] ?? { ...emptyText(), eyebrow: "", buttonLabel: "", title: "" }), ...patch } } } : slide));
  const move = (index: number, direction: -1 | 1) => setSlides((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target]!, next[index]!];
    return next.map((slide, order) => ({ ...slide, order }));
  });

  async function uploadImage(index: number, file: File) {
    const slide = slides[index];
    if (!slide) return;
    setError(""); setUploading(slide.id);
    try {
      const direct = await api<{ uploadURL: string; deliveryURL: string }>("/media/direct-upload", {
        method: "POST", body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const form = new FormData(); form.append("file", file);
      const response = await fetch(direct.uploadURL, { method: "POST", body: form });
      if (!response.ok) throw new Error("The image upload failed. Please try again.");
      update(index, { mediaType: "IMAGE", mediaUrl: direct.deliveryURL });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Image upload failed"); }
    finally { setUploading(null); }
  }

  async function generateTranslations(index: number) {
    const slide = slides[index]; if (!slide) return;
    setTranslating(slide.id); setError(""); setMessage("");
    try {
      const result = await api<{ content: Record<string, HeroText> }>("/hero/translate", { method: "POST", body: JSON.stringify({ content: slide.content?.en }) });
      update(index, { content: result.content });
      setMessage(`Slide ${index + 1}: translations generated. Review and edit them before publishing.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to generate translations"); }
    finally { setTranslating(null); }
  }

  async function save() {
    setSaving(true); setError(""); setMessage("");
    try {
      const result = await api<{ slides: HeroSlide[]; settings: SlideshowSettings }>("/hero", { method: "PUT", body: JSON.stringify({ slides, settings }) });
      setSlides(result.slides); setSettings(result.settings); setMessage("Slideshow published successfully.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save slideshow"); }
    finally { setSaving(false); }
  }

  if (loading) return <section><header className="studio-hero"><div><div className="eyebrow">Website</div><h1>Loading slideshow…</h1></div></header></section>;

  return <section className="website-config-page">
    <header className="studio-hero"><div><div className="eyebrow">Website</div><h1>Slideshow</h1><p>Control the content, background media and timing of the public website hero. Add up to five slides.</p></div><button className="primary" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save & publish"}</button></header>
    {message && <div className="alert success">{message}</div>}
    {error && <div className="alert error">{error}</div>}
    <div className="slideshow-settings"><div><div className="eyebrow">Global slideshow settings</div><h2>Playback</h2><p>These values apply to every slide.</p></div><label><span>Slide duration (ms)</span><input type="number" min="1000" max="60000" step="100" value={settings.durationMs} onChange={(event) => setSettings({ ...settings, durationMs: Number(event.target.value) })} /></label><label><span>Transition speed (ms)</span><input type="number" min="0" max="10000" step="100" value={settings.transitionMs} onChange={(event) => setSettings({ ...settings, transitionMs: Number(event.target.value) })} /></label></div>
    <div className="website-config-toolbar"><div><b>{slides.length} / 5 slides</b><span>Only active slides appear publicly.</span></div><button className="secondary" disabled={slides.length >= 5} onClick={() => setSlides((current) => [...current, { ...blankSlide(), order: current.length }])}>+ Add slide</button></div>
    {!slides.length && <div className="website-config-empty"><b>No hero slides configured</b><p>Add your first image or video slide. Until you publish, the website uses its built-in fallback slides.</p></div>}
    <div className="hero-admin-list">{slides.map((slide, index) => <article className="hero-admin-card" key={slide.id}>
      <div className="hero-admin-preview">
        {slide.mediaUrl ? slide.mediaType === "VIDEO" ? <video src={slide.mediaUrl} muted autoPlay loop playsInline /> : <img src={slide.mediaUrl} alt={slide.content?.en?.altText || "Slide preview"} /> : <div><span>◇</span><b>Add background media</b></div>}
        <span className="hero-slide-number">{String(index + 1).padStart(2, "0")}</span>
        {!slide.isActive && <span className="hero-disabled-badge">Hidden</span>}
      </div>
      <div className="hero-admin-editor">
        <div className="hero-admin-head"><div><span>Slide {index + 1}</span><h2>{slide.content?.en?.title || "Untitled slide"}</h2></div><div className="hero-order-actions"><button disabled={index === 0} onClick={() => move(index, -1)} title="Move up">↑</button><button disabled={index === slides.length - 1} onClick={() => move(index, 1)} title="Move down">↓</button><button className="danger-link" onClick={() => setSlides((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div></div>
        <div className="hero-admin-grid">
          <label><span>Background type</span><select value={slide.mediaType} onChange={(event) => update(index, { mediaType: event.target.value as "IMAGE" | "VIDEO", mediaUrl: "" })}><option value="IMAGE">Image</option><option value="VIDEO">Video</option></select></label>
          <label className="wide"><span>{slide.mediaType === "VIDEO" ? "Hosted video URL" : "Image URL"}</span><input type="url" value={slide.mediaUrl} onChange={(event) => update(index, { mediaUrl: event.target.value })} placeholder={slide.mediaType === "VIDEO" ? "https://…/hero-video.mp4" : "https://…/hero-image.jpg"} /></label>
          {slide.mediaType === "IMAGE" && <label className="hero-upload wide"><span>Or upload image</span><input type="file" accept="image/*" disabled={uploading === slide.id} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(index, file); }} /><small>{uploading === slide.id ? "Uploading to Cloudflare Images…" : "JPG, PNG, WebP or another browser-supported image."}</small></label>}
          {slide.mediaType === "VIDEO" && <p className="hero-video-note wide">Video files must currently be uploaded to your video or object-storage provider, then pasted here as a public MP4/WebM URL. Cloudflare Images does not store video.</p>}
          <div className="hero-translation-editor wide">
            <div className="hero-language-head"><div><b>Localized content</b><small>Write English, then generate and review every translation.</small></div><button type="button" className="ai-translate-inclusion" disabled={translating === slide.id} onClick={() => void generateTranslations(index)}>{translating === slide.id ? "Generating…" : "✦ Generate all languages with AI"}</button></div>
            <div className="hero-language-tabs">{languages.map((language) => <button type="button" key={language} className={(activeLanguages[slide.id] ?? "en") === language ? "active" : ""} onClick={() => setActiveLanguages((current) => ({ ...current, [slide.id]: language }))}>{language.toUpperCase()} {slide.content?.[language]?.title ? <i>✓</i> : null}</button>)}</div>
            {languages.map((language) => { const active = (activeLanguages[slide.id] ?? "en") === language; if (!active) return null; const content = slide.content?.[language] ?? { ...emptyText(), eyebrow: "", buttonLabel: "", title: "" }; return <div className="hero-localized-grid" key={language}>
              <div className="hero-language-label"><b>{languageNames[language]}</b><span>{language === "en" ? "Source content" : "AI-generated content — fully editable"}</span></div>
              <label><span>Eyebrow</span><input value={content.eyebrow} onChange={(event) => updateContent(index, language, { eyebrow: event.target.value })} /></label>
              <label className="wide"><span>Title</span><input value={content.title} onChange={(event) => updateContent(index, language, { title: event.target.value })} /></label>
              <label className="wide"><span>Description</span><textarea rows={3} value={content.description} onChange={(event) => updateContent(index, language, { description: event.target.value })} /></label>
              <label><span>Button label</span><input value={content.buttonLabel} onChange={(event) => updateContent(index, language, { buttonLabel: event.target.value })} /></label>
              <label className="wide"><span>Accessibility alt text</span><input value={content.altText} onChange={(event) => updateContent(index, language, { altText: event.target.value })} /></label>
            </div>; })}
          </div>
          <label><span>Button destination</span><input value={slide.buttonUrl} onChange={(event) => update(index, { buttonUrl: event.target.value })} placeholder="/villas" /></label>
          <label className="toggle-field hero-active-row wide"><span>Active</span><input type="checkbox" checked={slide.isActive} onChange={(event) => update(index, { isActive: event.target.checked })} /><span className="toggle" /></label>
        </div>
      </div>
    </article>)}</div>
  </section>;
}
