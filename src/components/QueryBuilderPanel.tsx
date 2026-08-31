import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpDown,
  Braces,
  Check,
  Code2,
  Copy,
  Download,
  Filter,
  Info,
  Layers,
  Link2,
  ListFilter,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Table2,
  Terminal,
  Trash2,
  X
} from 'lucide-react';
import { DatabaseState } from '../db/database';
import {
  compileSql,
  computeScope,
  discoverJoinKeys,
  executeQuery,
  FILTER_OPERATORS,
  introspectDatabase,
  type ColumnInfo,
  type FilterOperator,
  type JoinType,
  type QueryExecution,
  type QueryFilter,
  type QueryJoin,
  type QuerySpec,
  type ResultColumn,
  type SortDirection,
  type SqlOperation,
  type TableInfo,
  type TableName
} from '../db/queryEngine';
import { exportToCsv } from '../utils/exportCsv';

// ============================================================================
// QUERY BUILDER UI - interactive SQL authoring over the local relational store
// ----------------------------------------------------------------------------
// Mounted as a tab inside <DatabaseStatusModal />. The component owns the
// structured query state, renders a live SQL preview, and executes the query
// through the in-memory engine in src/db/queryEngine.ts.
// ============================================================================

interface QueryBuilderPanelProps {
  dbState: DatabaseState;
  /** Base relation - shared with the modal's table sidebar */
  activeTable: TableName;
  onSelectTable: (table: TableName) => void;
  className?: string;
}

/**
 * What a freshly added JOIN projects by default: the relation's key plus its
 * most descriptive text column, so the result set stays readable.
 */
function defaultJoinProjection(info: TableInfo, alias: string): string[] {
  const display =
    info.columns.find((c) => c.name === 'company_name') ||
    info.columns.find((c) => c.name === 'title') ||
    info.columns.find((c) => c.name === 'name' && !c.isPk) ||
    info.columns.find((c) => !c.isPk && (c.sqlType === 'VARCHAR' || c.sqlType === 'TEXT'));
  return [`${alias}.id`, display ? `${alias}.${display.name}` : null].filter(Boolean) as string[];
}

const LIMIT_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: '50 rows', value: 50 },
  { label: '100 rows', value: 100 },
  { label: '250 rows', value: 250 },
  { label: '1,000 rows', value: 1000 },
  { label: 'No limit', value: null }
];

const JOIN_TYPES: Array<{ value: JoinType; label: string; hint: string }> = [
  { value: 'INNER', label: 'INNER JOIN', hint: 'Only rows matching on both sides' },
  { value: 'LEFT', label: 'LEFT JOIN', hint: 'Keep every base row, NULL-fill misses' }
];

const fieldClass =
  'w-full text-xs p-2 bg-[#FDFBF7] border border-[#E5D8EE] rounded-lg focus:outline-none focus:border-[#C9A961] focus:ring-1 focus:ring-[#C9A961]/40 text-[#2A0E3F] cursor-pointer font-medium';

const labelClass = 'block text-[10px] uppercase tracking-wider font-black text-[#7E6C96] mb-1';

let uidCounter = 0;
const uid = (prefix: string) => {
  uidCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${uidCounter}`;
};

// ----------------------------------------------------------------------------
// Small presentational helpers
// ----------------------------------------------------------------------------

const SectionCard: React.FC<{
  title: string;
  hint?: string;
  icon: React.ReactNode;
  accent?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, hint, icon, accent = 'text-[#6B2D8C]', badge, actions, children, className = '' }) => (
  <section className={`bg-white rounded-xl border border-[#E5D8EE] shadow-2xs flex flex-col min-w-0 ${className}`}>
    <header className="px-3 py-2 border-b border-[#E5D8EE] flex items-center justify-between gap-2 bg-[#FDFBF7] rounded-t-xl">
      <div className="flex items-center gap-2 min-w-0">
        <span className={accent}>{icon}</span>
        <div className="min-w-0">
          <h5 className="text-[11px] font-black uppercase tracking-wider text-[#2A0E3F] leading-tight truncate">{title}</h5>
          {hint && <p className="text-[10px] text-[#7E6C96] leading-tight truncate">{hint}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {badge}
        {actions}
      </div>
    </header>
    <div className="p-3">{children}</div>
  </section>
);

/** Lightweight SQL tokenizer so the preview reads like a real editor theme. */
const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'JOIN',
  'ON', 'AS', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT', 'IS', 'NOT',
  'NULL', 'LIKE', 'ILIKE', 'IN', 'ASC', 'DESC', 'TRUE', 'FALSE', 'COUNT'
]);

interface SqlToken {
  text: string;
  kind: 'keyword' | 'string' | 'number' | 'ident' | 'space' | 'punct';
}

function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  const re = /('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([\s\S])/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(sql)) !== null) {
    if (match[1]) tokens.push({ text: match[1], kind: 'string' });
    else if (match[2]) tokens.push({ text: match[2], kind: 'number' });
    else if (match[3]) {
      const upper = match[3].toUpperCase();
      tokens.push({ text: match[3], kind: SQL_KEYWORDS.has(upper) ? 'keyword' : 'ident' });
    } else if (match[4]) tokens.push({ text: match[4], kind: 'space' });
    else tokens.push({ text: match[5], kind: 'punct' });
  }
  return tokens;
}

const tokenClass: Record<SqlToken['kind'], string> = {
  keyword: 'text-[#C9A961] font-bold',
  string: 'text-[#8FE3B0]',
  number: 'text-[#F3A8C4]',
  ident: 'text-[#EFE6F7]',
  space: '',
  punct: 'text-[#B79ECD]'
};

const SqlPreview: React.FC<{ sql: string }> = ({ sql }) => {
  const lines = sql.split('\n');
  return (
    <pre
      id="qb-sql-preview"
      aria-label="Generated SQL preview"
      className="text-[11.5px] leading-relaxed font-mono overflow-x-auto custom-scrollbar bg-[#1B0729] rounded-lg border border-[#3D1E4E] p-0 m-0"
    >
      <code className="block">
        {lines.map((line, idx) => (
          <div key={idx} className="flex items-start hover:bg-white/[0.03] px-3 py-[1px]">
            <span className="select-none w-6 shrink-0 text-right pr-3 text-[#5B4270]">{idx + 1}</span>
            <span className="whitespace-pre" data-sql-line="">
              {tokenizeSql(line).map((token, tIdx) => (
                <span key={tIdx} className={tokenClass[token.kind]}>
                  {token.text}
                </span>
              ))}
              {line.length === 0 ? ' ' : null}
            </span>
          </div>
        ))}
      </code>
    </pre>
  );
};

const formatCellNumber = (value: number): string =>
  Number.isInteger(value) ? value.toLocaleString('en-IN') : value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

function renderCellValue(value: unknown, sqlType: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="italic text-[#B39DC4]">NULL</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span
        className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${
          value ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-100 text-stone-500 border-stone-200'
        }`}
      >
        {value ? 'true' : 'false'}
      </span>
    );
  }
  if (typeof value === 'number') {
    return <span className="font-mono tabular-nums text-[#2A0E3F]">{formatCellNumber(value)}</span>;
  }
  if (Array.isArray(value)) {
    const items = value.map((v) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)));
    if (items.length === 0) return <span className="italic text-[#B39DC4]">{'{}'}</span>;
    return (
      <span className="inline-flex flex-wrap gap-1" title={items.join(', ')}>
        {items.slice(0, 3).map((item, i) => (
          <span key={i} className="px-1.5 py-0.5 rounded bg-[#F5EEF8] border border-[#E5D8EE] text-[10px] font-bold text-[#6B2D8C]">
            {item.length > 22 ? `${item.slice(0, 22)}…` : item}
          </span>
        ))}
        {items.length > 3 && <span className="text-[10px] font-bold text-[#7E6C96]">+{items.length - 3}</span>}
      </span>
    );
  }
  if (typeof value === 'object') {
    const json = JSON.stringify(value);
    return (
      <span className="font-mono text-[10px] text-[#5B4A6E]" title={json}>
        {json.length > 42 ? `${json.slice(0, 42)}…` : json}
      </span>
    );
  }
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}([T ]|$)/.test(str) && (sqlType === 'TIMESTAMP' || sqlType === 'DATE')) {
    const date = new Date(str);
    if (!Number.isNaN(date.getTime())) {
      const label = date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return <span className="whitespace-nowrap text-[#5B4A6E]" title={str}>{label}</span>;
    }
  }
  return (
    <span className="block max-w-[300px] truncate text-[#2A0E3F]" title={str}>
      {str}
    </span>
  );
}

// ----------------------------------------------------------------------------
// Quick presets
// ----------------------------------------------------------------------------

interface QueryPreset {
  id: string;
  label: string;
  description: string;
  build: (ctx: {
    tableByName: Map<string, TableInfo>;
    ref: (table: TableName, column: string) => string | null;
    nextId: (p: string) => string;
  }) => Partial<QuerySpec> | null;
}

const PRESETS: QueryPreset[] = [
  {
    id: 'rfq-supplier-trust',
    label: 'RFQs → Supplier trust',
    description: 'JOIN rfqs_enquiries with profiles_supplier, ranked by trust score',
    build: ({ tableByName, ref, nextId }) => {
      if (!tableByName.has('rfqs_enquiries') || !tableByName.has('profiles_supplier')) return null;
      const leftCols = ['id', 'requirement_title', 'status', 'quantity_required'];
      const rightCols = ['company_name', 'trust_score', 'verification_level'];
      return {
        operation: 'JOIN' as SqlOperation,
        fromTable: 'rfqs_enquiries' as TableName,
        columns: leftCols.map((c) => ref('rfqs_enquiries', c)).filter(Boolean) as string[],
        joins: [
          {
            id: nextId('join'),
            table: 'profiles_supplier' as TableName,
            leftColumn: ref('rfqs_enquiries', 'supplier_id') as string,
            rightColumn: ref('profiles_supplier', 'id') as string,
            joinType: 'LEFT' as JoinType,
            columns: rightCols.map((c) => ref('profiles_supplier', c)).filter(Boolean) as string[]
          }
        ],
        filters: [],
        orderByColumn: ref('profiles_supplier', 'trust_score'),
        orderDirection: 'DESC' as SortDirection,
        limit: 50
      };
    }
  },
  {
    id: 'quote-comparison',
    label: 'Quote price comparison',
    description: 'Every quote routed to a public RFQ, cheapest first',
    build: ({ tableByName, ref, nextId }) => {
      if (!tableByName.has('quotes')) return null;
      const cols = ['id', 'rfq_id', 'unit_price', 'total_price', 'status', 'moq_offered'].map((c) => ref('quotes', c)).filter(Boolean) as string[];
      const base: Partial<QuerySpec> = {
        operation: 'SELECT',
        fromTable: 'quotes' as TableName,
        columns: cols,
        joins: [],
        filters: [
          {
            id: nextId('filter'),
            column: ref('quotes', 'status') as string,
            operator: 'in' as FilterOperator,
            value: 'submitted, negotiating',
            combinator: 'AND'
          }
        ],
        orderByColumn: ref('quotes', 'total_price'),
        orderDirection: 'DESC' as SortDirection,
        limit: 50
      };
      if (tableByName.has('profiles_supplier') && ref('quotes', 'supplier_id')) {
        base.operation = 'JOIN';
        base.joins = [
          {
            id: nextId('join'),
            table: 'profiles_supplier' as TableName,
            leftColumn: ref('quotes', 'supplier_id') as string,
            rightColumn: ref('profiles_supplier', 'id') as string,
            joinType: 'INNER' as JoinType,
            columns: [ref('profiles_supplier', 'company_name'), ref('profiles_supplier', 'city')].filter(Boolean) as string[]
          }
        ];
      }
      return base;
    }
  },
  {
    id: 'open-catalogue',
    label: 'Active catalogue + MOQ',
    description: 'Live private-label listings above 10,000 ₹ unit price',
    build: ({ tableByName, ref, nextId }) => {
      if (!tableByName.has('products')) return null;
      return {
        operation: 'SELECT',
        fromTable: 'products' as TableName,
        columns: ['id', 'title', 'moq', 'unit_price', 'lead_time_days'].map((c) => ref('products', c)).filter(Boolean) as string[],
        joins: [],
        filters: [
          { id: nextId('filter'), column: ref('products', 'status') as string, operator: 'eq', value: 'active', combinator: 'AND' }
        ],
        orderByColumn: ref('products', 'unit_price'),
        orderDirection: 'DESC',
        limit: 25
      };
    }
  }
];

// ----------------------------------------------------------------------------
// Main panel
// ----------------------------------------------------------------------------

export const QueryBuilderPanel: React.FC<QueryBuilderPanelProps> = ({
  dbState,
  activeTable,
  onSelectTable,
  className = ''
}) => {
  const [operation, setOperation] = useState<SqlOperation>('SELECT');
  const [columns, setColumns] = useState<string[]>([]);
  const [joins, setJoins] = useState<QueryJoin[]>([]);
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  const [orderByColumn, setOrderByColumn] = useState<string | null>(null);
  const [orderDirection, setOrderDirection] = useState<SortDirection>('DESC');
  const [limit, setLimit] = useState<number | null>(100);

  const [columnSearch, setColumnSearch] = useState('');
  const [result, setResult] = useState<QueryExecution | null>(null);
  const [lastRunSql, setLastRunSql] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [runCount, setRunCount] = useState(0);

  // ---- Introspection -------------------------------------------------------
  const tables = useMemo(() => introspectDatabase(dbState), [dbState]);
  const tableByName = useMemo(() => new Map(tables.map((t) => [t.name as string, t])), [tables]);
  const baseTable = tableByName.get(activeTable as string) ?? tables[0];
  const baseColumns = baseTable?.columns ?? [];

  const spec = useMemo<QuerySpec>(
    () => ({
      operation,
      fromTable: activeTable,
      columns,
      joins: operation === 'JOIN' ? joins : [],
      filters,
      orderByColumn,
      orderDirection,
      limit
    }),
    [operation, activeTable, columns, joins, filters, orderByColumn, orderDirection, limit]
  );

  const scope = useMemo(() => computeScope(spec), [spec]);
  const scopeRefs = useMemo(() => {
    const map = new Map<string, ColumnInfo[]>();
    scope.forEach((entry) => {
      const info = tableByName.get(entry.table as string);
      map.set(
        entry.alias,
        (info?.columns ?? []).map((c) => ({ ...c, qualifiedName: `${entry.alias}.${c.name}`, alias: entry.alias }))
      );
    });
    return map;
  }, [scope, tableByName]);

  const availableRefs = useMemo(
    () => scope.flatMap((entry) => scopeRefs.get(entry.alias) ?? []),
    [scope, scopeRefs]
  );

  /** Relations still available as JOIN targets (base table and already-joined ones excluded). */
  const joinableTables = useMemo(
    () => tables.filter((t) => t.name !== activeTable && !joins.some((j) => j.table === t.name)),
    [tables, activeTable, joins]
  );

  const sql = useMemo(() => (baseTable ? compileSql(spec, tables) : ''), [spec, tables, baseTable]);
  const isStale = lastRunSql !== null && sql !== lastRunSql;
  const inactiveJoinCount = operation === 'SELECT' ? joins.length : 0;

  // ---- Helpers -------------------------------------------------------------
  const bareName = (ref: string) => ref.split('.').pop() as string;

  /**
   * Keep the builder consistent whenever the base relation changes (from the
   * FROM selector or from the modal's table sidebar): every reference that no
   * longer resolves is pruned, so the preview can never point at a dropped scope.
   */
  const lastBaseRef = useRef<TableName>(activeTable);
  useEffect(() => {
    if (lastBaseRef.current === activeTable) return;
    lastBaseRef.current = activeTable;

    const nextInfo = tableByName.get(activeTable as string);
    const nextJoins = joins.filter((j) => j.table !== activeTable);

    const scopedRefs = new Set((nextInfo?.columns ?? []).map((c) => c.qualifiedName));
    nextJoins.forEach((join) => {
      (tableByName.get(join.table as string)?.columns ?? []).forEach((c) => scopedRefs.add(`${join.table}.${c.name}`));
    });
    const resolves = (ref: string) => scopedRefs.has(ref);

    if (columns.some((ref) => !resolves(ref))) setColumns(columns.filter((ref) => resolves(ref)));
    if (filters.some((f) => !resolves(f.column))) setFilters(filters.filter((f) => resolves(f.column)));
    if (nextJoins.length !== joins.length) setJoins(nextJoins);
    if (orderByColumn && !resolves(orderByColumn)) setOrderByColumn(null);
  }, [activeTable, tableByName, columns, joins, filters, orderByColumn]);

  const handleOperationChange = (next: SqlOperation) => {
    setOperation(next);
    if (next === 'JOIN' && joins.length === 0) {
      // Seed the JOIN builder with the most informative relation of this table:
      // the foreign key that fans out across the most distinct rows.
      const suggestion = tableByName.get(activeTable as string);
      const fkColumns = (suggestion?.columns ?? []).filter((c) => c.fkTarget);
      const fk = fkColumns.sort(
        (a, b) => b.distinctValues.length - a.distinctValues.length || b.totalNonNull - a.totalNonNull
      )[0];
      if (fk?.fkTarget) {
        const [targetTable] = fk.fkTarget.split('.') as [TableName, string];
        const targetInfo = tableByName.get(targetTable as string);
        if (targetInfo) {
          const joinColumns = defaultJoinProjection(targetInfo, targetTable);
          setJoins([
            {
              id: uid('join'),
              table: targetTable,
              leftColumn: fk.qualifiedName,
              rightColumn: fk.fkTarget,
              joinType: 'INNER',
              columns: joinColumns
            }
          ]);
        }
      }
    }
  };

  const toggleColumn = (ref: string) => {
    setColumns((prev) => {
      const resolved = prev.length ? prev : baseColumns.map((c) => c.qualifiedName);
      return resolved.includes(ref) ? resolved.filter((c) => c !== ref) : [...resolved, ref];
    });
  };

  const toggleJoinColumn = (joinId: string, ref: string) => {
    setJoins((prev) =>
      prev.map((j) => {
        if (j.id !== joinId) return j;
        const all = (tableByName.get(j.table as string)?.columns ?? []).map((c) => `${j.table}.${c.name}`);
        const resolved = j.columns.length ? j.columns : all;
        return { ...j, columns: resolved.includes(ref) ? resolved.filter((c) => c !== ref) : [...resolved, ref] };
      })
    );
  };

  const addJoin = () => {
    const candidate = joinableTables[0];
    if (!candidate) return;
    const candidates = baseTable ? discoverJoinKeys(tables, activeTable, activeTable, candidate.name) : [];
    const best = candidates[0] ?? {
      leftColumn: `${activeTable}.id`,
      rightColumn: `${candidate.name}.id`,
      hint: 'shared id key',
      confidence: 'name' as const
    };
    setJoins((prev) => [
      ...prev,
      {
        id: uid('join'),
        table: candidate.name,
        leftColumn: best.leftColumn,
        rightColumn: best.rightColumn,
        joinType: 'INNER',
        columns: defaultJoinProjection(candidate, candidate.name)
      }
    ]);
  };

  const updateJoin = (joinId: string, patch: Partial<QueryJoin>) => {
    setJoins((prev) => prev.map((j) => (j.id === joinId ? { ...j, ...patch } : j)));
  };

  const changeJoinTable = (joinId: string, nextTable: TableName) => {
    setJoins((prev) =>
      prev.map((j) => {
        if (j.id !== joinId) return j;
        const candidates = baseTable ? discoverJoinKeys(tables, activeTable, activeTable, nextTable) : [];
        const best = candidates[0];
        const target = tableByName.get(nextTable as string);
        return {
          ...j,
          table: nextTable,
          leftColumn: best?.leftColumn ?? `${activeTable}.id`,
          rightColumn: best ? `${nextTable}.${bareName(best.rightColumn)}` : `${nextTable}.id`,
          columns: target ? defaultJoinProjection(target, nextTable) : [`${nextTable}.id`]
        };
      })
    );
    // Predicates that pointed at the previous join target are re-pointed at the
    // new one (or at an equivalent base column), otherwise dropped.
    const droppedAlias = joinTableOf(joinId);
    if (droppedAlias && droppedAlias !== nextTable) {
      const nextRefs = new Set((tableByName.get(nextTable as string)?.columns ?? []).map((c) => c.qualifiedName));
      const baseRefs = new Set(baseColumns.map((c) => c.qualifiedName));
      setFilters((prev) =>
        prev.flatMap((f) => {
          if (f.column.split('.')[0] !== droppedAlias) return [f];
          const remapped = `${nextTable}.${bareName(f.column)}`;
          if (nextRefs.has(remapped)) return [{ ...f, column: remapped }];
          return baseRefs.has(remapped) ? [{ ...f, column: remapped }] : [];
        })
      );
    }
  };

  const joinTableOf = (joinId: string): TableName | null => joins.find((j) => j.id === joinId)?.table ?? null;

  const removeJoin = (joinId: string) => {
    const removed = joins.find((j) => j.id === joinId);
    setJoins((prev) => prev.filter((j) => j.id !== joinId));
    if (!removed) return;
    // Re-point predicates/orders at the base table when an equivalent column exists there.
    const baseRefs = new Set(baseColumns.map((c) => c.qualifiedName));
    setFilters((prev) =>
      prev
        .map((f) => {
          const [alias, col] = f.column.split('.');
          if (alias !== removed.table) return f;
          const fallback = `${activeTable}.${col}`;
          return baseRefs.has(fallback) ? { ...f, column: fallback } : null;
        })
        .filter(Boolean) as QueryFilter[]
    );
    setOrderByColumn((prev) => {
      if (!prev) return prev;
      const [alias, col] = prev.split('.');
      if (alias !== removed.table) return prev;
      return baseRefs.has(`${activeTable}.${col}`) ? `${activeTable}.${col}` : null;
    });
  };

  const addFilter = () => {
    const candidate =
      baseColumns.find((c) => c.name === 'status') || baseColumns.find((c) => c.sqlType === 'VARCHAR' && !c.isPk) || baseColumns[0];
    if (!candidate) return;
    setFilters((prev) => [
      ...prev,
      { id: uid('filter'), column: candidate.qualifiedName, operator: 'eq', value: '', combinator: 'AND' }
    ]);
  };

  const updateFilter = (filterId: string, patch: Partial<QueryFilter>) => {
    setFilters((prev) => prev.map((f) => (f.id === filterId ? { ...f, ...patch } : f)));
  };

  const removeFilter = (filterId: string) => setFilters((prev) => prev.filter((f) => f.id !== filterId));

  const resetBuilder = () => {
    setOperation('SELECT');
    setColumns([]);
    setJoins([]);
    setFilters([]);
    setOrderByColumn(null);
    setOrderDirection('DESC');
    setLimit(100);
    setColumnSearch('');
    setResult(null);
    setLastRunSql(null);
    setRunError(null);
  };

  // ---- Execution -----------------------------------------------------------
  const runQuery = useCallback(
    (options?: { silent?: boolean; override?: Partial<QuerySpec> }) => {
      const nextSpec: QuerySpec = { ...spec, ...(options?.override ?? {}) };
      if (isExecuting) return;
      setIsExecuting(true);
      setRunError(null);
      const delay = options?.silent ? 140 : 420;
      window.setTimeout(() => {
        try {
          const execution = executeQuery(nextSpec, tables);
          setResult(execution);
          setLastRunSql(execution.sql);
          setRunCount((c) => c + 1);
        } catch (err: any) {
          setResult(null);
          setRunError(err?.message ? String(err.message) : 'Query failed to execute against the local store.');
        } finally {
          setIsExecuting(false);
        }
      }, delay);
    },
    [spec, tables, isExecuting]
  );

  const runRef = useRef(runQuery);
  runRef.current = runQuery;

  // First paint: execute the starter query so the viewer is never blank.
  useEffect(() => {
    const t = window.setTimeout(() => runRef.current({ silent: true }), 180);
    return () => window.clearTimeout(t);
  }, []);

  // Cmd/Ctrl + Enter runs the query while the builder has focus.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      runQuery();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard?.writeText(sql);
    setCopiedSql(true);
    window.setTimeout(() => setCopiedSql(false), 1800);
  };

  const applyPreset = (preset: QueryPreset) => {
    const built = preset.build({
      tableByName,
      ref: (table, column) => {
        const info = tableByName.get(table as string);
        return info?.columns.some((c) => c.name === column) ? `${table}.${column}` : null;
      },
      nextId: (p) => uid(p)
    });
    if (!built) return;
    if (built.fromTable && built.fromTable !== activeTable) onSelectTable(built.fromTable);
    setOperation((built.operation as SqlOperation) ?? 'SELECT');
    setColumns((built.columns as string[]) ?? []);
    setJoins((built.joins as QueryJoin[]) ?? []);
    setFilters((built.filters as QueryFilter[]) ?? []);
    setOrderByColumn((built.orderByColumn as string | null) ?? null);
    setOrderDirection((built.orderDirection as SortDirection) ?? 'DESC');
    setLimit(built.limit === undefined ? 100 : built.limit);
    runRef.current({ silent: true, override: built });
  };

  const handleSortFromHeader = (col: ResultColumn) => {
    const alreadySorted = orderByColumn === col.key;
    const nextDirection: SortDirection = alreadySorted && orderDirection === 'DESC' ? 'ASC' : 'DESC';
    setOrderByColumn(col.key);
    setOrderDirection(nextDirection);
    runRef.current({ silent: true, override: { orderByColumn: col.key, orderDirection: nextDirection } });
  };

  const handleExportCsv = () => {
    if (!result || result.rows.length === 0) return;
    const headers = result.columns.map((col) => ({ label: col.label, key: col.key }));
    const filename = `nexora_query_${activeTable}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCsv(filename, headers, result.rows as Array<Record<string, any>>);
  };

  // ---- Derived render data -------------------------------------------------
  const visibleColumns = useMemo(() => {
    const term = columnSearch.trim().toLowerCase();
    if (!term) return baseColumns;
    return baseColumns.filter(
      (c) => c.name.toLowerCase().includes(term) || c.sqlType.toLowerCase().includes(term) || (c.fkTarget ?? '').toLowerCase().includes(term)
    );
  }, [baseColumns, columnSearch]);

  const allBaseSelected = columns.length === 0 || columns.length === baseColumns.length;
  const effectiveProjection = columns.length ? columns : baseColumns.map((c) => c.qualifiedName);

  const resultColumns = result?.columns ?? [];

  return (
    <div className={`${className} bg-[#FDFBF7] min-h-0`} onKeyDown={handleKeyDown}>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-3.5">
        {/* ============================= HEADER BAR ============================= */}
        <div className="bg-white rounded-xl border border-[#E5D8EE] shadow-2xs overflow-hidden">
          <div className="px-3.5 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E5D8EE] bg-gradient-to-r from-[#FDFBF7] to-[#F5EEF8]/60">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#2A0E3F] text-[#C9A961] flex items-center justify-center shrink-0">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-[#2A0E3F] leading-none">Query Builder</h4>
                  <span className="px-1.5 py-0.5 rounded bg-[#F5EEF8] border border-[#D9C3E8] text-[9px] font-black uppercase tracking-wide text-[#6B2D8C]">
                    In-memory engine
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[9px] font-black uppercase tracking-wide text-emerald-700">
                    Read only
                  </span>
                </div>
                <p className="text-[11px] text-[#5B4A6E] mt-1 leading-snug">
                  Compose a SELECT / JOIN statement against the live mock tables, then run it and inspect the rows.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                id="btn-qb-reset"
                type="button"
                onClick={resetBuilder}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E5D8EE] hover:border-[#6B2D8C] hover:bg-[#F5EEF8] text-[11px] font-bold text-[#5B4A6E] hover:text-[#6B2D8C] flex items-center gap-1.5 transition-all cursor-pointer"
                title="Clear columns, JOINs and filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                id="btn-qb-run-query"
                type="button"
                onClick={() => runQuery()}
                disabled={isExecuting}
                className="px-3.5 py-1.5 rounded-lg bg-[#6B2D8C] hover:bg-[#2A0E3F] disabled:opacity-60 text-white text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Execute query (Ctrl / ⌘ + Enter)"
              >
                {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isExecuting ? 'Executing…' : 'Run Query'}</span>
              </button>
            </div>
          </div>

          {/* ============================ PRESETS ============================== */}
          <div className="px-3.5 py-2 border-b border-[#E5D8EE] bg-white/70 flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#7E6C96]">Quick presets</span>
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                id={`btn-qb-preset-${preset.id}`}
                type="button"
                title={preset.description}
                onClick={() => applyPreset(preset)}
                className="px-2 py-1 rounded-lg bg-[#FDFBF7] border border-[#E5D8EE] hover:border-[#6B2D8C]/60 hover:bg-[#F5EEF8] text-[10px] font-bold text-[#5B4A6E] hover:text-[#6B2D8C] transition-all cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
            <span className="text-[10px] text-[#B39DC4] ml-auto hidden sm:inline">
              Presets rebuild the whole query - run one to see JOIN + WHERE + ORDER BY wired together.
            </span>
          </div>

          {/* ========================= SOURCE + OPERATION ======================== */}
          <div className="p-3.5 space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div>
                <label className={labelClass} htmlFor="qb-input-table">
                  Table (FROM)
                </label>
                <select
                  id="qb-input-table"
                  value={activeTable}
                  onChange={(e) => onSelectTable(e.target.value as TableName)}
                  className={fieldClass}
                >
                  {tables.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} — {t.rowCount} rows
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="qb-input-operation">
                  Operation type
                </label>
                <select
                  id="qb-input-operation"
                  value={operation}
                  onChange={(e) => handleOperationChange(e.target.value as SqlOperation)}
                  className={fieldClass}
                >
                  <option value="SELECT">SELECT — single table</option>
                  <option value="JOIN">JOIN — relate two or more tables</option>
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="qb-input-order">
                  Order by
                </label>
                <select
                  id="qb-input-order"
                  value={orderByColumn ?? ''}
                  onChange={(e) => setOrderByColumn(e.target.value || null)}
                  className={fieldClass}
                >
                  <option value="">— none —</option>
                  {availableRefs.map((c) => (
                    <option key={c.qualifiedName} value={c.qualifiedName}>
                      {c.qualifiedName} ({c.sqlType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="qb-input-direction">
                  Direction / LIMIT
                </label>
                <div className="flex items-center gap-2">
                  <select
                    id="qb-input-direction"
                    value={orderDirection}
                    onChange={(e) => setOrderDirection(e.target.value as SortDirection)}
                    className={`${fieldClass} w-24`}
                  >
                    <option value="ASC">ASC</option>
                    <option value="DESC">DESC</option>
                  </select>
                  <select
                    id="qb-input-limit"
                    value={limit === null ? 'null' : String(limit)}
                    onChange={(e) => setLimit(e.target.value === 'null' ? null : Number(e.target.value))}
                    className={`${fieldClass} flex-1`}
                  >
                    {LIMIT_OPTIONS.map((opt) => (
                      <option key={opt.label} value={opt.value === null ? 'null' : String(opt.value)}>
                        LIMIT {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ============================ JOIN BUILDER ======================== */}
            {operation === 'JOIN' ? (
              <div id="qb-join-builder" className="rounded-xl border border-[#D9C3E8] bg-[#FDFBF7] p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-[#6B2D8C]" />
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-[#2A0E3F]">
                      Join Builder ({joins.length})
                    </h5>
                  </div>
                  <button
                    id="btn-qb-add-join"
                    type="button"
                    onClick={addJoin}
                    disabled={joinableTables.length === 0}
                    title={joinableTables.length === 0 ? 'Every table is already in this query' : 'Chain another relation'}
                    className="px-2 py-1 rounded-lg bg-white border border-[#E5D8EE] hover:border-[#6B2D8C] text-[10px] font-bold text-[#6B2D8C] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add JOIN</span>
                  </button>
                </div>

                {joins.length === 0 ? (
                  <p className="text-[11px] text-[#7E6C96] leading-relaxed">
                    No JOIN clauses yet. Add one to relate <code className="font-mono text-[#6B2D8C]">{activeTable}</code> to a
                    foreign table — the join keys are auto-detected from the discovered foreign keys.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {joins.map((join, joinIdx) => {
                      const targetInfo = tableByName.get(join.table as string);
                      const targetColumns = targetInfo?.columns ?? [];
                      const usedByOthers = new Set(joins.filter((j) => j.id !== join.id).map((j) => j.table));
                      const keyCandidates = discoverJoinKeys(tables, activeTable, activeTable, join.table);
                      const leftOptions = scope.slice(0, joinIdx + 1).flatMap((entry) => scopeRefs.get(entry.alias) ?? []);
                      const allTargetRefs = targetColumns.map((c) => `${join.table}.${c.name}`);
                      const resolvedJoinColumns = join.columns.length ? join.columns : allTargetRefs;

                      return (
                        <div key={join.id} className="bg-white rounded-lg border border-[#E5D8EE] p-2.5 space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              <span className="text-[10px] font-black text-[#6B2D8C] bg-[#F5EEF8] px-1.5 py-0.5 rounded border border-[#D9C3E8]">
                                {join.joinType}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-[#2A0E3F] truncate">
                                {join.table} AS {join.table}
                              </span>
                              <select
                                id={`qb-join-type-${join.id}`}
                                aria-label={`Join type for ${join.table}`}
                                value={join.joinType}
                                onChange={(e) => updateJoin(join.id, { joinType: e.target.value as JoinType })}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#E5D8EE] bg-[#FDFBF7] text-[#5B4A6E] focus:outline-none focus:border-[#C9A961] cursor-pointer"
                              >
                                {JOIN_TYPES.map((jt) => (
                                  <option key={jt.value} value={jt.value}>
                                    {jt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[9px] font-bold text-[#B39DC4] hidden sm:inline">
                                {JOIN_TYPES.find((jt) => jt.value === join.joinType)?.hint}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeJoin(join.id)}
                                aria-label={`Remove JOIN on ${join.table}`}
                                className="w-6 h-6 rounded-lg text-[#B39DC4] hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 lg:items-end">
                            <div>
                              <label className={labelClass} htmlFor={`qb-join-target-${join.id}`}>Target table</label>
                              <select
                                id={`qb-join-target-${join.id}`}
                                aria-label="Join target table"
                                value={join.table}
                                onChange={(e) => changeJoinTable(join.id, e.target.value as TableName)}
                                className={fieldClass}
                              >
                                {tables
                                  .filter((t) => t.name !== activeTable)
                                  .map((t) => (
                                    <option key={t.name} value={t.name} disabled={usedByOthers.has(t.name)}>
                                      {t.name} — {t.rowCount} rows{usedByOthers.has(t.name) ? ' (already joined)' : ''}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <div className="flex items-center justify-center pb-1">
                              <ArrowRight className="w-4 h-4 text-[#C9A961]" />
                            </div>

                            <div>
                              <label className={labelClass}>Join condition (ON)</label>
                              <div className="grid grid-cols-2 gap-1.5">
                                <select
                                  id={`qb-join-left-${join.id}`}
                                  aria-label="Left join key"
                                  value={leftOptions.some((c) => c.qualifiedName === join.leftColumn) ? join.leftColumn : ''}
                                  onChange={(e) => updateJoin(join.id, { leftColumn: e.target.value })}
                                  className={`${fieldClass} font-mono`}
                                >
                                  {!leftOptions.some((c) => c.qualifiedName === join.leftColumn) && (
                                    <option value="">choose left key…</option>
                                  )}
                                  {leftOptions.map((c) => (
                                    <option key={c.qualifiedName} value={c.qualifiedName}>
                                      {c.qualifiedName}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  id={`qb-join-right-${join.id}`}
                                  aria-label="Right join key"
                                  value={targetColumns.some((c) => `${join.table}.${c.name}` === join.rightColumn) ? join.rightColumn : ''}
                                  onChange={(e) => updateJoin(join.id, { rightColumn: e.target.value })}
                                  className={`${fieldClass} font-mono`}
                                >
                                  {!targetColumns.some((c) => `${join.table}.${c.name}` === join.rightColumn) && (
                                    <option value="">choose right key…</option>
                                  )}
                                  {targetColumns.map((c) => (
                                    <option key={`${join.table}.${c.name}`} value={`${join.table}.${c.name}`}>
                                      {join.table}.{c.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {keyCandidates.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  <span className="text-[9px] font-bold text-[#B39DC4] uppercase">Suggested:</span>
                                  {keyCandidates.slice(0, 3).map((cand) => (
                                    <button
                                      key={`${cand.leftColumn}-${cand.rightColumn}`}
                                      type="button"
                                      onClick={() =>
                                        updateJoin(join.id, {
                                          leftColumn: cand.leftColumn,
                                          rightColumn: `${join.table}.${bareName(cand.rightColumn)}`
                                        })
                                      }
                                      className="px-1.5 py-0.5 rounded bg-[#FDFBF7] border border-[#E5D8EE] hover:border-[#6B2D8C]/50 text-[9.5px] font-mono font-bold text-[#6B2D8C] cursor-pointer"
                                      title={cand.hint}
                                    >
                                      {bareName(cand.leftColumn)}={bareName(cand.rightColumn)}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className={`${labelClass} mb-0`}>
                                Columns from {join.table} ({resolvedJoinColumns.length})
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => updateJoin(join.id, { columns: [] })}
                                  className="text-[9px] font-black uppercase text-[#7E6C96] hover:text-[#6B2D8C] cursor-pointer"
                                >
                                  all (*)
                                </button>
                                <span className="text-[9px] text-[#D3C5DE]">|</span>
                                <button
                                  type="button"
                                  onClick={() => updateJoin(join.id, { columns: [`${join.table}.id`] })}
                                  className="text-[9px] font-black uppercase text-[#7E6C96] hover:text-[#6B2D8C] cursor-pointer"
                                >
                                  key only
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar">
                              {targetColumns.map((c) => {
                                const refName = `${join.table}.${c.name}`;
                                const isChecked = resolvedJoinColumns.includes(refName);
                                return (
                                  <button
                                    key={refName}
                                    type="button"
                                    onClick={() => toggleJoinColumn(join.id, refName)}
                                    className={`px-1.5 py-0.5 rounded border text-[10px] font-mono transition-all cursor-pointer ${
                                      isChecked
                                        ? 'bg-[#F5EEF8] border-[#6B2D8C]/40 text-[#6B2D8C] font-bold'
                                        : 'bg-white border-[#E5D8EE] text-[#B39DC4] hover:border-[#6B2D8C]/30'
                                    }`}
                                  >
                                    {c.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#D9C3E8] bg-white/60 px-3 py-2 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-[#C9A961] shrink-0" />
                <p className="text-[11px] text-[#5B4A6E] leading-snug">
                  Single-table mode. Switch <strong className="text-[#2A0E3F]">Operation type</strong> to <code className="font-mono text-[#6B2D8C]">JOIN</code> to
                  chain relations
                  {inactiveJoinCount > 0 ? (
                    <span className="text-[#7E6C96]"> — {inactiveJoinCount} saved JOIN clause(s) are currently inactive.</span>
                  ) : null}
                  .
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
              {/* =========================== COLUMNS ========================== */}
              <SectionCard
                title="Columns"
                hint={columns.length === 0 ? 'No explicit projection — SELECT *' : `${columns.length} of ${baseColumns.length} columns projected`}
                icon={<Braces className="w-3.5 h-3.5" />}
                badge={
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border bg-[#F5EEF8] border-[#D9C3E8] text-[#6B2D8C]">
                    {allBaseSelected ? '*' : columns.length}
                  </span>
                }
                actions={
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setColumns([])}
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                        columns.length === 0
                          ? 'bg-[#6B2D8C] text-white border-[#6B2D8C]'
                          : 'bg-white text-[#7E6C96] border-[#E5D8EE] hover:border-[#6B2D8C]'
                      }`}
                    >
                      SELECT *
                    </button>
                    <button
                      type="button"
                      onClick={() => setColumns(baseColumns.map((c) => c.qualifiedName))}
                      className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border bg-white text-[#7E6C96] border-[#E5D8EE] hover:border-[#6B2D8C] transition-all cursor-pointer"
                      title="Explicitly project every column"
                    >
                      All {baseColumns.length}
                    </button>
                  </div>
                }
              >
                <div className="space-y-2">
                  <input
                    type="text"
                    value={columnSearch}
                    onChange={(e) => setColumnSearch(e.target.value)}
                    placeholder={`Filter ${baseColumns.length} columns in ${activeTable}…`}
                    className="w-full px-2 py-1.5 text-[11px] bg-[#FDFBF7] border border-[#E5D8EE] rounded-lg focus:outline-none focus:border-[#C9A961] text-[#2A0E3F] placeholder:text-[#B39DC4]"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                    {visibleColumns.map((col) => {
                      const isChecked = effectiveProjection.includes(col.qualifiedName);
                      return (
                        <label
                          key={col.qualifiedName}
                          className={`flex items-center gap-1.5 px-1.5 py-1 rounded-lg border text-[10.5px] cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-[#F5EEF8] border-[#6B2D8C]/40'
                              : 'bg-white border-[#E5D8EE] hover:border-[#C9A961]/60'
                          }`}
                          title={col.fkTarget ? `FK → ${col.fkTarget}` : col.sqlType}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleColumn(col.qualifiedName)}
                            className="w-3 h-3 accent-[#6B2D8C] shrink-0 cursor-pointer"
                          />
                          <span className={`font-mono truncate ${col.isPk ? 'font-black text-[#2A0E3F]' : 'font-medium text-[#5B4A6E]'}`}>
                            {col.name}
                          </span>
                          {col.isPk && (
                            <span className="ml-auto text-[8px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded shrink-0">
                              PK
                            </span>
                          )}
                          {!col.isPk && col.fkTarget && (
                            <span className="ml-auto text-[8px] font-black text-sky-700 bg-sky-50 border border-sky-200 px-1 rounded shrink-0">
                              FK
                            </span>
                          )}
                        </label>
                      );
                    })}
                    {visibleColumns.length === 0 && (
                      <p className="col-span-full text-[11px] text-[#B39DC4] text-center py-3">
                        This table has no columns in the current store snapshot.
                      </p>
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* =========================== FILTERS =========================== */}
              <SectionCard
                title="Filter / WHERE clause"
                hint={filters.length === 0 ? 'No predicates — every row qualifies' : `${filters.length} predicate(s) chained left to right`}
                icon={<ListFilter className="w-3.5 h-3.5" />}
                badge={
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border bg-[#F5EEF8] border-[#D9C3E8] text-[#6B2D8C]">
                    {filters.length} filter{filters.length === 1 ? '' : 's'}
                  </span>
                }
                actions={
                  <div className="flex items-center gap-1.5">
                    {filters.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilters([])}
                        className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border bg-white text-[#7E6C96] border-[#E5D8EE] hover:border-rose-300 hover:text-rose-600 transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      id="btn-qb-add-filter"
                      type="button"
                      onClick={addFilter}
                      disabled={baseColumns.length === 0}
                      title={baseColumns.length === 0 ? 'This relation is empty - no columns to filter on' : 'Add a WHERE predicate'}
                      className="flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded border bg-[#6B2D8C] text-white border-[#6B2D8C] hover:bg-[#2A0E3F] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3" />
                      Filter
                    </button>
                  </div>
                }
              >
                {filters.length === 0 ? (
                  <div className="text-center py-4">
                    <Filter className="w-5 h-5 mx-auto text-[#D3C5DE] mb-1.5" />
                    <p className="text-[11px] text-[#7E6C96]">
                      e.g. <code className="font-mono text-[#6B2D8C]">{activeTable}.status = 'active'</code>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                    {filters.map((filter, idx) => {
                      const info = availableRefs.find((c) => c.qualifiedName === filter.column);
                      const operatorDef = FILTER_OPERATORS.find((op) => op.id === filter.operator) ?? FILTER_OPERATORS[0];
                      return (
                        <div
                          key={filter.id}
                          className="rounded-lg border border-[#E5D8EE] bg-[#FDFBF7] p-1.5 space-y-1.5"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-[#B39DC4] w-4 shrink-0">#{idx + 1}</span>
                            {idx > 0 && (
                              <select
                                aria-label="Predicate combinator"
                                value={filter.combinator}
                                onChange={(e) => updateFilter(filter.id, { combinator: e.target.value as QueryFilter['combinator'] })}
                                className="text-[9px] font-black px-1 py-0.5 rounded border border-[#E5D8EE] bg-white text-[#6B2D8C] cursor-pointer"
                              >
                                <option value="AND">AND</option>
                                <option value="OR">OR</option>
                              </select>
                            )}
                            <select
                              aria-label="Filter column"
                              value={availableRefs.some((c) => c.qualifiedName === filter.column) ? filter.column : ''}
                              onChange={(e) => updateFilter(filter.id, { column: e.target.value })}
                              className="flex-1 min-w-0 text-[10.5px] font-mono font-bold p-1 rounded-lg bg-white border border-[#E5D8EE] focus:outline-none focus:border-[#C9A961] text-[#2A0E3F] cursor-pointer"
                            >
                              {!availableRefs.some((c) => c.qualifiedName === filter.column) && (
                                <option value="">choose column…</option>
                              )}
                              {scope.map((entry) => (
                                <optgroup key={entry.alias} label={entry.alias}>
                                  {(scopeRefs.get(entry.alias) ?? []).map((c) => (
                                    <option key={c.qualifiedName} value={c.qualifiedName}>
                                      {c.qualifiedName} ({c.sqlType})
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                            <select
                              aria-label="Filter operator"
                              value={filter.operator}
                              onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterOperator })}
                              className="text-[10px] font-mono font-bold p-1 rounded-lg bg-white border border-[#E5D8EE] focus:outline-none focus:border-[#C9A961] text-[#6B2D8C] cursor-pointer"
                            >
                              {FILTER_OPERATORS.map((op) => (
                                <option key={op.id} value={op.id}>
                                  {op.symbol}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeFilter(filter.id)}
                              aria-label="Remove predicate"
                              className="w-5 h-5 rounded text-[#B39DC4] hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0 transition-all cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          {operatorDef.needsValue && (
                            <div className="pl-[22px]">
                              <input
                                type="text"
                                list={`qb-values-${filter.id}`}
                                value={filter.value}
                                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                                placeholder={
                                  operatorDef.id === 'in' || operatorDef.id === 'not_in'
                                    ? 'comma-separated values, e.g. negotiating, quoted'
                                    : 'comparison value'
                                }
                                className="w-full px-2 py-1 text-[11px] font-mono bg-white border border-[#E5D8EE] rounded-lg focus:outline-none focus:border-[#C9A961] text-[#2A0E3F] placeholder:text-[#C9B8D6]"
                              />
                              <datalist id={`qb-values-${filter.id}`}>
                                {(info?.distinctValues ?? []).map((v) => (
                                  <option key={v} value={v} />
                                ))}
                              </datalist>
                              {info && info.distinctValues.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {info.distinctValues.slice(0, 6).map((v) => (
                                    <button
                                      key={v}
                                      type="button"
                                      onClick={() => updateFilter(filter.id, { value: v })}
                                      className="px-1 py-0.5 rounded bg-white border border-[#E5D8EE] hover:border-[#6B2D8C]/50 text-[9px] font-mono text-[#5B4A6E] cursor-pointer truncate max-w-[130px]"
                                      title={`= ${v}`}
                                    >
                                      {v.length > 18 ? `${v.slice(0, 18)}…` : v}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-[9.5px] text-[#B39DC4] mt-2 leading-snug">
                  LIKE is a case-insensitive substring match (<code className="font-mono">%wildcards%</code> supported). NULL compares
                  against empty and missing values.
                </p>
              </SectionCard>
            </div>
          </div>

          {/* ============================ SQL PREVIEW ========================== */}
          <div className="border-t border-[#E5D8EE] bg-[#FDFBF7] px-3.5 py-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <Code2 className="w-4 h-4 text-[#6B2D8C] shrink-0" />
                <h5 className="text-[11px] font-black uppercase tracking-wider text-[#2A0E3F]">Generated SQL</h5>
                {isStale && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[9px] font-black uppercase text-amber-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Edited since last run
                  </span>
                )}
                {runCount > 0 && !isStale && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[9px] font-black uppercase text-emerald-700">
                    In sync
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="hidden sm:inline text-[10px] text-[#B39DC4] font-mono">Ctrl / ⌘ + ⏎</span>
                <button
                  id="btn-qb-copy-sql"
                  type="button"
                  onClick={handleCopySql}
                  className="px-2 py-1 rounded-lg bg-white border border-[#E5D8EE] hover:border-[#6B2D8C] text-[10px] font-bold text-[#5B4A6E] hover:text-[#6B2D8C] flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>
            </div>

            <SqlPreview sql={sql} />

            {runError && (
              <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-start gap-2">
                <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong className="font-black">Execution error:</strong> {runError}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ============================== RESULTS ============================== */}
        <div id="qb-results" className="bg-white rounded-xl border border-[#E5D8EE] shadow-2xs overflow-hidden flex flex-col">
          <header className="px-3.5 py-2.5 border-b border-[#E5D8EE] flex items-center justify-between gap-3 bg-[#FDFBF7]">
            <div className="flex items-center gap-2 min-w-0">
              <Table2 className="w-4 h-4 text-[#6B2D8C] shrink-0" />
              <h5 className="text-[11px] font-black uppercase tracking-wider text-[#2A0E3F]">Result set</h5>
              <span
                id="qb-row-count-badge"
                aria-live="polite"
                className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                  result && result.rows.length > 0
                    ? 'bg-[#F5EEF8] border-[#D9C3E8] text-[#6B2D8C]'
                    : 'bg-stone-100 border-stone-200 text-stone-500'
                }`}
              >
                {result
                  ? `Showing ${result.returnedRows} result${result.returnedRows === 1 ? '' : 's'}`
                  : isExecuting
                    ? 'Executing…'
                    : 'Not executed yet'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {result && (
                <>
                  <span className="text-[10px] font-mono text-[#7E6C96]">
                    {result.matchedRows} matched
                    {result.returnedRows !== result.matchedRows ? ` · ${result.matchedRows - result.returnedRows} truncated` : ''} ·{' '}
                    {result.scannedRows} scanned · {result.engineMs.toFixed(2)} ms
                  </span>
                  {result.joinCount > 0 && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-700">
                      {result.joinCount} JOIN{result.joinCount === 1 ? '' : 'S'}
                    </span>
                  )}
                  {result.rows.length > 0 && (
                    <button
                      id="btn-qb-export-csv"
                      type="button"
                      onClick={handleExportCsv}
                      className="px-2 py-1 rounded-lg bg-white border border-[#E5D8EE] hover:border-[#6B2D8C] text-[10px] font-bold text-[#5B4A6E] hover:text-[#6B2D8C] flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </header>

          {isExecuting && !result && (
            <div className="p-6 flex items-center justify-center gap-2 text-[#7E6C96]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-bold">Executing query on the local relational engine…</span>
            </div>
          )}

          {result && result.rows.length === 0 && (
            <div id="qb-empty-state" className="py-9 px-4 text-center">
              <div className="w-11 h-11 rounded-xl bg-[#F5EEF8] border border-[#E5D8EE] flex items-center justify-center mx-auto mb-2">
                <Layers className="w-5 h-5 text-[#B39DC4]" />
              </div>
              <p className="text-xs font-black text-[#2A0E3F]">No rows matched this query</p>
              <p className="text-[11px] text-[#7E6C96] mt-1 max-w-md mx-auto leading-relaxed">
                The statement is valid — <code className="font-mono text-[#6B2D8C]">{result.matchedRows}</code> row(s) survived the
                WHERE clause
                {result.joinCount > 0 ? ` after ${result.joinCount} JOIN(s) (INNER joins drop unmatched rows)` : ''}.
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                {filters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilters([]);
                      runRef.current({ silent: true, override: { filters: [] } });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E5D8EE] hover:border-[#6B2D8C] text-[10px] font-bold text-[#5B4A6E] hover:text-[#6B2D8C] transition-all cursor-pointer"
                  >
                    Drop all filters &amp; re-run
                  </button>
                )}
                {operation === 'JOIN' && joins.some((j) => j.joinType === 'INNER') && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextJoins = joins.map((j) => ({ ...j, joinType: 'LEFT' as JoinType }));
                      setJoins(nextJoins);
                      runRef.current({ silent: true, override: { joins: nextJoins } });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E5D8EE] hover:border-[#6B2D8C] text-[10px] font-bold text-[#5B4A6E] hover:text-[#6B2D8C] transition-all cursor-pointer"
                  >
                    Retry with LEFT JOIN
                  </button>
                )}
                <button
                  type="button"
                  onClick={resetBuilder}
                  className="px-2.5 py-1 rounded-lg bg-[#2A0E3F] text-white hover:bg-black text-[10px] font-bold transition-all cursor-pointer"
                >
                  Reset builder
                </button>
              </div>
            </div>
          )}

          {result && result.rows.length > 0 && (
            <div className="overflow-auto max-h-[42vh] custom-scrollbar">
              <table id="qb-results-table" className="w-full text-left border-collapse text-[11px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#F5EEF8] border-b border-[#E5D8EE]">
                    <th className="px-2 py-2 text-[9px] font-black uppercase tracking-wide text-[#7E6C96] w-10">#</th>
                    {resultColumns.map((col) => (
                      <th key={col.key} className="px-2 py-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSortFromHeader(col)}
                          className="flex items-center gap-1 group cursor-pointer"
                          title={`ORDER BY ${col.label}`}
                        >
                          <span
                            className={`font-mono text-[10px] font-black ${
                              orderByColumn === col.key ? 'text-[#6B2D8C]' : 'text-[#2A0E3F] group-hover:text-[#6B2D8C]'
                            }`}
                          >
                            {col.label}
                          </span>
                          {col.isPk && <span className="text-[8px] font-black text-amber-700">PK</span>}
                          <ArrowUpDown
                            className={`w-2.5 h-2.5 ${
                              orderByColumn === col.key ? 'text-[#C9A961]' : 'text-[#D3C5DE] group-hover:text-[#C9A961]'
                            }`}
                          />
                          <span className="text-[9px] font-mono text-[#B39DC4]">{col.sqlType}</span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E8F4]">
                  {result.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-[#FDFBF7] transition-colors even:bg-[#FCFAF8]">
                      <td className="px-2 py-1.5 text-[9px] font-mono text-[#B39DC4] align-top">{rowIdx + 1}</td>
                      {resultColumns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-2 py-1.5 align-top ${col.isPk ? 'bg-[#FDFBF7]/60' : ''}`}
                        >
                          {renderCellValue(row[col.key], col.sqlType)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result && result.rows.length > 0 && (
            <footer className="px-3.5 py-2 border-t border-[#E5D8EE] bg-[#FDFBF7] flex items-center justify-between gap-3 text-[10px] text-[#7E6C96]">
              <span className="flex items-center gap-1.5 min-w-0">
                <Table2 className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {spec.operation === 'JOIN'
                    ? `${activeTable} ${scope.slice(1).map((s) => `⨝ ${s.table}`).join(' ')}`
                    : activeTable}
                  {limit ? ` · capped at ${limit.toLocaleString('en-IN')} rows` : ''}
                </span>
              </span>
              <span className="font-mono shrink-0">
                {result.columns.length} column{result.columns.length === 1 ? '' : 's'} · run #{runCount}
              </span>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueryBuilderPanel;
