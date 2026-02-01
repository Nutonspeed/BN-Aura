'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BroadcastProvider, useBroadcastContext } from './context';
import BroadcastHeader from './components/BroadcastHeader';
import ComposeMessage from './components/ComposeMessage';
import MessagesList from './components/MessagesList';

function BroadcastContent() {
  const { fetchMessages, fetchClinics } = useBroadcastContext();

  useEffect(() => {
    fetchMessages();
    fetchClinics();
  }, [fetchMessages, fetchClinics]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <BroadcastHeader />
      
      <ComposeMessage />
      
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Message History</h2>
        <MessagesList />
      </div>
    </motion.div>
  );
}

export default function BroadcastPage() {
  return (
    <BroadcastProvider>
      <BroadcastContent />
    </BroadcastProvider>
  );
}
