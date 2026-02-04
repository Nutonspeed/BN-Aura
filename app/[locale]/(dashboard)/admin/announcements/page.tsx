'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Megaphone } from '@phosphor-icons/react';
import { AnnouncementProvider, useAnnouncementContext } from './context';
import AnnouncementsHeader from './components/AnnouncementsHeader';
import AnnouncementForm from './components/AnnouncementForm';
import AnnouncementsList from './components/AnnouncementsList';

function AnnouncementsContent() {
  const { fetchAnnouncements, fetchClinics } = useAnnouncementContext();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    fetchClinics();
  }, [fetchAnnouncements, fetchClinics]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <AnnouncementsHeader />
      
      {!showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h2 className="text-2xl font-bold text-white">System Announcements</h2>
            <p className="text-white/60 mt-1">Manage announcements visible to users</p>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Announcement
          </button>
        </motion.div>
      ) : (
        <AnnouncementForm onClose={() => setShowForm(false)} />
      )}
      
      {!showForm && <AnnouncementsList />}
    </motion.div>
  );
}

export default function AnnouncementsPage() {
  return (
    <AnnouncementProvider>
      <AnnouncementsContent />
    </AnnouncementProvider>
  );
}
