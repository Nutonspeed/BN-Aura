'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Trash,
  Clock,
  CheckCircle,
  XCircle,
  WarningCircle,
  Users,
  CalendarDots,
  SpinnerGap
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
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
        return <WarningCircle className="w-4 h-4 text-gray-400" />;
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
      <div className="space-y-6">
        {[...Array(3)].map((_, index) => (
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
                <div className="h-20 bg-secondary/50 rounded-2xl w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-8 opacity-40 rounded-[40px]">
        <div className="w-20 h-20 rounded-[40px] bg-secondary flex items-center justify-center text-muted-foreground shadow-inner">
          <WarningCircle weight="duotone" className="w-10 h-10" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-foreground uppercase tracking-widest">Archive Nominal</h3>
          <p className="text-sm text-muted-foreground font-medium italic max-w-sm mx-auto">
            Your broadcast transmission history will manifest here once initialized.
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
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="rounded-[32px] border-border/50 hover:border-primary/30 transition-all group overflow-hidden shadow-card hover:shadow-card-hover">
            <CardContent className="p-8">
              <div className="flex items-start justify-between gap-8">
                <div className="flex-1 space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 rounded-lg">
                      {getStatusIcon(message.status)}
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", 
                        message.status === 'sent' ? 'text-emerald-500' : 
                        message.status === 'failed' ? 'text-rose-500' : 
                        'text-amber-500'
                      )}>
                        {message.status}
                      </span>
                    </div>
                    <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[8px] tracking-widest uppercase px-3">
                      {message.message_type} NODE
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{message.title}</h3>
                    <p className="text-muted-foreground text-sm font-medium italic leading-relaxed line-clamp-2">{message.content}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Users weight="bold" className="w-4 h-4 opacity-60" />
                        <span>{message.delivery_stats.total} RECIPIENTS</span>
                      </div>
                      
                      {message.scheduled_at && (
                        <div className="flex items-center gap-2">
                          <CalendarDots weight="bold" className="w-4 h-4 opacity-60" />
                          <span>
                            {message.status === 'scheduled' ? 'PLAN:' : 'SENT:'} {formatDate(message.scheduled_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest md:justify-end">
                      <Clock weight="bold" className="w-3.5 h-3.5 opacity-40" />
                      INITIALIZED: {formatDate(message.created_at)}
                    </div>
                  </div>

                  {/* Delivery Stats Node */}
                  {message.delivery_stats.total > 0 && (
                    <div className="p-5 bg-secondary/30 rounded-2xl border border-border/50 shadow-inner">
                      <div className="grid grid-cols-3 gap-8 text-center">
                        <div className="space-y-1">
                          <p className="text-xl font-black text-emerald-500 tabular-nums">{message.delivery_stats.sent}</p>
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Success</p>
                        </div>
                        <div className="space-y-1 border-x border-border/30">
                          <p className="text-xl font-black text-amber-500 tabular-nums">{message.delivery_stats.pending}</p>
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Pending</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-black text-rose-500 tabular-nums">{message.delivery_stats.failed}</p>
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Exception</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(message.id)}
                  className="h-11 w-11 p-0 rounded-2xl border-border/50 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 transition-all shrink-0"
                  title="Purge Node"
                >
                  <Trash weight="bold" className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
