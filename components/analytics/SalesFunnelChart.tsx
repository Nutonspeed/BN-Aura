import dynamic from 'next/dynamic';

const SalesFunnelChartClient = dynamic(
  () => import('./SalesFunnelChartClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="glass-card p-6 rounded-2xl border border-white/10 h-[500px] animate-pulse bg-white/5" />
    )
  }
);

interface FunnelData {
  name: string;
  value: number;
  percentage: number;
}

interface SalesFunnelChartProps {
  data: FunnelData[];
  period?: string;
}

export default function SalesFunnelChart({ data, period = 'This Month' }: SalesFunnelChartProps) {
  return <SalesFunnelChartClient data={data} period={period} />;
}