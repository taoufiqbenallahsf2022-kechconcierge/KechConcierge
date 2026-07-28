import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type DragEvent,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FlowGraphCanvas,
  type GraphLocation,
} from "../components/flow/FlowGraphCanvas";
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
type DecisionOutcome = {
  id: string;
  name: string;
  isDefault: boolean;
  conditions: ConditionGroup;
  actions: FlowAction[];
};
type FieldAssignment = { id: string; field: string; value: any };
type ActionType =
  | "UPDATE_RECORD"
  | "UPDATE_RELATED"
  | "DELETE_RECORD"
  | "DELETE_RELATED"
  | "GET_RECORD"
  | "GET_RECORDS"
  | "LOOP"
  | "DECISION"
  | "CREATE_MATCHING"
  | "UPDATE_ONE"
  | "UPDATE_MATCHING"
  | "DELETE_MATCHING";
type FlowAction = {
  id: string;
  type: ActionType;
  relationshipId: string;
  targetEntity: string;
  field: string;
  value: any;
  conditions: ConditionGroup;
  outputKey: string;
  sourceRef: string;
  outcomes: DecisionOutcome[];
  bodyActions: FlowAction[];
  assignments: FieldAssignment[];
  continueOnError: boolean;
};
type ActionLocation = GraphLocation;

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
const PROTECTED_ASSIGNMENT_FIELDS = new Set([
  "id",
  "passwordHash",
  "emailVerificationToken",
  "passwordResetToken",
  "createdDate",
  "createdAt",
  "updatedDate",
  "updatedAt",
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
  {
    type: "GET_RECORD",
    title: "Get Record",
    description: "Find one record and expose it to later activities.",
    icon: "1",
  },
  {
    type: "GET_RECORDS",
    title: "Get Records",
    description: "Find a collection and expose it to loops or later steps.",
    icon: "≡",
  },
  {
    type: "LOOP",
    title: "Loop Over Records",
    description: "Run all following activities once for every record.",
    icon: "↻",
  },
  {
    type: "DECISION",
    title: "Decision Split",
    description: "Continue only when the selected record matches.",
    icon: "◇",
  },
  {
    type: "CREATE_MATCHING",
    title: "Create Record",
    description: "Create a record using static or flow values.",
    icon: "+",
  },
  {
    type: "UPDATE_ONE",
    title: "Update One Record",
    description: "Find the first matching record and update its fields.",
    icon: "1",
  },
  {
    type: "UPDATE_MATCHING",
    title: "Update Records",
    description: "Update records selected by conditions.",
    icon: "✎",
  },
  {
    type: "DELETE_MATCHING",
    title: "Delete Records",
    description: "Delete records selected by conditions.",
    icon: "−",
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
const blankAssignment = (): FieldAssignment => ({
  id: uid(),
  field: "",
  value: "",
});
const blankAction = (type: ActionType): FlowAction => ({
  id: uid(),
  type,
  relationshipId: "",
  targetEntity: "",
  field: "",
  value: "",
  conditions: blankGroup(),
  outputKey: `step_${uid().slice(0, 8)}`,
  sourceRef: "trigger",
  outcomes:
    type === "DECISION"
      ? [
          {
            id: uid(),
            name: "Matches",
            isDefault: false,
            conditions: blankGroup(),
            actions: [],
          },
          {
            id: uid(),
            name: "Default",
            isDefault: true,
            conditions: blankGroup(),
            actions: [],
          },
        ]
      : [],
  bodyActions: [],
  assignments: [
    "UPDATE_RECORD",
    "UPDATE_RELATED",
    "CREATE_MATCHING",
    "UPDATE_ONE",
    "UPDATE_MATCHING",
  ].includes(type)
    ? [blankAssignment()]
    : [],
  continueOnError: true,
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
  references = [],
}: {
  value: ConditionGroup;
  fields: SchemaField[];
  onChange: (value: ConditionGroup) => void;
  emptyLabel: string;
  references?: Array<{ label: string; value: string }>;
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
                  <option key={item.name} value={item.name}>
                    {item.name === "id" ? "id (Record ID)" : item.name}
                  </option>
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
                {!!references.length && (
                  <select
                    className="condition-reference-select"
                    value={
                      typeof condition.value === "string" &&
                      condition.value.startsWith("{{")
                        ? condition.value
                        : ""
                    }
                    onChange={(event) =>
                      event.target.value &&
                      update(index, { value: event.target.value })
                    }
                  >
                    <option value="">Or use a flow value…</option>
                    {references.map((reference) => (
                      <option value={reference.value} key={reference.value}>
                        {reference.label}
                      </option>
                    ))}
                  </select>
                )}
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
  readOnly = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onCancel: () => void;
  onSave?: () => void;
  readOnly?: boolean;
}) {
  return (
    <div
      className="flow-modal-backdrop"
      role="presentation"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onCancel()
      }
    >
      <section className={`flow-modal ${readOnly ? "read-only" : ""}`} role="dialog" aria-modal="true">
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
        {onSave && !readOnly && (
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
  const [searchParams] = useSearchParams();
  const versionId = searchParams.get("version");
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
  const [actionDraft, setActionDraft] = useState<
    (ActionLocation & { value: FlowAction }) | null
  >(null);
  const [dropActiveKey, setDropActiveKey] = useState<string | null>(null);
  const [activityPickerLocation, setActivityPickerLocation] =
    useState<ActionLocation | null>(null);
  const [message, setMessage] = useState("");
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<Row[]>([]);
  const [runPopupOpen, setRunPopupOpen] = useState(true);
  const [executionActivityId, setExecutionActivityId] = useState<string | null>(null);
  const [executionActivityType, setExecutionActivityType] = useState<string | null>(null);
  const [versionStatus, setVersionStatus] = useState<string | null>(null);
  const [activityMetrics, setActivityMetrics] = useState<Row[]>([]);
  const [logRows, setLogRows] = useState<Row[]>([]);
  const [logPagination, setLogPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
  });
  const [logFilterLogic, setLogFilterLogic] = useState<"AND" | "OR">("AND");
  const [logFilters, setLogFilters] = useState<Array<{
    id: string;
    field: "triggerRecordId" | "affectedId" | "startedDate";
    operator: string;
    value: string;
    valueTo: string;
  }>>([]);
  const readOnly = !!id && (!versionId || versionStatus !== "DRAFT");
  const logVersionId =
    versionId ??
    versions.find((version) => version.version === form.currentVersion)?.id ??
    null;
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
      id && versionId
        ? studioRequest<Row>(`/flows/${id}/versions/${versionId}`)
        : Promise.resolve(null),
    ]).then(([schema, flows, selectedVersion]) => {
      setModels(schema.models);
      setRelationships(schema.relationships);
      const current = flows.items.find((item) => item.id === id);
      const row = selectedVersion ?? current;
      if (!row) return;
      setVersionStatus(selectedVersion?.status ?? null);
      setVersions(current?.versions ?? []);
      setRunPopupOpen(true);
      const triggerConditions = row.condition?.items
        ? row.condition
        : { logic: "AND", items: row.condition ? [row.condition] : [] };
      let actions = (row.actions ?? []).map((action: Row) => {
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
        const defaults = blankAction(action.type);
        return {
          ...defaults,
          ...action,
          continueOnError: action.continueOnError !== false,
          id: action.id ?? uid(),
          relationshipId,
          conditions: action.conditions?.items
            ? action.conditions
            : blankGroup(),
          assignments: Array.isArray(action.assignments)
            ? action.assignments.map((assignment: Row) => ({
                id: assignment.id ?? uid(),
                field: assignment.field ?? "",
                value: assignment.value ?? "",
              }))
            : action.field
              ? [
                  {
                    id: uid(),
                    field: action.field,
                    value: action.value ?? "",
                  },
                ]
              : defaults.assignments,
          outcomes:
            action.type === "DECISION"
              ? Array.isArray(action.outcomes)
                ? action.outcomes.map((outcome: Row) => ({
                    id: outcome.id ?? uid(),
                    name: outcome.name ?? "Outcome",
                    isDefault: !!outcome.isDefault,
                    conditions: outcome.conditions?.items
                      ? outcome.conditions
                      : blankGroup(),
                    actions: Array.isArray(outcome.actions)
                      ? outcome.actions.map((child: Row) => ({
                          ...blankAction(child.type),
                          ...child,
                          continueOnError: child.continueOnError !== false,
                          id: child.id ?? uid(),
                          conditions: child.conditions?.items
                            ? child.conditions
                            : blankGroup(),
                          assignments: Array.isArray(child.assignments)
                            ? child.assignments
                            : child.field
                              ? [
                                  {
                                    id: uid(),
                                    field: child.field,
                                    value: child.value ?? "",
                                  },
                                ]
                              : blankAction(child.type).assignments,
                        }))
                      : [],
                  }))
                : [
                    {
                      id: uid(),
                      name: "Matches",
                      isDefault: false,
                      conditions: action.conditions?.items
                        ? action.conditions
                        : blankGroup(),
                      actions: [],
                    },
                    {
                      id: uid(),
                      name: "Default",
                      isDefault: true,
                      conditions: blankGroup(),
                      actions: [],
                    },
                  ]
              : defaults.outcomes,
          bodyActions: Array.isArray(action.bodyActions)
            ? action.bodyActions.map((child: Row) => ({
                ...blankAction(child.type),
                ...child,
                continueOnError: child.continueOnError !== false,
                id: child.id ?? uid(),
                conditions: child.conditions?.items
                  ? child.conditions
                  : blankGroup(),
                assignments: Array.isArray(child.assignments)
                  ? child.assignments
                  : child.field
                    ? [
                        {
                          id: uid(),
                          field: child.field,
                          value: child.value ?? "",
                        },
                      ]
                    : blankAction(child.type).assignments,
              }))
            : defaults.bodyActions,
        };
      });
      const legacyLoopIndex = (row.actions ?? []).findIndex(
        (action: Row) =>
          action.type === "LOOP" && !Array.isArray(action.bodyActions),
      );
      if (legacyLoopIndex >= 0) {
        actions[legacyLoopIndex] = {
          ...actions[legacyLoopIndex],
          bodyActions: actions.slice(legacyLoopIndex + 1),
        };
        actions = actions.slice(0, legacyLoopIndex + 1);
      }
      setForm({
        name: row.name,
        description: row.description ?? "",
        sourceEntity: row.sourceEntity,
        trigger: row.trigger,
        isActive: current?.isActive ?? false,
        currentVersion: selectedVersion?.version ?? current?.currentVersion ?? 1,
        triggerConditions,
        actions,
      });
    });
  }, [id, versionId]);

  async function createVersion() {
    if (!id) return;
    setMessage("");
    try {
      const version = await studioRequest<Row>(`/flows/${id}/versions`, {
        method: "POST",
      });
      navigate(`/automation-studio/flows/${id}?version=${version.id}`);
      setMessage(`Version ${version.version} draft created.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create version.");
    }
  }

  useEffect(() => {
    if (!id || !logVersionId) {
      setActivityMetrics([]);
      return;
    }
    void studioRequest<{ items: Row[] }>(
      `/flows/${id}/versions/${logVersionId}/activity-metrics`,
    ).then((response) => setActivityMetrics(response.items));
  }, [id, logVersionId]);

  const executionByActivity = useMemo(() => {
    const grouped: Record<string, {
      status: "COMPLETED" | "FAILED";
      count: number;
      errors: number;
      summary: string;
    }> = {};
    for (const item of activityMetrics) {
      const current = grouped[item.activityId] ?? {
        status: "COMPLETED",
        count: 0,
        errors: 0,
        summary: "",
      };
      current.count += Math.max(
        item._count?._all ?? 0,
        item._sum?.inputCount ?? 0,
        item._sum?.outputCount ?? 0,
        item._sum?.affectedCount ?? 0,
      );
      if (item.status === "FAILED") {
        current.status = "FAILED";
        current.errors += item._count?._all ?? 0;
      }
      current.summary = `${current.count} processed across this Flow version.`;
      grouped[item.activityId] = current;
    }
    return grouped;
  }, [activityMetrics]);

  useEffect(() => {
    if (!id || !logVersionId || !executionActivityId) return;
    const params = new URLSearchParams({
      page: String(logPagination.page),
      pageSize: String(logPagination.pageSize),
      logic: logFilterLogic,
    });
    params.set(
      "filters",
      JSON.stringify(
        logFilters.map((filter) => ({
          ...filter,
          value:
            filter.field === "startedDate" &&
            filter.operator !== "LAST_DAYS" &&
            filter.value
              ? new Date(filter.value).toISOString()
              : filter.value,
          valueTo:
            filter.field === "startedDate" &&
            filter.operator === "BETWEEN" &&
            filter.valueTo
              ? new Date(filter.valueTo).toISOString()
              : filter.valueTo,
        })),
      ),
    );
    void studioRequest<{ items: Row[]; pagination: typeof logPagination }>(
      `/flows/${id}/versions/${logVersionId}/activities/${executionActivityId}/logs?${params}`,
    ).then((response) => {
      setLogRows(response.items);
      setLogPagination(response.pagination);
    });
  }, [
    id,
    logVersionId,
    executionActivityId,
    logPagination.page,
    logPagination.pageSize,
    logFilterLogic,
    logFilters,
  ]);

  function updateActionsAt(
    current: any,
    location: ActionLocation,
    updater: (actions: FlowAction[]) => FlowAction[],
  ) {
    if (!location.loopId && (!location.decisionId || !location.outcomeId))
      return { ...current, actions: updater(current.actions) };
    const updateNested = (actions: FlowAction[]): FlowAction[] =>
      actions.map((action) => {
        if (action.id === location.loopId)
          return {
            ...action,
            bodyActions: updater(action.bodyActions),
          };
        if (action.id === location.decisionId)
          return {
            ...action,
            outcomes: action.outcomes.map((outcome) =>
              outcome.id === location.outcomeId
                ? { ...outcome, actions: updater(outcome.actions) }
                : outcome,
            ),
          };
        return {
          ...action,
          bodyActions:
            action.type === "LOOP"
              ? updateNested(action.bodyActions)
              : action.bodyActions,
          outcomes:
            action.type === "DECISION"
              ? action.outcomes.map((outcome) => ({
                  ...outcome,
                  actions: updateNested(outcome.actions),
                }))
              : action.outcomes,
        };
      });
    return {
      ...current,
      actions: updateNested(current.actions),
    };
  }
  function insertActivity(type: ActionType, location: ActionLocation) {
    const next = blankAction(type);
    setForm((current: any) =>
      updateActionsAt(current, location, (actions) => [
        ...actions.slice(0, location.index),
        next,
        ...actions.slice(location.index),
      ]),
    );
    setActionDraft({ ...location, value: next });
    setActivityPickerLocation(null);
  }
  function dropActivity(
    event: DragEvent<HTMLDivElement>,
    location: ActionLocation,
  ) {
    event.preventDefault();
    setDropActiveKey(null);
    const type = event.dataTransfer.getData(
      "application/x-flow-activity",
    ) as ActionType;
    if (!ACTIVITY_TYPES.some((activity) => activity.type === type)) return;
    insertActivity(type, location);
  }
  function openTrigger() {
    setTriggerDraft({
      sourceEntity: form.sourceEntity,
      trigger: form.trigger,
      conditions: structuredClone(form.triggerConditions),
    });
  }
  function openAction(index: number) {
    const value = structuredClone(form.actions[index]);
    setActionDraft({ index, value: { ...value, continueOnError: value.continueOnError !== false } });
  }
  function openBranchAction(
    decisionId: string,
    outcomeId: string,
    index: number,
    action: FlowAction,
  ) {
    setActionDraft({
      decisionId,
      outcomeId,
      index,
      value: { ...structuredClone(action), continueOnError: action.continueOnError !== false },
    });
  }
  function actionSummary(action: FlowAction) {
    if (action.type === "GET_RECORD")
      return `${action.targetEntity || "Choose object"} → ${action.outputKey}`;
    if (action.type === "GET_RECORDS")
      return `${action.targetEntity || "Choose object"} collection → ${action.outputKey}`;
    if (action.type === "LOOP")
      return `For each record in ${action.sourceRef || "a collection"}`;
    if (action.type === "DECISION")
      return `${action.outcomes.length} outcome paths from ${action.sourceRef || "a record"}`;
    if (action.type === "CREATE_MATCHING")
      return `Create ${action.targetEntity || "record"} · ${action.assignments.length} field${action.assignments.length === 1 ? "" : "s"}`;
    if (action.type === "UPDATE_ONE")
      return `Update one ${action.targetEntity || "record"} · ${action.assignments.length} field${action.assignments.length === 1 ? "" : "s"}`;
    if (action.type === "UPDATE_MATCHING")
      return `Update matching ${action.targetEntity || "records"} · ${action.assignments.length} field${action.assignments.length === 1 ? "" : "s"}`;
    if (action.type === "DELETE_MATCHING")
      return `Delete matching ${action.targetEntity || "records"}`;
    if (action.type === "DELETE_RECORD") return "Delete the triggered record";
    if (action.type === "DELETE_RELATED") {
      const relation = relationships.find(
        (item) => item.id === action.relationshipId,
      );
      const count = action.conditions.items.filter((item) => item.field).length;
      return `${relation?.targetEntity ?? "Related records"} · ${count ? `${count} filter${count === 1 ? "" : "s"}` : "all matching records"}`;
    }
    if (!action.assignments.length) return "Click to configure";
    if (action.type === "UPDATE_RECORD")
      return `Set ${action.assignments.length} field${action.assignments.length === 1 ? "" : "s"}`;
    const relation = relationships.find(
      (item) => item.id === action.relationshipId,
    );
    const count = action.conditions.items.filter((item) => item.field).length;
    return `${relation?.targetEntity ?? "Related records"} · ${count ? `${count} filter${count === 1 ? "" : "s"} · ` : ""}set ${action.assignments.length} field${action.assignments.length === 1 ? "" : "s"}`;
  }
  function insertionPoint(location: ActionLocation) {
    const key = `${location.decisionId ?? "root"}:${location.outcomeId ?? "root"}:${location.index}`;
    return (
      <div
        className={`flow-insert-point ${
          dropActiveKey === key ? "active" : ""
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setDropActiveKey(key);
        }}
        onDragLeave={() => setDropActiveKey(null)}
        onDrop={(event) => dropActivity(event, location)}
      >
        <button
          type="button"
          aria-label={`Add activity at position ${location.index + 1}`}
          onClick={() => setActivityPickerLocation(location)}
        >
          +
        </button>
        <span>Drop activity here</span>
      </div>
    );
  }
  function typed(value: any, field?: SchemaField) {
    if (
      typeof value === "string" &&
      /^\{\{[a-zA-Z0-9_-]+\.[a-zA-Z0-9_]+\}\}$/.test(value)
    )
      return value;
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
  async function saveFlow(activeState = form.isActive, activateAfter = false) {
    if (!form.sourceEntity) {
      setMessage("Configure the trigger before saving.");
      return;
    }
    if (!form.name.trim()) {
      setMessage("Give the flow a name before saving.");
      return;
    }
    const flattenActions = (actions: FlowAction[]): FlowAction[] =>
      actions.flatMap((action) => [
        action,
        ...flattenActions(action.bodyActions),
        ...action.outcomes.flatMap((outcome) =>
          flattenActions(outcome.actions),
        ),
      ]);
    const everyAction = flattenActions(form.actions);
    const outputKeys = everyAction
      .filter((action: FlowAction) =>
        ["GET_RECORD", "GET_RECORDS", "LOOP"].includes(action.type),
      )
      .map((action: FlowAction) => action.outputKey)
      .filter(Boolean);
    if (new Set(outputKeys).size !== outputKeys.length) {
      setMessage("Every data and loop output must have a unique name.");
      return;
    }
    const invalidAction = everyAction.find((action: FlowAction) => {
      if (
        ["GET_RECORD", "GET_RECORDS", "CREATE_MATCHING", "UPDATE_ONE", "UPDATE_MATCHING", "DELETE_MATCHING"].includes(
          action.type,
        ) &&
        !action.targetEntity
      )
        return true;
      if (action.type === "LOOP" && !action.sourceRef) return true;
      if (
        action.type === "DECISION" &&
        (!action.outcomes.some((outcome) => outcome.isDefault) ||
          !action.outcomes
            .filter((outcome) => !outcome.isDefault)
            .every((outcome) =>
              outcome.conditions.items.some((condition) => condition.field),
            ))
      )
        return true;
      if (
        ["UPDATE_ONE", "UPDATE_MATCHING", "DELETE_MATCHING"].includes(action.type) &&
        !action.conditions.items.some((condition) => condition.field)
      )
        return true;
      if (
        [
          "UPDATE_RECORD",
          "UPDATE_RELATED",
          "CREATE_MATCHING",
          "UPDATE_ONE",
          "UPDATE_MATCHING",
        ].includes(action.type) &&
        (!action.assignments.length ||
          action.assignments.some((assignment) => !assignment.field) ||
          new Set(
            action.assignments.map((assignment) => assignment.field),
          ).size !== action.assignments.length)
      )
        return true;
      return false;
    });
    if (invalidAction) {
      setMessage(
        `${activityDefinition(invalidAction.type).title} is not completely configured.`,
      );
      return;
    }
    const actions = form.actions.map((action: FlowAction) => {
      const relation = relationships.find(
        (item) => item.id === action.relationshipId,
      );
      const target =
        ["UPDATE_RECORD", "DELETE_RECORD"].includes(action.type)
          ? form.sourceEntity
          : action.type === "DECISION"
            ? entityForReference(action.sourceRef)
            : (relation?.targetEntity ?? action.targetEntity);
      const metadata = model(target)?.fields.find(
        (field) => field.name === action.field,
      );
      return {
        ...action,
        targetEntity: target,
        value: typed(action.value, metadata),
        assignments: action.assignments.map((assignment) => ({
          ...assignment,
          value: typed(
            assignment.value,
            model(target)?.fields.find(
              (field) => field.name === assignment.field,
            ),
          ),
        })),
        conditions: typedGroup(action.conditions, target),
        outcomes: action.outcomes.map((outcome) => ({
          ...outcome,
          conditions: typedGroup(outcome.conditions, target),
          actions: outcome.actions.map((child) => {
            const childRelation = relationships.find(
              (item) => item.id === child.relationshipId,
            );
            const childTarget = [
              "UPDATE_RECORD",
              "DELETE_RECORD",
            ].includes(child.type)
              ? form.sourceEntity
              : (childRelation?.targetEntity ?? child.targetEntity);
            const childField = model(childTarget)?.fields.find(
              (field) => field.name === child.field,
            );
            return {
              ...child,
              targetEntity: childTarget,
              value: typed(child.value, childField),
              assignments: child.assignments.map((assignment) => ({
                ...assignment,
                value: typed(
                  assignment.value,
                  model(childTarget)?.fields.find(
                    (field) => field.name === assignment.field,
                  ),
                ),
              })),
              conditions: typedGroup(child.conditions, childTarget),
            };
          }),
        })),
        bodyActions: action.bodyActions.map((child) => {
          const childRelation = relationships.find(
            (item) => item.id === child.relationshipId,
          );
          const childTarget = ["UPDATE_RECORD", "DELETE_RECORD"].includes(
            child.type,
          )
            ? form.sourceEntity
            : (childRelation?.targetEntity ?? child.targetEntity);
          const childField = model(childTarget)?.fields.find(
            (field) => field.name === child.field,
          );
          return {
            ...child,
            targetEntity: childTarget,
            value: typed(child.value, childField),
            assignments: child.assignments.map((assignment) => ({
              ...assignment,
              value: typed(
                assignment.value,
                model(childTarget)?.fields.find(
                  (field) => field.name === assignment.field,
                ),
              ),
            })),
            conditions: typedGroup(child.conditions, childTarget),
          };
        }),
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
    const savePath =
      id && versionId ? `/flows/${id}/versions/${versionId}` : "/flows";
    const saved = await studioRequest<Row>(savePath, {
      method: id && versionId ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });
    if (activateAfter && id && versionId) {
      await studioRequest(`/flows/${id}/versions/${versionId}/activate`, {
        method: "POST",
      });
      setVersionStatus("ACTIVE");
      setForm((current: any) => ({ ...current, isActive: true }));
      setMessage(`Version ${form.currentVersion} saved and activated.`);
      navigate(`/automation-studio/flows/${id}`, { replace: true });
      return;
    }
    setMessage(
      id && versionId ? `Version ${form.currentVersion} draft saved.` : "Flow draft saved.",
    );
    setForm((current: any) => ({ ...current, isActive: activeState }));
    setMetadataOpen(false);
    if (!id)
      navigate(`/automation-studio/flows/${saved.id}?version=${saved.draftVersionId}`, { replace: true });
  }

  const draftRelation = actionDraft
    ? relationships.find((item) => item.id === actionDraft.value.relationshipId)
    : undefined;
  function findActionContainer(
    actions: FlowAction[],
    decisionId: string,
    outcomeId: string,
    inherited: FlowAction[] = [],
  ): { before: FlowAction[]; outcome: DecisionOutcome } | undefined {
    for (let index = 0; index < actions.length; index += 1) {
      const action = actions[index]!;
      const before = [...inherited, ...actions.slice(0, index)];
      if (action.id === decisionId) {
        const outcome = action.outcomes.find(
          (candidate) => candidate.id === outcomeId,
        );
        if (outcome) return { before, outcome };
      }
      if (action.type === "DECISION") {
        for (const outcome of action.outcomes) {
          const nested = findActionContainer(
            outcome.actions,
            decisionId,
            outcomeId,
            before,
          );
          if (nested) return nested;
        }
      }
      if (action.type === "LOOP") {
        const nested = findActionContainer(
          action.bodyActions,
          decisionId,
          outcomeId,
          [...before, action],
        );
        if (nested) return nested;
      }
    }
    return undefined;
  }
  function findLoopContainer(
    actions: FlowAction[],
    loopId: string,
    inherited: FlowAction[] = [],
  ): { before: FlowAction[]; loop: FlowAction } | undefined {
    for (let index = 0; index < actions.length; index += 1) {
      const action = actions[index]!;
      const before = [...inherited, ...actions.slice(0, index)];
      if (action.id === loopId) return { before, loop: action };
      for (const outcome of action.outcomes) {
        const nested = findLoopContainer(
          outcome.actions,
          loopId,
          before,
        );
        if (nested) return nested;
      }
      if (action.type === "LOOP") {
        const nested = findLoopContainer(action.bodyActions, loopId, before);
        if (nested) return nested;
      }
    }
    return undefined;
  }
  function findActiveLoopIds(
    actions: FlowAction[],
    location: ActionLocation,
    activeLoopIds: string[] = [],
  ): string[] | undefined {
    for (const action of actions) {
      if (
        action.id === location.decisionId &&
        action.outcomes.some(
          (outcome) => outcome.id === location.outcomeId,
        )
      )
        return activeLoopIds;
      if (action.id === location.loopId)
        return [...activeLoopIds, action.id];
      for (const outcome of action.outcomes) {
        const nested = findActiveLoopIds(
          outcome.actions,
          location,
          activeLoopIds,
        );
        if (nested) return nested;
      }
      if (action.type === "LOOP") {
        const nested = findActiveLoopIds(
          action.bodyActions,
          location,
          [...activeLoopIds, action.id],
        );
        if (nested) return nested;
      }
    }
    return undefined;
  }
  const draftContainer =
    actionDraft?.decisionId && actionDraft.outcomeId
      ? findActionContainer(
          form.actions,
          actionDraft.decisionId,
          actionDraft.outcomeId,
        )
      : undefined;
  const draftLoopContainer = actionDraft?.loopId
    ? findLoopContainer(form.actions, actionDraft.loopId)
    : undefined;
  const availableOutputActions = actionDraft?.loopId
    ? [
        ...(draftLoopContainer?.before ?? []),
        ...(draftLoopContainer ? [draftLoopContainer.loop] : []),
        ...(draftLoopContainer?.loop.bodyActions.slice(
          0,
          actionDraft.index,
        ) ?? []),
      ]
    : actionDraft?.decisionId
    ? [
        ...(draftContainer?.before ?? []),
        ...(draftContainer?.outcome.actions.slice(0, actionDraft.index) ?? []),
      ]
    : form.actions.slice(0, actionDraft?.index ?? form.actions.length);
  const activeLoopIds = actionDraft
    ? (findActiveLoopIds(form.actions, actionDraft) ?? [])
    : [];
  const outputSources = [
    { value: "trigger", label: `Triggered ${form.sourceEntity || "record"}`, entity: form.sourceEntity, collection: false },
    ...availableOutputActions.flatMap((action: FlowAction) => {
      if (action.type === "GET_RECORD" || action.type === "GET_RECORDS")
        return [{
          value: action.outputKey,
          label: `${action.outputKey} (${action.targetEntity || "unconfigured"})`,
          entity: action.targetEntity,
          collection: action.type === "GET_RECORDS",
        }];
      if (action.type === "LOOP") {
        if (!activeLoopIds.includes(action.id)) return [];
        const source = availableOutputActions.find(
          (candidate: FlowAction) => candidate.outputKey === action.sourceRef,
        );
        return [{
          value: action.outputKey,
          label: `${action.outputKey} (current loop record)`,
          entity: source?.targetEntity ?? "",
          collection: false,
        }];
      }
        return [];
    }),
  ];
  const entityForReference = (reference: string) =>
    outputSources.find((source) => source.value === reference)?.entity ?? "";
  const referenceOptions = outputSources.flatMap((source) =>
    (model(source.entity)?.fields ?? []).map((field) => ({
      label: `${source.label} → ${field.name}`,
      value: `{{${source.value}.${field.name}}}`,
    })),
  );
  const draftTarget = !actionDraft
    ? ""
    : ["UPDATE_RECORD", "DELETE_RECORD"].includes(actionDraft.value.type)
      ? form.sourceEntity
      : actionDraft.value.type === "DECISION"
        ? entityForReference(actionDraft.value.sourceRef)
        : (draftRelation?.targetEntity ?? actionDraft.value.targetEntity);
  const availableRelationships = relationships.filter(
    (item) =>
      item.sourceEntity === form.sourceEntity &&
      FLOW_ENTITIES.has(item.targetEntity),
  );
  function renderActionList(
    actions: FlowAction[],
    parent: Pick<ActionLocation, "decisionId" | "outcomeId"> = {},
  ) {
    return (
      <>
        {insertionPoint({ ...parent, index: 0 })}
        {actions.map((action, index) => (
          <div className="visual-node-group" key={action.id}>
            <button
              type="button"
              className={`compact-flow-node activity-compact ${
                actionSummary(action).length > 54 ? "has-long-summary" : ""
              } ${
                ["DECISION", "LOOP"].includes(action.type)
                  ? "control-flow-node"
                  : ""
              }`}
              onClick={() =>
                parent.decisionId && parent.outcomeId
                  ? openBranchAction(
                      parent.decisionId,
                      parent.outcomeId,
                      index,
                      action,
                    )
                  : openAction(index)
              }
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
              className={
                parent.decisionId ? "branch-node-delete" : "compact-node-delete"
              }
              onClick={() =>
                setForm((current: any) =>
                  updateActionsAt(
                    current,
                    { ...parent, index },
                    (currentActions) =>
                      currentActions.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                  ),
                )
              }
            >
              ×
            </button>
            {action.type === "DECISION" && (
              <div
                className="decision-paths"
                style={
                  {
                    "--decision-path-count": action.outcomes.length,
                  } as CSSProperties
                }
              >
                {action.outcomes.map((outcome) => (
                  <section className="decision-path" key={outcome.id}>
                    <header>
                      <span>{outcome.isDefault ? "DEFAULT" : "OUTCOME"}</span>
                      <b>{outcome.name}</b>
                    </header>
                    <div className="decision-path-track">
                      {renderActionList(outcome.actions, {
                        decisionId: action.id,
                        outcomeId: outcome.id,
                      })}
                    </div>
                  </section>
                ))}
                <div className="decision-merge" aria-label="Paths merge" />
              </div>
            )}
            {insertionPoint({ ...parent, index: index + 1 })}
          </div>
        ))}
      </>
    );
  }

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
          {id && (
            <button
              type="button"
              className="secondary"
              onClick={() => setVersionsOpen(true)}
            >
              Versions ({versions.length || form.currentVersion || 1})
            </button>
          )}
          {versionId && versionStatus !== "DRAFT" && (
            <button
              type="button"
              className="secondary"
              onClick={() => navigate(`/automation-studio/flows/${id}`)}
            >
              Back to Active Version
            </button>
          )}
          {id && !versionId && (
            <button
              type="button"
              className="primary"
              onClick={() => void createVersion()}
            >
              + Create New Version
            </button>
          )}
          {(!id || (versionId && versionStatus === "DRAFT")) && (
            <>
              <button
                type="button"
                className="primary"
                onClick={() => setMetadataOpen(true)}
              >
                {id ? "Save Draft" : "Save Flow Draft"}
              </button>
              {id && versionId && (
                <button
                  type="button"
                  className="activate-button"
                  onClick={() => void saveFlow(true, true)}
                >
                  Activate Version
                </button>
              )}
            </>
          )}
        </div>
      </header>
      {readOnly && (
        <div className="flow-version-banner">
          {versionId
            ? `Viewing immutable version ${form.currentVersion} (${versionStatus?.toLowerCase()}).`
            : `Viewing ${form.isActive ? "active" : "published"} Flow version ${form.currentVersion}. Create a new version to make changes.`}
        </div>
      )}
      {executionActivityId && runPopupOpen && (
        <section className="flow-activity-log-popup" role="dialog" aria-modal="true">
          <header>
            <div>
              <span>Version {form.currentVersion} execution history</span>
              <h2>Activity processing details</h2>
              <p>{logPagination.total.toLocaleString()} execution/iteration row{logPagination.total === 1 ? "" : "s"} for this activity.</p>
            </div>
            <button
              type="button"
              aria-label="Close activity execution history"
              onClick={() => {
                setRunPopupOpen(false);
                setExecutionActivityId(null);
                setExecutionActivityType(null);
              }}
            >
              ×
            </button>
          </header>
          <div className="flow-activity-log-filters">
            <div className="flow-log-filter-toolbar">
              <div>
                <b>Filter activity logs</b>
                <small>Build conditions and decide how they are combined.</small>
              </div>
              <label>
                Match
                <select
                  value={logFilterLogic}
                  onChange={(event) => {
                    setLogPagination((current) => ({ ...current, page: 1 }));
                    setLogFilterLogic(event.target.value as "AND" | "OR");
                  }}
                >
                  <option value="AND">All conditions (AND)</option>
                  <option value="OR">Any condition (OR)</option>
                </select>
              </label>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setLogFilters((current) => [
                    ...current,
                    {
                      id: uid(),
                      field: "triggerRecordId",
                      operator: "CONTAINS",
                      value: "",
                      valueTo: "",
                    },
                  ])
                }
              >
                + Add condition
              </button>
              {logFilters.length > 0 && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setLogFilters([]);
                    setLogPagination((current) => ({ ...current, page: 1 }));
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flow-log-condition-list">
              {logFilters.length === 0 && (
                <div className="flow-log-filter-empty">
                  No filters applied. Add a condition to narrow these logs.
                </div>
              )}
              {logFilters.map((filter, index) => {
                const singleRecordActivity = [
                  "CREATE_MATCHING",
                  "UPDATE_ONE",
                  "UPDATE_RECORD",
                  "DELETE_RECORD",
                  "GET_RECORD",
                ].includes(executionActivityType ?? "");
                const updateFilter = (patch: Partial<typeof filter>) => {
                  setLogPagination((current) => ({ ...current, page: 1 }));
                  setLogFilters((current) =>
                    current.map((item) =>
                      item.id === filter.id ? { ...item, ...patch } : item,
                    ),
                  );
                };
                return (
                  <div className="flow-log-condition" key={filter.id}>
                    <span className="flow-log-condition-index">
                      {index === 0 ? "WHERE" : logFilterLogic}
                    </span>
                    <select
                      value={filter.field}
                      onChange={(event) => {
                        const field = event.target.value as typeof filter.field;
                        updateFilter({
                          field,
                          operator: field === "startedDate" ? "LAST_DAYS" : "CONTAINS",
                          value: field === "startedDate" ? "7" : "",
                          valueTo: "",
                        });
                      }}
                    >
                      <option value="triggerRecordId">Trigger object ID</option>
                      {singleRecordActivity && (
                        <option value="affectedId">Affected record ID</option>
                      )}
                      <option value="startedDate">Date executed</option>
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(event) =>
                        updateFilter({
                          operator: event.target.value,
                          value: event.target.value === "LAST_DAYS" ? "7" : "",
                          valueTo: "",
                        })
                      }
                    >
                      {filter.field === "startedDate" ? (
                        <>
                          <option value="LAST_DAYS">is in the last X days</option>
                          <option value="BETWEEN">is between</option>
                          <option value="AFTER">is after</option>
                          <option value="BEFORE">is before</option>
                        </>
                      ) : (
                        <>
                          <option value="CONTAINS">contains</option>
                          <option value="EQUALS">equals</option>
                        </>
                      )}
                    </select>
                    <input
                      type={
                        filter.field === "startedDate" &&
                        filter.operator !== "LAST_DAYS"
                          ? "datetime-local"
                          : filter.operator === "LAST_DAYS"
                            ? "number"
                            : "text"
                      }
                      min={filter.operator === "LAST_DAYS" ? "1" : undefined}
                      value={filter.value}
                      placeholder={filter.operator === "LAST_DAYS" ? "Days" : "Value"}
                      onChange={(event) => updateFilter({ value: event.target.value })}
                    />
                    {filter.operator === "BETWEEN" && (
                      <>
                        <span className="flow-log-and">and</span>
                        <input
                          type="datetime-local"
                          value={filter.valueTo}
                          onChange={(event) => updateFilter({ valueTo: event.target.value })}
                        />
                      </>
                    )}
                    <button
                      type="button"
                      className="danger-ghost"
                      aria-label="Remove filter condition"
                      onClick={() => {
                        setLogPagination((current) => ({ ...current, page: 1 }));
                        setLogFilters((current) =>
                          current.filter((item) => item.id !== filter.id),
                        );
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flow-activity-log-table">
            <table>
              <thead>
                <tr>
                  <th>Executed</th>
                  <th>Trigger ID</th>
                  <th>Object</th>
                  <th>Affected ID / count</th>
                  <th>Status</th>
                  <th>What happened</th>
                </tr>
              </thead>
              <tbody>
                {logRows.map((row) => (
                  <tr key={row.id} className={row.status === "FAILED" ? "failed" : ""}>
                    <td>{new Date(row.startedDate || row.runStartedDate).toLocaleString()}</td>
                    <td><code>{row.run?.triggerRecordId || "—"}</code></td>
                    <td>
                      {row.objectName
                        ? row.objectName[0].toUpperCase() + row.objectName.slice(1)
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={row.filterSummary ? "activity-affected-detail" : ""}
                        title={row.filterSummary || undefined}
                      >
                        {row.affectedId ?? "—"}
                      </span>
                    </td>
                    <td><span className={`activity-run-status ${row.status.toLowerCase()}`}>{row.status}</span></td>
                    <td>
                      <b>{row.summary || "Activity completed."}</b>
                      {row.error && <small>{row.error}</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="flow-log-pagination">
            <span>
              Page {logPagination.page} of {logPagination.totalPages} ·{" "}
              {logPagination.total.toLocaleString()} rows
            </span>
            <label>
              Rows per page
              <select
                value={logPagination.pageSize}
                onChange={(event) =>
                  setLogPagination((current) => ({
                    ...current,
                    page: 1,
                    pageSize: Number(event.target.value),
                  }))
                }
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
            <button
              type="button"
              className="secondary"
              disabled={logPagination.page <= 1}
              onClick={() =>
                setLogPagination((current) => ({
                  ...current,
                  page: current.page - 1,
                }))
              }
            >
              Previous
            </button>
            <button
              type="button"
              className="secondary"
              disabled={logPagination.page >= logPagination.totalPages}
              onClick={() =>
                setLogPagination((current) => ({
                  ...current,
                  page: current.page + 1,
                }))
              }
            >
              Next
            </button>
          </footer>
        </section>
      )}
      {message && (
        <div
          className={
            /saved|activated|created/i.test(message)
              ? "alert success"
              : "alert error"
          }
        >
          {message}
        </div>
      )}
      <div className="visual-flow-shell">
        <aside className={`flow-palette ${readOnly ? "read-only" : ""}`}>
          <div className="flow-palette-title">
            <span>TOOLBOX</span>
            <h2>Activities</h2>
            <p>Drag an activity into the flow.</p>
          </div>
          {ACTIVITY_TYPES.map((activity) => (
            <div
              className="palette-activity"
              draggable={!readOnly}
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
            <b>Coming next</b>
            <span>Send Email</span>
            <span>Wait / Pause</span>
            <span>HTTP Callout</span>
          </div>
        </aside>
        <main className="visual-flow-main">
          <FlowGraphCanvas
            triggerTitle={
              form.sourceEntity ? "Record Trigger" : "Configure Trigger"
            }
            triggerSummary={triggerSummary(
              form.sourceEntity,
              form.trigger,
              form.triggerConditions,
            )}
            triggerConfigured={!!form.sourceEntity}
            actions={form.actions}
            executionByActivity={executionByActivity}
            onOpenExecution={(activityId, activityType) => {
              setExecutionActivityId(activityId);
              setExecutionActivityType(activityType);
              setLogPagination((current) => ({ ...current, page: 1 }));
              setLogFilters([]);
              setLogFilterLogic("AND");
              setRunPopupOpen(true);
            }}
            activityDefinition={activityDefinition}
            actionSummary={actionSummary}
            onConfigureTrigger={openTrigger}
            onInsert={readOnly ? () => undefined : (location) => setActivityPickerLocation(location)}
            onDropActivity={(type, location) =>
              !readOnly && insertActivity(type as ActionType, location)
            }
            onEditAction={(location, action) => {
              return location.loopId
                ? setActionDraft({
                    ...location,
                    value: {
                      ...structuredClone(action as FlowAction),
                      continueOnError: (action as FlowAction).continueOnError !== false,
                    },
                  })
                : location.decisionId && location.outcomeId
                ? openBranchAction(
                    location.decisionId,
                    location.outcomeId,
                    location.index,
                    action as FlowAction,
                  )
                : openAction(location.index)
            }}
            onDeleteAction={(location) =>
              !readOnly &&
              setForm((current: any) =>
                updateActionsAt(current, location, (actions) =>
                  actions.filter(
                    (_, index) => index !== location.index,
                  ),
                ),
              )
            }
          />
        </main>
      </div>
      {versionsOpen && (
        <Modal
          title="Flow version history"
          description="Every saved definition is immutable. Open any version to visualize exactly what was configured."
          onCancel={() => setVersionsOpen(false)}
        >
          <div className="flow-version-list">
            {versions.map((version) => (
              <button
                type="button"
                key={version.id}
                className={version.id === versionId ? "selected" : ""}
                onClick={() => {
                  setVersionsOpen(false);
                  navigate(`/automation-studio/flows/${id}?version=${version.id}`);
                }}
              >
                <b>Version {version.version}</b>
                <span>{new Date(version.createdDate).toLocaleString()}</span>
                <em>{version.status}</em>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {activityPickerLocation !== null && (
        <Modal
          title="Add Activity"
          description="Choose the activity to insert at this point in the flow."
          onCancel={() => setActivityPickerLocation(null)}
        >
          <div className="activity-picker-grid">
            {ACTIVITY_TYPES.map((activity) => (
              <button
                type="button"
                className="activity-picker-option"
                key={activity.type}
                onClick={() =>
                  insertActivity(activity.type, activityPickerLocation)
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
          title={id ? `Save Version ${form.currentVersion}` : "Save Flow Draft"}
          description={
            id
              ? "Save your changes to this draft. It will not affect the active Flow until you activate this version."
              : "Give the new Flow a name and description. Version 1 will be created as a draft."
          }
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
          readOnly={readOnly}
          onSave={readOnly ? undefined : () => {
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
          readOnly={readOnly}
          onSave={readOnly ? undefined : () => {
            setForm((current: any) =>
              updateActionsAt(current, actionDraft, (actions) =>
                actions.map((action: FlowAction, index: number) =>
                  index === actionDraft.index ? actionDraft.value : action,
                ),
              ),
            );
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
          <label className="flow-error-policy">
            <input
              type="checkbox"
              checked={actionDraft.value.continueOnError}
              onChange={(event) =>
                setActionDraft({
                  ...actionDraft,
                  value: {
                    ...actionDraft.value,
                    continueOnError: event.target.checked,
                  },
                })
              }
            />
            <span>
              <b>Continue this path when this activity fails</b>
              <small>Enabled by default. Disable it to stop the current Flow execution immediately.</small>
            </span>
          </label>
          {executionByActivity[actionDraft.value.id] && (
            <div className={`activity-last-run ${executionByActivity[actionDraft.value.id].errors ? "error" : ""}`}>
              <b>Latest execution</b>
              <span>{executionByActivity[actionDraft.value.id].summary}</span>
            </div>
          )}
          {["GET_RECORD", "GET_RECORDS"].includes(
            actionDraft.value.type,
          ) && (
            <>
              <div className="studio-form-grid">
                <FormField label="Object to query">
                  <select
                    value={actionDraft.value.targetEntity}
                    onChange={(event) =>
                      setActionDraft({
                        ...actionDraft,
                        value: {
                          ...actionDraft.value,
                          targetEntity: event.target.value,
                          conditions: blankGroup(),
                        },
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
                <FormField label="Output variable">
                  <input
                    value={actionDraft.value.outputKey}
                    onChange={(event) =>
                      setActionDraft({
                        ...actionDraft,
                        value: {
                          ...actionDraft.value,
                          outputKey: event.target.value.replace(
                            /[^a-zA-Z0-9_-]/g,
                            "_",
                          ),
                        },
                      })
                    }
                    required
                  />
                </FormField>
              </div>
              <ConditionsEditor
                value={actionDraft.value.conditions}
                fields={
                  model(actionDraft.value.targetEntity)?.fields ?? []
                }
                onChange={(conditions) =>
                  setActionDraft({
                    ...actionDraft,
                    value: { ...actionDraft.value, conditions },
                  })
                }
                emptyLabel="No conditions returns the first record or up to 200 records."
                references={referenceOptions}
              />
              <div className="reference-help">
                Condition values may reference previous data using{" "}
                <code>{"{{trigger.email}}"}</code> or{" "}
                <code>{"{{outputName.id}}"}</code>.
              </div>
            </>
          )}
          {actionDraft.value.type === "LOOP" && (
            <div className="studio-form-grid">
              <FormField label="Records collection">
                <select
                  value={actionDraft.value.sourceRef}
                  onChange={(event) =>
                    setActionDraft({
                      ...actionDraft,
                      value: {
                        ...actionDraft.value,
                        sourceRef: event.target.value,
                      },
                    })
                  }
                  required
                >
                  <option value="">Choose Get Records output</option>
                  {outputSources
                    .filter((source) => source.collection)
                    .map((source) => (
                      <option value={source.value} key={source.value}>
                        {source.label}
                      </option>
                    ))}
                </select>
              </FormField>
              <FormField label="Current record variable">
                <input
                  value={actionDraft.value.outputKey}
                  onChange={(event) =>
                    setActionDraft({
                      ...actionDraft,
                      value: {
                        ...actionDraft.value,
                        outputKey: event.target.value.replace(
                          /[^a-zA-Z0-9_-]/g,
                          "_",
                        ),
                      },
                    })
                  }
                  required
                />
              </FormField>
              <div className="reference-help">
                Activities placed on the Iteration path run once per record
                and return to this Loop. Reference the current item with{" "}
                <code>{`{{${actionDraft.value.outputKey}.fieldName}}`}</code>.
              </div>
            </div>
          )}
          {actionDraft.value.type === "DECISION" && (
            <>
              <FormField label="Record to evaluate">
                <select
                  value={actionDraft.value.sourceRef}
                  onChange={(event) =>
                    setActionDraft({
                      ...actionDraft,
                      value: {
                        ...actionDraft.value,
                        sourceRef: event.target.value,
                        outcomes: actionDraft.value.outcomes.map((outcome) => ({
                          ...outcome,
                          conditions: blankGroup(),
                        })),
                      },
                    })
                  }
                >
                  {outputSources
                    .filter((source) => !source.collection)
                    .map((source) => (
                      <option value={source.value} key={source.value}>
                        {source.label}
                      </option>
                    ))}
                </select>
              </FormField>
              <div className="decision-outcome-editor-head">
                <div>
                  <b>Outcome paths</b>
                  <small>
                    The first matching outcome runs. Default runs when none
                    match.
                  </small>
                </div>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    const defaultIndex = actionDraft.value.outcomes.findIndex(
                      (outcome) => outcome.isDefault,
                    );
                    const outcome: DecisionOutcome = {
                      id: uid(),
                      name: `Outcome ${actionDraft.value.outcomes.length}`,
                      isDefault: false,
                      conditions: blankGroup(),
                      actions: [],
                    };
                    const outcomes = [...actionDraft.value.outcomes];
                    outcomes.splice(
                      defaultIndex < 0 ? outcomes.length : defaultIndex,
                      0,
                      outcome,
                    );
                    setActionDraft({
                      ...actionDraft,
                      value: { ...actionDraft.value, outcomes },
                    });
                  }}
                >
                  + Add outcome
                </button>
              </div>
              {actionDraft.value.outcomes.map((outcome, outcomeIndex) => (
                <section
                  className={`decision-outcome-editor ${
                    outcome.isDefault ? "default" : ""
                  }`}
                  key={outcome.id}
                >
                  <div className="decision-outcome-title">
                    <FormField
                      label={outcome.isDefault ? "Default path" : "Path name"}
                    >
                      <input
                        value={outcome.name}
                        onChange={(event) =>
                          setActionDraft({
                            ...actionDraft,
                            value: {
                              ...actionDraft.value,
                              outcomes: actionDraft.value.outcomes.map(
                                (item, index) =>
                                  index === outcomeIndex
                                    ? { ...item, name: event.target.value }
                                    : item,
                              ),
                            },
                          })
                        }
                        required
                      />
                    </FormField>
                    {!outcome.isDefault && (
                      <button
                        type="button"
                        className="danger-ghost"
                        onClick={() =>
                          setActionDraft({
                            ...actionDraft,
                            value: {
                              ...actionDraft.value,
                              outcomes: actionDraft.value.outcomes.filter(
                                (_, index) => index !== outcomeIndex,
                              ),
                            },
                          })
                        }
                      >
                        Remove path
                      </button>
                    )}
                  </div>
                  {outcome.isDefault ? (
                    <p className="reference-help">
                      Used automatically when no earlier outcome matches.
                    </p>
                  ) : (
                    <ConditionsEditor
                      value={outcome.conditions}
                      fields={model(draftTarget)?.fields ?? []}
                      onChange={(conditions) =>
                        setActionDraft({
                          ...actionDraft,
                          value: {
                            ...actionDraft.value,
                            outcomes: actionDraft.value.outcomes.map(
                              (item, index) =>
                                index === outcomeIndex
                                  ? { ...item, conditions }
                                  : item,
                            ),
                          },
                        })
                      }
                      emptyLabel="This outcome requires at least one condition."
                      references={referenceOptions}
                    />
                  )}
                </section>
              ))}
            </>
          )}
          {["CREATE_MATCHING", "UPDATE_ONE", "UPDATE_MATCHING", "DELETE_MATCHING"].includes(
            actionDraft.value.type,
          ) && (
            <>
              <FormField label="Object">
                <select
                  value={actionDraft.value.targetEntity}
                  onChange={(event) =>
                    setActionDraft({
                      ...actionDraft,
                      value: {
                        ...actionDraft.value,
                        targetEntity: event.target.value,
                        field: "",
                        value: "",
                        assignments: [blankAssignment()],
                        conditions: blankGroup(),
                      },
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
              {actionDraft.value.type !== "CREATE_MATCHING" && (
                <>
                  <ConditionsEditor
                    value={actionDraft.value.conditions}
                    fields={
                      model(actionDraft.value.targetEntity)?.fields ?? []
                    }
                    onChange={(conditions) =>
                      setActionDraft({
                        ...actionDraft,
                        value: { ...actionDraft.value, conditions },
                      })
                    }
                    emptyLabel="Add a condition such as id, individualId, email, or another field to select the record."
                    references={referenceOptions}
                  />
                  <div className="reference-help">
                    Record IDs are available for lookup conditions. They are
                    intentionally excluded only from Set Field Values because
                    primary keys must not be overwritten.
                  </div>
                </>
              )}
            </>
          )}
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
                        assignments: [blankAssignment()],
                        conditions: blankGroup(),
                      },
                    });
                  }}
                  required
                >
                  <option value="">Choose a Prisma relationship</option>
                  {availableRelationships.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.targetEntity} records — {item.label}
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
                references={referenceOptions}
              />
            </>
          )}
          {[
            "UPDATE_RECORD",
            "UPDATE_RELATED",
            "CREATE_MATCHING",
            "UPDATE_ONE",
            "UPDATE_MATCHING",
          ].includes(
            actionDraft.value.type,
          ) && (
            <div className="visual-field-update">
              <div className="assignment-editor-head">
                <div>
                  <h3>Set Field Values</h3>
                  <small>
                    All field changes are written in one database operation.
                  </small>
                </div>
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setActionDraft({
                      ...actionDraft,
                      value: {
                        ...actionDraft.value,
                        assignments: [
                          ...actionDraft.value.assignments,
                          blankAssignment(),
                        ],
                      },
                    })
                  }
                >
                  + Add field
                </button>
              </div>
              {actionDraft.value.assignments.map(
                (assignment, assignmentIndex) => {
                  const assignmentField = model(draftTarget)?.fields.find(
                    (field) => field.name === assignment.field,
                  );
                  return (
                    <div className="field-assignment-row" key={assignment.id}>
                      <FormField label={`Field ${assignmentIndex + 1}`}>
                        <select
                          value={assignment.field}
                          onChange={(event) =>
                            setActionDraft({
                              ...actionDraft,
                              value: {
                                ...actionDraft.value,
                                assignments:
                                  actionDraft.value.assignments.map(
                                    (item, index) =>
                                      index === assignmentIndex
                                        ? {
                                            ...item,
                                            field: event.target.value,
                                            value: "",
                                          }
                                        : item,
                                  ),
                              },
                            })
                          }
                          required
                        >
                          <option value="">Choose field</option>
                          {model(draftTarget)?.fields
                            .filter(
                              (field) =>
                                !PROTECTED_ASSIGNMENT_FIELDS.has(field.name),
                            )
                            .map((field) => (
                              <option
                                key={field.name}
                                disabled={actionDraft.value.assignments.some(
                                  (item, index) =>
                                    index !== assignmentIndex &&
                                    item.field === field.name,
                                )}
                              >
                                {field.name}
                              </option>
                            ))}
                        </select>
                      </FormField>
                      <FormField label="Value">
                        <ValueInput
                          field={assignmentField}
                          operator="EQUALS"
                          value={assignment.value}
                          onChange={(value) =>
                            setActionDraft({
                              ...actionDraft,
                              value: {
                                ...actionDraft.value,
                                assignments:
                                  actionDraft.value.assignments.map(
                                    (item, index) =>
                                      index === assignmentIndex
                                        ? { ...item, value }
                                        : item,
                                  ),
                              },
                            })
                          }
                        />
                        <select
                          className="condition-reference-select"
                          value={
                            typeof assignment.value === "string" &&
                            assignment.value.startsWith("{{")
                              ? assignment.value
                              : ""
                          }
                          onChange={(event) =>
                            event.target.value &&
                            setActionDraft({
                              ...actionDraft,
                              value: {
                                ...actionDraft.value,
                                assignments:
                                  actionDraft.value.assignments.map(
                                    (item, index) =>
                                      index === assignmentIndex
                                        ? {
                                            ...item,
                                            value: event.target.value,
                                          }
                                        : item,
                                  ),
                              },
                            })
                          }
                        >
                          <option value="">Or use a flow value…</option>
                          {referenceOptions.map((reference) => (
                            <option
                              value={reference.value}
                              key={reference.value}
                            >
                              {reference.label}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      <button
                        type="button"
                        className="visual-condition-remove"
                        disabled={
                          actionDraft.value.assignments.length === 1
                        }
                        onClick={() =>
                          setActionDraft({
                            ...actionDraft,
                            value: {
                              ...actionDraft.value,
                              assignments:
                                actionDraft.value.assignments.filter(
                                  (_, index) =>
                                    index !== assignmentIndex,
                                ),
                            },
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </Modal>
      )}
    </section>
  );
}
