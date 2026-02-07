import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText,
  DownloadSimple,
  X,
  Receipt,
  Clock,
  CheckCircle,
  Buildings,
  MapPin,
  User,
  IdentificationBadge,
  Briefcase
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface InvoiceModalProps {
  invoice: {
    id: string;
    clinic: string;
    amount: number;
    date: string;
  } | null;
  onClose: () => void;
  onDownload: (id: string) => void;
  formatCurrency: (amount: number) => string;
}

export default function InvoiceModal({ invoice, onClose, onDownload, formatCurrency }: InvoiceModalProps) {
  return (
    <AnimatePresence>
      {invoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-[40px] w-full max-w-lg shadow-premium relative z-10 my-8 overflow-hidden group"
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Receipt className="w-64 h-64 text-primary" />
            </div>

            <div className="p-10 relative z-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <FileText weight="duotone" className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase">Invoice Node</h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 font-mono">{invoice.id}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="p-2 h-10 w-10 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                >
                  <X weight="bold" className="w-6 h-6" />
                </Button>
              </div>

              <div className="space-y-8">
                <Card className="bg-secondary/30 border border-border/50 rounded-[32px] overflow-hidden">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-center group/item">
                      <div className="flex items-center gap-3">
                        <Buildings weight="duotone" className="w-4 h-4 text-primary/60" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cluster Node</span>
                      </div>
                      <span className="text-sm font-bold text-foreground uppercase tracking-tight">{invoice.clinic}</span>
                    </div>
                    
                    <div className="flex justify-between items-center group/item">
                      <div className="flex items-center gap-3">
                        <Clock weight="duotone" className="w-4 h-4 text-primary/60" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Billing Cycle</span>
                      </div>
                      <span className="text-sm font-bold text-foreground tabular-nums">{invoice.date}</span>
                    </div>

                    <div className="flex justify-between items-center group/item">
                      <div className="flex items-center gap-3">
                        <CheckCircle weight="duotone" className="w-4 h-4 text-emerald-500/60" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sync Status</span>
                      </div>
                      <Badge variant="success" size="sm" className="font-black text-[8px] uppercase tracking-widest px-3">PAID_OK</Badge>
                    </div>

                    <div className="pt-6 border-t border-border/30 flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="text-sm font-black text-foreground uppercase tracking-widest">Fiscal Yield</span>
                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60 leading-none">Global settlement value</p>
                      </div>
                      <span className="text-3xl font-black text-primary tabular-nums tracking-tighter">{formatCurrency(invoice.amount)}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Button
                    onClick={() => onDownload(invoice.id)}
                    className="w-full sm:flex-[2] py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3 group"
                  >
                    <DownloadSimple weight="bold" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Archive PDF node
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full sm:flex-1 py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] border-border/50 hover:bg-secondary"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
