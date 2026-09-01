import { Link, useParams } from "react-router-dom";
import { entityMap } from "../../config/entities";
import { useGetOneQuery } from "../../store/api";
import { EntityListView } from "../../components/crm/EntityListView";
import { EntityDetailShell } from "../../components/crm/EntityDetailShell";
import { formatDate } from "../../components/DisplayValue";

const entity = "trip-carts";
const config = entityMap[entity];
const productEntityByType: Record<string, string> = {
  VILLA: "villas",
  RESTAURANT: "restaurants",
  SWIMMINGPOOL: "beach-clubs",
  BEACHCLUB: "beach-clubs",
  NIGHTCLUB: "night-clubs",
  PACK: "packs",
  ACTIVITY: "activities",
  EXPERIENCE: "activities",
  TRANSPORTATION: "transportation",
};

function productAdminPath(item: Record<string, unknown>) {
  const entityName = productEntityByType[String(item.productType || "").toUpperCase()];
  return entityName && item.productId ? `/entities/${entityName}/${item.productId}` : null;
}

export function TripCartsList() { return <EntityListView entity={entity} config={config} />; }

export function TripCartsDetail() {
  const { id = "" } = useParams();
  const { data, isLoading, error } = useGetOneQuery({ entity, id });
  if (isLoading) return <div className="empty-state">Loading trip cart…</div>;
  if (error || !data) return <div className="empty-state">Trip cart not found.</div>;
  const items = Array.isArray(data.items) ? data.items as Record<string, unknown>[] : [];
  const renderField = (field: any, value: unknown) => {
    if (field.name === "individualId" && value) return <Link className="record-link" to={`/entities/individuals/${value}`}>{String(value)}</Link>;
    if (field.name === "contactRequestId" && value) return <Link className="record-link" to={`/entities/contact-requests/${value}`}>{String(value)}</Link>;
    return undefined;
  };
  return <EntityDetailShell entity={entity} id={id} config={config} data={data} renderField={renderField}>
    <section className="form-section catalog-plans"><div className="form-section-title"><div><div className="eyebrow">Itinerary</div><h2>Trip items</h2></div><span className="badge">{items.length} items</span></div>
      <div className="tablewrap entity-table"><table><thead><tr><th>Product</th><th>Type</th><th>Plan</th><th>Start date</th><th>End date</th></tr></thead><tbody>{items.map((item) => {
        const productPath = productAdminPath(item);
        const productLabel = <><b>{String(item.productName || "—")}</b><div className="muted">{String(item.category || "")}</div></>;
        return <tr key={String(item.id)}><td>{productPath ? <Link className="record-link" to={productPath}>{productLabel}</Link> : productLabel}</td><td><span className="badge">{String(item.productType || "—")}</span></td><td>{String(item.planTitle || "—")}</td><td>{formatDate(item.startDate, false)}</td><td>{formatDate(item.endDate, false)}</td></tr>;
      })}</tbody></table>{!items.length && <div className="empty-state">No products in this trip.</div>}</div>
    </section>
  </EntityDetailShell>;
}
