'use client';

import { motion } from 'framer-motion';
import { Trash2, Clock, CheckCircle, XCircle, AlertCircle, Users, Calendar } from 'lucide-react';
import { useBroadcastContext } from '../context';
import { BroadcastMessage } from '../types';

export default function MessagesList() {
  const { messages, loading, deleteMessage } = useBroadcastContext();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      case 'scheduled':
        return 'bg-amber-500/20 text-amber-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(id);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
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

  if (messages.length === 0) {
    return (
      <div className="glass-card p-12 rounded-2xl border border-white/10 text-center">
        <AlertCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No messages sent yet</h3>
        <p className="text-white/60">Your broadcast history will appear here</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(message.status)}
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(message.status)}`}>
                  {message.status}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-bold uppercase bg-white/10 text-white/60">
                  {message.message_type}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{message.title}</h3>
              <p className="text-white/60 text-sm mb-4 line-clamp-2">{message.content}</p>

              <div className="flex items-center gap-6 text-sm text-white/50">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{message.delivery_stats.total} recipients</span>
                </div>
                
                {message.scheduled_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {message.status === 'scheduled' ? 'Scheduled for' : 'Sent at'} {formatDate(message.scheduled_at)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span>Created {formatDate(message.created_at)}</span>
                </div>
              </div>

              {/* Delivery Stats */}
              {message.delivery_stats.total > 0 && (
                <div className="mt-4 p-3 bg-white/5 rounded-xl">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-emerald-400 font-bold">{message.delivery_stats.sent}</p>
                      <p className="text-white/40 text-xs">Sent</p>
                    </div>
                    <div>
                      <p className="text-amber-400 font-bold">{message.delivery_stats.pending}</p>
                      <p className="text-white/40 text-xs">Pending</p>
                    </div>
                    <div>
                      <p className="text-red-400 font-bold">{message.delivery_stats.failed}</p>
                      <p className="text-white/40 text-xs">Failed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => handleDelete(message.id)}
              className="ml-4 p-2 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
