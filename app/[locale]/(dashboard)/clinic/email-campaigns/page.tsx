'use client';

import { useState, useEffect } from 'react';
import { 
  EnvelopeSimple, 
  Plus, 
  PaperPlaneTilt, 
  Clock, 
  Eye, 
  Users, 
  TrendUp,
  ArrowLeft,
  CaretRight,
  ChartBar,
  WarningCircle,
  CheckCircle,
  Megaphone,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
}

export default function EmailCampaignsPage() {
  const { goBack } = useBackNavigation();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getStatusStyle = (s: string) => {
    if (s === 'sent') return 'bg-green-100 text-green-700';
    if (s === 'scheduled') return 'bg-blue-100 text-blue-700';
    if (s === 'sending') return 'bg-yellow-100 text-yellow-700';
    if (s === 'draft') return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (s: string) => {
    if (s === 'sent') return 'ส่งแล้ว';
    if (s === 'scheduled') return 'กำหนดเวลา';
    if (s === 'sending') return 'กำลังส่ง';
    if (s === 'draft') return 'ร่าง';
    return s;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Megaphone weight="duotone" className="w-4 h-4" />
            Marketing Operations Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight"
          >
            Email <span className="text-primary">Campaigns</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating targeted clinical outreach and automated engagement cycles.
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchData}
            disabled={loading}
            className="gap-2"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Intel
          </Button>
          <Button 
            onClick={() => setShowCreate(true)}
            className="gap-2 shadow-premium px-8"
          >
            <Plus weight="bold" className="w-4 h-4" />
            Initiate Campaign
          </Button>
        </div>
      </div>

      {/* Campaign Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Campaigns"
          value={campaigns.length}
          icon={EnvelopeSimple}
          trend="neutral"
        />
        <StatCard
          title="Nodes Transmitted"
          value={campaigns.filter(c => c.status === 'sent').length}
          icon={PaperPlaneTilt}
          trend="up"
          change={12}
          iconColor="text-emerald-500"
        />
        <StatCard
          title="Scheduled Cycles"
          value={campaigns.filter(c => c.status === 'scheduled').length}
          icon={Clock}
          trend="neutral"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Draft Node Count"
          value={campaigns.filter(c => c.status === 'draft').length}
          icon={Eye}
          trend="neutral"
          iconColor="text-muted-foreground"
        />
      </div>

      {/* Campaigns Grid */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Syncing Campaign Matrix...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-4 opacity-40">
            <EnvelopeSimple weight="duotone" className="w-16 h-16" />
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-widest mb-2">Zero Marketing Signals Detected</p>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(true)} className="text-primary font-bold uppercase tracking-widest">Initialize First Node</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign, i) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full border-border/50 hover:border-primary/30 transition-all group overflow-hidden flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all duration-500">
                          <EnvelopeSimple weight="duotone" className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="truncate tracking-tight text-lg">{campaign.name}</CardTitle>
                          <Badge variant={campaign.status === 'sent' ? 'success' : campaign.status === 'scheduled' ? 'default' : 'secondary'} size="sm" className="font-black uppercase tracking-widest mt-1">
                            {getStatusLabel(campaign.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-6">
                    <p className="text-sm text-foreground/70 line-clamp-2 font-medium bg-secondary/30 p-4 rounded-2xl border border-border/50">
                      "{campaign.subject}"
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <Clock weight="bold" className="w-3.5 h-3.5" />
                        {formatDate(campaign.created_at)}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="p-2 text-muted-foreground hover:text-primary">
                          Edit
                        </Button>
                        {campaign.status === 'draft' && (
                          <Button variant="ghost" size="sm" className="p-2 text-emerald-500 hover:bg-emerald-500/5">
                            Send
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card p-8 rounded-[32px] border border-border shadow-premium w-full max-w-lg relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Plus weight="bold" className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">New Marketing Node</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Initialize outreach protocol</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCreate(false)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
                >
                  <X weight="bold" className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={async e => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                await fetch('/api/email-campaigns', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: fd.get('name'),
                    subject: fd.get('subject'),
                    contentHtml: `<p>${fd.get('content')}</p>`
                  })
                });
                setShowCreate(false);
                fetchData();
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Campaign Node Identity</label>
                  <input name="name" required className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-5 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium placeholder:text-muted-foreground/40" placeholder="e.g. VIP Re-engagement Cycle" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Transmission Subject</label>
                  <input name="subject" required className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-5 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium placeholder:text-muted-foreground/40" placeholder="Identity-validated subject line" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Payload Content</label>
                  <textarea name="content" rows={4} required className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-5 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium placeholder:text-muted-foreground/40 resize-none" placeholder="HTML or text-based transmission content..." />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
                  <Button type="submit" className="w-full sm:w-auto px-10 py-4 shadow-premium">
                    Authorize Node
                  </Button>
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => setShowCreate(false)}
                    className="w-full sm:w-auto text-xs font-black uppercase tracking-widest text-muted-foreground"
                  >
                    Abort
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
