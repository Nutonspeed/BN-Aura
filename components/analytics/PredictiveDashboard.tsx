import dynamic from 'next/dynamic';

const PredictiveDashboardClient = dynamic(
  () => import('./PredictiveDashboardClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-8">
        <div className="glass-card p-6 rounded-2xl border border-white/10 h-[400px] animate-pulse bg-white/5" />
        <div className="glass-card p-6 rounded-2xl border border-white/10 h-[400px] animate-pulse bg-white/5" />
      </div>
    )
  }
);

export default function PredictiveDashboard() {
  return <PredictiveDashboardClient />;
}