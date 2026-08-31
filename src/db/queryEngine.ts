// ============================================================================
// NEXORA LUXE - IN-MEMORY SQL QUERY ENGINE (Query Builder UI backend)
// ============================================================================
// Zero-dependency relational executor that runs SELECT / JOIN statements
// against the live Phase 4 `DatabaseState` store. It is intentionally small
// (no parser): the Query Builder UI owns structured state, this module
// compiles it into raw SQL text (for the code preview) and executes the same
// spec against the mock tables, returning a tabular result set.
// ============================================================================

import { DatabaseState } from './database';

export type TableName = keyof DatabaseState;

export type SqlOperation = 'SELECT' | 'JOIN';
export type JoinType = 'INNER' | 'LEFT';
export type FilterCombinator = 'AND' | 'OR';
export type SortDirection = 'ASC' | 'DESC';

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

export interface FilterOperatorDef {
  id: FilterOperator;
  /** SQL symbol rendered in the generated statement */
  symbol: string;
  /** Human label for the dropdown */
  label: string;
  /** Whether the operator requires a comparison value */
  needsValue: boolean;
}

export const FILTER_OPERATORS: FilterOperatorDef[] = [
  { id: 'eq', symbol: '=', label: '= equals', needsValue: true },
  { id: 'neq', symbol: '!=', label: '!= not equal', needsValue: true },
  { id: 'gt', symbol: '>', label: '> greater than', needsValue: true },
  { id: 'gte', symbol: '>=', label: '>= greater / equal', needsValue: true },
  { id: 'lt', symbol: '<', label: '< lower than', needsValue: true },
  { id: 'lte', symbol: '<=', label: '<= lower / equal', needsValue: true },
  { id: 'like', symbol: 'LIKE', label: 'LIKE contains', needsValue: true },
  { id: 'in', symbol: 'IN', label: 'IN list', needsValue: true },
  { id: 'not_in', symbol: 'NOT IN', label: 'NOT IN list', needsValue: true },
  { id: 'is_null', symbol: 'IS NULL', label: 'IS NULL', needsValue: false },
  { id: 'is_not_null', symbol: 'IS NOT NULL', label: 'IS NOT NULL', needsValue: false }
];

/** Preferred display order of the relational tables (matches the DB sidebar). */
export const TABLE_ORDER: TableName[] = [
  'users',
  'profiles_buyer',
  'profiles_supplier',
  'products',
  'rfqs_enquiries',
  'quotes',
  'messages',
  'follow_ups'
];

// ----------------------------------------------------------------------------
// Introspection (schema discovery from live rows)
// ----------------------------------------------------------------------------

export interface ColumnInfo {
  /** Owning table key */
  table: TableName;
  /** Bare column name, e.g. `supplier_id` */
  name: string;
  /** Fully qualified reference, e.g. `rfqs_enquiries.supplier_id` */
  qualifiedName: string;
  /** Query scope alias the column is referenced under (set when in scope) */
  alias?: string;
  /** Inferred Postgres-ish type label, e.g. `UUID`, `TEXT[]` */
  sqlType: string;
  isPk: boolean;
  /** Discovered foreign key target, e.g. `profiles_supplier.id` */
  fkTarget: string | null;
  /** Distinct scalar values (capped) used to power value suggestions */
  distinctValues: string[];
  nullCount: number;
  totalNonNull: number;
}

export interface TableInfo {
  name: TableName;
  label: string;
  rowCount: number;
  columns: ColumnInfo[];
  rows: Array<Record<string, unknown>>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_STAMP_RE =
  /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const NUMERIC_RE = /^-?\d+(\.\d+)?$/;

const MAX_DISTINCT_SAMPLES = 24;

function scalarToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map((v) => scalarToString(v)).join(', ');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object]';
    }
  }
  return String(value);
}

function inferSqlType(table: TableName, name: string, values: unknown[]): string {
  const present = values.filter((v) => v !== null && v !== undefined);

  if (name === 'id' || name.endsWith('_id')) {
    const looksUuid = present.length > 0 && present.every((v) => typeof v === 'string' && UUID_RE.test(v));
    if (looksUuid) return 'UUID';
  }

  if (present.length === 0) return 'VARCHAR';
  if (present.every((v) => typeof v === 'boolean')) return 'BOOLEAN';
  if (present.every((v) => Array.isArray(v))) return 'TEXT[]';
  if (present.every((v) => typeof v === 'object' && v !== null && !Array.isArray(v))) return 'JSONB';

  if (present.every((v) => typeof v === 'number')) {
    const integral = present.every((v) => Number.isInteger(v as number));
    return integral ? 'INTEGER' : 'NUMERIC';
  }

  if (present.every((v) => typeof v === 'string')) {
    const strings = present as string[];
    if (strings.every((v) => ISO_STAMP_RE.test(v))) {
      return strings.every((v) => v.length === 10) ? 'DATE' : 'TIMESTAMP';
    }
    if (strings.every((v) => NUMERIC_RE.test(v))) return 'NUMERIC';
    const longest = strings.reduce((acc, v) => Math.max(acc, v.length), 0);
    return longest <= 64 ? 'VARCHAR' : 'TEXT';
  }

  return 'VARCHAR';
}

/**
 * Build a schema snapshot of the mock database: every table's columns with
 * inferred types, primary-key detection and foreign-key relations discovered
 * by value overlap (so it always matches the real seeded data).
 */
export function introspectDatabase(state: DatabaseState): TableInfo[] {
  const store = state as unknown as Record<string, unknown>;
  const keys = TABLE_ORDER.filter((t) => Array.isArray(store[t]));

  const rawRows = new Map<TableName, Array<Record<string, unknown>>>();
  keys.forEach((t) => rawRows.set(t, ((store[t] || []) as Array<Record<string, unknown>>)));

  // Primary key value sets, used for FK discovery.
  const pkSets = new Map<TableName, Set<string>>();
  keys.forEach((t) => {
    const set = new Set<string>();
    (rawRows.get(t) || []).forEach((row) => {
      if (row && row.id !== undefined && row.id !== null) set.add(scalarToString(row.id));
    });
    pkSets.set(t, set);
  });

  const tables: TableInfo[] = keys.map((table) => {
    const rows = rawRows.get(table) || [];

    // Union of keys across every record (records may be shaped slightly differently).
    const order: string[] = [];
    rows.forEach((row) => {
      if (!row) return;
      Object.keys(row).forEach((col) => {
        if (!order.includes(col)) order.push(col);
      });
    });
    if (!order.includes('id') && rows.length > 0) order.unshift('id');

    const columns: ColumnInfo[] = order.map((name) => {
      const values = rows.map((row) => (row ? row[name] : undefined));
      const distinct = new Map<string, string>();
      let nullCount = 0;
      let totalNonNull = 0;
      values.forEach((v) => {
        if (v === null || v === undefined) nullCount += 1;
        else {
          totalNonNull += 1;
          const s = scalarToString(v);
          if (s && !distinct.has(s)) distinct.set(s, s);
        }
      });

      // FK discovery: `<something>_id` columns whose values resolve to another table's PK.
      let fkTarget: string | null = null;
      if (name !== 'id' && name.endsWith('_id')) {
        let bestTable: TableName | null = null;
        let bestHits = 0;
        keys.forEach((candidate) => {
          if (candidate === table) return;
          const set = pkSets.get(candidate);
          if (!set || set.size === 0) return;
          let hits = 0;
          values.forEach((v) => {
            if (v !== null && v !== undefined && set.has(scalarToString(v))) hits += 1;
          });
          if (hits > bestHits) {
            bestHits = hits;
            bestTable = candidate;
          }
        });
        if (bestTable) fkTarget = `${bestTable}.id`;
      }

      return {
        table,
        name,
        qualifiedName: `${table}.${name}`,
        sqlType: inferSqlType(table, name, values),
        isPk: name === 'id',
        fkTarget,
        distinctValues: Array.from(distinct.values()).slice(0, MAX_DISTINCT_SAMPLES),
        nullCount,
        totalNonNull
      };
    });

    return {
      name: table,
      label: table,
      rowCount: rows.length,
      columns,
      rows
    };
  });

  return tables;
}

// ----------------------------------------------------------------------------
// Query spec
// ----------------------------------------------------------------------------

export interface QueryFilter {
  id: string;
  /** `alias.column` reference */
  column: string;
  operator: FilterOperator;
  /** Raw user input (numbers / booleans are coerced by column type) */
  value: string;
  /** How this predicate chains to the previous one (ignored for the first) */
  combinator: FilterCombinator;
}

export interface QueryJoin {
  id: string;
  /** Target table being joined */
  table: TableName;
  /** `alias.column` on the left (already in scope) */
  leftColumn: string;
  /** `table.column` on the right */
  rightColumn: string;
  joinType: JoinType;
  /** Projected columns from the joined table; empty = all (`alias.*`) */
  columns: string[];
}

export interface QuerySpec {
  operation: SqlOperation;
  fromTable: TableName;
  /** `fromTable.column` refs selected in the projection; empty = `*` */
  columns: string[];
  joins: QueryJoin[];
  filters: QueryFilter[];
  orderByColumn: string | null;
  orderDirection: SortDirection;
  limit: number | null;
}

export interface QueryScopeEntry {
  alias: string;
  table: TableName;
  /** Unique id of the join that introduced this scope (null for the base table) */
  joinId: string | null;
}

/**
 * Deterministic alias assignment: the base table keeps its own name, each join
 * keeps its table name unless that name is taken (then `table_2`, `table_3`...).
 */
export function computeScope(spec: QuerySpec): QueryScopeEntry[] {
  const scope: QueryScopeEntry[] = [{ alias: spec.fromTable, table: spec.fromTable, joinId: null }];
  const used = new Set<string>([spec.fromTable]);

  spec.joins.forEach((join) => {
    let alias: string = join.table;
    let n = 2;
    while (used.has(alias)) {
      alias = `${join.table}_${n}`;
      n += 1;
    }
    used.add(alias);
    scope.push({ alias, table: join.table, joinId: join.id });
  });

  return scope;
}

/** Active joins — JOIN clauses only participate when the operation is `JOIN`. */
export function activeJoins(spec: QuerySpec): QueryJoin[] {
  return spec.operation === 'JOIN' ? spec.joins : [];
}

/**
 * Discover viable join key pairs between an in-scope alias and a target table,
 * using the foreign keys found during introspection (in both directions) with a
 * name-similarity fallback. The first entry is the recommended pair.
 */
export interface JoinKeyCandidate {
  /** `alias.column` on the left side (already in scope) */
  leftColumn: string;
  /** `targetTable.column` on the right side */
  rightColumn: string;
  /** Short human hint shown next to the candidate */
  hint: string;
  confidence: 'fk' | 'reverse-fk' | 'name';
}

export function discoverJoinKeys(
  tables: TableInfo[],
  leftAlias: string,
  leftTable: TableName,
  rightTable: TableName
): JoinKeyCandidate[] {
  const left = tables.find((t) => t.name === leftTable);
  const right = tables.find((t) => t.name === rightTable);
  if (!left || !right) return [];

  const candidates: JoinKeyCandidate[] = [];
  const seen = new Set<string>();
  const push = (c: JoinKeyCandidate) => {
    if (seen.has(`${c.leftColumn}=${c.rightColumn}`)) return;
    seen.add(`${c.leftColumn}=${c.rightColumn}`);
    candidates.push(c);
  };

  // left.fk -> right.<pk>
  left.columns.forEach((col) => {
    if (col.fkTarget === `${rightTable}.id` || col.fkTarget?.startsWith(`${rightTable}.`)) {
      const rightCol = (col.fkTarget as string).split('.')[1];
      push({
        leftColumn: `${leftAlias}.${col.name}`,
        rightColumn: `${rightTable}.${rightCol}`,
        hint: `${col.name} foreign key`,
        confidence: 'fk'
      });
    }
  });

  // right.fk -> left.<pk>
  right.columns.forEach((col) => {
    if (col.fkTarget === `${leftTable}.id` || col.fkTarget?.startsWith(`${leftTable}.`)) {
      const leftCol = (col.fkTarget as string).split('.')[1];
      push({
        leftColumn: `${leftAlias}.${leftCol}`,
        rightColumn: `${rightTable}.${col.name}`,
        hint: `${col.name} foreign key`,
        confidence: 'reverse-fk'
      });
    }
  });

  // Name heuristic: `<x>_id` on either side resolved against the other's PK.
  const foreignSingular = rightTable.replace(/ies$/, 'y').replace(/s$/, '');
  const leftSingular = leftTable.replace(/ies$/, 'y').replace(/s$/, '');
  left.columns.forEach((col) => {
    if (col.name.endsWith('_id') && (col.name.startsWith(`${foreignSingular}_`) || col.name.includes(rightTable.slice(0, 4)))) {
      push({
        leftColumn: `${leftAlias}.${col.name}`,
        rightColumn: `${rightTable}.id`,
        hint: 'name match',
        confidence: 'name'
      });
    }
  });
  right.columns.forEach((col) => {
    if (col.name.endsWith('_id') && (col.name.startsWith(`${leftSingular}_`) || col.name.includes(leftTable.slice(0, 4)))) {
      push({
        leftColumn: `${leftAlias}.id`,
        rightColumn: `${rightTable}.${col.name}`,
        hint: 'name match',
        confidence: 'name'
      });
    }
  });

  // Last resort: both relations expose `id`.
  if (
    candidates.length === 0 &&
    left.columns.some((c) => c.name === 'id') &&
    right.columns.some((c) => c.name === 'id')
  ) {
    push({
      leftColumn: `${leftAlias}.id`,
      rightColumn: `${rightTable}.id`,
      hint: 'shared id key',
      confidence: 'name'
    });
  }

  return candidates;
}

// ----------------------------------------------------------------------------
// SQL compilation (preview text)
// ----------------------------------------------------------------------------

function isNumericType(type: string): boolean {
  return type === 'INTEGER' || type === 'NUMERIC';
}

function normalizeComparable(sqlType: string, raw: unknown): unknown {
  if (raw === null || raw === undefined) return null;
  if (isNumericType(sqlType)) {
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw));
    return Number.isNaN(n) ? String(raw).toLowerCase() : n;
  }
  if (sqlType === 'BOOLEAN') {
    if (typeof raw === 'boolean') return raw;
    const s = String(raw).trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === 't';
  }
  return scalarToString(raw).toLowerCase();
}

function quoteLiteral(type: string, raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'NULL';
  if (isNumericType(type)) {
    const n = parseFloat(trimmed);
    return Number.isNaN(n) ? `'${trimmed.replace(/'/g, "''")}'` : String(n);
  }
  if (type === 'BOOLEAN') {
    const t = trimmed.toLowerCase();
    if (['true', '1', 'yes', 't'].includes(t)) return 'TRUE';
    if (['false', '0', 'no', 'f'].includes(t)) return 'FALSE';
  }
  return `'${trimmed.replace(/'/g, "''")}'`;
}

function columnType(scopeIndex: Map<string, ColumnInfo>, ref: string): string {
  return scopeIndex.get(ref)?.sqlType ?? 'VARCHAR';
}

function renderPredicate(
  filter: QueryFilter,
  scopeIndex: Map<string, ColumnInfo>,
  qualify: (ref: string) => string
): string {
  const def = FILTER_OPERATORS.find((op) => op.id === filter.operator) ?? FILTER_OPERATORS[0];
  const type = columnType(scopeIndex, filter.column);
  const ref = qualify(filter.column);

  if (def.id === 'is_null') return `${ref} IS NULL`;
  if (def.id === 'is_not_null') return `${ref} IS NOT NULL`;

  if (def.id === 'in' || def.id === 'not_in') {
    const parts = filter.value
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const list = parts.length ? parts.map((p) => quoteLiteral(type, p)).join(', ') : "''";
    return `${ref} ${def.symbol} (${list})`;
  }

  if (def.id === 'like') {
    const raw = filter.value.trim();
    // Bare terms become case-insensitive substring matches ("%term%").
    const pattern = /[%_]/.test(raw) ? raw : `%${raw}%`;
    return `${ref} ${def.symbol} '${pattern.replace(/'/g, "''")}'`;
  }

  return `${ref} ${def.symbol} ${quoteLiteral(type, filter.value)}`;
}

/**
 * Compile a structured spec into formatted, copy-pasteable SQL.
 * `qualify` controls whether column refs are rendered as `table.column` or bare.
 */
export function compileSql(spec: QuerySpec, tables: TableInfo[]): string {
  const scope = computeScope(spec);
  const joins = activeJoins(spec);
  const scopeIndex = buildScopeIndex(scope, tables);

  const multiTable = joins.length > 0;
  const qualify = (ref: string) => (multiTable ? ref : stripAlias(ref, spec.fromTable));

  const projection: string[] = [];
  const emittedRefs = new Set<string>();
  const takenLabels = new Set<string>();

  const emit = (ref: string) => {
    if (emittedRefs.has(ref)) return;
    emittedRefs.add(ref);
    projection.push(ref);
  };

  const baseColumns = spec.columns.length
    ? spec.columns.filter((c) => scopeIndex.has(c))
    : tables.find((t) => t.name === spec.fromTable)?.columns.map((c) => c.qualifiedName) ?? [];

  if (spec.columns.length === 0) {
    // "All columns" stays terse: `*` for a single relation, `table.*` when joining.
    projection.push(multiTable ? `${spec.fromTable}.*` : '*');
  } else {
    baseColumns.forEach((ref) => {
      takenLabels.add(ref.split('.').pop() as string);
      emit(ref);
    });
  }

  joins.forEach((join) => {
    const entry = scope.find((s) => s.joinId === join.id);
    if (!entry) return;
    const selected = join.columns.length
      ? join.columns.filter((c) => scopeIndex.has(c))
      : tables.find((t) => t.name === entry.table)?.columns.map((c) => `${entry.alias}.${c.name}`) ?? [];

    if (selected.length === 0) {
      projection.push(`${entry.alias}.*`);
      return;
    }

    selected.forEach((ref) => {
      if (emittedRefs.has(ref)) return;
      const bare = ref.split('.').pop() as string;
      if (multiTable && takenLabels.has(bare)) {
        emittedRefs.add(ref);
        projection.push(`${ref} AS ${entry.alias}_${bare}`);
      } else {
        takenLabels.add(bare);
        emit(ref);
      }
    });
  });

  const fromClause = spec.fromTable;

  const joinLines = joins.map((join) => {
    const entry = scope.find((s) => s.joinId === join.id);
    const aliasSuffix = entry && entry.alias !== entry.table ? ` AS ${entry.alias}` : '';
    const target = `${join.table}${aliasSuffix}`;
    return `${join.joinType} JOIN ${target} ON ${qualify(join.leftColumn)} = ${qualify(join.rightColumn)}`;
  });

  const whereLines = spec.filters
    .filter((f) => scopeIndex.has(f.column))
    .map((f, idx) => `${idx === 0 ? '' : `${f.combinator} `}${renderPredicate(f, scopeIndex, qualify)}`);

  const orderLine =
    spec.orderByColumn && scopeIndex.has(spec.orderByColumn)
      ? `ORDER BY ${qualify(spec.orderByColumn)} ${spec.orderDirection}`
      : '';

  const lines: string[] = [];
  const renderedProjection = projection.map((entry2) =>
    entry2 === '*' || entry2.endsWith('.*') || entry2.includes(' AS ') ? entry2 : qualify(entry2)
  );

  if (renderedProjection.length === 0) renderedProjection.push('*');

  if (renderedProjection.length <= 1) {
    lines.push(`SELECT ${renderedProjection.join(', ')}`);
  } else {
    lines.push('SELECT');
    renderedProjection.forEach((p, i) => lines.push(`  ${p}${i === renderedProjection.length - 1 ? '' : ','}`));
  }
  lines.push(`FROM ${fromClause}`);
  joinLines.forEach((l) => lines.push(l));
  if (whereLines.length === 1) {
    lines.push(`WHERE ${whereLines[0]}`);
  } else if (whereLines.length > 1) {
    lines.push('WHERE');
    whereLines.forEach((l) => lines.push(`  ${l}`));
  }
  if (orderLine) lines.push(orderLine);
  if (spec.limit) lines.push(`LIMIT ${spec.limit}`);
  lines[lines.length - 1] += ';';

  return lines.join('\n');
}

function stripAlias(ref: string, baseTable: TableName): string {
  const [alias, ...rest] = ref.split('.');
  if (alias === baseTable) return rest.join('.');
  return ref;
}

/** `alias.column` -> column metadata for every table currently in scope. */
export function buildScopeIndex(scope: QueryScopeEntry[], tables: TableInfo[]): Map<string, ColumnInfo> {
  const index = new Map<string, ColumnInfo>();
  const byName = new Map(tables.map((t) => [t.name as string, t]));

  scope.forEach((entry) => {
    const table = byName.get(entry.table);
    if (!table) return;
    table.columns.forEach((col) => {
      index.set(`${entry.alias}.${col.name}`, {
        ...col,
        table: entry.table,
        qualifiedName: `${entry.alias}.${col.name}`,
        alias: entry.alias
      });
    });
  });

  return index;
}

// ----------------------------------------------------------------------------
// Execution
// ----------------------------------------------------------------------------

export interface ResultColumn {
  key: string;
  label: string;
  table: TableName | null;
  sqlType: string;
  isPk: boolean;
}

export interface QueryExecution {
  sql: string;
  columns: ResultColumn[];
  rows: Array<Record<string, unknown>>;
  /** Rows surviving WHERE (before LIMIT) */
  matchedRows: number;
  /** Rows handed to the viewer after LIMIT */
  returnedRows: number;
  /** Rows scanned across base + joined tables */
  scannedRows: number;
  engineMs: number;
  joinCount: number;
  warning: string | null;
}

function looseEquals(rowValue: unknown, needle: string, sqlType: string): boolean {
  if (Array.isArray(rowValue)) {
    return rowValue.some((item) => looseEquals(item, needle, 'VARCHAR'));
  }
  const a = normalizeComparable(sqlType, rowValue);
  const b = normalizeComparable(sqlType, needle);
  if (a === null) return b === null || needle.trim() === '' || needle.trim().toLowerCase() === 'null';
  if (typeof a === 'number' && typeof b === 'number') return a === b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b;
  return String(a) === String(b);
}

function evaluateFilter(
  row: Record<string, unknown>,
  filter: QueryFilter,
  scopeIndex: Map<string, ColumnInfo>
): boolean {
  const info = scopeIndex.get(filter.column);
  const sqlType = info?.sqlType ?? 'VARCHAR';
  const raw = row[filter.column];
  const def = FILTER_OPERATORS.find((op) => op.id === filter.operator) ?? FILTER_OPERATORS[0];

  if (def.id === 'is_null') return raw === null || raw === undefined || raw === '';
  if (def.id === 'is_not_null') return !(raw === null || raw === undefined || raw === '');

  if (def.id === 'in' || def.id === 'not_in') {
    const needles = filter.value
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const hit = Array.isArray(raw)
      ? raw.some((item) => needles.some((needle) => looseEquals(item, needle, 'VARCHAR')))
      : needles.some((needle) => looseEquals(raw, needle, sqlType));
    if (!needles.length) return def.id === 'not_in';
    return def.id === 'in' ? hit : !hit;
  }

  if (def.id === 'like') {
    if (raw === null || raw === undefined) return false;
    const haystack = Array.isArray(raw) ? raw.map((v) => scalarToString(v)).join(' ') : scalarToString(raw);
    const pattern = filter.value.trim();
    if (!pattern) return true;
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped.replace(/\s*%+\s*/gi, '.*').replace(/_/g, '.')}$`, 'i');
    return regex.test(haystack);
  }

  const left = normalizeComparable(sqlType, raw);
  const right = normalizeComparable(sqlType, filter.value);

  if (def.id === 'eq') {
    if (left === null) return filter.value.trim() === '' || filter.value.trim().toLowerCase() === 'null';
    if (Array.isArray(raw)) {
      return raw.some((item) => looseEquals(item, filter.value, sqlType === 'TEXT[]' ? 'VARCHAR' : sqlType));
    }
    return looseEquals(raw, filter.value, sqlType);
  }
  if (def.id === 'neq') {
    if (left === null) return filter.value.trim() !== '' && filter.value.trim().toLowerCase() !== 'null';
    if (Array.isArray(raw)) {
      return !raw.some((item) => looseEquals(item, filter.value, sqlType === 'TEXT[]' ? 'VARCHAR' : sqlType));
    }
    return !looseEquals(raw, filter.value, sqlType);
  }

  if (left === null || right === null) return false;
  if (typeof left === 'boolean' || typeof right === 'boolean') return false;

  let cmp: number;
  if (typeof left === 'number' && typeof right === 'number') cmp = left - right;
  else cmp = String(left).localeCompare(String(right), undefined, { numeric: true });

  if (def.id === 'gt') return cmp > 0;
  if (def.id === 'gte') return cmp >= 0;
  if (def.id === 'lt') return cmp < 0;
  if (def.id === 'lte') return cmp <= 0;
  return true;
}

/** Combine the filter list (supports mixed AND / OR chaining, left to right). */
function rowPassesFilters(
  row: Record<string, unknown>,
  filters: QueryFilter[],
  scopeIndex: Map<string, ColumnInfo>
): boolean {
  let outcome = true;
  filters.forEach((filter, idx) => {
    const pass = evaluateFilter(row, filter, scopeIndex);
    if (idx === 0) outcome = pass;
    else outcome = filter.combinator === 'OR' ? outcome || pass : outcome && pass;
  });
  return outcome;
}

function sortComparator(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  ref: string,
  direction: SortDirection,
  sqlType: string
): number {
  const av = normalizeComparable(sqlType, a[ref]);
  const bv = normalizeComparable(sqlType, b[ref]);
  const aNull = av === null || av === undefined;
  const bNull = bv === null || bv === undefined;
  if (aNull && bNull) return 0;
  if (aNull) return 1; // NULLS LAST
  if (bNull) return -1;

  let cmp = 0;
  if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
  else if (typeof av === 'boolean' && typeof bv === 'boolean') cmp = Number(av) - Number(bv);
  else cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });

  return direction === 'DESC' ? -cmp : cmp;
}

/**
 * Execute a compiled spec against the in-memory store and return a result set
 * ready for tabular rendering.
 */
export function executeQuery(spec: QuerySpec, tables: TableInfo[]): QueryExecution {
  const startedAt =
    typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();

  const scope = computeScope(spec);
  const scopeIndex = buildScopeIndex(scope, tables);
  const joins = activeJoins(spec);
  const tableByName = new Map(tables.map((t) => [t.name as string, t]));

  let warning: string | null = null;
  let scannedRows = 0;

  const base = tableByName.get(spec.fromTable);
  if (!base) {
    return {
      sql: compileSql(spec, tables),
      columns: [],
      rows: [],
      matchedRows: 0,
      returnedRows: 0,
      scannedRows: 0,
      engineMs: 0,
      joinCount: 0,
      warning: `Relation "${String(spec.fromTable)}" is not available in the local store.`
    };
  }

  const baseRefs = base.columns.map((c) => c.qualifiedName);

  let rows: Array<Record<string, unknown>> = base.rows.map((row) => {
    const shaped: Record<string, unknown> = {};
    base.columns.forEach((col) => {
      shaped[col.qualifiedName] = row[col.name] ?? null;
    });
    return shaped;
  });
  scannedRows += base.rows.length;

  joins.forEach((join) => {
    const entry = scope.find((s) => s.joinId === join.id);
    if (!entry) return;
    const target = tableByName.get(join.table);
    if (!target) {
      warning = `Table "${String(join.table)}" is not present in the local store - JOIN skipped.`;
      return;
    }

    const targetRefs = target.columns.map((c) => `${entry.alias}.${c.name}`);
    const rightColumn = join.rightColumn.split('.').pop() as string;

    // Hash index on the join key of the target table.
    const index = new Map<string, Array<Record<string, unknown>>>();
    target.rows.forEach((row) => {
      const key = scalarToString(row[rightColumn]);
      const bucket = index.get(key);
      const remapped: Record<string, unknown> = {};
      target.columns.forEach((col) => {
        remapped[`${entry.alias}.${col.name}`] = row[col.name] ?? null;
      });
      if (bucket) bucket.push(remapped);
      else index.set(key, [remapped]);
      scannedRows += 1;
    });

    const next: Array<Record<string, unknown>> = [];
    rows.forEach((leftRow) => {
      const key = scalarToString(leftRow[join.leftColumn]);
      const matches = index.get(key);
      if (matches && matches.length) {
        matches.forEach((rightRow) => next.push({ ...leftRow, ...rightRow }));
      } else if (join.joinType === 'LEFT') {
        const padded: Record<string, unknown> = { ...leftRow };
        targetRefs.forEach((ref) => {
          padded[ref] = null;
        });
        next.push(padded);
      }
    });
    rows = next;
  });

  const filters = spec.filters.filter((f) => scopeIndex.has(f.column));
  const filtered = filters.length ? rows.filter((row) => rowPassesFilters(row, filters, scopeIndex)) : rows;

  // ---- Projection -------------------------------------------------------
  const columns: ResultColumn[] = [];
  const pushColumn = (ref: string) => {
    const info = scopeIndex.get(ref);
    if (!info) return;
    const [alias] = ref.split('.');
    const bare = ref.split('.').pop() as string;
    const label = joins.length ? `${alias}.${bare}` : bare;
    if (columns.some((c) => c.key === ref)) return;
    columns.push({
      key: ref,
      label,
      table: info.table,
      sqlType: info.sqlType,
      isPk: info.isPk
    });
  };

  if (spec.columns.length) {
    spec.columns.forEach(pushColumn);
    // Every requested column fell out of scope - fall back to the full relation.
    if (columns.length === 0) {
      base.columns.forEach((c) => pushColumn(c.qualifiedName));
      warning = 'Projected columns are no longer part of the query scope - selecting all columns instead.';
    }
  } else {
    base.columns.forEach((c) => pushColumn(c.qualifiedName));
  }

  joins.forEach((join) => {
    const entry = scope.find((s) => s.joinId === join.id);
    if (!entry) return;
    const target = tableByName.get(join.table);
    if (!target) return;
    if (join.columns.length) join.columns.forEach(pushColumn);
    else target.columns.forEach((c) => pushColumn(`${entry.alias}.${c.name}`));
  });

  // ---- Sort + limit -----------------------------------------------------
  const orderRef = spec.orderByColumn && scopeIndex.has(spec.orderByColumn) ? spec.orderByColumn : null;
  let ordered = filtered;
  if (orderRef) {
    const type = columnType(scopeIndex, orderRef);
    ordered = [...filtered].sort((a, b) => sortComparator(a, b, orderRef, spec.orderDirection, type));
  }

  const matchedRows = ordered.length;
  const limited = spec.limit && spec.limit > 0 ? ordered.slice(0, spec.limit) : ordered;

  const projectedRows = limited.map((row) => {
    const out: Record<string, unknown> = {};
    columns.forEach((col) => {
      out[col.key] = row[col.key] ?? null;
    });
    return out;
  });

  const droppedByLimit = matchedRows - limited.length;
  if (droppedByLimit > 0) {
    warning = `LIMIT ${spec.limit} truncated ${droppedByLimit} matched row${droppedByLimit === 1 ? '' : 's'}.`;
  }

  const finishedAt =
    typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();

  return {
    sql: compileSql(spec, tables),
    columns,
    rows: projectedRows,
    matchedRows,
    returnedRows: projectedRows.length,
    scannedRows,
    engineMs: Math.max(0, Math.round((finishedAt - startedAt) * 1000) / 1000),
    joinCount: joins.length,
    warning
  };
}

/** Suggest a sane ORDER BY column for a table (timestamps first, else PK). */
export function suggestOrderColumn(table: TableInfo): string | null {
  const stamp = table.columns.find((c) => c.sqlType === 'TIMESTAMP');
  if (stamp) return stamp.qualifiedName;
  const id = table.columns.find((c) => c.isPk);
  return id ? id.qualifiedName : table.columns[0]?.qualifiedName ?? null;
}
