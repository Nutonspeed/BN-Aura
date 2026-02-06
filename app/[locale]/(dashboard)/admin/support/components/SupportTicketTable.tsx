'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ResponsiveTable from '@/components/ui/ResponsiveTable';
import { 
  MagnifyingGlass, 
  Funnel, 
  Plus, 
  Eye, 
  PencilSimple, 
  Trash, 
  Clock, 
  WarningCircle, 
  CheckCircle, 
  XCircle,
  Buildings,
  User,
  CaretDown,
  DotsThreeVertical,
  CalendarDots,
  Pulse,
  IdentificationCard,
  IdentificationBadge,
  Monitor
} from '@phosphor-icons/react';
import { SupportTicket } from '../types';

interface SupportTicketTableProps {
  tickets: SupportTicket[];
  onTicketSelect: (ticket: SupportTicket) => void;
  onTicketEdit: (ticket: SupportTicket) => void;
  onTicketDelete: (ticketId: string) => void;
  loading?: boolean;
}

export default function SupportTicketTable({ 
  tickets, 
  onTicketSelect, 
  onTicketEdit, 
  onTicketDelete, 
  loading = false 
}: SupportTicketTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const columns = [
    {
      header: 'Ticket Node',
      accessor: (ticket: SupportTicket) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shrink-0">
            <WarningCircle weight="duotone" className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate uppercase tracking-tight leading-tight">{ticket.subject}</p>
            <p className="text-[10px] text-muted-foreground font-medium truncate italic">{ticket.description}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Identity Node',
      accessor: (ticket: SupportTicket) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shadow-inner">
            <User weight="bold" className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{ticket.user?.full_name || 'ANONYMOUS'}</p>
            <p className="text-[9px] text-muted-foreground truncate font-mono uppercase opacity-60">{ticket.user?.email || 'OFFLINE'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Cluster Link',
      accessor: (ticket: SupportTicket) => (
        <div className="flex items-center gap-2">
          <Buildings weight="duotone" className="w-4 h-4 text-primary/60" />
          <span className="text-xs font-bold text-foreground uppercase tracking-tight">{ticket.clinic_name || 'STANDALONE'}</span>
        </div>
      )
    },
    {
      header: 'Protocol Priority',
      accessor: (ticket: SupportTicket) => {
        const priority = ticket.priority.toLowerCase();
        return (
          <Badge 
            variant={priority === 'urgent' ? 'destructive' : priority === 'high' ? 'warning' : 'secondary'} 
            size="sm" 
            className="font-black text-[8px] tracking-widest px-2.5 py-1 uppercase shadow-sm"
          >
            {priority}
          </Badge>
        );
      }
    },
    {
      header: 'Sync Status',
      accessor: (ticket: SupportTicket) => {
        const status = ticket.status.toLowerCase();
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 rounded-lg w-fit border border-border/30">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
              status === 'resolved' ? "bg-emerald-500" : 
              status === 'open' ? "bg-rose-500" : 
              status === 'in_progress' ? "bg-amber-500" : "bg-muted"
            )} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest",
              status === 'resolved' ? "text-emerald-500" : 
              status === 'open' ? "text-rose-500" : 
              status === 'in_progress' ? "text-amber-500" : "text-muted-foreground"
            )}>{status.replace('_', ' ')}</span>
          </div>
        );
      }
    },
    {
      header: 'Initialized',
      accessor: (ticket: SupportTicket) => (
        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
          {new Date(ticket.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      header: '',
      className: 'text-right',
      accessor: (ticket: SupportTicket) => (
        <div className="flex items-center justify-end gap-2 opacity-40 group-hover/row:opacity-100 transition-opacity">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onTicketSelect(ticket); }}
            className="h-9 w-9 p-0 rounded-xl border-border/50 hover:bg-secondary text-muted-foreground hover:text-primary transition-all"
          >
            <Eye weight="bold" className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onTicketEdit(ticket); }}
            className="h-9 w-9 p-0 rounded-xl border-border/50 hover:bg-secondary text-muted-foreground hover:text-primary transition-all"
          >
            <PencilSimple weight="bold" className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onTicketDelete(ticket.id); }}
            className="h-9 w-9 p-0 rounded-xl border-border/50 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 transition-all"
          >
            <Trash weight="bold" className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Table Hub */}
      <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
        <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <Monitor weight="fill" className="w-48 h-48 text-primary" />
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                <Monitor weight="duotone" className="w-7 h-7" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Support Ticket Registry</CardTitle>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-1">Global assistance protocol matrix</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 lg:max-w-3xl justify-end">
              <div className="relative w-full sm:w-64 group/input">
                <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                <input
                  type="text"
                  placeholder="Query tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10 font-bold text-sm"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-40">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-3 px-6 pr-10 text-[10px] font-black uppercase tracking-widest text-foreground focus:border-primary outline-none transition-all appearance-none shadow-inner"
                  >
                    <option value="all">ALL_STATUS</option>
                    <option value="open">OPEN</option>
                    <option value="in_progress">PROCESSING</option>
                    <option value="resolved">SETTLED</option>
                    <option value="closed">ARCHIVED</option>
                  </select>
                  <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
                </div>

                <div className="relative w-full sm:w-40">
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-3 px-6 pr-10 text-[10px] font-black uppercase tracking-widest text-foreground focus:border-primary outline-none transition-all appearance-none shadow-inner"
                  >
                    <option value="all">ALL_PRIORITY</option>
                    <option value="low">LOW</option>
                    <option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option>
                    <option value="urgent">URGENT</option>
                  </select>
                  <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ResponsiveTable
            columns={columns}
            data={filteredTickets}
            loading={loading}
            rowKey={(t) => t.id}
            emptyMessage="Zero support nodes detected in current clinical registry."
            onRowClick={onTicketSelect}
            mobileCard={(ticket) => (
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner group-hover/row:bg-primary/10 transition-all">
                      <WarningCircle weight="duotone" className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate uppercase tracking-tight leading-tight">{ticket.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={ticket.priority.toLowerCase() === 'urgent' ? 'destructive' : ticket.priority.toLowerCase() === 'high' ? 'warning' : 'secondary'} size="sm" className="font-black text-[7px] tracking-widest px-1.5 py-0.5 uppercase shadow-sm">
                          {ticket.priority}
                        </Badge>
                        <Badge variant="ghost" size="sm" className="bg-primary/5 text-primary border-none font-mono text-[8px] px-1.5 py-0.5 tracking-tighter">NODE-{ticket.id.slice(0, 4)}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 rounded-lg border border-border/30 shadow-inner">
                    <div className={cn("w-1 h-1 rounded-full animate-pulse", ticket.status === 'resolved' ? "bg-emerald-500" : "bg-amber-500")} />
                    <span className="text-[8px] font-black uppercase tracking-widest">{ticket.status.toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 py-4 border-y border-border/20">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">Identity Origin</p>
                    <p className="text-xs font-bold text-foreground truncate">{ticket.user?.full_name || 'ANONYMOUS'}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">Cluster Node</p>
                    <p className="text-xs font-bold text-foreground truncate uppercase">{ticket.clinic_name || 'STANDALONE'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <CalendarDots weight="bold" className="w-3.5 h-3.5 opacity-40" />
                    Initialized: {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-xl border-border/50 hover:bg-secondary">
                      <Eye weight="bold" className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-10 w-10 p-0 border-border/50 rounded-xl hover:bg-secondary text-primary"
                      onClick={(e) => { e.stopPropagation(); onTicketEdit(ticket); }}
                    >
                      <PencilSimple weight="bold" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}