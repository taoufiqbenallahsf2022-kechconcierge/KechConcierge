import { prisma } from "../lib/prisma.js";

export type ObjectRelationship = {
  id: string;
  sourceEntity: string;
  targetEntity: string;
  sourceField: string;
  targetField: string;
  label: string;
};

const entityName = (table: string) =>
  table ? table[0]!.toLowerCase() + table.slice(1) : table;

export async function loadObjectRelationships(): Promise<ObjectRelationship[]> {
  const rows = await prisma.$queryRaw<Array<{
    constraint_name: string;
    source_table: string;
    source_column: string;
    target_table: string;
    target_column: string;
  }>>`
    SELECT
      tc.constraint_name,
      kcu.table_name AS source_table,
      kcu.column_name AS source_column,
      ccu.table_name AS target_table,
      ccu.column_name AS target_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.constraint_schema = kcu.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY kcu.table_name, tc.constraint_name`;

  return rows.flatMap(row => {
    const child = entityName(row.source_table);
    const parent = entityName(row.target_table);
    return [
      {
        id: `forward:${row.constraint_name}`,
        sourceEntity: child,
        targetEntity: parent,
        sourceField: row.source_column,
        targetField: row.target_column,
        label: `${child}.${row.source_column} → ${parent}.${row.target_column}`,
      },
      {
        id: `reverse:${row.constraint_name}`,
        sourceEntity: parent,
        targetEntity: child,
        sourceField: row.target_column,
        targetField: row.source_column,
        label: `${parent}.${row.target_column} → ${child}.${row.source_column}`,
      },
    ];
  });
}
