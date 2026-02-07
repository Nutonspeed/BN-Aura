'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  CaretUp,
  CaretDown,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  Funnel,
  SpinnerGap
} from '@phosphor-icons/react';
export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  pagination?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  stickyHeader?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  pagination = true,
  pageSize = 10,
  emptyMessage = 'No data available',
  onRowClick,
  className,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    onSearch?.(query);
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    const comparison = aVal < bVal ? -1 : 1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const getValue = (row: T, key: string): unknown => {
    const keys = key.split('.');
    let value: unknown = row;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return value;
  };

  return (
    <div className={cn("w-full", className)}>
      {searchable && (
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
          <button className="p-2.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <Funnel className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={cn(
              "bg-muted/50",
              stickyHeader && "sticky top-0 z-10"
            )}>
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                      col.align === 'center' && "text-center",
                      col.align === 'right' && "text-right",
                      col.sortable && "cursor-pointer hover:text-foreground transition-colors select-none"
                    )}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                  >
                    <div className={cn(
                      "flex items-center gap-1",
                      col.align === 'center' && "justify-center",
                      col.align === 'right' && "justify-end"
                    )}>
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        sortDirection === 'asc' 
                          ? <CaretUp weight="bold" className="w-3 h-3" />
                          : <CaretDown weight="bold" className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <SpinnerGap className="w-6 h-6 mx-auto animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">Loading...</p>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    onClick={() => onRowClick?.(row, rowIndex)}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col) => {
                      const value = getValue(row, String(col.key));
                      return (
                        <td
                          key={String(col.key)}
                          className={cn(
                            "px-4 py-3 text-sm text-foreground",
                            col.align === 'center' && "text-center",
                            col.align === 'right' && "text-right"
                          )}
                        >
                          {col.render ? col.render(value, row, rowIndex) : String(value ?? '-')}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, data.length)} of {data.length} results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <CaretLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 rounded-md text-xs font-medium transition-all",
                      currentPage === page
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent text-muted-foreground"
                    )}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <CaretRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}