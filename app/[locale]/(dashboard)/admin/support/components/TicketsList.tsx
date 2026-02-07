'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  SpinnerGap,
  Clock,
  User,
  Buildings,
  ChatCircle,
  Eye,
  PencilSimple,
  Warning,
  CheckCircle,
  WarningCircle,
  CaretRight
} from '@phosphor-icons/react';
import { useSupportContext } from '../context';
import { SupportTicket } from '../types';
import { motion } from 'framer-motion';

interface TicketsListProps {
  onViewTicket: (ticket: SupportTicket) => void;
  onEditTicket: (ticket: SupportTicket) => void;
}

export default function TicketsList({ onViewTicket, onEditTicket }: TicketsListProps) {
  const { tickets, loading } = useSupportContext();

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'low': return 'bg-secondary text-muted-foreground border-border';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'in_progress': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'closed': return 'bg-secondary text-muted-foreground border-border';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInDays < 7) return `${Math.floor(diffInDays)}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="rounded-[32px] border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-8">
              <div className="animate-pulse space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="h-6 w-20 bg-secondary rounded-lg"></div>
                    <div className="h-6 w-20 bg-secondary rounded-lg"></div>
                  </div>
                  <div className="h-8 w-8 bg-secondary rounded-xl"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-6 bg-secondary rounded-xl w-3/4"></div>
                  <div className="h-4 bg-secondary rounded-lg w-1/2"></div>
                </div>
                <div className="grid grid-cols-3 gap-6 pt-4">
                  <div className="h-4 bg-secondary rounded-lg"></div>
                  <div className="h-4 bg-secondary rounded-lg"></div>
                  <div className="h-4 bg-secondary rounded-lg"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-8 opacity-40 rounded-[40px]">
        <div className="w-20 h-20 rounded-[40px] bg-secondary flex items-center justify-center text-muted-foreground shadow-inner">
          <ChatCircle weight="duotone" className="w-10 h-10" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-foreground uppercase tracking-widest">Support Nominal</h3>
          <p className="text-sm text-muted-foreground font-medium italic max-w-sm mx-auto">
            Zero support tickets match your current operational filters.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {tickets.map((ticket, index) => (
        <motion.div
          key={ticket.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card 
            className="rounded-[32px] border-border/50 hover:border-primary/30 transition-all cursor-pointer group shadow-card hover:shadow-card-hover overflow-hidden"
            onClick={() => onViewTicket(ticket)}
          >
            <CardContent className="p-8">
              <div className="flex items-start justify-between gap-8">
                <div className="flex-1 space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="ghost" className={cn("font-black uppercase text-[8px] tracking-widest px-3 py-1 border", getPriorityColor(ticket.priority))}>
                      {ticket.priority.toUpperCase()} PRIORITY
                    </Badge>
                    <Badge variant="ghost" className={cn("font-black uppercase text-[8px] tracking-widest px-3 py-1 border", getStatusColor(ticket.status))}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {ticket.category && (
                      <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[8px] tracking-widest uppercase px-3 py-1">
                        {ticket.category.replace('_', ' ').toUpperCase()} NODE
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                      {ticket.subject}
                    </h3>
                    <p className="text-muted-foreground text-sm font-medium italic leading-relaxed line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                    <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                        <Buildings weight="bold" className="w-4 h-4 opacity-60" />
                      </div>
                      <span className="truncate">{ticket.clinic_name || 'ANONYMOUS_CLINIC'}</span>
                    </div>
                    
                    {ticket.user && (
                      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                          <User weight="bold" className="w-4 h-4 opacity-60" />
                        </div>
                        <span className="truncate">{ticket.user.full_name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                        <Clock weight="bold" className="w-4 h-4 opacity-60" />
                      </div>
                      <span>{getTimeAgo(ticket.created_at)}</span>
                    </div>

                    {ticket.replies && (
                      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                          <ChatCircle weight="bold" className="w-4 h-4 opacity-60" />
                        </div>
                        <span>{ticket.replies.length} TRANSMISSIONS</span>
                      </div>
                    )}
                  </div>

                  {ticket.assigned_user && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <span className="opacity-60">Assigned Node:</span>
                        <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[9px] px-3 py-1 shadow-inner">
                          {ticket.assigned_user.full_name.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewTicket(ticket);
                    }}
                    className="h-11 w-11 p-0 rounded-2xl border-border/50 hover:bg-secondary text-muted-foreground hover:text-primary transition-all shadow-sm"
                    title="View Protocol"
                  >
                    <Eye weight="bold" className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTicket(ticket);
                    }}
                    className="h-11 w-11 p-0 rounded-2xl border-border/50 hover:bg-secondary text-muted-foreground hover:text-primary transition-all shadow-sm"
                    title="Modify Node"
                  >
                    <PencilSimple weight="bold" className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}