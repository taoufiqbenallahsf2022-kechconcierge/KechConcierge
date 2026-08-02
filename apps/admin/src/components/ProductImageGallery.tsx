import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../store/api";

type GalleryItem = { id: string; url: string; previewUrl?: string; filename: string; progress: number; status: "ready" | "uploading" | "error"; error?: string; altKey?: string };
const MAX_IMAGES = 50;
const MAX_BYTES = 10 * 1024 * 1024;
const accepted = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

const key = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export function ProductImageGallery({ name, value }: { name: string; value: string }) {
  const initial = useMemo<GalleryItem[]>(() => {
    try {
      const urls = JSON.parse(value || "[]");
      return Array.isArray(urls) ? urls.filter(Boolean).slice(0, MAX_IMAGES).map((url, index) => ({ id: key(), url: String(url), filename: `Image ${index + 1}`, progress: 100, status: "ready", altKey: `image${index + 1}` })) : [];
    } catch { return []; }
  }, [value]);
  const [items, setItems] = useState(initial); const [dragging, setDragging] = useState<string>(); const [dropActive, setDropActive] = useState(false); const [preview, setPreview] = useState<GalleryItem>(); const [message, setMessage] = useState(""); const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => items.forEach(item => item.previewUrl?.startsWith("blob:") && URL.revokeObjectURL(item.previewUrl)), []);

  function commit(nextItems: GalleryItem[]) {
    const mapping: Record<string, string> = {};
    const normalized = nextItems.map((item, index) => {
      const nextKey = `image${index + 1}`;
      if (item.altKey) mapping[item.altKey] = nextKey;
      return { ...item, altKey: nextKey };
    });
    setItems(normalized);
    window.dispatchEvent(new CustomEvent("admin:product-gallery-order", { detail: { mapping } }));
  }

  function patchItem(id: string, patch: Partial<GalleryItem>) { setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item)); }

  async function uploadOne(file: File, itemId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/images/direct-upload`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, contentType: file.type }) });
      const upload = await response.json();
      if (!response.ok) throw new Error(upload.message || "Cloudflare upload could not be started.");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest(); xhr.open("POST", upload.uploadURL);
        xhr.upload.onprogress = event => event.lengthComputable && patchItem(itemId, { progress: Math.max(1, Math.round((event.loaded / event.total) * 99)) });
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Cloudflare upload failed (${xhr.status}).`));
        xhr.onerror = () => reject(new Error("The connection to Cloudflare was interrupted."));
        const form = new FormData(); form.append("file", file, file.name); xhr.send(form);
      });
      patchItem(itemId, { url: upload.deliveryURL, progress: 100, status: "ready", error: undefined });
    } catch (error) {
      patchItem(itemId, { status: "error", error: error instanceof Error ? error.message : "Upload failed" });
    }
  }

  async function addFiles(files: File[]) {
    setMessage(""); const remaining = MAX_IMAGES - items.length;
    if (remaining <= 0) return setMessage("This product already has the maximum of 50 images.");
    const chosen = files.slice(0, remaining); const invalid = chosen.find(file => !accepted.has(file.type) || file.size > MAX_BYTES);
    if (invalid) return setMessage(`${invalid.name} must be a JPG, PNG, WebP, GIF or AVIF image no larger than 10 MB.`);
    if (files.length > remaining) setMessage(`Only the first ${remaining} images were added because the gallery limit is 50.`);
    const additions = chosen.map(file => ({ id: key(), url: "", previewUrl: URL.createObjectURL(file), filename: file.name, progress: 0, status: "uploading" as const, file }));
    const next = [...items, ...additions.map(({ file: _file, ...item }) => item)]; commit(next);
    let cursor = 0;
    async function worker() { while (cursor < additions.length) { const current = additions[cursor++]; await uploadOne(current.file, current.id); } }
    await Promise.all(Array.from({ length: Math.min(3, additions.length) }, worker));
  }

  function dropFiles(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDropActive(false); const files = [...event.dataTransfer.files]; if (files.length) void addFiles(files); }
  function reorder(targetId: string) { if (!dragging || dragging === targetId) return; const from = items.findIndex(item => item.id === dragging); const to = items.findIndex(item => item.id === targetId); if (from < 0 || to < 0) return; const next = [...items]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); commit(next); setDragging(undefined); }
  function remove(id: string) { const removed = items.find(item => item.id === id); if (removed?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(removed.previewUrl); commit(items.filter(item => item.id !== id)); }
  const readyUrls = items.map(item => item.url).filter(Boolean);

  return <div className="product-gallery-editor">
    <input type="hidden" name={name} value={JSON.stringify(readyUrls)} />
    <input type="hidden" name="galleryUploadPending" value={String(items.filter(item => item.status === "uploading").length)} />
    <input type="hidden" name="galleryUploadFailed" value={String(items.filter(item => item.status === "error").length)} />
    <div className={`product-gallery-dropzone ${dropActive ? "active" : ""}`} onDragEnter={event => { event.preventDefault(); setDropActive(true); }} onDragOver={event => event.preventDefault()} onDragLeave={event => event.currentTarget === event.target && setDropActive(false)} onDrop={dropFiles}>
      <input ref={fileInput} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple onChange={event => { void addFiles([...(event.target.files ?? [])]); event.target.value = ""; }} />
      <div className="gallery-upload-icon">↑</div><div><b>Drop product images here</b><span>or select up to {MAX_IMAGES - items.length} images · 10 MB maximum each</span></div><button type="button" className="secondary" disabled={items.length >= MAX_IMAGES} onClick={() => fileInput.current?.click()}>Choose images</button>
    </div>
    {message && <div className="gallery-message">{message}</div>}
    {items.length > 0 && <><div className="gallery-editor-head"><b>{items.length} / 50 images</b><span>Drag cards to change the website order. The first card becomes image1.</span></div><div className="product-gallery-grid">
      {items.map((item, index) => <article className={`gallery-card ${item.status}`} draggable={item.status === "ready"} onDragStart={() => setDragging(item.id)} onDragEnd={() => setDragging(undefined)} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); reorder(item.id); }} key={item.id}>
        <button type="button" className="gallery-image-button" onClick={() => setPreview(item)}><img src={item.previewUrl || item.url} alt={`Gallery position ${index + 1}`} /><span className="gallery-position">{index + 1}</span>{item.status === "ready" && <span className="gallery-zoom">Preview</span>}</button>
        <div className="gallery-card-info"><b title={item.filename}>{item.filename}</b>{item.status === "ready" ? <a href={item.url} target="_blank" rel="noreferrer" title={item.url}>{item.url}</a> : item.status === "error" ? <span className="gallery-error">{item.error}</span> : <span>Uploading… {item.progress}%</span>}</div>
        {item.status === "uploading" && <div className="gallery-progress"><i style={{ width: `${item.progress}%` }} /></div>}
        <button type="button" className="gallery-remove" aria-label={`Remove image ${index + 1}`} onClick={() => remove(item.id)}>×</button><span className="gallery-drag-handle" title="Drag to reorder">⠿</span>
      </article>)}
    </div></>}
    {preview && <GalleryPreview item={preview} close={() => setPreview(undefined)} />}
  </div>;
}

export function ProductGalleryViewer({ images }: { images: string[] }) {
  const [preview, setPreview] = useState<GalleryItem>();
  if (!images.length) return <span className="muted">No gallery images</span>;
  return <><div className="product-gallery-viewer">{images.map((url, index) => <button type="button" onClick={() => setPreview({ id: String(index), url, filename: `Image ${index + 1}`, progress: 100, status: "ready" })} key={`${url}-${index}`}><img src={url} alt={`Product gallery image ${index + 1}`} /><span>{index + 1}</span></button>)}</div>{preview && <GalleryPreview item={preview} close={() => setPreview(undefined)} />}</>;
}

function GalleryPreview({ item, close }: { item: GalleryItem; close: () => void }) {
  useEffect(() => { const keydown = (event: KeyboardEvent) => event.key === "Escape" && close(); document.addEventListener("keydown", keydown); return () => document.removeEventListener("keydown", keydown); }, [close]);
  return <div className="gallery-preview-backdrop" onMouseDown={event => event.target === event.currentTarget && close()}><div className="gallery-preview-modal" role="dialog" aria-modal="true"><header><div><b>{item.filename}</b>{item.url && <a href={item.url} target="_blank" rel="noreferrer">Open Cloudflare URL</a>}</div><button type="button" onClick={close}>×</button></header><img src={item.previewUrl || item.url} alt={`${item.filename} large preview`} />{item.url && <code>{item.url}</code>}</div></div>;
}
