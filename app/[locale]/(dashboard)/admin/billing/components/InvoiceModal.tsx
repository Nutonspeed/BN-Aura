import { motion, AnimatePresence } from 'framer-motion';
import { FileText, DownloadSimple, XCircle } from '@phosphor-icons/react';

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 p-8 rounded-[32px] border-2 border-slate-600 w-full max-w-lg shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Invoice Detail</h3>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{invoice.id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-slate-700 text-gray-400 hover:text-white rounded-xl transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-slate-900 border-2 border-slate-700 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Clinic</span>
                  <span className="text-white font-bold">{invoice.clinic}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Billing Date</span>
                  <span className="text-white font-bold">{invoice.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">PAID</span>
                </div>
                <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                  <span className="text-sm font-black text-white uppercase tracking-widest">Total Amount</span>
                  <span className="text-2xl font-black text-primary">{formatCurrency(invoice.amount)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onDownload(invoice.id)}
                  className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <DownloadSimple className="w-4 h-4 stroke-[3px]" />
                  Download PDF
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-4 bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-600 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
