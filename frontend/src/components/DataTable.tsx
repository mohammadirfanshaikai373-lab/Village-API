import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (val: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  searchPlaceholder?: string;
  searchKeys?: string[];
  onRowClick?: (row: any) => void;
  expandRow?: (row: any) => React.ReactNode;
}

export default function DataTable({ columns, data, searchPlaceholder = 'Search…', searchKeys, onRowClick, expandRow }: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search && searchKeys) {
      const q = search.toLowerCase();
      rows = rows.filter(r => searchKeys.some(k => String(r[k] || '').toLowerCase().includes(q)));
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const va = a[sortKey], vb = b[sortKey];
        if (va == null) return 1;
        if (vb == null) return -1;
        const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, search, searchKeys, sortKey, sortDir]);

  return (
    <div>
      <div className="mb-3 relative">
        <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-faded dark:text-ash" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 bg-card dark:bg-card-dark border border-rule dark:border-rule-dark rounded-lg text-sm text-ink dark:text-cream placeholder:text-faded dark:placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-teal/30 font-body"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-rule dark:border-rule-dark">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-parchment dark:bg-void">
              {columns.map(col => (
                <th key={col.key} className="text-left px-4 py-3 font-heading font-semibold text-faded dark:text-ash text-xs uppercase tracking-wider">
                  {col.sortable ? (
                    <button onClick={() => handleSort(col.key)} className="flex items-center gap-1 hover:text-ink dark:hover:text-cream transition-colors">
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ChevronUp size={14} strokeWidth={1.5} /> : <ChevronDown size={14} strokeWidth={1.5} />
                      ) : (
                        <ChevronUp size={14} strokeWidth={1.5} className="opacity-30" />
                      )}
                    </button>
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <>
                <tr
                  key={row.id ?? i}
                  className="dashed-row hover:bg-parchment/60 dark:hover:bg-void/60 cursor-pointer transition-colors"
                  onClick={() => {
                    if (expandRow) setExpandedId(expandedId === (row.id ?? i) ? null : row.id ?? i);
                    onRowClick?.(row);
                  }}
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-ink dark:text-cream font-body">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
                {expandRow && expandedId === (row.id ?? i) && (
                  <tr key={`expand-${row.id ?? i}`}>
                    <td colSpan={columns.length} className="px-4 py-3 bg-parchment/40 dark:bg-void/40 border-b border-dashed border-rule dark:border-rule-dark">
                      {expandRow(row)}
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-faded dark:text-ash font-body">
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}