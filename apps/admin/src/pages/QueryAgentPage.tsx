import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../store/api";
import { useAuth } from "../auth/AuthContext";

async function api(path: string, body?: any, method = "POST") {
  const response = await fetch(`${API_BASE_URL}/query-agent${path}`, { method: body === undefined ? "GET" : method, credentials: "include", headers: { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json(); if (!response.ok) throw new Error(data.message || "Query Agent request failed"); return data;
}
const date = (value: string) => new Date(value).toLocaleString("en-GB", { timeZone: "UTC" }) + " GMT";
export function QueryAgentPage() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<any[]>([]), [historyPage, setHistoryPage] = useState(1), [historyTotal, setHistoryTotal] = useState(0);
  const [selected, setSelected] = useState<any>(), [result, setResult] = useState<any>(), [prompt, setPrompt] = useState(""), [sql, setSql] = useState("");
  const [busy, setBusy] = useState(""), [error, setError] = useState("");
  const [executionPage, setExecutionPage] = useState(1);
  const resultRef = useRef<HTMLElement>(null);
  const admin = user?.role?.toUpperCase() === "ADMIN";
  async function history(page = historyPage) { const data = await api(`?page=${page}`); setQueries(data.items); setHistoryTotal(data.total); }
  useEffect(() => { if (admin) history().catch(e => setError(e.message)); }, [historyPage, admin]);
  async function select(id: string, page = 1) {
    const data = await api(`/${id}?page=${page}`); setSelected(data); setSql(data.sql); setExecutionPage(page);
  }
  async function execute(id: string, page = 1) {
    const data = await api(`/${id}/execute`, { page }); setResult(data);
    await select(id); await history();
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  async function submit() {
    if (!prompt.trim() || busy) return;
    setError(""); setResult(undefined); setBusy("Understanding your request and generating SQL…");
    try {
      const data = await api("", { prompt, previousQueryId: selected?.id });
      setSelected({ ...data, executions: [], executionTotal: 0 }); setSql(data.sql); setPrompt(""); setHistoryPage(1);
      setBusy("Running your report…"); await execute(data.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create report"); await history().catch(() => {}); }
    finally { setBusy(""); }
  }
  async function rerun(page = 1) {
    if (!selected || busy) return; setBusy("Running your report…"); setError("");
    try {
      if (sql !== selected.sql) await api(`/${selected.id}`, { sql }, "PATCH");
      await execute(selected.id, page);
    } catch (e) { setError(e instanceof Error ? e.message : "Report failed"); await select(selected.id).catch(() => {}); }
    finally { setBusy(""); }
  }
  const columns = result?.items?.length ? Object.keys(result.items[0]) : [];
  const cell = (value: any) => value == null ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (!admin) return <div className="alert info">Query Agent is available to administrators only.</div>;
  return <div className="query-agent"><header className="pagehead"><div><span className="eyebrow">Studio</span><h1>Query Agent</h1><p>Investigate your catalog, plans, visitors, customers, orders, messages and other business records. Dates use GMT.</p></div><button className="secondary" disabled={!!busy} onClick={() => { setSelected(undefined); setResult(undefined); setSql(""); setPrompt(""); setError(""); }}>New conversation</button></header>
    <div className="query-agent-layout"><section className="query-history"><h2>Saved requests</h2>{queries.map(query => <button disabled={!!busy} className={selected?.id === query.id ? "active" : ""} key={query.id} onClick={() => { setBusy("Loading request…"); setResult(undefined); setError(""); select(query.id).catch(e => setError(e.message)).finally(() => setBusy("")); }}><b>{query.title}</b><small>{date(query.createdDate)} · {query._count.executions} executions</small></button>)}{!queries.length && <p>Your requests will appear here.</p>}<div className="pager"><button disabled={historyPage <= 1 || !!busy} onClick={() => setHistoryPage(historyPage - 1)}>‹</button><span>{historyPage}</span><button disabled={historyPage * 20 >= historyTotal || !!busy} onClick={() => setHistoryPage(historyPage + 1)}>›</button></div></section>
    <div className="query-workspace">{error && <div className="alert error" role="alert">{error}</div>}
      {selected && <section className="query-message"><span>Your request</span><p>{selected.prompt}</p><div className="query-answer"><b>{selected.title}</b><p>{selected.explanation}</p><small>Created {date(selected.createdDate)} · Updated {date(selected.updatedDate)} · {selected.model}</small></div></section>}
      <form className="query-compose" onSubmit={event => { event.preventDefault(); void submit(); }}><label htmlFor="query-prompt">{selected ? "Ask a follow-up question" : "What would you like to investigate?"}</label><textarea id="query-prompt" rows={4} maxLength={4000} disabled={!!busy} placeholder="Show today's visitors, individuals and customers grouped by TikTok, Instagram, Facebook and other sources." value={prompt} onChange={e => setPrompt(e.target.value)} /><div><small>Only your prompt, SQL and execution metadata are saved. Result rows are not stored.</small><button className="primary" disabled={!!busy || !prompt.trim()}>{busy || "Ask & run report"}</button></div></form>
      {selected && <><details className="query-sql"><summary>View or edit generated SQL</summary><textarea aria-label="Generated SQL" value={sql} onChange={e => setSql(e.target.value)} rows={10} spellCheck={false} disabled={!!busy} /><button className="secondary" disabled={!!busy || !sql.trim()} onClick={() => void rerun()}>Save SQL & run again</button></details>
      <section ref={resultRef} className="query-results"><div className="section-title"><div><span>Report</span><h2>Results</h2></div><button className="secondary" disabled={!!busy} onClick={() => void rerun()}>Run again</button></div>{busy && <p role="status">{busy}</p>}{!result ? <div className="empty-state">Run this saved query to load current results.</div> : <>{result.items.length ? <div className="tablewrap"><table><thead><tr>{columns.map(column => <th key={column}>{column.replaceAll("_", " ")}</th>)}</tr></thead><tbody>{result.items.map((row: any, index: number) => <tr key={index}>{columns.map(column => <td key={column}>{cell(row[column])}</td>)}</tr>)}</tbody></table></div> : <div className="empty-state">No matching rows.</div>}<div className="pager"><span>Page {result.page} · {result.execution.durationMs} ms</span><button disabled={!!busy || result.page <= 1} onClick={() => void rerun(result.page - 1)}>Previous</button><button disabled={!!busy || !result.hasMore} onClick={() => void rerun(result.page + 1)}>Next</button></div></>}</section>
      <section className="related-card"><h2>Executions</h2><p className="cta-editor-note">Row counts refer to rows returned on that results page.</p><div className="tablewrap"><table><thead><tr><th>Date (GMT)</th><th>Status</th><th>Rows</th><th>Duration</th><th>Error</th></tr></thead><tbody>{selected.executions?.map((execution: any) => <tr key={execution.id}><td>{date(execution.createdDate)}</td><td>{execution.status}</td><td>{execution.rowCount ?? "—"}</td><td>{execution.durationMs} ms</td><td>{execution.error || "—"}</td></tr>)}</tbody></table></div><div className="pager"><button disabled={!!busy || executionPage <= 1} onClick={() => select(selected.id, executionPage - 1).catch(e => setError(e.message))}>Previous</button><span>Page {executionPage}</span><button disabled={!!busy || executionPage * 20 >= selected.executionTotal} onClick={() => select(selected.id, executionPage + 1).catch(e => setError(e.message))}>Next</button></div></section></>}
    </div></div></div>;
}
