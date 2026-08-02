import { FormEvent, ReactNode, useEffect, useState } from "react";
import { studioRequest } from "../lib/studioApi";

type LanguageBlock = { language: string; subject: string; html: string };
type Template = { id?: string; name: string; description: string; defaultSubject: string; defaultHtml: string; languageBlocks?: Record<string, { subject: string; html: string }>; isActive: boolean };
const blank = (): Template & { blocks: LanguageBlock[] } => ({ name: "", description: "", defaultSubject: "", defaultHtml: "", blocks: [], isActive: true });

export function EmailStudioPage() {
  const [items, setItems] = useState<Template[]>([]);
  const [form, setForm] = useState<any>(blank());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const load = () => studioRequest<{ items: Template[] }>("/email-templates").then(result => setItems(result.items));
  useEffect(() => { void load(); }, []);
  const edit = (item: Template) => setForm({ ...item, blocks: Object.entries(item.languageBlocks ?? {}).map(([language, value]) => ({ language, ...value })) });
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const languageBlocks = Object.fromEntries(form.blocks.map((block: LanguageBlock) => [block.language, { subject: block.subject, html: block.html }]));
      const saved = await studioRequest<Template>(form.id ? `/email-templates/${form.id}` : "/email-templates", { method: form.id ? "PATCH" : "POST", body: JSON.stringify({ ...form, languageBlocks }) });
      setForm((current: any) => ({ ...current, id: saved.id })); setMessage("Email saved successfully."); await load();
    } finally { setSaving(false); }
  }
  const updateBlock = (index: number, patch: Partial<LanguageBlock>) => setForm((current: any) => ({ ...current, blocks: current.blocks.map((block: LanguageBlock, itemIndex: number) => itemIndex === index ? { ...block, ...patch } : block) }));
  const appendHtml = (target: string, html: string) => setForm((current: any) => target === "default" ? { ...current, defaultHtml: `${current.defaultHtml}\n${html}`.trim() } : { ...current, blocks: current.blocks.map((block: LanguageBlock) => block.language === target ? { ...block, html: `${block.html}\n${html}`.trim() } : block) });
  return <section className="email-studio-friendly">
    <header className="studio-hero"><div><div className="eyebrow">Email Studio</div><h1>Dynamic email content</h1><p>Create multilingual emails and add repeated related records without writing loops or handling JSON.</p></div><button className="primary" onClick={() => setForm(blank())}>+ New email</button></header>
    {message && <div className="segment-toast">✓ {message}</div>}
    <div className="studio-editor-layout">
      <aside className="studio-list">{items.map(item => <button type="button" className={`studio-row ${form.id === item.id ? "selected" : ""}`} key={item.id} onClick={() => edit(item)}><div><b>{item.name}</b><span>{item.description}</span></div></button>)}</aside>
      <form className="email-friendly-form" onSubmit={save}>
        <section className="studio-panel"><div className="studio-panel-head"><h2>Email details</h2><label className="studio-check"><input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} /> Active</label></div><div className="studio-form-grid"><Field label="Name"><input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></Field><Field label="Description"><input value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></Field><Field label="Default subject"><input required value={form.defaultSubject} onChange={event => setForm({ ...form, defaultSubject: event.target.value })} /></Field><Field label="Default email content"><textarea required rows={10} value={form.defaultHtml} onChange={event => setForm({ ...form, defaultHtml: event.target.value })} /></Field></div></section>
        <RepeatContentBuilder targets={[{ value: "default", label: "Default email" }, ...form.blocks.filter((block: LanguageBlock) => block.language).map((block: LanguageBlock) => ({ value: block.language, label: block.language.toUpperCase() }))]} append={appendHtml} />
        <section className="studio-panel"><div className="studio-panel-head"><div><h2>Language variants</h2><p>Each language can override the default subject and content.</p></div><button type="button" className="secondary" onClick={() => setForm({ ...form, blocks: [...form.blocks, { language: "", subject: "", html: "" }] })}>+ Add language</button></div>{form.blocks.map((block: LanguageBlock, index: number) => <article className="email-language-card" key={index}><div className="studio-form-grid"><Field label="Language"><select value={block.language} onChange={event => updateBlock(index, { language: event.target.value })}><option value="">Choose language</option>{["en", "fr", "de", "es", "it", "pt", "ar"].map(code => <option value={code} key={code}>{code.toUpperCase()}</option>)}</select></Field><Field label="Subject"><input value={block.subject} onChange={event => updateBlock(index, { subject: event.target.value })} /></Field><Field label="Email content"><textarea rows={8} value={block.html} onChange={event => updateBlock(index, { html: event.target.value })} /></Field></div><button type="button" className="danger-button" onClick={() => setForm({ ...form, blocks: form.blocks.filter((_: LanguageBlock, itemIndex: number) => itemIndex !== index) })}>Remove language</button></article>)}</section>
        <footer className="studio-actions sticky-actions"><button className="primary" disabled={saving}>{saving ? "Saving…" : "Save email"}</button></footer>
      </form>
    </div>
  </section>;
}

function RepeatContentBuilder({ targets, append }: { targets: Array<{ value: string; label: string }>; append: (target: string, html: string) => void }) {
  const [open, setOpen] = useState(false); const [target, setTarget] = useState("default"); const [collection, setCollection] = useState("visitedVillas"); const [title, setTitle] = useState("pageName"); const [text, setText] = useState(""); const [link, setLink] = useState("pageUrl"); const [button, setButton] = useState("View villa");
  const insert = () => {
    const html = `{{#${collection}}}<div style="margin:0 0 16px;padding:16px;border:1px solid #e8e2de;border-radius:12px"><h3 style="margin:0 0 8px">{{${title}}}</h3>${text ? `<p>{{${text}}}</p>` : ""}${link ? `<a href="{{${link}}}" style="color:#a65334;font-weight:700">${button}</a>` : ""}</div>{{/${collection}}}`;
    append(target, html); setOpen(false);
  };
  return <section className="studio-panel repeat-builder"><div className="studio-panel-head"><div><h2>Repeated related content</h2><p>Display every item from a Segment collection as an email block.</p></div><button type="button" className="secondary" onClick={() => setOpen(!open)}>{open ? "Close" : "+ Add repeated block"}</button></div>{open && <div className="repeat-builder-grid"><Field label="Insert into"><select value={target} onChange={event => setTarget(event.target.value)}>{targets.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}</select></Field><Field label="Collection name"><input value={collection} onChange={event => setCollection(event.target.value)} placeholder="visitedVillas" /></Field><Field label="Heading field"><input value={title} onChange={event => setTitle(event.target.value)} placeholder="pageName" /></Field><Field label="Optional text field"><input value={text} onChange={event => setText(event.target.value)} placeholder="description" /></Field><Field label="Link field"><input value={link} onChange={event => setLink(event.target.value)} placeholder="pageUrl" /></Field><Field label="Button label"><input value={button} onChange={event => setButton(event.target.value)} /></Field><button type="button" className="primary" disabled={!collection || !title} onClick={insert}>Insert repeated block</button></div>}</section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="studio-field"><span>{label}</span>{children}</label>; }
