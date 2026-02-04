'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CaretLeft,
  CaretRight,
  CaretUp,
  CaretDown,
  MagnifyingGlass,
  Funnel,
  Download,
  ArrowsClockwise,
  Gear,
  DotsThreeVertical
} from '@phosphor-icons/react';

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  refreshable?: boolean;
  paginatable?: boolean;
  itemsPerPage?: number;
  onSearch?: (query: string) => void;
  onFilter?: (filters: any) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  onRowClick?: (item: T) => void;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  searchable = true,
  filterable = true,
  exportable = true,
  refreshable = true,
  paginatable = true,
  itemsPerPage = 10,
  onSearch,
  onFilter,
  onExport,
  onRefresh,
  onRowClick,
  onSort,
  emptyMessage = 'No data available',
  className = ''
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());

  // Filter data based on search
  const filteredData = data.filter(item => {
    if (!searchQuery) return true;
    return columns.some(column => {
      const value = item[column.key];
      return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
    });
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    const comparison = aValue.toString().localeCompare(bValue.toString());
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = paginatable 
    ? sortedData.slice(startIndex, startIndex + itemsPerPage)
    : sortedData;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    onSearch?.(query);
  };

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedData.map((_, index) => startIndex + index)));
    }
  };

  const handleSelectItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowsClockwise className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
          
          {filterable && (
            <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all">
              <Funnel className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {exportable && (
            <button 
              onClick={onExport}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          
          {refreshable && (
            <button 
              onClick={onRefresh}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <ArrowsClockwise className="w-4 h-4" />
            </button>
          )}
          
          <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all">
            <Gear className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-white/20 bg-white/10 text-primary focus:ring-primary/50"
                  />
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key as string}
                    className={`px-4 py-3 text-left text-xs font-bold text-white/70 uppercase ${
                      column.sortable ? 'cursor-pointer hover:text-white' : ''
                    }`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && sortConfig?.key === column.key && (
                        sortConfig.direction === 'asc' ? (
                          <CaretUp className="w-3 h-3" />
                        ) : (
                          <CaretDown className="w-3 h-3" />
                        )
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-bold text-white/70 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-white/60">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <motion.tr
                    key={startIndex + index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`hover:bg-white/5 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => onRowClick?.(item)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(startIndex + index)}
                        onChange={() => handleSelectItem(startIndex + index)}
                        className="rounded border-white/20 bg-white/10 text-primary focus:ring-primary/50"
                      />
                    </td>
                    {columns.map((column) => (
                      <td key={column.key as string} className="px-4 py-3">
                        {column.render ? (
                          column.render(item[column.key], item)
                        ) : (
                          <span className="text-white/80">
                            {item[column.key]?.toString() || '-'}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <button className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-all">
                        <DotsThreeVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {paginatable && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/60">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of{' '}
            {sortedData.length} results
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CaretLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                const isActive = currentPage === pageNum;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CaretRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
