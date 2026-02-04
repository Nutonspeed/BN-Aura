'use client';

import { motion } from 'framer-motion';
import { Trash, PencilSimple, Eye, EyeSlash, CalendarDots, Target, Monitor, Flag, Users, ChartBar } from '@phosphor-icons/react';
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

  if (announcements.length === 0) {
    return (
      <div className="glass-card p-12 rounded-2xl border border-white/10 text-center">
        <Target className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No announcements yet</h3>
        <p className="text-white/60">Create your first announcement to get started</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {announcements.map((announcement, index) => (
        <motion.div
          key={announcement.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getPriorityColor(announcement.priority)}`}>
                  {announcement.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${
                  announcement.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {announcement.is_active ? <Eye className="w-3 h-3" /> : <EyeSlash className="w-3 h-3" />}
                  {announcement.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-bold uppercase bg-white/10 text-white/60 flex items-center gap-1">
                  {getLocationIcon(announcement.display_location)}
                  {announcement.display_location}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{announcement.title}</h3>
              <p className="text-white/60 text-sm mb-4 line-clamp-2">{announcement.content}</p>

              <div className="flex items-center gap-6 text-sm text-white/50 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{getTargetSummary(announcement)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CalendarDots className="w-4 h-4" />
                  <span>
                    {new Date(announcement.start_date) > new Date() 
                      ? `Starts ${formatDate(announcement.start_date)}`
                      : announcement.end_date && new Date(announcement.end_date) < new Date()
                      ? `Ended ${formatDate(announcement.end_date)}`
                      : announcement.end_date
                      ? `Ends ${formatDate(announcement.end_date)}`
                      : `Started ${formatDate(announcement.start_date)}`
                    }
                  </span>
                </div>

                {announcement.read_count !== undefined && (
                  <div className="flex items-center gap-2">
                    <ChartBar className="w-4 h-4" />
                    <span>{announcement.read_count} views</span>
                  </div>
                )}
              </div>

              {/* Schedule Info */}
              <div className="p-3 bg-white/5 rounded-xl">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/40">Start</p>
                    <p className="text-white/80">{formatDate(announcement.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-white/40">End</p>
                    <p className="text-white/80">
                      {announcement.end_date ? formatDate(announcement.end_date) : 'No end date'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="ml-4 flex items-center gap-2">
              <button
                onClick={() => toggleActive(announcement.id)}
                className="p-2 text-white/60 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all"
                title={announcement.is_active ? 'Deactivate' : 'Activate'}
              >
                {announcement.is_active ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              
              <button
                className="p-2 text-white/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                title="Edit"
              >
                <PencilSimple className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleDelete(announcement.id)}
                className="p-2 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                title="Delete"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
