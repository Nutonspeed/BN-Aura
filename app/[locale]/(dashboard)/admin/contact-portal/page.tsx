'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChatCircle, Users, EnvelopeSimple, Phone, Clock, Funnel, MagnifyingGlass, ArrowUpRight } from '@phosphor-icons/react';

export default function ContactPortalPage() {
  const [activeTab, setActiveTab] = useState('messages');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Contact Portal</h1>
            <p className="text-muted-foreground mt-2">Manage customer communications and support requests</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-xl p-1">
          {[
            { id: 'messages', label: 'Messages', icon: MessageSquare },
            { id: 'contacts', label: 'Contacts', icon: Users },
            { id: 'support', label: 'Support', icon: Phone }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-semibold text-white mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Unread</span>
                  <span className="text-sm font-medium text-white">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <span className="text-sm font-medium text-white">45</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="text-sm font-medium text-white">128</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 rounded-xl border border-white/10 min-h-[500px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white">Contact Portal</h3>
                <p className="text-muted-foreground max-w-sm">
                  Customer communication hub will be implemented here. 
                  This includes messaging, contact management, and support ticket system.
                </p>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
