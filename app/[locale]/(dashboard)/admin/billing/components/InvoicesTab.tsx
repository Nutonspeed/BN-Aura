import { 
  FileText,
  DownloadSimple,
  ArrowSquareOut,
  Receipt,
  Clock,
  CheckCircle,
  WarningCircle,
  Monitor
} from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import ResponsiveTable from '@/components/ui/ResponsiveTable';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface InvoicesTabProps {
  formatCurrency: (amount: number) => string;
  onDownload: (id: string) => void;
  onViewInvoice: (invoice: any) => void;
}

export default function InvoicesTab({ formatCurrency, onDownload, onViewInvoice }: InvoicesTabProps) {
  const t = useTranslations('admin.billing');
  const tCommon = useTranslations('common');
  
  const columns = [
    {
      header: 'Invoice Node',
      accessor: (invoice: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shrink-0">
            <Receipt weight="duotone" className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono text-sm text-primary font-bold tracking-widest block uppercase">
              INV-2026-00{invoice}
            </span>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Digital Registry Node</span>
          </div>
        </div>
      )
    },
    {
      header: 'Cluster Identity',
      accessor: (invoice: any) => (
        <div className="flex items-center gap-2">
          <Monitor weight="duotone" className="w-4 h-4 text-primary/60" />
          <span className="text-foreground font-bold tracking-tight uppercase">
            Clinic Node {invoice}
          </span>
        </div>
      )
    },
    {
      header: 'Temporal Node',
      accessor: (invoice: any) => (
        <div className="flex items-center gap-2">
          <Clock weight="duotone" className="w-4 h-4 text-primary/60" />
          <span className="text-muted-foreground text-sm font-medium">
            Feb {invoice}, 2026
          </span>
        </div>
      )
    },
    {
      header: 'Fiscal Value',
      accessor: (invoice: any) => (
        <span className="text-foreground font-black tabular-nums">
          ฿{formatCurrency(invoice * 2900).replace('฿', '')}
        </span>
      )
    },
    {
      header: 'Sync Status',
      accessor: () => (
        <Badge variant="success" size="sm" className="font-black uppercase tracking-widest px-3">
          SETTLED
        </Badge>
      )
    },
    {
      header: '',
      className: 'text-right',
      accessor: (invoice: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onDownload(`INV-2026-00${invoice}`)}
            className="h-10 w-10 p-0 border-border/50 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
          >
            <DownloadSimple weight="bold" className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onViewInvoice({ 
              id: `INV-2026-00${invoice}`, 
              clinic: `Clinic Node ${invoice}`, 
              amount: invoice * 2900, 
              date: `Feb ${invoice}, 2026` 
            })}
            className="h-10 w-10 p-0 border-border/50 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
          >
            <ArrowSquareOut weight="bold" className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
        <CardHeader className="p-10 border-b border-border/50 bg-secondary/30 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <FileText className="w-64 h-64 text-primary" />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto border border-primary/20 shadow-inner group-hover:bg-primary/20 transition-all">
              <FileText weight="duotone" className="w-10 h-10 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black text-foreground uppercase tracking-tight">Invoice <span className="text-primary text-glow">Vault</span></CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-2">Historical fiscal synchronization</p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto relative z-10">
            {[
              { label: 'Pending Nodes', val: '3', color: 'text-amber-500', icon: Clock },
              { label: 'Settled Node (Feb)', val: '12', color: 'text-emerald-500', icon: CheckCircle },
              { label: 'Oversight Exceptions', val: '1', color: 'text-rose-500', icon: WarningCircle }
            ].map((node, i) => (
              <div key={i} className="p-6 bg-card border border-border/50 rounded-3xl shadow-inner group/node hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <node.icon weight="duotone" className={cn("w-5 h-5", node.color)} />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{node.label}</span>
                </div>
                <p className={cn("text-4xl font-black tracking-tighter", node.color)}>{node.val}</p>
              </div>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Invoices Table Registry */}
      <div className="px-2">
        <Card className="rounded-[40px] border-border/50 overflow-hidden shadow-premium">
          <ResponsiveTable
            columns={columns}
            data={[1, 2, 3, 4, 5]}
            rowKey={(i) => String(i)}
            emptyMessage="Zero fiscal nodes detected in current vault."
            mobileCard={(invoice) => (
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                      <Receipt weight="duotone" className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-primary font-black tracking-widest">INV-2026-00{invoice}</p>
                      <p className="text-base font-bold text-foreground truncate tracking-tight uppercase">Clinic Node {invoice}</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm" className="font-black uppercase text-[8px] tracking-widest px-3">
                    SETTLED
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6 py-4 border-y border-border/50">
                  <div>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Fiscal Value</p>
                    <p className="text-lg font-black text-foreground tabular-nums">฿{formatCurrency(invoice * 2900).replace('฿', '')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Temporal Node</p>
                    <p className="text-xs font-bold text-foreground">Feb {invoice}, 2026</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <Monitor weight="bold" className="w-3.5 h-3.5 opacity-60" />
                    Archive Validated
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(`INV-2026-00${invoice}`)}
                      className="px-4 py-2 h-auto rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 border-border/50"
                    >
                      <DownloadSimple weight="bold" className="w-3.5 h-3.5" />
                      PDF
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => onViewInvoice({ 
                        id: `INV-2026-00${invoice}`, 
                        clinic: `Clinic Node ${invoice}`, 
                        amount: invoice * 2900, 
                        date: `Feb ${invoice}, 2026` 
                      })}
                      className="px-4 py-2 h-auto rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 border-border/50"
                    >
                      <ArrowSquareOut weight="bold" className="w-3.5 h-3.5" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            )}
          />
        </Card>
      </div>
    </div>
  );
}
