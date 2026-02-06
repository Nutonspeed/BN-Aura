'use client';

import { TimelineEvent } from '@/lib/customer/customerIntelligence';
import { 
  ChatCircle, 
  CalendarDots, 
  ShoppingBag, 
  ArrowRight,
  CheckCircle,
  WarningCircle
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface CustomerTimelineViewProps {
  events: TimelineEvent[];
}

export default function CustomerTimelineView({ events }: CustomerTimelineViewProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
          <CalendarDots className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No timeline events found</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'conversation':
        return <ChatCircle className="w-4 h-4 text-blue-400" />;
      case 'appointment':
        return <CalendarDots className="w-4 h-4 text-purple-400" />;
      case 'purchase':
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'status_change':
        return <ArrowRight className="w-4 h-4 text-yellow-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'conversation':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'appointment':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'purchase':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'status_change':
        return 'bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6 relative pl-4">
      {/* Vertical Line */}
      <div className="absolute left-[19px] top-2 bottom-4 w-px bg-white/10" />

      {events.map((event, index) => (
        <div key={event.id} className="relative flex gap-4 group">
          {/* Dot */}
          <div className={`
            relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0
            bg-slate-900 border border-white/10 shadow-lg group-hover:scale-110 transition-transform
          `}>
            {getIcon(event.type)}
          </div>

          {/* Content Card */}
          <div className={`flex-1 p-4 rounded-xl border ${getBgColor(event.type)} hover:bg-white/5 transition-colors`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">
                {format(new Date(event.date), 'd MMM yyyy HH:mm', { locale: th })}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-black/20 text-muted-foreground">
                {event.type}
              </span>
            </div>
            
            <h4 className="text-sm font-bold text-white mb-1">{event.title}</h4>
            <p className="text-sm text-muted-foreground mb-3">{event.description}</p>

            {/* Metadata */}
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/5">
                {event.metadata.price && (
                  <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">
                    ฿{Number(event.metadata.price).toLocaleString()}
                  </span>
                )}
                {event.metadata.sentiment && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    event.metadata.sentiment.score > 0.5 ? 'bg-green-500/10 text-green-400' : 
                    event.metadata.sentiment.score < -0.5 ? 'bg-red-500/10 text-red-400' : 
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    Sentiment: {event.metadata.sentiment.label}
                  </span>
                )}
                {event.metadata.dealProbability !== undefined && event.metadata.dealProbability !== null && (
                  <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400">
                    Prob: {event.metadata.dealProbability}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}