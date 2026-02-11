'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Buildings,
  Plus,
  MagnifyingGlass,
  MapPin,
  Phone,
  PencilSimple,
  Trash,
  DotsThreeVertical,
  SpinnerGap,
  CheckCircle,
  Clock,
  SquaresFour,
  MapTrifold,
  ArrowLeft,
  CaretRight,
  ChartBar,
  TrendUp,
  Wallet,
  Users,
  CalendarDots
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';
import BranchModal from '@/components/BranchModal';

interface Branch {
  id: string;
  branch_name: string;
  branch_code: string;
  address: string;
  city: string;
  province: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

function BranchManagementContent() {
  const { goBack } = useBackNavigation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'manage' | 'compare'>('manage');
  const [comparison, setComparison] = useState<any[]>([]);
  const [compTotals, setCompTotals] = useState<any>(null);
  const [compLoading, setCompLoading] = useState(false);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/branches');
      const result = await res.json();
      if (result.success) {
        setBranches(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleAddBranch = () => {
    setSelectedBranch(undefined);
    setIsModalOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยุติโหนดสาขานี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
    
    try {
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchBranches();
      }
    } catch (err) {
      console.error('Error deleting branch:', err);
    }
  };

  const filteredBranches = branches.filter(branch => 
    branch.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.branch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />
      
      <BranchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBranches}
        branch={selectedBranch}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Buildings weight="duotone" className="w-4 h-4" />
            โหนดขยายคลินิก
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight"
          >
            การ<span className="text-primary">จัดการสาขา</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            จัดการกลุ่มการดำเนินงานหลายภูมิภาคและโมดูลการตรวจสอบภูมิภาค
          </motion.p>
        </div>

        <Button 
          onClick={handleAddBranch}
          className="gap-2 shadow-premium px-8"
        >
          <Plus weight="bold" className="w-4 h-4" />
          เริ่มต้นสาขา
        </Button>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('manage')} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all', activeTab === 'manage' ? 'bg-primary text-white shadow-md' : 'bg-secondary text-muted-foreground hover:bg-accent')}>
          <Buildings weight="duotone" className="w-4 h-4" /> จัดการสาขา
        </button>
        <button onClick={() => setActiveTab('compare')} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all', activeTab === 'compare' ? 'bg-primary text-white shadow-md' : 'bg-secondary text-muted-foreground hover:bg-accent')}>
          <ChartBar weight="duotone" className="w-4 h-4" /> เปรียบเทียบผลงาน
        </button>
      </div>

      {activeTab === 'manage' && (<>
      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="กรองตามชื่อสาขา รหัส หรือเมือง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-2xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
            />
          </div>
        </div>
        
        <StatCard
          title="กลุ่มที่ใช้งาน"
          value={branches.length}
          icon={SquaresFour}
          trend="neutral"
          className="p-4"
        />
      </div>

      {/* Branch Grid */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">กำลังซิงโครไนซ์กริดขยาย...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredBranches.map((branch, i) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full border-border/50 hover:border-primary/30 transition-all group overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <MapTrifold className="w-32 h-32 text-primary" />
                  </div>

                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all duration-500 shadow-sm">
                          <Buildings weight="duotone" className="w-7 h-7" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="ghost" size="sm" className="font-mono text-[9px] px-2 py-0.5 border-none bg-primary/5 text-primary">{branch.branch_code}</Badge>
                            <Badge variant={branch.is_active ? 'success' : 'secondary'} size="sm" className="font-black uppercase text-[8px] tracking-widest">
                              {branch.is_active ? 'ใช้งาน' : 'ออฟไลน์'}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl font-bold tracking-tight truncate">{branch.branch_name}</CardTitle>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditBranch(branch)}
                          className="p-2 h-9 w-9 text-muted-foreground hover:text-primary"
                        >
                          <PencilSimple weight="bold" className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteBranch(branch.id)}
                          className="p-2 h-9 w-9 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5"
                        >
                          <Trash weight="bold" className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-6 relative z-10 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-2xl border border-border/50 group-hover:border-primary/20 transition-all">
                        <MapPin weight="duotone" className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground/70 font-medium leading-relaxed italic">
                          {branch.address}, {branch.city}, {branch.province}
                        </p>
                      </div>
                      {branch.phone && (
                        <div className="flex items-center gap-3 px-4 py-2">
                          <Phone weight="duotone" className="w-4 h-4 text-primary/60 shrink-0" />
                          <p className="text-sm text-foreground font-bold tabular-nums">{branch.phone}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <Clock weight="bold" className="w-3.5 h-3.5 opacity-60" />
                        สร้างเมื่อ: {new Date(branch.created_at).toLocaleDateString()}
                      </div>
                      <Button variant="ghost" size="sm" className="text-primary font-black uppercase text-[10px] tracking-widest gap-2">
                        ดูโหนด <CaretRight weight="bold" className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {filteredBranches.length === 0 && !loading && (
              <Card variant="ghost" className="col-span-full py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-4 opacity-40">
                <Buildings weight="duotone" className="w-16 h-16" />
                <p className="text-xs font-black uppercase tracking-widest">ไม่พบกลุ่มที่ใช้งาน</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </>)}

      {/* Branch Comparison Tab */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          {compLoading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">กำลังโหลดข้อมูลเปรียบเทียบ...</p>
            </div>
          ) : comparison.length === 0 ? (
            <Card className="py-20 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-4 opacity-40 rounded-2xl">
              <ChartBar weight="duotone" className="w-16 h-16" />
              <p className="text-xs font-black uppercase tracking-widest">ยังไม่มีข้อมูลเปรียบเทียบ</p>
            </Card>
          ) : (<>
            {compTotals && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 rounded-2xl border-border/50">
                  <div className="flex items-center gap-2 mb-1"><Wallet weight="duotone" className="w-4 h-4 text-emerald-500" /><p className="text-xs text-muted-foreground uppercase tracking-widest">รายได้รวม</p></div>
                  <p className="text-2xl font-black text-emerald-500">฿{compTotals.totalRevenue?.toLocaleString()}</p>
                </Card>
                <Card className="p-5 rounded-2xl border-border/50">
                  <div className="flex items-center gap-2 mb-1"><TrendUp weight="duotone" className="w-4 h-4 text-blue-500" /><p className="text-xs text-muted-foreground uppercase tracking-widest">ธุรกรรม</p></div>
                  <p className="text-2xl font-black text-blue-500">{compTotals.totalTransactions?.toLocaleString()}</p>
                </Card>
                <Card className="p-5 rounded-2xl border-border/50">
                  <div className="flex items-center gap-2 mb-1"><CalendarDots weight="duotone" className="w-4 h-4 text-purple-500" /><p className="text-xs text-muted-foreground uppercase tracking-widest">นัดหมาย</p></div>
                  <p className="text-2xl font-black text-purple-500">{compTotals.totalAppointments?.toLocaleString()}</p>
                </Card>
                <Card className="p-5 rounded-2xl border-border/50">
                  <div className="flex items-center gap-2 mb-1"><Users weight="duotone" className="w-4 h-4 text-amber-500" /><p className="text-xs text-muted-foreground uppercase tracking-widest">พนักงาน</p></div>
                  <p className="text-2xl font-black text-amber-500">{compTotals.totalStaff}</p>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {comparison.map((b: any, i: number) => (
                <motion.div key={b.branchId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="rounded-2xl border-border/50 overflow-hidden hover:shadow-md transition-all">
                    <div className="p-5 border-b border-border/50 bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">#{b.rank}</div>
                        <div>
                          <p className="font-bold text-sm">{b.branchName}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{b.address}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-center"><span className="text-xs text-muted-foreground">รายได้</span><span className="font-black text-emerald-500">฿{b.metrics.revenue?.toLocaleString()}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-muted-foreground">ธุรกรรม</span><span className="font-bold">{b.metrics.transactionCount}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-muted-foreground">เฉลี่ย/รายการ</span><span className="font-bold">฿{b.metrics.avgTransactionValue?.toLocaleString()}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-muted-foreground">นัดหมาย</span><span className="font-bold">{b.metrics.appointmentCount}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-muted-foreground">อัตราสำเร็จ</span><span className="font-bold">{b.metrics.completionRate}%</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-muted-foreground">พนักงาน</span><span className="font-bold">{b.metrics.staffCount}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-muted-foreground">รายได้/พนักงาน</span><span className="font-bold text-blue-500">฿{b.metrics.revenuePerStaff?.toLocaleString()}</span></div>
                    </div>
                    {comparison[0] && comparison[0].metrics.revenue > 0 && (
                      <div className="px-5 pb-5">
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(b.metrics.revenue / comparison[0].metrics.revenue) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </>)}
        </div>
      )}

    </motion.div>
  );
}

export default function BranchManagement() {
  return (
    <Suspense fallback={
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">กำลังเริ่มต้นกริดขยาย...</p>
      </div>
    }>
      <BranchManagementContent />
    </Suspense>
  );
}
