'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  MagnifyingGlass,
  Funnel,
  CaretDown
} from '@phosphor-icons/react';
import { useSupportContext } from '../context';

export default function TicketFilters() {
  const { filters, updateFilters } = useSupportContext();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ search: e.target.value, page: 1 });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ status: e.target.value, page: 1 });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ priority: e.target.value, page: 1 });
  };

  return (
    <Card className="p-6 rounded-[32px] border-border/50 shadow-premium overflow-hidden group">
      <div className="flex flex-wrap items-center gap-6 relative z-10">
        <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-xl border border-primary/10">
          <Funnel weight="bold" className="w-4 h-4 text-primary" />
          <span className="text-primary text-[10px] font-black uppercase tracking-widest">Protocol Filters</span>
        </div>
        
        <div className="relative flex-1 min-w-[300px] group/input">
          <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
          <MagnifyingGlass weight="bold" className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
          <input
            type="text"
            placeholder="Query tickets by subject, description, or identity..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-11 pr-4 py-3.5 bg-secondary/30 border border-border rounded-2xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-all shadow-inner relative z-10 font-bold text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={filters.status}
              onChange={handleStatusChange}
              className="bg-secondary/30 border border-border rounded-2xl py-3.5 px-6 pr-10 text-xs font-black uppercase tracking-widest text-foreground focus:border-primary outline-none transition-all appearance-none shadow-inner"
            >
              <option value="all" className="bg-card">ALL_STATUS</option>
              <option value="open" className="bg-card">OPEN_NODE</option>
              <option value="in_progress" className="bg-card">PROCESSING</option>
              <option value="resolved" className="bg-card">SETTLED</option>
              <option value="closed" className="bg-card">ARCHIVED</option>
            </select>
            <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filters.priority}
              onChange={handlePriorityChange}
              className="bg-secondary/30 border border-border rounded-2xl py-3.5 px-6 pr-10 text-xs font-black uppercase tracking-widest text-foreground focus:border-primary outline-none transition-all appearance-none shadow-inner"
            >
              <option value="all" className="bg-card">ALL_PRIORITY</option>
              <option value="low" className="bg-card">LOW_VAL</option>
              <option value="medium" className="bg-card">MEDIUM_VAL</option>
              <option value="high" className="bg-card">HIGH_ALERT</option>
              <option value="urgent" className="bg-card">URGENT_SYNC</option>
            </select>
            <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
          </div>

          <Button
            variant="outline"
            onClick={() => updateFilters({ search: '', status: 'all', priority: 'all', page: 1 })}
            className="px-6 py-3.5 h-auto rounded-2xl border-border/50 hover:bg-secondary text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Clear Matrix
          </Button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 px-1">
        <div className="w-1 h-1 rounded-full bg-primary/40" />
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          {filters.search ? (
            <span>
              Searching: "{filters.search}"
              {(filters.status !== 'all' || filters.priority !== 'all') && ' | '}
            </span>
          ) : (
            <span>Global Registry View</span>
          )}
          {filters.status !== 'all' && (
            <span>
              Status: {filters.status.toUpperCase()}
              {filters.priority !== 'all' && ' | '}
            </span>
          )}
          {filters.priority !== 'all' && (
            <span>Priority: {filters.priority.toUpperCase()}</span>
          )}
        </div>
      </div>
    </Card>
  );
}