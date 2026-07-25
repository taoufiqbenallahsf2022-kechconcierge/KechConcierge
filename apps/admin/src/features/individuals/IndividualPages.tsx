import { Link, useParams } from "react-router-dom";
import { entityMap } from "../../config/entities";
import { useGetOneQuery } from "../../store/api";
import { EntityListView } from "../../components/crm/EntityListView";
import { EntityCreateView } from "../../components/crm/EntityCreateView";
import { EntityDetailShell } from "../../components/crm/EntityDetailShell";
import { DisplayValue } from "../../components/DisplayValue";
const config = entityMap.individuals;
export function IndividualList() {
  return <EntityListView entity="individuals" config={config} />;
}
export function IndividualCreate() {
  return <EntityCreateView entity="individuals" config={config} />;
}
export function IndividualDetail() {
  const { id = "" } = useParams();
  const { data, isLoading, error } = useGetOneQuery({
    entity: "individuals",
    id,
  });
  if (isLoading) return <div className="empty-state">Loading record…</div>;
  if (error || !data)
    return <div className="empty-state">Record not found.</div>;
  return (
    <EntityDetailShell entity="individuals" id={id} config={config} data={data}>
      <IndividualRelated data={data} />
    </EntityDetailShell>
  );
}
const tabs = [
  ["pageVisits", "Page visits"],
  ["chats", "Website chats"],
  ["contactRequests", "Contact requests"],
  ["leads", "Leads"],
  ["prospects", "Prospects"],
  ["accounts", "Accounts"],
  ["consents", "Consents"],
] as const;
function IndividualRelated({ data }: { data: Record<string, unknown> }) {
  const [active, setActive] =
    React.useState<(typeof tabs)[number][0]>("pageVisits");
  const rows = (data[active] as Record<string, unknown>[] | undefined) ?? [];
  return (
    <section className="related-card">
      <h2>Related information</h2>
      <div className="tabs">
        {tabs.map(([key, label]) => (
          <button
            className={active === key ? "active" : ""}
            onClick={() => setActive(key)}
            key={key}
          >
            {label}
            <span>{((data[key] as unknown[]) ?? []).length}</span>
          </button>
        ))}
      </div>
      <RelatedTable type={active} rows={rows} />
    </section>
  );
}
import React from "react";
function RelatedTable({
  type,
  rows,
}: {
  type: string;
  rows: Record<string, unknown>[];
}) {
  if (!rows.length)
    return <div className="empty-state">No related records.</div>;
  const defs: Record<
    string,
    { cols: [string, string][]; path: (r: Record<string, unknown>) => string }
  > = {
    pageVisits: {
      cols: [
        ["pageName", "Page"],
        ["pageUrl", "URL"],
        ["visitorStage", "Stage"],
        ["visitDate", "Visited"],
      ],
      path: (r) => `/entities/page-visits/${r.id}`,
    },
    chats: {
      cols: [
        ["participantStage", "Participant"],
        ["status", "Status"],
        ["managedBy", "Managed by"],
        ["updatedDate", "Last activity"],
      ],
      path: (r) => `/chats/${r.id}`,
    },
    contactRequests: {
      cols: [
        ["requestType", "Type"],
        ["subject", "Subject"],
        ["email", "Email"],
        ["createdDate", "Received"],
      ],
      path: (r) => `/entities/contact-requests/${r.id}`,
    },
    leads: {
      cols: [
        ["firstName", "First name"],
        ["lastName", "Last name"],
        ["email", "Email"],
        ["statusDescription", "Status"],
      ],
      path: (r) => `/entities/leads/${r.id}`,
    },
    prospects: {
      cols: [
        ["firstName", "First name"],
        ["lastName", "Last name"],
        ["email", "Email"],
        ["statusDescription", "Status"],
      ],
      path: (r) => `/entities/prospects/${r.id}`,
    },
    accounts: {
      cols: [
        ["firstName", "First name"],
        ["lastName", "Last name"],
        ["email", "Email"],
        ["statusDescription", "Status"],
      ],
      path: (r) => `/entities/accounts/${r.id}`,
    },
    consents: {
      cols: [
        ["channel", "Channel"],
        ["channelStatus", "Status"],
        ["updatedDate", "Last modified"],
      ],
      path: (r) => `/entities/consents/${r.id}`,
    },
  };
  const d = defs[type];
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            {d.cols.map(([, l]) => (
              <th key={l}>{l}</th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              className="clickable-row"
              key={String(r.id ?? i)}
              onClick={() => location.assign(d.path(r))}
            >
              {d.cols.map(([k]) => (
                <td key={k}>
                  <DisplayValue
                    field={{
                      name: k,
                      label: k,
                      kind: k.toLowerCase().includes("date")
                        ? "datetime"
                        : "text",
                    }}
                    value={r[k]}
                  />
                </td>
              ))}
              <td className="actions">
                <Link onClick={(e) => e.stopPropagation()} to={d.path(r)}>
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
