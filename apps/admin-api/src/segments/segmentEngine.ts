type FieldType = "string" | "number" | "boolean" | "date" | "enum" | "collection";
type Field = { name: string; type: FieldType; nullable?: boolean; values?: string[] };
type ObjectMeta = { name: string; label: string; profile?: boolean; subscriberField?: string; emailField?: string; phoneField?: string; fields: Field[] };

const audit: Field[] = [
  { name: "createdDate", type: "date" }, { name: "createdBy", type: "string", nullable: true },
  { name: "updatedDate", type: "date" }, { name: "updatedBy", type: "string", nullable: true },
];
const profileFields: Field[] = [
  { name: "id", type: "string" }, { name: "individualId", type: "string" },
  { name: "firstName", type: "string" }, { name: "lastName", type: "string" },
  { name: "email", type: "string", nullable: true }, { name: "mobilePhone", type: "string", nullable: true },
  { name: "address", type: "string", nullable: true }, { name: "birthdate", type: "date", nullable: true },
  { name: "country", type: "string", nullable: true }, { name: "language", type: "string" },
  { name: "source", type: "string" }, { name: "statusDescription", type: "string" }, ...audit,
];

export const segmentObjects: ObjectMeta[] = [
  { name: "Individual", label: "Individuals", profile: true, subscriberField: "id", emailField: "email", phoneField: "mobilePhone", fields: [
    { name: "id", type: "string" }, { name: "firstName", type: "string" }, { name: "lastName", type: "string" },
    { name: "email", type: "string", nullable: true }, { name: "manualEmail", type: "string", nullable: true },
    { name: "mobilePhone", type: "string", nullable: true }, { name: "address", type: "string", nullable: true },
    { name: "birthdate", type: "date", nullable: true }, { name: "country", type: "string", nullable: true },
    { name: "language", type: "string" }, { name: "source", type: "string" }, { name: "isActive", type: "boolean" },
    { name: "emailVerified", type: "boolean" }, ...audit,
  ]},
  ...["Lead", "Prospect", "Account"].map(name => ({ name, label: `${name}s`, profile: true, subscriberField: "individualId", emailField: "email", phoneField: "mobilePhone", fields: profileFields })),
  { name: "Consent", label: "Consents", fields: [{ name: "id", type: "string" }, { name: "individualId", type: "string" }, { name: "channel", type: "enum", values: ["EMAIL", "SMS", "WHATSAPP", "PHONE"] }, { name: "channelStatus", type: "enum", values: ["OPTIN", "OPTOUT", "UNKNOWN"] }, ...audit] },
  { name: "Product", label: "Products", fields: [{ name: "id", type: "string" }, { name: "uniqueCode", type: "string" }, { name: "type", type: "enum", values: ["VILLA", "SWIMMINGPOOL", "SPA", "RESTAURANT", "ACTIVITY", "TRANSPORTATION"] }, { name: "priceEuro", type: "number", nullable: true }, { name: "order", type: "number", nullable: true }, { name: "isActive", type: "boolean" }, { name: "createdAt", type: "date" }, { name: "updatedAt", type: "date" }] },
  { name: "PageVisit", label: "Page visits", fields: [{ name: "id", type: "string" }, { name: "pageUrl", type: "string" }, { name: "pageName", type: "string", nullable: true }, { name: "visitorId", type: "string", nullable: true }, { name: "journeyId", type: "string", nullable: true }, { name: "visitorStage", type: "enum", values: ["ANONYMOUS", "LEAD", "PROSPECT", "ACCOUNT"] }, { name: "leadId", type: "string", nullable: true }, { name: "prospectId", type: "string", nullable: true }, { name: "accountId", type: "string", nullable: true }, { name: "individualId", type: "string", nullable: true }, { name: "visitDate", type: "date" }, { name: "referrer", type: "string", nullable: true }, { name: "userAgent", type: "string", nullable: true }, { name: "sessionId", type: "string", nullable: true }] },
  { name: "ContactRequest", label: "Contact requests", fields: [{ name: "id", type: "string" }, { name: "email", type: "string" }, { name: "mobilePhone", type: "string", nullable: true }, { name: "requestType", type: "enum", values: ["ADVISOR_GUIDE", "COMPLAINT", "SUPPORT", "PARTNERSHIP", "OTHER"] }, { name: "individualId", type: "string", nullable: true }, { name: "leadId", type: "string", nullable: true }, { name: "prospectId", type: "string", nullable: true }, { name: "accountId", type: "string", nullable: true }, ...audit] },
  { name: "Chat", label: "Chats", fields: [{ name: "id", type: "string" }, { name: "visitorId", type: "string", nullable: true }, { name: "individualId", type: "string", nullable: true }, { name: "leadId", type: "string", nullable: true }, { name: "prospectId", type: "string", nullable: true }, { name: "accountId", type: "string", nullable: true }, { name: "status", type: "enum", values: ["OPEN", "WAITING_FOR_ADVISOR", "WAITING_FOR_VISITOR", "CLOSED"] }, { name: "language", type: "string" }, ...audit] },
  { name: "ChatMessage", label: "Chat messages", fields: [{ name: "id", type: "string" }, { name: "chatId", type: "string" }, { name: "senderType", type: "enum", values: ["VISITOR", "INDIVIDUAL", "LEAD", "PROSPECT", "ACCOUNT", "ADVISOR", "AI"] }, { name: "sendTime", type: "date" }, { name: "isRead", type: "boolean" }] },
  { name: "VisitorJourney", label: "Visitor journeys", fields: [{ name: "id", type: "string" }, { name: "visitorId", type: "string" }, { name: "individualId", type: "string", nullable: true }, { name: "startedAt", type: "date" }, { name: "claimedAt", type: "date", nullable: true }, { name: "endedAt", type: "date", nullable: true }, { name: "lastSeenAt", type: "date" }] },
  { name: "WhatsAppConversation", label: "WhatsApp conversations", fields: [{ name: "id", type: "string" }, { name: "whatsappPhone", type: "string", nullable: true }, { name: "whatsappUserId", type: "string", nullable: true }, { name: "displayName", type: "string", nullable: true }, { name: "createdDate", type: "date" }, { name: "updatedDate", type: "date" }] },
  { name: "WhatsAppMessage", label: "WhatsApp messages", fields: [{ name: "id", type: "string" }, { name: "conversationId", type: "string" }, { name: "sender", type: "enum", values: ["CUSTOMER", "ADVISOR", "AI"] }, { name: "sentAt", type: "date" }] },
];

export const segmentFunctions: Record<string, Array<{ value: string; label: string; argument?: string }>> = {
  string: [
    { value: "NONE", label: "No transformation" }, { value: "UPPER", label: "Uppercase" },
    { value: "LOWER", label: "Lowercase" }, { value: "TRIM", label: "Remove surrounding spaces" },
    { value: "LENGTH", label: "Text length" }, { value: "CONCAT", label: "Add text", argument: "Text to add" },
    { value: "SUBSTRING", label: "Extract part", argument: "Start,length" },
    { value: "REPLACE", label: "Replace text", argument: "Old text,new text" },
  ],
  number: [{ value: "NONE", label: "No transformation" }, { value: "ABS", label: "Absolute value" }, { value: "ROUND", label: "Round" }],
  date: [{ value: "NONE", label: "No transformation" }, { value: "YEAR", label: "Year" }, { value: "MONTH", label: "Month" }, { value: "DAY", label: "Day" }],
  boolean: [{ value: "NONE", label: "No transformation" }], enum: [{ value: "NONE", label: "No transformation" }],
};

export const segmentRelationships = segmentObjects.flatMap(source => segmentObjects.flatMap(target => {
  if (source.name === target.name) return [];
  const sourceKey = source.name === "Individual" ? "id" : source.profile ? "id" : "id";
  const candidate = source.name === "Individual" ? "individualId" : `${source.name.charAt(0).toLowerCase()}${source.name.slice(1)}Id`;
  if (!target.fields.some(item => item.name === candidate) || !source.fields.some(item => item.name === sourceKey)) return [];
  return [{ sourceObject: source.name, sourceField: sourceKey, targetObject: target.name, targetField: candidate }];
}));

const objectMap = new Map(segmentObjects.map(object => [object.name, object]));
const q = (value: string) => `"${value.replaceAll('"', '""')}"`;
const fail = (message: string): never => { throw Object.assign(new Error(message), { status: 400 }); };
const meta = (name: unknown) => objectMap.get(String(name)) ?? fail(`Object ${String(name)} is not available for segments`);
const field = (objectName: string, name: unknown) => meta(objectName).fields.find(item => item.name === name) ?? fail(`Field ${String(name)} is not available on ${objectName}`);

function operatorSql(operator: string, left: string, right: string, type: FieldType): string {
  const ops: Record<string, string> = { EQUALS: "=", NOT_EQUALS: "<>", GT: ">", GTE: ">=", LT: "<", LTE: "<=", BEFORE: "<", AFTER: ">" };
  if (ops[operator]) return `${left} ${ops[operator]} ${right}`;
  if (operator === "CONTAINS") return `${left} ILIKE '%' || ${right} || '%'`;
  if (operator === "STARTS_WITH") return `${left} ILIKE ${right} || '%'`;
  if (operator === "ENDS_WITH") return `${left} ILIKE '%' || ${right}`;
  if (operator === "IS_NULL") return `${left} IS NULL`;
  if (operator === "IS_NOT_NULL") return `${left} IS NOT NULL`;
  if ((operator === "IN" || operator === "NOT_IN") && type !== "boolean") return `${left} ${operator === "NOT_IN" ? "NOT " : ""}IN (${right})`;
  return fail(`Operator ${operator} is not supported`);
}

export function compileSegment(definition: any) {
  const inclusion = compileSide(definition?.inclusion, definition?.contactPoints ?? [], true);
  if (!definition?.exclusion?.enabled) return inclusion;
  if (definition.exclusion.sourceObject !== definition.inclusion.sourceObject) fail("Exclusion must use the same profile object as inclusion");
  const exclusion = compileSide(definition.exclusion, [], false, inclusion.params.length);
  return { sql: `SELECT inc.*\nFROM (\n${indentSql(inclusion.sql, 2)}\n) inc\nWHERE NOT EXISTS (\n  SELECT 1\n  FROM (\n${indentSql(exclusion.sql, 4)}\n  ) exc\n  WHERE exc."subscriberKey" = inc."subscriberKey"\n)`, params: [...inclusion.params, ...exclusion.params], output: inclusion.output };
}

function compileSide(side: any, contactPoints: string[], includeOutput: boolean, offset = 0) {
  const source = meta(side?.sourceObject);
  if (!source.profile) fail("A segment must start from a profile object");
  const aliases = new Map<string, string>([["profile", source.name]]);
  const sqlAliases = new Map<string, string>([["profile", "p"]]);
  const params: unknown[] = [];
  const addParam = (value: unknown) => { params.push(value); return `$${offset + params.length}`; };
  let joins = "";
  for (const [index, join] of (side.joins ?? []).entries()) {
    const joinMeta = meta(join.object); const id = String(join.id || `join${index}`); const alias = `j${index}`;
    aliases.set(id, joinMeta.name); sqlAliases.set(id, alias);
    const conditions = compileGroup(join.conditions, condition => compileCondition(condition, aliases, sqlAliases, addParam));
    if (!conditions) fail(`Join ${joinMeta.label} needs at least one condition`);
    joins += `\n${join.type === "INNER" ? "INNER" : "LEFT"} JOIN ${q(joinMeta.name)} ${q(alias)}\n  ON ${formatExpression(conditions, "     ")}`;
  }
  const subscriber = source.subscriberField!;
  const selections: string[] = [`${q("p")}.${q(subscriber)} AS "subscriberKey"`];
  const output: { name: string; type: FieldType }[] = [{ name: "subscriberKey", type: "string" }];
  const selectedGroupRefs: string[] = [];
  const hasAggregate = (side.fields ?? []).some((item: any) => item.aggregate && item.aggregate !== "NONE");
  if (includeOutput && contactPoints.includes("EMAIL")) { selections.push(`${q("p")}.${q(source.emailField!)} AS "email"`); output.push({ name: "email", type: "string" }); }
  if (includeOutput && (contactPoints.includes("PHONE") || contactPoints.includes("WHATSAPP"))) { selections.push(`${q("p")}.${q(source.phoneField!)} AS "phone"`); output.push({ name: "phone", type: "string" }); }
  for (const [index, selected] of (side.fields ?? []).entries()) {
    const objectName = aliases.get(selected.alias) ?? fail("Selected field uses an unknown source"); const f = field(objectName, selected.field);
    const rawRef = `${q(sqlAliases.get(selected.alias)!)}.${q(f.name)}`; const ref = transformSql(rawRef, f.type, selected.transform, selected.transformArgument, addParam); const aggregate = String(selected.aggregate || "NONE");
    if (["SUM", "AVG"].includes(aggregate) && f.type !== "number") fail(`${aggregate} can only use number fields`);
    const expression = aggregate === "NONE" ? ref : aggregate === "COUNT_DISTINCT" ? `COUNT(DISTINCT ${ref})` : `${aggregate}(${ref})`;
    if (aggregate === "NONE") selectedGroupRefs.push(ref);
    const name = String(selected.outputName || `${selected.alias}_${selected.field}_${index}`).replace(/[^A-Za-z0-9_]/g, "_");
    selections.push(`${expression} AS ${q(name)}`); output.push({ name, type: ["COUNT", "COUNT_DISTINCT", "SUM", "AVG"].includes(aggregate) ? "number" : f.type });
  }
  for (const [index, collection] of (side.collections ?? []).entries()) {
    const objectName = aliases.get(collection.alias) ?? fail("Collection uses an unknown joined object");
    const sqlAlias = q(sqlAliases.get(collection.alias)!);
    const dedupe = field(objectName, collection.dedupeField);
    const included = Array.isArray(collection.fields) ? collection.fields : [];
    if (!included.length) fail("A related records collection needs at least one field");
    const pairs = included.flatMap((fieldName: string) => {
      const selectedField = field(objectName, fieldName);
      return [`'${selectedField.name.replaceAll("'", "''")}'`, `${sqlAlias}.${q(selectedField.name)}`];
    });
    const name = String(collection.name || `collection_${index + 1}`).replace(/[^A-Za-z0-9_]/g, "_");
    const aggregate = `jsonb_object_agg(CAST(${sqlAlias}.${q(dedupe.name)} AS text), jsonb_build_object(${pairs.join(", ")})) FILTER (WHERE ${sqlAlias}.${q(dedupe.name)} IS NOT NULL)`;
    selections.push(`COALESCE(jsonb_path_query_array(${aggregate}, '$.*'), '[]'::jsonb) AS ${q(name)}`);
    output.push({ name, type: "collection" });
  }
  const filters = compileGroup(side.filters, condition => compileCondition(condition, aliases, sqlAliases, addParam));
  const groups = (side.groupBy ?? []).map((item: any) => { const objectName = aliases.get(item.alias) ?? fail("Group field uses an unknown source"); field(objectName, item.field); return `${q(sqlAliases.get(item.alias)!)}.${q(item.field)}`; });
  const having = compileGroup(side.having, condition => { const selected = (side.fields ?? []).find((item: any) => item.outputName === condition.field && item.aggregate && item.aggregate !== "NONE") ?? fail("HAVING must use an aggregate output"); const objectName = aliases.get(selected.alias)!; const f = field(objectName, selected.field); const ref = `${q(sqlAliases.get(selected.alias)!)}.${q(f.name)}`; const aggregate = selected.aggregate === "COUNT_DISTINCT" ? `COUNT(DISTINCT ${ref})` : `${selected.aggregate}(${ref})`; return operatorSql(condition.operator, aggregate, addParam(condition.value), "number"); });
  const needsGroup = hasAggregate || (side.collections ?? []).length > 0 || groups.length > 0;
  const groupRefs = [...new Set([`${q("p")}.${q(subscriber)}`, ...(includeOutput && contactPoints.includes("EMAIL") ? [`${q("p")}.${q(source.emailField!)}`] : []), ...(includeOutput && (contactPoints.includes("PHONE") || contactPoints.includes("WHATSAPP")) ? [`${q("p")}.${q(source.phoneField!)}`] : []), ...selectedGroupRefs, ...groups])];
  const sql = [
    `SELECT\n  ${selections.join(",\n  ")}`,
    `FROM ${q(source.name)} ${q("p")}${joins}`,
    filters ? `WHERE ${formatExpression(filters, "  ")}` : "",
    needsGroup ? `GROUP BY\n  ${groupRefs.join(",\n  ")}` : "",
    having ? `HAVING ${formatExpression(having, "  ")}` : "",
  ].filter(Boolean).join("\n");
  return { sql, params, output };
}

function transformSql(ref: string, type: FieldType, transformValue: unknown, argument: unknown, addParam: (value: unknown) => string) {
  const transform = String(transformValue || "NONE");
  const allowed = segmentFunctions[type]?.some(item => item.value === transform);
  if (!allowed) fail(`${transform} is not available for ${type} fields`);
  if (["UPPER", "LOWER", "TRIM", "LENGTH", "ABS", "ROUND"].includes(transform)) return `${transform}(${ref})`;
  if (["YEAR", "MONTH", "DAY"].includes(transform)) return `EXTRACT(${transform} FROM ${ref})`;
  if (transform === "CONCAT") return `CONCAT(${ref}, ${addParam(String(argument ?? ""))})`;
  if (transform === "SUBSTRING") { const parts = String(argument ?? "").split(",").map(Number); const start = parts[0] ?? 0; const length = parts[1] ?? 0; if (!Number.isInteger(start) || !Number.isInteger(length) || start < 1 || length < 1) fail("Extract part requires start,length"); return `SUBSTRING(${ref} FROM ${addParam(start)} FOR ${addParam(length)})`; }
  if (transform === "REPLACE") { const [from, to] = String(argument ?? "").split(","); if (!from) fail("Replace text requires old text,new text"); return `REPLACE(${ref}, ${addParam(from)}, ${addParam(to ?? "")})`; }
  return ref;
}

function formatExpression(expression: string, indent: string) {
  return expression.replaceAll(" AND ", `\n${indent}AND `).replaceAll(" OR ", `\n${indent}OR `);
}

function indentSql(sql: string, spaces: number) {
  const prefix = " ".repeat(spaces);
  return sql.split("\n").map(line => `${prefix}${line}`).join("\n");
}

function compileGroup(value: any, compileLeaf: (condition: any) => string): string {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value.map((item, index) => `${index ? item.connector === "OR" ? "OR " : "AND " : ""}${compileLeaf(item)}`).join(" ");
  }
  if (value.kind !== "GROUP" || !Array.isArray(value.items)) fail("Invalid condition group");
  const items = value.items.map((item: any) => item?.kind === "GROUP" ? compileGroup(item, compileLeaf) : compileLeaf(item));
  if (!items.length) return "";
  const logic = value.logic === "OR" ? " OR " : " AND ";
  return `(${items.join(logic)})`;
}

function compileCondition(condition: any, aliases: Map<string, string>, sqlAliases: Map<string, string>, addParam: (value: unknown) => string) {
  const leftObject = aliases.get(condition.leftAlias) ?? fail("Condition uses an unknown source"); const leftField = field(leftObject, condition.leftField); const rawLeft = `${q(sqlAliases.get(condition.leftAlias)!)}.${q(leftField.name)}`; const left = transformSql(rawLeft, leftField.type, condition.leftTransform, condition.leftTransformArgument, addParam);
  if (["IS_NULL", "IS_NOT_NULL"].includes(condition.operator)) return operatorSql(condition.operator, left, "", leftField.type);
  if (condition.operator === "BETWEEN") {
    if (!condition.value || !condition.valueTo) fail("BETWEEN requires a start and end value");
    return `${left} BETWEEN ${addParam(condition.value)} AND ${addParam(condition.valueTo)}`;
  }
  if (["IN_LAST", "NOT_IN_LAST"].includes(condition.operator)) {
    if (leftField.type !== "date") fail(`${condition.operator} can only use date fields`);
    const amount = Number(condition.value);
    if (!Number.isFinite(amount) || amount <= 0) fail("Relative date amount must be greater than zero");
    const units: Record<string, string> = { MINUTES: "minute", HOURS: "hour", DAYS: "day", WEEKS: "week", MONTHS: "month", YEARS: "year" };
    const unit = units[String(condition.relativeUnit ?? "DAYS")] ?? fail("Invalid relative date unit");
    return `${left} ${condition.operator === "NOT_IN_LAST" ? "<" : ">="} NOW() - (${addParam(amount)} * INTERVAL '1 ${unit}')`;
  }
  if (condition.rightKind === "FIELD") { const rightObject = aliases.get(condition.rightAlias) ?? fail("Condition uses an unknown right source"); const rightField = field(rightObject, condition.rightField); return operatorSql(condition.operator, left, `${q(sqlAliases.get(condition.rightAlias)!)}.${q(rightField.name)}`, leftField.type); }
  if (["IN", "NOT_IN"].includes(condition.operator)) { const values = Array.isArray(condition.value) ? condition.value : String(condition.value ?? "").split(",").map((v: string) => v.trim()).filter(Boolean); if (!values.length) fail("IN needs at least one value"); return operatorSql(condition.operator, left, values.map(addParam).join(", "), leftField.type); }
  return operatorSql(condition.operator, left, addParam(condition.value), leftField.type);
}
