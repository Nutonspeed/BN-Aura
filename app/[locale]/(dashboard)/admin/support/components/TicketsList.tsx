'use client';

import { motion } from 'framer-motion';
import { Clock, User, Buildings, ChatCircle, Eye, PencilSimple } from '@phosphor-icons/react';
import { useSupportContext } from '../context';
import { SupportTicket } from '../types';

interface TicketsListProps {
  onViewTicket: (ticket: SupportTicket) => void;
  onEditTicket: (ticket: SupportTicket) => void;
}

export default function TicketsList({ onViewTicket, onEditTicket }: TicketsListProps) {
  const { tickets, loading } = useSupportContext();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-blue-500/20 text-blue-400';
      case 'low': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-amber-500/20 text-amber-400';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      case 'resolved': return 'bg-emerald-500/20 text-emerald-400';
      case 'closed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
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

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return formatDate(dateString);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="glass-card p-6 rounded-2xl border border-white/10">
            <div className="animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-white/10 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="glass-card p-12 rounded-2xl border border-white/10 text-center">
        <ChatCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No tickets found</h3>
        <p className="text-white/60">No support tickets match your current filters.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {tickets.map((ticket, index) => (
        <motion.div
          key={ticket.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="glass-card p-6 rounded-2xl border border-white/10 hover:border-primary/30 transition-all cursor-pointer group"
          onClick={() => onViewTicket(ticket)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                {ticket.category && (
                  <span className="px-2 py-1 rounded-full text-xs font-bold uppercase bg-white/10 text-white/60">
                    {ticket.category.replace('_', ' ')}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
                {ticket.subject}
              </h3>

              <p className="text-white/60 text-sm mb-4 line-clamp-2">
                {ticket.description}
              </p>

              <div className="flex items-center gap-6 text-sm text-white/50">
                <div className="flex items-center gap-2">
                  <Buildings className="w-4 h-4" />
                  <span>{ticket.clinic_name || 'Unknown Clinic'}</span>
                </div>
                
                {ticket.user && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{ticket.user.full_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{getTimeAgo(ticket.created_at)}</span>
                </div>

                {ticket.replies && (
                  <div className="flex items-center gap-2">
                    <ChatCircle className="w-4 h-4" />
                    <span>{ticket.replies.length} replies</span>
                  </div>
                )}
              </div>

              {ticket.assigned_user && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <span>Assigned to:</span>
                    <span className="text-white font-medium">{ticket.assigned_user.full_name}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewTicket(ticket);
                }}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTicket(ticket);
                }}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <PencilSimple className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
