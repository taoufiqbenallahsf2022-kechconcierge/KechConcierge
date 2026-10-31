import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../../store/api";

type DateFilters = { from: string; to: string; audience: string };
type ListResponse = { items: any[]; total: number; page: number; pageSize: number; pages: number };

const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const defaultFilters = (): DateFilters => {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 6);
  return { from: isoDay(from), to: isoDay(to), audience: "all" };
};
const gmt = (value: string) => `${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "GMT" }).format(new Date(value))} GMT`;
const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
const reveal = (ref: { current: HTMLElement | null }) => window.setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);

async function request(path: string) {
  const response = await fetch(`${API_BASE_URL}/performance${path}`, { credentials: "include" });
  if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.message || "Unable to load performance data");
  return response.json();
}

function Filters({ filters, onChange, children }: { filters: DateFilters; onChange: (next: DateFilters) => void; children?: React.ReactNode }) {
  return <div className="performance-filters">
    <label><span>From (GMT)</span><input type="date" value={filters.from} onChange={(event) => onChange({ ...filters, from: event.target.value })} /></label>
    <label><span>To (GMT)</span><input type="date" value={filters.to} onChange={(event) => onChange({ ...filters, to: event.target.value })} /></label>
    <label><span>Visitor</span><select value={filters.audience} onChange={(event) => onChange({ ...filters, audience: event.target.value })}><option value="all">Everyone</option><option value="known">Known individuals</option><option value="visitor">Visitors</option></select></label>
    {children}
  </div>;
}

function MetricCards({ items, active, onSelect }: { items: Array<{ key: string; label: string; value: number; hint?: string }>; active?: string; onSelect: (key: string) => void }) {
  return <div className="performance-metrics">{items.map((item) => <button key={item.key} className={active === item.key ? "active" : ""} onClick={() => onSelect(item.key)}>
    <span>{item.label}</span><strong>{item.value.toLocaleString()}</strong><small>{item.hint || "View records →"}</small>
  </button>)}</div>;
}

function TrendChart({ data, series }: { data: any[]; series: Array<{ key: string; label: string; color: string }> }) {
  const width = 920, height = 260, left = 48, top = 24, bottom = 38;
  const max = Math.max(1, ...data.flatMap((row) => series.map((item) => Number(row[item.key] ?? 0))));
  const x = (index: number) => left + (data.length <= 1 ? 0 : index * (width - left - 20) / (data.length - 1));
  const y = (value: number) => top + (height - top - bottom) * (1 - value / max);
  return <div className="performance-chart-card">
    <div className="chart-head"><div><b>Daily trend</b><span>All dates and times use GMT</span></div><div className="chart-legend">{series.map((item) => <span key={item.key}><i style={{ background: item.color }} />{item.label}</span>)}</div></div>
    {!data.length ? <div className="performance-empty">No data in this period.</div> : <div className="chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily performance trend">
      {[0, .25, .5, .75, 1].map((ratio) => <g key={ratio}><line x1={left} x2={width - 20} y1={y(max * ratio)} y2={y(max * ratio)} stroke="#ebe7e4" /><text x={left - 10} y={y(max * ratio) + 4} textAnchor="end">{Math.round(max * ratio)}</text></g>)}
      {series.map((item) => {
        const points = data.map((row, index) => `${x(index)},${y(Number(row[item.key] ?? 0))}`).join(" ");
        return <g key={item.key}><polyline points={points} fill="none" stroke={item.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />{data.map((row, index) => <circle key={row.date} cx={x(index)} cy={y(Number(row[item.key] ?? 0))} r="3.5" fill={item.color}><title>{`${row.date}: ${row[item.key] ?? 0} ${item.label}`}</title></circle>)}</g>;
      })}
      {data.map((row, index) => <text key={row.date} x={x(index)} y={height - 12} textAnchor="middle">{new Date(`${row.date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "GMT" })}</text>)}
    </svg></div>}
  </div>;
}

function Pagination({ value, onChange }: { value: ListResponse; onChange: (page: number) => void }) {
  return <div className="pager"><span>{value.total.toLocaleString()} records · Page {value.page} of {Math.max(value.pages, 1)}</span><button disabled={value.page <= 1} onClick={() => onChange(value.page - 1)}>Previous</button><button disabled={value.page >= value.pages} onClick={() => onChange(value.page + 1)}>Next</button></div>;
}

function Loading({ error }: { error?: string }) { return <div className={error ? "alert error" : "performance-loading"}>{error || "Loading performance data…"}</div>; }

export function EmailPerformancePage() {
  const detailsRef = useRef<HTMLElement>(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [email, setEmail] = useState("");
  const [overview, setOverview] = useState<any>();
  const [metric, setMetric] = useState("sent");
  const [details, setDetails] = useState<ListResponse>();
  const [detailPage, setDetailPage] = useState(1);
  const [error, setError] = useState("");
  const query = useMemo(() => new URLSearchParams({ from: filters.from, to: filters.to, ...(email ? { email } : {}) }).toString(), [filters, email]);
  useEffect(() => { setError(""); request(`/emails/overview?${query}`).then(setOverview).catch((e) => setError(e.message)); }, [query]);
  useEffect(() => { request(`/emails/items?${query}&metric=${metric}&page=${detailPage}`).then(setDetails).catch((e) => setError(e.message)); }, [query, metric, detailPage]);
  const totals = overview?.totals ?? {};
  return <PerformanceShell title="Email performance" description="Delivery and engagement reported by Resend." eyebrow="Performance · Email">
    <div className="performance-filters"><label><span>From (GMT)</span><input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></label><label><span>To (GMT)</span><input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></label><label className="grow"><span>Recipient email</span><input placeholder="Filter by email address" value={email} onChange={(e) => { setEmail(e.target.value); setDetailPage(1); }} /></label></div>
    {error && <Loading error={error} />}{overview && <><MetricCards active={metric} onSelect={(key) => { setMetric(key); setDetailPage(1); reveal(detailsRef); }} items={[
      { key: "sent", label: "Sent", value: totals.sent ?? 0 }, { key: "delivered", label: "Delivered", value: totals.delivered ?? 0 }, { key: "opened", label: "Opened", value: totals.opened ?? 0 }, { key: "clicked", label: "Clicked", value: totals.clicked ?? 0 }, { key: "bounced", label: "Bounced", value: totals.bounced ?? 0 },
    ]} /><TrendChart data={overview.series ?? []} series={[{ key: "sent", label: "Sent", color: "#a65334" }, { key: "opened", label: "Opened", color: "#2d7b68" }, { key: "clicked", label: "Clicked", color: "#4a67a1" }, { key: "bounced", label: "Bounced", color: "#b23a2d" }]} /></>}
    <DetailCard sectionRef={detailsRef} title={`${label(metric)} email activity`} note={overview?.source === "resend" && metric !== "sent" ? "Detailed interactions are recorded from the moment the Resend webhook is enabled; totals include Resend history." : undefined}>
      {!details ? <Loading /> : <><div className="tablewrap"><table><thead><tr><th>Resend ID</th><th>Recipient</th><th>Subject</th><th>Event</th><th>Date (GMT)</th><th>Details</th></tr></thead><tbody>{details.items.map((item) => <tr key={`${item.id}-${item.date}`}><td><code>{item.id}</code></td><td>{item.email}</td><td>{item.subject || "—"}</td><td><span className="badge">{label(item.event)}</span></td><td>{gmt(item.date)}</td><td>{item.link ? <a href={item.link} target="_blank" rel="noreferrer">Opened link</a> : item.bounceType || "—"}</td></tr>)}</tbody></table></div><Pagination value={details} onChange={setDetailPage} /></>}
    </DetailCard>
  </PerformanceShell>;
}

function EngagementReport({ kind }: { kind: "contacts" | "chats" }) {
  const detailsRef = useRef<HTMLElement>(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [requestType, setRequestType] = useState("");
  const [overview, setOverview] = useState<any>();
  const [metric, setMetric] = useState("total");
  const [details, setDetails] = useState<ListResponse>();
  const [detailPage, setDetailPage] = useState(1);
  const [error, setError] = useState("");
  const query = useMemo(() => new URLSearchParams({ ...filters, ...(kind === "contacts" && requestType ? { requestType } : {}) }).toString(), [filters, kind, requestType]);
  useEffect(() => { request(`/engagement/overview?${query}`).then(setOverview).catch((e) => setError(e.message)); }, [query]);
  useEffect(() => { request(`/engagement/items?${query}&kind=${kind}&metric=${metric}&page=${detailPage}`).then(setDetails).catch((e) => setError(e.message)); }, [query, kind, metric, detailPage]);
  const choose = (nextMetric: string) => { setMetric(nextMetric); setDetailPage(1); reveal(detailsRef); };
  const contacts = kind === "contacts";
  return <PerformanceShell title={contacts ? "Contact request performance" : "Live-chat performance"} description={contacts ? "Requests submitted through the contact form, grouped by request type." : "Chat conversations grouped by chat status."} eyebrow={`Performance · ${contacts ? "Contact requests" : "Live chats"}`}>
    <Filters filters={filters} onChange={(next) => { setFilters(next); setDetailPage(1); }}>{contacts && <label><span>Contact request type</span><select value={requestType} onChange={(e) => { setRequestType(e.target.value); setDetailPage(1); }}><option value="">All contact request types</option>{["ADVISOR_GUIDE", "PRODUCT_REQUEST", "COMPLAINT", "SUPPORT", "PARTNERSHIP", "OTHER"].map((type) => <option key={type}>{type}</option>)}</select></label>}</Filters>
    {error && <Loading error={error} />}{overview && <>
      <MetricCards active={metric === "total" ? "total" : ""} onSelect={() => choose("total")} items={[{ key: "total", label: contacts ? "Contact requests" : "Live chats", value: contacts ? overview.totals.contacts : overview.totals.chats }]} />
      <TrendChart data={overview.series} series={[contacts ? { key: "contacts", label: "Contact requests", color: "#a65334" } : { key: "chats", label: "Live chats", color: "#2d7b68" }]} />
      <Breakdown title={contacts ? "Contact request types" : "Live chat status"} values={contacts ? overview.byRequestType : overview.byChatStatus} active={metric} onSelect={choose} />
    </>}
    <DetailCard sectionRef={detailsRef} title={`${contacts ? "Contact requests" : "Live chats"} · ${label(metric)}`}>{!details ? <Loading /> : <><div className="tablewrap"><table><thead><tr>{contacts ? <><th>ID</th><th>Client</th><th>Email</th><th>Type</th></> : <><th>ID</th><th>Visitor</th><th>Stage</th><th>Status</th></>}<th>Identity</th><th>Date (GMT)</th></tr></thead><tbody>{details.items.map((item) => <tr key={item.id}>{contacts ? <><td><code>{item.id}</code></td><td>{item.firstName} {item.lastName}</td><td>{item.email}</td><td>{label(item.requestType)}</td></> : <><td><code>{item.id}</code></td><td>{item.visitorId || "—"}</td><td>{label(item.participantStage)}</td><td>{label(item.status)}</td></>}<td>{item.individualId ? <span className="badge success">Known</span> : <span className="badge neutral">Visitor</span>}</td><td>{gmt(item.createdDate)}</td></tr>)}</tbody></table></div><Pagination value={details} onChange={setDetailPage} /></>}</DetailCard>
  </PerformanceShell>;
}

export function ContactRequestPerformancePage() { return <EngagementReport kind="contacts" />; }
export function LiveChatPerformancePage() { return <EngagementReport kind="chats" />; }

export function PageVisitPerformancePage() {
  const detailsRef = useRef<HTMLElement>(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [search, setSearch] = useState("");
  const [overview, setOverview] = useState<any>();
  const [pageUrl, setPageUrl] = useState("");
  const [details, setDetails] = useState<ListResponse>();
  const [detailPage, setDetailPage] = useState(1);
  const [error, setError] = useState("");
  const query = useMemo(() => new URLSearchParams({ ...filters, ...(search ? { search } : {}) }).toString(), [filters, search]);
  useEffect(() => { request(`/page-visits/overview?${query}`).then(setOverview).catch((e) => setError(e.message)); }, [query]);
  useEffect(() => { request(`/page-visits/items?${query}&page=${detailPage}${pageUrl ? `&pageUrl=${encodeURIComponent(pageUrl)}` : ""}`).then(setDetails).catch((e) => setError(e.message)); }, [query, pageUrl, detailPage]);
  return <PerformanceShell title="Page visits" description="See which pages attract visitors and how traffic changes over time." eyebrow="Performance · Website">
    <Filters filters={filters} onChange={(next) => { setFilters(next); setDetailPage(1); }}><label className="grow"><span>Page</span><input value={search} placeholder="Search page name or URL" onChange={(e) => setSearch(e.target.value)} /></label></Filters>
    {error && <Loading error={error} />}{overview && <><MetricCards active={pageUrl ? "" : "visits"} onSelect={() => { setPageUrl(""); setDetailPage(1); reveal(detailsRef); }} items={[{ key: "visits", label: "Page visits", value: overview.totals.visits }, { key: "visitors", label: "Unique visitors", value: overview.totals.visitors, hint: "Distinct people and browsers" }]} /><TrendChart data={overview.series} series={[{ key: "visits", label: "Visits", color: "#a65334" }]} />
      <div className="performance-ranking"><div className="section-title"><div><span>Most visited</span><h2>Top pages</h2></div><small>Click a page to inspect its visits</small></div>{overview.topPages.map((item: any, index: number) => <button key={item.pageUrl} className={pageUrl === item.pageUrl ? "active" : ""} onClick={() => { setPageUrl(item.pageUrl); setDetailPage(1); reveal(detailsRef); }}><b>{index + 1}</b><span><strong>{item.pageName || item.pageUrl}</strong><small>{item.pageUrl}</small></span><em>{item.visits.toLocaleString()}</em></button>)}</div></>}
    <DetailCard sectionRef={detailsRef} title={pageUrl ? `Visits · ${pageUrl}` : "All page visits"}>{!details ? <Loading /> : <><div className="tablewrap"><table><thead><tr><th>ID</th><th>Page</th><th>Visitor</th><th>Stage</th><th>Identity</th><th>Referrer</th><th>Date (GMT)</th></tr></thead><tbody>{details.items.map((item) => <tr key={item.id}><td><code>{item.id}</code></td><td><b>{item.pageName || "—"}</b><small className="cell-subtitle">{item.pageUrl}</small></td><td>{item.visitorId || "—"}</td><td>{label(item.visitorStage)}</td><td>{item.individualId ? <span className="badge success">Known</span> : <span className="badge neutral">Visitor</span>}</td><td>{item.referrer || "Direct"}</td><td>{gmt(item.visitDate)}</td></tr>)}</tbody></table></div><Pagination value={details} onChange={setDetailPage} /></>}</DetailCard>
  </PerformanceShell>;
}

function PerformanceShell({ title, description, eyebrow, children }: { title: string; description: string; eyebrow: string; children: React.ReactNode }) { return <div className="performance-page"><header className="pagehead"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><span className="gmt-chip">GMT reporting</span></header>{children}</div>; }
function DetailCard({ title, note, children, sectionRef }: { title: string; note?: string; children: React.ReactNode; sectionRef?: React.RefObject<HTMLElement | null> }) { return <section ref={sectionRef} className="performance-details"><div className="section-title"><div><span>Records</span><h2>{title}</h2></div>{note && <small>{note}</small>}</div>{children}</section>; }
function Breakdown({ title, values, active, onSelect }: { title: string; values: Record<string, number>; active: string; onSelect: (key: string) => void }) { return <section className="performance-breakdown"><h2>{title}</h2>{Object.entries(values).sort((a, b) => b[1] - a[1]).map(([key, value]) => <button key={key} className={active === key ? "active" : ""} onClick={() => onSelect(key)}><span>{label(key)}</span><b>{value.toLocaleString()}</b></button>)}{!Object.keys(values).length && <p>No activity in this period.</p>}</section>; }
