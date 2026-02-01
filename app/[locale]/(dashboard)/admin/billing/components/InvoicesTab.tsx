import { FileText, Download, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface InvoicesTabProps {
  formatCurrency: (amount: number) => string;
  onDownload: (id: string) => void;
  onViewInvoice: (invoice: any) => void;
}

export default function InvoicesTab({ formatCurrency, onDownload, onViewInvoice }: InvoicesTabProps) {
  const t = useTranslations('admin.billing');
  const tCommon = useTranslations('common');
  
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-10 rounded-[32px] border-2 border-slate-700 shadow-lg text-center">
        <FileText className="w-16 h-16 text-blue-400/20 mx-auto mb-4" />
        <h3 className="text-2xl font-black text-white uppercase tracking-tight">{t('invoices')}</h3>
        <p className="text-gray-400 max-w-md mx-auto mt-2 font-medium">
          {t('description')}
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="p-6 bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-inner">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pending</p>
            <p className="text-3xl font-black text-amber-400 mt-1">3</p>
          </div>
          <div className="p-6 bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-inner">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Paid (Feb)</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">12</p>
          </div>
          <div className="p-6 bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-inner">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Overdue</p>
            <p className="text-3xl font-black text-red-500 mt-1">1</p>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-800 rounded-2xl border-2 border-slate-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('clinic')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('amount')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-primary font-bold">INV-2026-00{i}</td>
                  <td className="px-6 py-4 text-white font-bold tracking-tight">Clinic Node {i}</td>
                  <td className="px-6 py-4 text-gray-300 text-sm font-medium">Feb {i}, 2026</td>
                  <td className="px-6 py-4 text-white font-black">฿{formatCurrency(i * 2900).replace('฿', '')}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">PAID</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onDownload(`INV-2026-00${i}`)}
                        className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onViewInvoice({ 
                          id: `INV-2026-00${i}`, 
                          clinic: `Clinic Node ${i}`, 
                          amount: i * 2900, 
                          date: `Feb ${i}, 2026` 
                        })}
                        className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
