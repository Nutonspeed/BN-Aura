'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Branch {
  id: string;
  branch_name: string;
  branch_code: string;
}

export default function BranchSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch('/api/branches');
      const result = await res.json();
      if (result.success) {
        setBranches(result.data || []);
        
        // Initialize from localStorage or default to first branch
        const savedBranchId = localStorage.getItem('selected_branch_id');
        if (savedBranchId) {
          const found = result.data.find((b: Branch) => b.id === savedBranchId);
          if (found) setSelectedBranch(found);
          else if (result.data.length > 0) setSelectedBranch(result.data[0]);
        } else if (result.data.length > 0) {
          setSelectedBranch(result.data[0]);
          localStorage.setItem('selected_branch_id', result.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching branches for switcher:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    localStorage.setItem('selected_branch_id', branch.id);
    setIsOpen(false);
    // Reload or notify app of branch change
    window.dispatchEvent(new Event('branch_changed'));
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  if (branches.length <= 1 && !selectedBranch) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="text-left hidden md:block">
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Operational Node</p>
          <p className="text-xs font-bold text-white leading-none">
            {selectedBranch?.branch_name || 'Select Branch'}
          </p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-64 bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-2xl p-2 z-50 overflow-hidden"
            >
              <div className="p-3 mb-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Switch Branch Cluster</p>
              </div>
              <div className="space-y-1">
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => handleSelect(branch)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl transition-all group",
                      selectedBranch?.id === branch.id 
                        ? "bg-primary text-primary-foreground shadow-glow-sm" 
                        : "hover:bg-white/5 text-muted-foreground hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                        selectedBranch?.id === branch.id ? "bg-white/20 border-white/20" : "bg-white/5 border-white/5 group-hover:border-primary/30"
                      )}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold truncate max-w-[120px]">{branch.branch_name}</p>
                        <p className={cn(
                          "text-[9px] font-medium opacity-60",
                          selectedBranch?.id === branch.id ? "text-white" : "text-muted-foreground"
                        )}>{branch.branch_code}</p>
                      </div>
                    </div>
                    {selectedBranch?.id === branch.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
