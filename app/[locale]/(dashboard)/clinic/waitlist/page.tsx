'use client';

import { 
  Clock,
  User,
  Phone,
  Bell,
  Check,
  X,
  Plus,
  MagnifyingGlass,
  ArrowLeft,
  ArrowsClockwise,
  CheckCircle,
  WarningCircle,
  UserList,
  CaretRight,
  ClockCounterClockwise,
  CalendarDots,
  TrendUp
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';
import { Link, useRouter } from '@/i18n/routing';
import ResponsiveTable from '@/components/ui/ResponsiveTable';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WaitlistEntry {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  customer?: { full_name: string; phone: string };
  service?: { name: { th: string } };
  preferred_dates: string[];
  preferred_time_range: { start: string; end: string };
  priority: number;
  status: string;
  notified_count: number;
  created_at: string;
}

export default function WaitlistPage() {
  const { goBack } = useBackNavigation();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('waiting');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/waitlist?status=${filter}`);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { 
    fetchData(); 
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/waitlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId: id, status })
    });
    fetchData();
  };

  const notify = async () => {
    if (!selected.length) return;
    await fetch('/api/waitlist/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryIds: selected,
        availableSlot: { date: new Date().toISOString().split('T')[0], time: '14:00' }
      })
    });
    setSelected([]);
    fetchData();
  };

  const filtered = entries.filter(e => {
    const name = e.customer?.full_name || e.customer_name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const getStatusStyle = (s: string) => {
    if (s === 'waiting') return 'bg-blue-500/10 text-blue-500';
    if (s === 'notified') return 'bg-amber-500/10 text-amber-500';
    if (s === 'converted') return 'bg-emerald-500/10 text-emerald-500';
    return 'bg-secondary text-muted-foreground';
  };

  const columns = [
    {
      header: '',
      className: 'w-12',
      accessor: (entry: WaitlistEntry) => (
        entry.status === 'waiting' ? (
          <input
            type="checkbox"
            checked={selected.includes(entry.id)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (e.target.checked) {
                setSelected([...selected, entry.id]);
              } else {
                setSelected(selected.filter(id => id !== entry.id));
              }
            }}
            className="rounded border-border bg-secondary text-primary focus:ring-primary"
          />
        ) : null
      )
    },
    {
      header: 'ลูกค้า',
      accessor: (entry: WaitlistEntry) => (
        <div>
          <p className="font-bold text-foreground">{entry.customer?.full_name || entry.customer_name}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
            <Phone className="w-3 h-3 text-primary/60" /> {entry.customer?.phone || entry.customer_phone}
          </p>
        </div>
      )
    },
    {
      header: 'บริการ',
      accessor: (entry: WaitlistEntry) => (
        <span className="text-sm font-medium text-foreground">{entry.service?.name?.th || '-'}</span>
      )
    },
    {
      header: 'ลำดับ',
      accessor: (entry: WaitlistEntry) => (
        <span className={cn(
          "px-2 py-1 rounded text-xs font-bold tabular-nums",
          entry.priority <= 3 ? "bg-rose-500/10 text-rose-500" : "bg-secondary text-muted-foreground"
        )}>
          #{entry.priority}
        </span>
      )
    },
    {
      header: 'สถานะ',
      accessor: (entry: WaitlistEntry) => (
        <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusStyle(entry.status))}>
          {entry.status === 'waiting' ? 'รอคิว' : entry.status === 'notified' ? 'แจ้งแล้ว' : 'จองแล้ว'}
        </span>
      )
    },
    {
      header: '',
      className: 'text-right',
      accessor: (entry: WaitlistEntry) => (
        entry.status === 'waiting' && (
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => updateStatus(entry.id, 'converted')} 
              className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all border border-transparent hover:border-emerald-500/20"
              title="จองสำเร็จ"
            >
              <Check className="w-4 h-4 stroke-[3px]" />
            </button>
            <button 
              onClick={() => updateStatus(entry.id, 'cancelled')} 
              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/20"
              title="ยกเลิก"
            >
              <X className="w-4 h-4 stroke-[3px]" />
            </button>
          </div>
        )
      )
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Clock weight="duotone" className="w-4 h-4" />
            Temporal Queue registry
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Clinic <span className="text-primary">Waitlist</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            จัดการรายชื่อรอและลำดับความสำคัญของลูกค้า
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {selected.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
              >
                <Button 
                  onClick={notify}
                  className="bg-amber-500 hover:bg-amber-600 text-white gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium"
                >
                  <Bell weight="bold" className="w-4 h-4" />
                  Dispatch Notice ({selected.length})
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <Button 
            variant="outline"
            onClick={fetchData}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            อัปเดต
          </Button>
          <Button className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium">
            <Plus weight="bold" className="w-4 h-4" />
            เพิ่มรายชื่อ
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="Waiting Nodes"
          value={entries.filter(e => e.status === 'waiting').length}
          icon={Clock}
          className="p-4"
        />
        <StatCard
          title="Notified Identities"
          value={entries.filter(e => e.status === 'notified').length}
          icon={Bell}
          iconColor="text-amber-500"
          className="p-4"
        />
        <StatCard
          title="Converted Cycles"
          value={entries.filter(e => e.status === 'converted').length}
          icon={CheckCircle}
          iconColor="text-emerald-500"
          className="p-4"
        />
        <StatCard
          title="Conversion Velocity"
          value={entries.length ? Math.round((entries.filter(e => e.status === 'converted').length / entries.length) * 100) : 0}
          suffix="%"
          icon={TrendUp}
          iconColor="text-primary"
          className="p-4"
        />
      </div>

      {/* Search & Filters */}
      <div className="px-2">
        <Card className="p-6 rounded-[32px] border-border/50 shadow-card">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Query identity node name or registry phone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
              />
            </div>
            <div className="flex bg-secondary/50 border border-border/50 p-1.5 rounded-[20px] w-fit shadow-inner">
              {[
                { id: 'waiting', label: 'Queued', icon: Clock },
                { id: 'notified', label: 'Notified', icon: Bell },
                { id: 'converted', label: 'Sealed', icon: CheckCircle }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap flex items-center gap-2",
                    filter === f.id
                      ? "bg-primary text-primary-foreground border-primary shadow-premium"
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <f.icon weight={filter === f.id ? "fill" : "bold"} className="w-3.5 h-3.5" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Waitlist Registry Table */}
      <div className="px-2">
        <Card className="rounded-[40px] border-border/50 overflow-hidden shadow-premium">
          <ResponsiveTable
            columns={columns}
            data={filtered}
            loading={loading}
            rowKey={(e) => e.id}
            emptyMessage="Zero temporal waiting nodes detected in current matrix."
            mobileCard={(entry) => (
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    {entry.status === 'waiting' && (
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selected.includes(entry.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelected([...selected, entry.id]);
                            else setSelected(selected.filter(id => id !== entry.id));
                          }}
                          className="peer sr-only"
                        />
                        <div className="w-6 h-6 bg-secondary border-2 border-border/50 rounded-lg transition-all peer-checked:bg-primary peer-checked:border-primary shadow-inner" />
                        <Check weight="bold" className="absolute w-3.5 h-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                      <User weight="duotone" className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate uppercase tracking-tight">{entry.customer?.full_name || entry.customer_name}</p>
                      <p className="text-[10px] font-black text-muted-foreground truncate uppercase tracking-widest flex items-center gap-2">
                        <Phone weight="bold" className="w-3 h-3" />
                        {entry.customer?.phone || entry.customer_phone}
                      </p>
                    </div>
                  </div>
                  <Badge variant={entry.status === 'waiting' ? 'default' : entry.status === 'notified' ? 'warning' : 'success'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-3">
                    {entry.status === 'waiting' ? 'QUEUED' : entry.status === 'notified' ? 'NOTIFIED' : 'SEALED'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6 py-4 border-y border-border/50">
                  <div>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Target Protocol</p>
                    <p className="text-xs font-bold text-foreground truncate uppercase">{entry.service?.name?.th || 'General Service'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Priority Index</p>
                    <Badge variant={entry.priority <= 3 ? 'destructive' : 'secondary'} size="sm" className="font-black text-[10px] tabular-nums">
                      #{entry.priority}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <ClockCounterClockwise weight="bold" className="w-3.5 h-3.5 opacity-60" />
                    Registry: {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                  {entry.status === 'waiting' && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => updateStatus(entry.id, 'converted')} 
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 border-border/50 rounded-xl text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/20"
                      >
                        <Check weight="bold" className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => updateStatus(entry.id, 'cancelled')} 
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 border-border/50 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20"
                      >
                        <X weight="bold" className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          />
        </Card>
      </div>
    </motion.div>
  );
}
