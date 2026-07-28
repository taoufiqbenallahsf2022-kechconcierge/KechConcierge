import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { studioRequest } from "../lib/studioApi";

type Row = Record<string, any>;
type SchemaField = { name: string; type: string; values?: string[] };
type SchemaModel = { name: string; fields: SchemaField[] };
type Relationship = {
  id: string;
  sourceEntity: string;
  targetEntity: string;
  sourceField: string;
  targetField: string;
  label: string;
};
type Condition = { field: string; operator: string; value: any; valueTo: any };
type ConditionGroup = { logic: "AND" | "OR"; items: Condition[] };
type FlowAction = {
  type: "UPDATE_RECORD" | "UPDATE_RELATED";
  relationshipId: string;
  targetEntity: string;
  field: string;
  value: any;
  conditions: ConditionGroup;
};

const FLOW_ENTITIES = new Set(["individual", "lead", "prospect", "account", "consent", "product", "chat", "contactRequest", "pageVisit", "whatsAppConversation"]);
const operators: Record<string, string[]> = {
  string: ["EQUALS", "NOT_EQUALS", "CONTAINS", "STARTS_WITH", "ENDS_WITH", "IN", "NOT_IN", "IS_NULL", "IS_NOT_NULL"],
  number: ["EQUALS", "NOT_EQUALS", "GT", "GTE", "LT", "LTE", "BETWEEN", "IS_NULL", "IS_NOT_NULL"],
  date: ["EQUALS", "BEFORE", "AFTER", "BETWEEN", "IS_NULL", "IS_NOT_NULL"],
  boolean: ["EQUALS", "TRUTHY", "FALSY", "IS_NULL", "IS_NOT_NULL"],
  enum: ["EQUALS", "NOT_EQUALS", "IN", "NOT_IN", "IS_NULL", "IS_NOT_NULL"],
  json: ["IS_NULL", "IS_NOT_NULL"],
};
const newCondition = (): Condition => ({ field: "", operator: "EQUALS", value: "", valueTo: "" });
const newGroup = (): ConditionGroup => ({ logic: "AND", items: [newCondition()] });
const newAction = (): FlowAction => ({ type: "UPDATE_RECORD", relationshipId: "", targetEntity: "", field: "", value: "", conditions: newGroup() });

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="studio-field"><span>{label}</span>{children}</label>;
}

function ConditionBuilder({ title, group, fields, onChange }: { title: string; group: ConditionGroup; fields: SchemaField[]; onChange: (group: ConditionGroup) => void }) {
  const update = (index: number, patch: Partial<Condition>) =>
    onChange({ ...group, items: group.items.map((item, i) => i === index ? { ...item, ...patch } : item) });
  return <div className="flow-condition-box"><div className="flow-subhead"><div><b>{title}</b><small>Continue only when these conditions match.</small></div><div><select value={group.logic} onChange={event => onChange({ ...group, logic: event.target.value as "AND" | "OR" })}><option value="AND">All conditions (AND)</option><option value="OR">Any condition (OR)</option></select><button type="button" className="secondary" onClick={() => onChange({ ...group, items: [...group.items, newCondition()] })}>+ Condition</button></div></div>{group.items.map((condition, index) => {
    const metadata = fields.find(field => field.name === condition.field);
    const hiddenValue = ["IS_NULL", "IS_NOT_NULL", "TRUTHY", "FALSY"].includes(condition.operator);
    return <div className="flow-condition-row" key={index}><Field label="Field"><select value={condition.field} onChange={event => update(index, { field: event.target.value, operator: "EQUALS", value: "", valueTo: "" })}><option value="">Choose field</option>{fields.map(field => <option value={field.name} key={field.name}>{field.name}</option>)}</select></Field><Field label="Operator"><select value={condition.operator} onChange={event => update(index, { operator: event.target.value, value: "", valueTo: "" })}>{(operators[metadata?.type ?? "string"] ?? operators.string).map(operator => <option key={operator}>{operator}</option>)}</select></Field>{!hiddenValue && <Field label="Value"><TypedValue field={metadata} operator={condition.operator} value={condition.value} onChange={value => update(index, { value })} /></Field>}{condition.operator === "BETWEEN" && <Field label="Second value"><TypedValue field={metadata} operator={condition.operator} value={condition.valueTo} onChange={valueTo => update(index, { valueTo })} /></Field>}<button type="button" className="flow-remove" aria-label="Remove condition" onClick={() => onChange({ ...group, items: group.items.filter((_, i) => i !== index) })}>×</button></div>;
  })}</div>;
}

function TypedValue({ field, operator, value, onChange }: { field?: SchemaField; operator: string; value: any; onChange: (value: any) => void }) {
  if (field?.type === "enum") {
    if (["IN", "NOT_IN"].includes(operator))
      return <select multiple value={Array.isArray(value) ? value : []} onChange={event => onChange([...event.currentTarget.selectedOptions].map(option => option.value))}>{field.values?.map(option => <option key={option}>{option}</option>)}</select>;
    return <select value={value ?? ""} onChange={event => onChange(event.target.value)}><option value="">Choose value</option>{field.values?.map(option => <option key={option}>{option}</option>)}</select>;
  }
  if (field?.type === "boolean")
    return <select value={String(value ?? "")} onChange={event => onChange(event.target.value)}><option value="">Choose value</option><option value="true">True</option><option value="false">False</option><option value="null">Null</option></select>;
  return <input type={field?.type === "number" ? "number" : field?.type === "date" ? "datetime-local" : "text"} value={value ?? ""} onChange={event => onChange(event.target.value)} placeholder={["IN", "NOT_IN"].includes(operator) ? "Comma-separated values" : undefined} />;
}

export function FlowEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [models, setModels] = useState<SchemaModel[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [form, setForm] = useState<any>({ name: "", description: "", sourceEntity: "", trigger: "UPDATED", isActive: false, triggerConditions: newGroup(), actions: [newAction()] });
  const [message, setMessage] = useState("");
  const flowModels = useMemo(() => models.filter(model => FLOW_ENTITIES.has(model.name)), [models]);
  const model = (name: string) => models.find(item => item.name === name);

  useEffect(() => {
    void Promise.all([
      studioRequest<{ models: SchemaModel[]; relationships: Relationship[] }>("/schema"),
      id ? studioRequest<{ items: Row[] }>("/flows") : Promise.resolve({ items: [] }),
    ]).then(([schema, flows]) => {
      setModels(schema.models);
      setRelationships(schema.relationships);
      const row = flows.items.find(item => item.id === id);
      if (!row) return;
      const triggerConditions = row.condition?.items ? row.condition : { logic: "AND", items: row.condition ? [row.condition] : [newCondition()] };
      const actions = (row.actions?.length ? row.actions : [newAction()]).map((action: Row) => {
        let relationshipId = action.relationshipId ?? "";
        if (!relationshipId && action.type === "UPDATE_RELATED") {
          relationshipId = schema.relationships.find(relation =>
            relation.sourceEntity === row.sourceEntity &&
            relation.targetEntity === action.targetEntity &&
            relation.sourceField === (action.sourceField ?? "id") &&
            relation.targetField === action.matchField
          )?.id ?? "";
        }
        return { ...newAction(), ...action, relationshipId, conditions: action.conditions?.items ? action.conditions : newGroup() };
      });
      setForm({ name: row.name, description: row.description ?? "", sourceEntity: row.sourceEntity, trigger: row.trigger, isActive: row.isActive, triggerConditions, actions });
    });
  }, [id]);

  function updateAction(index: number, patch: Partial<FlowAction>) {
    setForm((current: any) => ({ ...current, actions: current.actions.map((action: FlowAction, i: number) => i === index ? { ...action, ...patch } : action) }));
  }
  function typed(value: any, field?: SchemaField) {
    if (value === "null") return null;
    if (field?.type === "boolean") return value === "true";
    if (field?.type === "number" && value !== "") return Number(value);
    if (field?.type === "date" && value) return new Date(value).toISOString();
    return value;
  }
  function typedGroup(group: ConditionGroup, entity: string) {
    return { ...group, items: group.items.filter(item => item.field).map(item => {
      const metadata = model(entity)?.fields.find(field => field.name === item.field);
      return { ...item, value: typed(item.value, metadata), valueTo: typed(item.valueTo, metadata) };
    }) };
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    const actions = form.actions.map((action: FlowAction) => {
      const relationship = relationships.find(item => item.id === action.relationshipId);
      const targetEntity = action.type === "UPDATE_RECORD" ? form.sourceEntity : relationship?.targetEntity ?? action.targetEntity;
      const metadata = model(targetEntity)?.fields.find(field => field.name === action.field);
      return { ...action, targetEntity, value: typed(action.value, metadata), conditions: typedGroup(action.conditions, targetEntity) };
    });
    const payload = { name: form.name, description: form.description, sourceEntity: form.sourceEntity, trigger: form.trigger, isActive: form.isActive, condition: typedGroup(form.triggerConditions, form.sourceEntity), actions };
    const saved = await studioRequest<Row>(id ? `/flows/${id}` : "/flows", { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) });
    setMessage("Flow saved.");
    if (!id) navigate(`/automation-studio/flows/${saved.id}`, { replace: true });
  }

  const availableRelationships = relationships.filter(relation => relation.sourceEntity === form.sourceEntity && FLOW_ENTITIES.has(relation.targetEntity));
  return <section><header className="studio-hero"><div><div className="eyebrow">Automation Studio</div><h1>{id ? "Flow Builder" : "New Flow"}</h1><p>Build a record-triggered flow using connected steps.</p></div><button className="secondary" onClick={() => navigate("/automation-studio/flows")}>← Flows</button></header>{message && <div className="alert success">{message}</div>}<form className="salesforce-flow" onSubmit={save}><div className="flow-toolbar"><Field label="Flow name"><input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></Field><Field label="Description"><input value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></Field><label className="studio-check"><input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} /> Active</label><button className="primary">Save flow</button></div><div className="flow-canvas"><section className="flow-node trigger-node"><div className="flow-node-icon">⚡</div><div className="flow-node-title"><span>START</span><h2>Record Trigger</h2><p>Run when a record is added or updated.</p></div><div className="studio-form-grid"><Field label="Object"><select value={form.sourceEntity} onChange={event => setForm({ ...form, sourceEntity: event.target.value, triggerConditions: newGroup(), actions: [newAction()] })} required><option value="">Choose object</option>{flowModels.map(model => <option key={model.name}>{model.name}</option>)}</select></Field><Field label="Trigger"><select value={form.trigger} onChange={event => setForm({ ...form, trigger: event.target.value })}><option value="CREATED">A record is created</option><option value="UPDATED">A record is updated</option></select></Field></div><ConditionBuilder title="Entry conditions" group={form.triggerConditions} fields={model(form.sourceEntity)?.fields ?? []} onChange={triggerConditions => setForm({ ...form, triggerConditions })} /></section><div className="flow-connector"><span>＋</span></div>{form.actions.map((action: FlowAction, index: number) => {
    const relationship = relationships.find(item => item.id === action.relationshipId);
    const targetEntity = action.type === "UPDATE_RECORD" ? form.sourceEntity : relationship?.targetEntity ?? "";
    return <div key={index} className="flow-action-wrap"><section className="flow-node action-node"><div className="flow-node-number">{index + 1}</div><div className="flow-node-title"><span>ACTION</span><h2>{action.type === "UPDATE_RECORD" ? "Update Triggered Record" : "Update Related Records"}</h2></div><Field label="Activity"><select value={action.type} onChange={event => updateAction(index, { type: event.target.value as FlowAction["type"], relationshipId: "", targetEntity: "", field: "", value: "", conditions: newGroup() })}><option value="UPDATE_RECORD">Update Triggered Record</option><option value="UPDATE_RELATED">Update Related Records</option></select></Field>{action.type === "UPDATE_RELATED" && <><Field label="Related object and relationship"><select value={action.relationshipId} onChange={event => { const relation = relationships.find(item => item.id === event.target.value); updateAction(index, { relationshipId: event.target.value, targetEntity: relation?.targetEntity ?? "", field: "", value: "", conditions: newGroup() }); }} required><option value="">Choose a detected relationship</option>{availableRelationships.map(relation => <option value={relation.id} key={relation.id}>{relation.targetEntity}</option>)}</select></Field>{relationship && <div className="relationship-path"><span>Automatically linked through Prisma relationship</span><code>{relationship.label}</code></div>}<ConditionBuilder title={`Filter related ${targetEntity} records`} group={action.conditions} fields={model(targetEntity)?.fields ?? []} onChange={conditions => updateAction(index, { conditions })} /></>}<div className="flow-update-box"><h3>Set field values</h3><div className="studio-form-grid"><Field label="Field to update"><select value={action.field} onChange={event => updateAction(index, { field: event.target.value, value: "" })} required><option value="">Choose field</option>{model(targetEntity)?.fields.map(field => <option value={field.name} key={field.name}>{field.name}</option>)}</select></Field><Field label="New value"><TypedValue field={model(targetEntity)?.fields.find(field => field.name === action.field)} operator="EQUALS" value={action.value} onChange={value => updateAction(index, { value })} /></Field></div></div><button type="button" className="flow-delete-action" onClick={() => setForm({ ...form, actions: form.actions.filter((_: FlowAction, i: number) => i !== index) })}>Remove action</button></section>{index < form.actions.length - 1 && <div className="flow-connector"><span>＋</span></div>}</div>;
  })}<button type="button" className="flow-add-action" onClick={() => setForm({ ...form, actions: [...form.actions, newAction()] })}>＋ Add Action</button></div></form></section>;
}
