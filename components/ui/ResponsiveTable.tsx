'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SpinnerGap,
  WarningCircle
} from '@phosphor-icons/react';
interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  mobileHidden?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowKey: (item: T) => string;
  mobileCard?: (item: T) => React.ReactNode;
}

export default function ResponsiveTable<T>({
  columns,
  data,
  loading,
  emptyMessage = "No data found",
  onRowClick,
  rowKey,
  mobileCard
}: ResponsiveTableProps<T>) {
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <SpinnerGap className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium uppercase tracking-widest animate-pulse">Loading Data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground opacity-60">
        <WarningCircle className="w-12 h-12" />
        <p className="text-sm font-medium uppercase tracking-widest">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className={cn(
        "hidden md:block overflow-x-auto rounded-xl border border-border bg-card shadow-card",
        onRowClick && "cursor-pointer"
      )}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/50 border-b border-border">
              {columns.map((col, index) => (
                <th 
                  key={index}
                  className={cn(
                    "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item, i) => (
              <motion.tr
                key={rowKey(item)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "hover:bg-accent/50 transition-colors group",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col, j) => (
                  <td 
                    key={j}
                    className={cn("px-6 py-4", col.className)}
                  >
                    {typeof col.accessor === 'function' 
                      ? col.accessor(item) 
                      : (item[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View (Cards or List) */}
      <div className="md:hidden space-y-4">
        {data.map((item, i) => (
          <motion.div
            key={rowKey(item)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onRowClick?.(item)}
            className={cn(
              "bg-card border border-border rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all",
              onRowClick && "cursor-pointer"
            )}
          >
            {mobileCard ? mobileCard(item) : (
              <div className="space-y-3">
                {columns.map((col, j) => (
                  <div key={j} className="flex justify-between items-start gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 mt-0.5">
                      {col.header}
                    </span>
                    <div className="text-sm font-medium text-foreground text-right break-words overflow-hidden">
                      {typeof col.accessor === 'function' 
                        ? col.accessor(item) 
                        : (item[col.accessor] as React.ReactNode)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}