'use client';

import { Search, Filter } from 'lucide-react';
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
    <div className="glass-card p-6 rounded-2xl border border-white/10">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          <span className="text-white font-medium">Filters</span>
        </div>
        
        <div className="relative flex-1 min-w-[250px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search tickets by subject or description..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <select
          value={filters.status}
          onChange={handleStatusChange}
          className="bg-white/10 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all" className="bg-slate-800">All Status</option>
          <option value="open" className="bg-slate-800">Open</option>
          <option value="in_progress" className="bg-slate-800">In Progress</option>
          <option value="resolved" className="bg-slate-800">Resolved</option>
          <option value="closed" className="bg-slate-800">Closed</option>
        </select>

        <select
          value={filters.priority}
          onChange={handlePriorityChange}
          className="bg-white/10 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all" className="bg-slate-800">All Priority</option>
          <option value="low" className="bg-slate-800">Low</option>
          <option value="medium" className="bg-slate-800">Medium</option>
          <option value="high" className="bg-slate-800">High</option>
          <option value="urgent" className="bg-slate-800">Urgent</option>
        </select>

        <button
          onClick={() => updateFilters({ search: '', status: 'all', priority: 'all', page: 1 })}
          className="px-4 py-2 bg-white/10 text-white/80 rounded-xl hover:bg-white/20 transition-all text-sm"
        >
          Clear All
        </button>
      </div>

      <div className="mt-4 text-white/60 text-sm">
        {filters.search && (
          <span>
            Searching for "{filters.search}"
            {(filters.status !== 'all' || filters.priority !== 'all') && ', '}
          </span>
        )}
        {filters.status !== 'all' && (
          <span>
            Status: {filters.status}
            {filters.priority !== 'all' && ', '}
          </span>
        )}
        {filters.priority !== 'all' && (
          <span>Priority: {filters.priority}</span>
        )}
      </div>
    </div>
  );
}
