'use client';

import { CustomerRelationships } from '@/lib/customer/customerIntelligence';
import { Users, UserCheck, ShareNetwork, ArrowRight } from '@phosphor-icons/react';

interface CustomerRelationshipsViewProps {
  data: CustomerRelationships;
}

export default function CustomerRelationshipsView({ data }: CustomerRelationshipsViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Similar Customers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white">Similar Customers</h3>
        </div>
        
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          {data.similarCustomers.length > 0 ? (
            <div className="divide-y divide-white/10">
              {data.similarCustomers.map((customer) => (
                <div key={customer.id} className="p-3 hover:bg-white/5 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">Match: {customer.similarity}%</p>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg transition-all">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No similar customers found</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Assigned Staff */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white">Assigned Team</h3>
          </div>
          
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            {data.assignedStaff ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-white">{data.assignedStaff.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{data.assignedStaff.role.replace('_', ' ')}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No staff assigned</p>
            )}
          </div>
        </div>

        {/* Referrals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShareNetwork className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white">Referral Network</h3>
          </div>
          
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            {data.referrals.length > 0 ? (
              <div className="divide-y divide-white/10">
                {data.referrals.map((referral) => (
                  <div key={referral.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                        {referral.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{referral.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(referral.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-white/10 text-muted-foreground">
                      {referral.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">No referrals yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}