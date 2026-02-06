'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash, PencilSimple, Eye, EyeSlash, CalendarDots, Target, Monitor, Flag, Users, ChartBar, SpinnerGap } from '@phosphor-icons/react';
import { useAnnouncementContext } from '../context';
import { Announcement } from '../types';

export default function AnnouncementsList() {
  const { announcements, loading, deleteAnnouncement, toggleActive } = useAnnouncementContext();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400';
      case 'normal':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'banner':
        return <Monitor className="w-4 h-4" />;
      case 'modal':
        return <Eye className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
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

  const getTargetSummary = (announcement: Announcement) => {
    const { target_audience } = announcement;
    const parts = [];
    
    if (target_audience.roles.length > 0) {
      parts.push(`${target_audience.roles.length} roles`);
    }
    if (target_audience.plans.length > 0) {
      parts.push(`${target_audience.plans.length} plans`);
    }
    if (target_audience.clinics.length > 0) {
      parts.push(`${target_audience.clinics.length} clinics`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'All users';
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteAnnouncement(id);
      } catch (error) {
        console.error('Failed to delete announcement:', error);
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

  if (announcements.length === 0) {
    return (
      <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-8 opacity-40 rounded-[40px]">
        <div className="w-20 h-20 rounded-[40px] bg-secondary flex items-center justify-center text-muted-foreground shadow-inner">
          <Target weight="duotone" className="w-10 h-10" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-foreground uppercase tracking-widest">Registry Nominal</h3>
          <p className="text-sm text-muted-foreground font-medium italic max-w-sm mx-auto">
            No system broadcasts established in current operational registry.
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
      {announcements.map((announcement, index) => (
        <motion.div
          key={announcement.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="rounded-[32px] border-border/50 hover:border-primary/30 transition-all group overflow-hidden shadow-card hover:shadow-card-hover">
            <CardContent className="p-8">
              <div className="flex items-start justify-between gap-8">
                <div className="flex-1 space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={announcement.priority === 'high' ? 'destructive' : announcement.priority === 'normal' ? 'warning' : 'secondary'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-3 py-1">
                      {announcement.priority} PRIORITY
                    </Badge>
                    <Badge variant={announcement.is_active ? 'success' : 'secondary'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-3 py-1 gap-1.5">
                      {announcement.is_active ? <Eye weight="bold" className="w-3 h-3" /> : <EyeSlash weight="bold" className="w-3 h-3" />}
                      {announcement.is_active ? 'OPERATIONAL' : 'OFFLINE'}
                    </Badge>
                    <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[8px] tracking-widest uppercase px-3 py-1 gap-1.5">
                      {getLocationIcon(announcement.display_location)}
                      {announcement.display_location} NODE
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{announcement.title}</h3>
                    <p className="text-muted-foreground text-sm font-medium italic leading-relaxed line-clamp-2">{announcement.content}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                        <Users weight="bold" className="w-4 h-4 opacity-60" />
                      </div>
                      <span>{getTargetSummary(announcement)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                        <CalendarDots weight="bold" className="w-4 h-4 opacity-60" />
                      </div>
                      <span>
                        {new Date(announcement.start_date) > new Date() 
                          ? `INITIALIZING: ${formatDate(announcement.start_date)}` 
                          : announcement.end_date && new Date(announcement.end_date) < new Date() 
                          ? `ARCHIVED: ${formatDate(announcement.end_date)}` 
                          : announcement.end_date 
                          ? `EXPIRING: ${formatDate(announcement.end_date)}` 
                          : `ESTABLISHED: ${formatDate(announcement.start_date)}` 
                        }
                      </span>
                    </div>

                    {announcement.read_count !== undefined && (
                      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                          <ChartBar weight="bold" className="w-4 h-4 opacity-60" />
                        </div>
                        <span>{announcement.read_count} NODE_VIEWS</span>
                      </div>
                    )}
                  </div>

                  {/* Schedule Node Info */}
                  <div className="p-5 bg-secondary/30 rounded-2xl border border-border/50 shadow-inner">
                    <div className="grid grid-cols-2 gap-8 text-[10px] font-black uppercase tracking-widest">
                      <div className="space-y-1">
                        <p className="text-muted-foreground opacity-60">Transmission Start</p>
                        <p className="text-foreground">{formatDate(announcement.start_date)}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-muted-foreground opacity-60">Lifecycle End</p>
                        <p className="text-foreground">
                          {announcement.end_date ? formatDate(announcement.end_date) : 'PERPETUAL_NODE'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(announcement.id)}
                    className="h-11 w-11 p-0 rounded-2xl border-border/50 hover:bg-secondary text-muted-foreground hover:text-amber-500 transition-all"
                    title={announcement.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {announcement.is_active ? <EyeSlash weight="bold" className="w-5 h-5" /> : <Eye weight="bold" className="w-5 h-5" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 w-11 p-0 rounded-2xl border-border/50 hover:bg-secondary text-muted-foreground hover:text-primary transition-all"
                    title="Modify Protocol"
                  >
                    <PencilSimple weight="bold" className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(announcement.id)}
                    className="h-11 w-11 p-0 rounded-2xl border-border/50 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 transition-all"
                    title="Delete Node"
                  >
                    <Trash weight="bold" className="w-5 h-5" />
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
