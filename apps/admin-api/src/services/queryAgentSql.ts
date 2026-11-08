import { parse } from "pgsql-ast-parser";
import { businessEntities } from "./queryAgentCatalog.js";

export const reportingViews = ["reporting_visitors", "reporting_visitor_identities", "reporting_individuals", "reporting_page_visits", "reporting_contact_requests", "reporting_chats", "reporting_customers", "reporting_orders"];
const functions = new Set(["count", "sum", "avg", "min", "max", "date_trunc", "date_part", "coalesce", "nullif", "lower", "upper", "round", "to_char", "now", "concat", "concat_ws", "trim", "length", "substring", "greatest", "least", "abs", "ceil", "floor", "bool_or", "bool_and"]);
const casts = new Set(["text", "varchar", "int", "int4", "int8", "integer", "bigint", "numeric", "decimal", "date", "timestamp", "timestamptz", "interval", "bool", "boolean", "float", "float8", "double precision"]);
const statements = new Set(["select", "with", "union", "union all"]);
export function validateReportingSql(input: string) {
  try { return validate(input); }
  catch (error) { if (error instanceof Error) Object.assign(error, { status: 400 }); throw error; }
}
function validate(input: string) {
  if (typeof input !== "string" || input.length > 20000) throw new Error("Query is missing or too long");
  const sql = input.trim().replace(/;\s*$/, "");
  let ast: any[];
  try { ast = parse(sql); } catch { throw new Error("Only valid PostgreSQL reporting SELECT queries can be executed"); }
  if (ast.length !== 1 || !statements.has(ast[0]?.type)) throw new Error("Only one read-only SELECT query can be executed");
  let tables = 0;
  const walk = (node: any, aliases = new Set<string>()) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "with") {
      const scope = new Set(aliases);
      for (const binding of node.bind ?? []) {
        walk(binding.statement, scope);
        scope.add(binding.alias.name);
      }
      walk(node.in, scope);
      return;
    }
    if (node.into || node.for || node.locking || node.type === "with recursive") throw new Error("Query operation is not allowed");
    if (["insert", "update", "delete", "truncate", "create table", "drop table", "set", "show", "copy", "do", "values"].includes(node.type)) throw new Error("Only read-only SELECT queries are allowed");
    if (node.type === "table") {
      const name = node.name;
      const business = businessEntities.includes(name?.name) && (!name.schema || name.schema === "query_agent");
      const legacy = reportingViews.includes(name?.name) && (!name.schema || ["public", "query_agent"].includes(name.schema));
      const cte = aliases.has(name?.name) && !name.schema;
      if (!business && !legacy && !cte) throw new Error("Only application business entities may be queried; system tables and credentials are unavailable");
      if (business || legacy) tables += 1;
    }
    if (node.type === "call" && (node.function?.schema || !functions.has(node.function?.name?.toLowerCase()))) throw new Error("SQL function is not permitted for reporting");
    if (node.type === "cast" && (node.to?.schema || !casts.has(node.to?.name?.toLowerCase()))) throw new Error("SQL cast is not permitted for reporting");
    if (node.type === "binary" && !["=", "!=", "<>", "<", ">", "<=", ">=", "+", "-", "*", "/", "%", "AND", "OR", "LIKE", "NOT LIKE", "ILIKE", "NOT ILIKE", "IN", "NOT IN", "IS", "IS NOT", "||", "AT TIME ZONE"].includes(String(node.op).toUpperCase())) throw new Error("SQL operator is not permitted");
    Object.values(node).forEach(value => Array.isArray(value) ? value.forEach(item => walk(item, aliases)) : walk(value, aliases));
  };
  walk(ast[0]);
  if (!tables) throw new Error("The query must use an application business entity");
  return sql;
}
