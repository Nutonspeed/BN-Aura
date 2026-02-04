'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SpinnerGap } from '@phosphor-icons/react';
import { SupportProvider, useSupportContext } from './context';
import SupportHeader from './components/SupportHeader';
import SupportStats from './components/SupportStats';
import TicketFilters from './components/TicketFilters';
import SupportTicketTable from './components/SupportTicketTable';
import { SupportTicket } from './types';

function SupportContent() {
  const { loading, tickets, refreshTickets } = useSupportContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    refreshTickets();
  }, [refreshTickets]);

  const handleCreateTicket = () => {
    setShowCreateModal(true);
  };

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const handleEditTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  if (loading && !selectedTicket) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <SupportHeader onCreateTicket={handleCreateTicket} />
      
      <SupportStats />
      
      <TicketFilters />
      
      <SupportTicketTable 
        tickets={tickets || []}
        onTicketSelect={handleViewTicket}
        onTicketEdit={handleEditTicket}
        onTicketDelete={(ticketId) => console.log('Delete ticket:', ticketId)}
        loading={loading}
      />

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 p-8 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Create Support Ticket</h2>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Clinic
                  </label>
                  <select className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="" className="bg-slate-800">Select Clinic</option>
                    <option value="clinic-1" className="bg-slate-800">Bangkok Premium Clinic</option>
                    <option value="clinic-2" className="bg-slate-800">Phuket Beauty Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Priority
                  </label>
                  <select className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="low" className="bg-slate-800">Low</option>
                    <option value="medium" className="bg-slate-800" selected>Medium</option>
                    <option value="high" className="bg-slate-800">High</option>
                    <option value="urgent" className="bg-slate-800">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Category
                </label>
                <select className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="general" className="bg-slate-800" selected>General</option>
                  <option value="technical" className="bg-slate-800">Technical</option>
                  <option value="billing" className="bg-slate-800">Billing</option>
                  <option value="feature_request" className="bg-slate-800">Feature Request</option>
                  <option value="bug_report" className="bg-slate-800">Bug Report</option>
                </select>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Detailed description of the issue or request"
                />
              </div>
            </form>

            <div className="flex items-center gap-4 mt-8">
              <button
                type="button"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all font-medium"
              >
                Create Ticket
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 p-8 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Ticket Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${selectedTicket.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : selectedTicket.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {selectedTicket.priority}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${selectedTicket.status === 'open' ? 'bg-amber-500/20 text-amber-400' : selectedTicket.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {selectedTicket.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">{selectedTicket.subject}</h3>
                <p className="text-white/80">{selectedTicket.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/5 rounded-xl">
                <div>
                  <h4 className="font-medium text-white mb-2">Clinic</h4>
                  <p className="text-white/60">{selectedTicket.clinic?.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Created By</h4>
                  <p className="text-white/60">{selectedTicket.user?.full_name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Created At</h4>
                  <p className="text-white/60">
                    {new Date(selectedTicket.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Assigned To</h4>
                  <p className="text-white/60">
                    {selectedTicket.assigned_user?.full_name || 'Unassigned'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-4">Conversation</h4>
                <div className="space-y-4">
                  {/* Initial message */}
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-white">{selectedTicket.user?.full_name}</span>
                      <span className="text-xs text-white/40">
                        {new Date(selectedTicket.created_at).toLocaleString('th-TH')}
                      </span>
                    </div>
                    <p className="text-white/80">{selectedTicket.description}</p>
                  </div>

                  {/* Replies would go here */}
                  <div className="p-4 bg-primary/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-white">Support Agent</span>
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">ADMIN</span>
                      <span className="text-xs text-white/40">2 hours ago</span>
                    </div>
                    <p className="text-white/80">Thank you for contacting support. We're looking into this issue and will get back to you shortly.</p>
                  </div>
                </div>

                {/* Reply form */}
                <div className="mt-6 p-4 bg-white/5 rounded-xl">
                  <textarea
                    rows={3}
                    className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Type your reply..."
                  />
                  <div className="flex items-center justify-between mt-4">
                    <label className="flex items-center gap-2 text-sm text-white/60">
                      <input type="checkbox" className="rounded" />
                      Internal note (not visible to customer)
                    </label>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all font-medium">
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default function SupportPage() {
  return (
    <SupportProvider>
      <SupportContent />
    </SupportProvider>
  );
}
