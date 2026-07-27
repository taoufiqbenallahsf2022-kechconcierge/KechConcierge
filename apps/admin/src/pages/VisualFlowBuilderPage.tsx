import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from "react";
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
type ActionType =
  | "UPDATE_RECORD"
  | "UPDATE_RELATED"
  | "DELETE_RECORD"
  | "DELETE_RELATED";
type FlowAction = {
  id: string;
  type: ActionType;
  relationshipId: string;
  targetEntity: string;
  field: string;
  value: any;
  conditions: ConditionGroup;
};

const FLOW_ENTITIES = new Set([
  "individual",
  "lead",
  "prospect",
  "account",
  "consent",
  "product",
  "chat",
  "contactRequest",
  "pageVisit",
  "whatsAppConversation",
]);
const ACTIVITY_TYPES: Array<{
  type: ActionType;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    type: "UPDATE_RECORD",
    title: "Update Triggered Record",
    description: "Update fields on the record that started the flow.",
    icon: "✎",
  },
  {
    type: "UPDATE_RELATED",
    title: "Update Related Records",
    description: "Update selected records through a detected relationship.",
    icon: "⇄",
  },
  {
    type: "DELETE_RECORD",
    title: "Delete Triggered Record",
    description: "Delete the record that started the flow.",
    icon: "−",
  },
  {
    type: "DELETE_RELATED",
    title: "Delete Related Records",
    description: "Delete selected records through a detected relationship.",
    icon: "×",
  },
];
const operatorMap: Record<string, string[]> = {
  string: [
    "EQUALS",
    "NOT_EQUALS",
    "CONTAINS",
    "STARTS_WITH",
    "ENDS_WITH",
    "IN",
    "NOT_IN",
    "IS_NULL",
    "IS_NOT_NULL",
  ],
  number: [
    "EQUALS",
    "NOT_EQUALS",
    "GT",
    "GTE",
    "LT",
    "LTE",
    "BETWEEN",
    "IS_NULL",
    "IS_NOT_NULL",
  ],
  date: ["EQUALS", "BEFORE", "AFTER", "BETWEEN", "IS_NULL", "IS_NOT_NULL"],
  boolean: ["EQUALS", "TRUTHY", "FALSY", "IS_NULL", "IS_NOT_NULL"],
  enum: ["EQUALS", "NOT_EQUALS", "IN", "NOT_IN", "IS_NULL", "IS_NOT_NULL"],
  json: ["IS_NULL", "IS_NOT_NULL"],
};
const uid = () => crypto.randomUUID();
const blankCondition = (): Condition => ({
  field: "",
  operator: "EQUALS",
  value: "",
  valueTo: "",
});
const blankGroup = (): ConditionGroup => ({ logic: "AND", items: [] });
const blankAction = (type: ActionType): FlowAction => ({
  id: uid(),
  type,
  relationshipId: "",
  targetEntity: "",
  field: "",
  value: "",
  conditions: blankGroup(),
});

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="studio-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function activityDefinition(type: ActionType) {
  return ACTIVITY_TYPES.find((activity) => activity.type === type)!;
}
function triggerSummary(
  sourceEntity: string,
  trigger: string,
  conditions: ConditionGroup,
) {
  if (!sourceEntity) return "Click to configure the record trigger";
  const count = conditions.items.filter((item) => item.field).length;
  const eventLabel =
    trigger === "CREATED"
      ? "record created"
      : trigger === "DELETED"
        ? "record deleted"
        : "record updated";
  return `${sourceEntity} · ${eventLabel}${count ? ` · ${count} condition${count === 1 ? "" : "s"}` : " · always"}`;
}

function ValueInput({
  field,
  operator,
  value,
  onChange,
}: {
  field?: SchemaField;
  operator: string;
  value: any;
  onChange: (value: any) => void;
}) {
  if (field?.type === "enum") {
    if (["IN", "NOT_IN"].includes(operator))
      return (
        <select
          multiple
          value={Array.isArray(value) ? value : []}
          onChange={(event) =>
            onChange(
              [...event.currentTarget.selectedOptions].map(
                (option) => option.value,
              ),
            )
          }
        >
          {field.values?.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      );
    return (
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Choose value</option>
        {field.values?.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    );
  }
  if (field?.type === "boolean")
    return (
      <select
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Choose value</option>
        <option value="true">True</option>
        <option value="false">False</option>
        <option value="null">Null</option>
      </select>
    );
  return (
    <input
      type={
        field?.type === "number"
          ? "number"
          : field?.type === "date"
            ? "datetime-local"
            : "text"
      }
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={
        ["IN", "NOT_IN"].includes(operator)
          ? "Comma-separated values"
          : undefined
      }
    />
  );
}

function ConditionsEditor({
  value,
  fields,
  onChange,
  emptyLabel,
}: {
  value: ConditionGroup;
  fields: SchemaField[];
  onChange: (value: ConditionGroup) => void;
  emptyLabel: string;
}) {
  const update = (index: number, patch: Partial<Condition>) =>
    onChange({
      ...value,
      items: value.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });
  return (
    <div className="visual-conditions">
      <div className="visual-condition-head">
        <div>
          <b>Conditions</b>
          <small>
            {value.items.length
              ? "Choose how the conditions are evaluated."
              : emptyLabel}
          </small>
        </div>
        <div>
          <select
            value={value.logic}
            onChange={(event) =>
              onChange({ ...value, logic: event.target.value as "AND" | "OR" })
            }
          >
            <option value="AND">All (AND)</option>
            <option value="OR">Any (OR)</option>
          </select>
          <button
            type="button"
            className="secondary"
            onClick={() =>
              onChange({ ...value, items: [...value.items, blankCondition()] })
            }
          >
            + Add condition
          </button>
        </div>
      </div>
      {value.items.map((condition, index) => {
        const field = fields.find((item) => item.name === condition.field);
        const noValue = ["IS_NULL", "IS_NOT_NULL", "TRUTHY", "FALSY"].includes(
          condition.operator,
        );
        return (
          <div className="visual-condition-row" key={index}>
            <FormField label="Field">
              <select
                value={condition.field}
                onChange={(event) =>
                  update(index, {
                    field: event.target.value,
                    operator: "EQUALS",
                    value: "",
                    valueTo: "",
                  })
                }
              >
                <option value="">Choose field</option>
                {fields.map((item) => (
                  <option key={item.name}>{item.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Operator">
              <select
                value={condition.operator}
                onChange={(event) =>
                  update(index, {
                    operator: event.target.value,
                    value: "",
                    valueTo: "",
                  })
                }
              >
                {(
                  operatorMap[field?.type ?? "string"] ?? operatorMap.string
                ).map((operator) => (
                  <option key={operator}>{operator}</option>
                ))}
              </select>
            </FormField>
            {!noValue && (
              <FormField label="Value">
                <ValueInput
                  field={field}
                  operator={condition.operator}
                  value={condition.value}
                  onChange={(next) => update(index, { value: next })}
                />
              </FormField>
            )}
            {condition.operator === "BETWEEN" && (
              <FormField label="Second value">
                <ValueInput
                  field={field}
                  operator={condition.operator}
                  value={condition.valueTo}
                  onChange={(next) => update(index, { valueTo: next })}
                />
              </FormField>
            )}
            <button
              type="button"
              className="visual-condition-remove"
              onClick={() =>
                onChange({
                  ...value,
                  items: value.items.filter((_, i) => i !== index),
                })
              }
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Modal({
  title,
  description,
  children,
  onCancel,
  onSave,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onCancel: () => void;
  onSave?: () => void;
}) {
  return (
    <div
      className="flow-modal-backdrop"
      role="presentation"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onCancel()
      }
    >
      <section className="flow-modal" role="dialog" aria-modal="true">
        <header>
          <div>
            <div className="eyebrow">Flow configuration</div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button type="button" className="flow-modal-close" onClick={onCancel}>
            ×
          </button>
        </header>
        <div className="flow-modal-body">{children}</div>
        {onSave && (
          <footer>
            <button type="button" className="secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="primary" onClick={onSave}>
              Save configuration
            </button>
          </footer>
        )}
      </section>
    </div>
  );
}

export function VisualFlowEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [models, setModels] = useState<SchemaModel[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    sourceEntity: "",
    trigger: "UPDATED",
    isActive: false,
    triggerConditions: blankGroup(),
    actions: [] as FlowAction[],
  });
  const [triggerDraft, setTriggerDraft] = useState<any>(null);
  const [actionDraft, setActionDraft] = useState<{
    index: number;
    value: FlowAction;
  } | null>(null);
  const [dropActiveIndex, setDropActiveIndex] = useState<number | null>(null);
  const [activityPickerIndex, setActivityPickerIndex] = useState<number | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [metadataOpen, setMetadataOpen] = useState(false);
  const model = (name: string) => models.find((item) => item.name === name);
  const flowModels = useMemo(
    () => models.filter((item) => FLOW_ENTITIES.has(item.name)),
    [models],
  );

  useEffect(() => {
    void Promise.all([
      studioRequest<{ models: SchemaModel[]; relationships: Relationship[] }>(
        "/schema",
      ),
      id
        ? studioRequest<{ items: Row[] }>("/flows")
        : Promise.resolve({ items: [] }),
    ]).then(([schema, flows]) => {
      setModels(schema.models);
      setRelationships(schema.relationships);
      const row = flows.items.find((item) => item.id === id);
      if (!row) return;
      const triggerConditions = row.condition?.items
        ? row.condition
        : { logic: "AND", items: row.condition ? [row.condition] : [] };
      const actions = (row.actions ?? []).map((action: Row) => {
        let relationshipId = action.relationshipId ?? "";
        if (
          !relationshipId &&
          ["UPDATE_RELATED", "DELETE_RELATED"].includes(action.type)
        )
          relationshipId =
            schema.relationships.find(
              (relation) =>
                relation.sourceEntity === row.sourceEntity &&
                relation.targetEntity === action.targetEntity &&
                relation.sourceField === (action.sourceField ?? "id") &&
                relation.targetField === action.matchField,
            )?.id ?? "";
        return {
          ...blankAction(action.type),
          ...action,
          id: action.id ?? uid(),
          relationshipId,
          conditions: action.conditions?.items
            ? action.conditions
            : blankGroup(),
        };
      });
      setForm({
        name: row.name,
        description: row.description ?? "",
        sourceEntity: row.sourceEntity,
        trigger: row.trigger,
        isActive: row.isActive,
        triggerConditions,
        actions,
      });
    });
  }, [id]);

  function insertActivity(type: ActionType, index: number) {
    const next = blankAction(type);
    setForm((current: any) => ({
      ...current,
      actions: [
        ...current.actions.slice(0, index),
        next,
        ...current.actions.slice(index),
      ],
    }));
    setActionDraft({ index, value: next });
    setActivityPickerIndex(null);
  }
  function dropActivity(event: DragEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    setDropActiveIndex(null);
    const type = event.dataTransfer.getData(
      "application/x-flow-activity",
    ) as ActionType;
    if (!ACTIVITY_TYPES.some((activity) => activity.type === type)) return;
    insertActivity(type, index);
  }
  function openTrigger() {
    setTriggerDraft({
      sourceEntity: form.sourceEntity,
      trigger: form.trigger,
      conditions: structuredClone(form.triggerConditions),
    });
  }
  function openAction(index: number) {
    setActionDraft({ index, value: structuredClone(form.actions[index]) });
  }
  function actionSummary(action: FlowAction) {
    if (action.type === "DELETE_RECORD") return "Delete the triggered record";
    if (action.type === "DELETE_RELATED") {
      const relation = relationships.find(
        (item) => item.id === action.relationshipId,
      );
      const count = action.conditions.items.filter((item) => item.field).length;
      return `${relation?.targetEntity ?? "Related records"} · ${count ? `${count} filter${count === 1 ? "" : "s"}` : "all matching records"}`;
    }
    if (!action.field) return "Click to configure";
    if (action.type === "UPDATE_RECORD")
      return `Set ${action.field} to ${String(action.value)}`;
    const relation = relationships.find(
      (item) => item.id === action.relationshipId,
    );
    const count = action.conditions.items.filter((item) => item.field).length;
    return `${relation?.targetEntity ?? "Related records"} · ${count ? `${count} filter${count === 1 ? "" : "s"} · ` : ""}set ${action.field}`;
  }
  function insertionPoint(index: number) {
    return (
      <div
        className={`flow-insert-point ${
          dropActiveIndex === index ? "active" : ""
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setDropActiveIndex(index);
        }}
        onDragLeave={() => setDropActiveIndex(null)}
        onDrop={(event) => dropActivity(event, index)}
      >
        <button
          type="button"
          aria-label={`Add activity at position ${index + 1}`}
          onClick={() => setActivityPickerIndex(index)}
        >
          +
        </button>
        <span>Drop activity here</span>
      </div>
    );
  }
  function typed(value: any, field?: SchemaField) {
    if (value === "null") return null;
    if (field?.type === "boolean") return value === "true";
    if (field?.type === "number" && value !== "") return Number(value);
    if (field?.type === "date" && value) return new Date(value).toISOString();
    return value;
  }
  function typedGroup(group: ConditionGroup, entity: string) {
    return {
      ...group,
      items: group.items
        .filter((item) => item.field)
        .map((item) => {
          const metadata = model(entity)?.fields.find(
            (field) => field.name === item.field,
          );
          return {
            ...item,
            value: typed(item.value, metadata),
            valueTo: typed(item.valueTo, metadata),
          };
        }),
    };
  }
  async function saveFlow(activeState = form.isActive) {
    if (!form.sourceEntity) {
      setMessage("Configure the trigger before saving.");
      return;
    }
    if (!form.name.trim()) {
      setMessage("Give the flow a name before saving.");
      return;
    }
    const actions = form.actions.map((action: FlowAction) => {
      const relation = relationships.find(
        (item) => item.id === action.relationshipId,
      );
      const target =
        ["UPDATE_RECORD", "DELETE_RECORD"].includes(action.type)
          ? form.sourceEntity
          : (relation?.targetEntity ?? action.targetEntity);
      const metadata = model(target)?.fields.find(
        (field) => field.name === action.field,
      );
      return {
        ...action,
        targetEntity: target,
        value: typed(action.value, metadata),
        conditions: typedGroup(action.conditions, target),
      };
    });
    const payload = {
      name: form.name,
      description: form.description,
      sourceEntity: form.sourceEntity,
      trigger: form.trigger,
      isActive: activeState,
      condition: typedGroup(form.triggerConditions, form.sourceEntity),
      actions,
    };
    const saved = await studioRequest<Row>(id ? `/flows/${id}` : "/flows", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });
    setMessage(
      activeState === form.isActive
        ? "Flow saved."
        : activeState
          ? "Flow activated."
          : "Flow deactivated.",
    );
    setForm((current: any) => ({ ...current, isActive: activeState }));
    setMetadataOpen(false);
    if (!id)
      navigate(`/automation-studio/flows/${saved.id}`, { replace: true });
  }

  const draftRelation = actionDraft
    ? relationships.find((item) => item.id === actionDraft.value.relationshipId)
    : undefined;
  const draftTarget =
    actionDraft &&
    ["UPDATE_RECORD", "DELETE_RECORD"].includes(actionDraft.value.type)
      ? form.sourceEntity
      : (draftRelation?.targetEntity ?? "");
  const availableRelationships = relationships.filter(
    (item) =>
      item.sourceEntity === form.sourceEntity &&
      FLOW_ENTITIES.has(item.targetEntity),
  );

  return (
    <section className="flow-fullscreen">
      <header className="flow-workspace-header">
        <button
          type="button"
          className="secondary"
          onClick={() => navigate("/automation-studio/flows")}
        >
          Back to Flows
        </button>
        <div className="flow-workspace-title">
          <div className="eyebrow">Automation Studio</div>
          <h1>Flow Builder</h1>
        </div>
        <div className="flow-workspace-actions">
          <button
            type="button"
            className="primary"
            onClick={() => setMetadataOpen(true)}
          >
            Save Flow
          </button>
          <button
            type="button"
            className={form.isActive ? "secondary" : "activate-button"}
            onClick={() => {
              if (!id) {
                setMessage("Save the flow before activating it.");
                return;
              }
              void saveFlow(!form.isActive);
            }}
          >
            {form.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </header>
      {message && (
        <div
          className={
            message.startsWith("Flow saved") ? "alert success" : "alert error"
          }
        >
          {message}
        </div>
      )}
      <div className="visual-flow-shell">
        <aside className="flow-palette">
          <div className="flow-palette-title">
            <span>TOOLBOX</span>
            <h2>Activities</h2>
            <p>Drag an activity into the flow.</p>
          </div>
          {ACTIVITY_TYPES.map((activity) => (
            <div
              className="palette-activity"
              draggable
              key={activity.type}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "copy";
                event.dataTransfer.setData(
                  "application/x-flow-activity",
                  activity.type,
                );
              }}
            >
              <span>{activity.icon}</span>
              <div>
                <b>{activity.title}</b>
                <small>{activity.description}</small>
              </div>
              <i>⋮⋮</i>
            </div>
          ))}
          <div className="palette-coming">
            <b>Designed for extension</b>
            <span>Send Email</span>
            <span>Delete Records</span>
            <span>Loop over Records</span>
          </div>
        </aside>
        <main className="visual-flow-main">
          <div className="visual-flow-canvas">
            <button
              type="button"
              className={`compact-flow-node trigger-compact ${form.sourceEntity ? "configured" : ""}`}
              onClick={openTrigger}
            >
              <span className="compact-icon">⚡</span>
              <div>
                <small>TRIGGER</small>
                <b>
                  {form.sourceEntity ? "Record Trigger" : "Configure Trigger"}
                </b>
                <p>
                  {triggerSummary(
                    form.sourceEntity,
                    form.trigger,
                    form.triggerConditions,
                  )}
                </p>
              </div>
              <em>›</em>
            </button>
            {insertionPoint(0)}
            {form.actions.map((action: FlowAction, index: number) => (
              <div className="visual-node-group" key={action.id}>
                <button
                  type="button"
                  className={`compact-flow-node activity-compact ${
                    actionSummary(action).length > 54 ? "has-long-summary" : ""
                  }`}
                  onClick={() => openAction(index)}
                >
                  <span className="compact-icon">
                    {activityDefinition(action.type).icon}
                  </span>
                  <div>
                    <small>ACTIVITY {index + 1}</small>
                    <b>{activityDefinition(action.type).title}</b>
                    <p>{actionSummary(action)}</p>
                  </div>
                  <em>›</em>
                </button>
                <button
                  type="button"
                  className="compact-node-delete"
                  onClick={() =>
                    setForm({
                      ...form,
                      actions: form.actions.filter(
                        (_: FlowAction, i: number) => i !== index,
                      ),
                    })
                  }
                >
                  ×
                </button>
                {insertionPoint(index + 1)}
              </div>
            ))}
            <div className="compact-flow-node end-node">
              <span className="compact-icon">■</span>
              <div>
                <small>END</small>
                <b>Flow Complete</b>
                <p>The flow stops after the final activity.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      {activityPickerIndex !== null && (
        <Modal
          title="Add Activity"
          description="Choose the activity to insert at this point in the flow."
          onCancel={() => setActivityPickerIndex(null)}
        >
          <div className="activity-picker-grid">
            {ACTIVITY_TYPES.map((activity) => (
              <button
                type="button"
                className="activity-picker-option"
                key={activity.type}
                onClick={() =>
                  insertActivity(activity.type, activityPickerIndex)
                }
              >
                <span>{activity.icon}</span>
                <div>
                  <b>{activity.title}</b>
                  <small>{activity.description}</small>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {metadataOpen && (
        <Modal
          title="Save Flow"
          description="Give the completed flow a name and description."
          onCancel={() => setMetadataOpen(false)}
          onSave={() => void saveFlow()}
        >
          <div className="studio-form-grid">
            <FormField label="Flow name">
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
                autoFocus
              />
            </FormField>
            <FormField label="Description">
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </FormField>
          </div>
        </Modal>
      )}
      {triggerDraft && (
        <Modal
          title="Configure Record Trigger"
          description="Choose when the flow starts and define its entry conditions."
          onCancel={() => setTriggerDraft(null)}
          onSave={() => {
            setForm({
              ...form,
              sourceEntity: triggerDraft.sourceEntity,
              trigger: triggerDraft.trigger,
              triggerConditions: triggerDraft.conditions,
              ...(form.sourceEntity !== triggerDraft.sourceEntity
                ? { actions: [] }
                : {}),
            });
            setTriggerDraft(null);
          }}
        >
          <div className="studio-form-grid">
            <FormField label="Object">
              <select
                value={triggerDraft.sourceEntity}
                onChange={(event) =>
                  setTriggerDraft({
                    ...triggerDraft,
                    sourceEntity: event.target.value,
                    conditions: blankGroup(),
                  })
                }
                required
              >
                <option value="">Choose object</option>
                {flowModels.map((item) => (
                  <option key={item.name}>{item.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="When to run">
              <select
                value={triggerDraft.trigger}
                onChange={(event) =>
                  setTriggerDraft({
                    ...triggerDraft,
                    trigger: event.target.value,
                  })
                }
              >
                <option value="CREATED">A record is created</option>
                <option value="UPDATED">A record is updated</option>
                <option value="DELETED">A record is deleted</option>
              </select>
            </FormField>
          </div>
          <ConditionsEditor
            value={triggerDraft.conditions}
            fields={model(triggerDraft.sourceEntity)?.fields ?? []}
            onChange={(conditions) =>
              setTriggerDraft({ ...triggerDraft, conditions })
            }
            emptyLabel="No conditions means every matching record starts the flow."
          />
        </Modal>
      )}
      {actionDraft && (
        <Modal
          title={activityDefinition(actionDraft.value.type).title}
          description="Configure this activity. The canvas will show a compact summary after saving."
          onCancel={() => setActionDraft(null)}
          onSave={() => {
            setForm({
              ...form,
              actions: form.actions.map((action: FlowAction, index: number) =>
                index === actionDraft.index ? actionDraft.value : action,
              ),
            });
            setActionDraft(null);
          }}
        >
          <FormField label="Activity type">
            <select
              value={actionDraft.value.type}
              onChange={(event) =>
                setActionDraft({
                  ...actionDraft,
                  value: blankAction(event.target.value as ActionType),
                })
              }
            >
              {ACTIVITY_TYPES.map((item) => (
                <option value={item.type} key={item.type}>
                  {item.title}
                </option>
              ))}
            </select>
          </FormField>
          {["UPDATE_RELATED", "DELETE_RELATED"].includes(
            actionDraft.value.type,
          ) && (
            <>
              <FormField label="Related records">
                <select
                  value={actionDraft.value.relationshipId}
                  onChange={(event) => {
                    const relationship = relationships.find(
                      (item) => item.id === event.target.value,
                    );
                    setActionDraft({
                      ...actionDraft,
                      value: {
                        ...actionDraft.value,
                        relationshipId: event.target.value,
                        targetEntity: relationship?.targetEntity ?? "",
                        field: "",
                        value: "",
                        conditions: blankGroup(),
                      },
                    });
                  }}
                  required
                >
                  <option value="">Choose a Prisma relationship</option>
                  {availableRelationships.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </FormField>
              {draftRelation && (
                <div className="relationship-path">
                  <span>Automatically linked relationship</span>
                  <code>{draftRelation.label}</code>
                </div>
              )}
              <ConditionsEditor
                value={actionDraft.value.conditions}
                fields={model(draftTarget)?.fields ?? []}
                onChange={(conditions) =>
                  setActionDraft({
                    ...actionDraft,
                    value: { ...actionDraft.value, conditions },
                  })
                }
                emptyLabel={`No filter means all records through this relationship are ${
                  actionDraft.value.type === "DELETE_RELATED"
                    ? "deleted"
                    : "updated"
                }.`}
              />
            </>
          )}
          {["UPDATE_RECORD", "UPDATE_RELATED"].includes(
            actionDraft.value.type,
          ) && (
          <div className="visual-field-update">
            <h3>Set Field Values</h3>
            <div className="studio-form-grid">
              <FormField label="Field to update">
                <select
                  value={actionDraft.value.field}
                  onChange={(event) =>
                    setActionDraft({
                      ...actionDraft,
                      value: {
                        ...actionDraft.value,
                        field: event.target.value,
                        value: "",
                      },
                    })
                  }
                  required
                >
                  <option value="">Choose field</option>
                  {model(draftTarget)?.fields.map((field) => (
                    <option key={field.name}>{field.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="New value">
                <ValueInput
                  field={model(draftTarget)?.fields.find(
                    (field) => field.name === actionDraft.value.field,
                  )}
                  operator="EQUALS"
                  value={actionDraft.value.value}
                  onChange={(value) =>
                    setActionDraft({
                      ...actionDraft,
                      value: { ...actionDraft.value, value },
                    })
                  }
                />
              </FormField>
            </div>
          </div>
          )}
        </Modal>
      )}
    </section>
  );
}
