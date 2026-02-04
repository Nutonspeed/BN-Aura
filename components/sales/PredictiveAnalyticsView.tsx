'use client';

import { PredictiveAnalytics } from '@/lib/customer/customerIntelligence';
import { 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  ArrowRight,
  TrendDown,
  Pulse
} from '@phosphor-icons/react';

interface PredictiveAnalyticsViewProps {
  data: PredictiveAnalytics;
}

export default function PredictiveAnalyticsView({ data }: PredictiveAnalyticsViewProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-green-400 bg-green-500/10 border-green-500/20';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <Activity className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Churn Risk Card */}
        <div className={`p-4 rounded-xl border ${getRiskColor(data.churnRisk.level)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {getRiskIcon(data.churnRisk.level)}
              <h3 className="font-bold">Churn Risk</h3>
            </div>
            <span className="text-2xl font-black">{data.churnRisk.score}%</span>
          </div>
          
          <div className="space-y-2">
            <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-current transition-all duration-500"
                style={{ width: `${data.churnRisk.score}%` }}
              />
            </div>
            <p className="text-xs opacity-80 uppercase font-bold tracking-wider">
              {data.churnRisk.level} Risk Level
            </p>
          </div>

          {data.churnRisk.factors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-black/10">
              <p className="text-xs font-bold mb-2 opacity-80">RISK FACTORS</p>
              <ul className="space-y-1">
                {data.churnRisk.factors.map((factor, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-current" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* LTV Prediction Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-bold">Lifetime Value</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase font-bold">Predicted</p>
              <span className="text-2xl font-black text-white">
                ฿{data.ltv.predicted.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-black text-emerald-400">
              +฿{(data.ltv.predicted - data.ltv.current).toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground mb-1.5">potential growth</span>
          </div>

          <div className="mt-4 pt-4 border-t border-emerald-500/20 flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Current Value</span>
            <span className="font-bold text-white">฿{data.ltv.current.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Next Best Action */}
      <div className="p-1 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="bg-slate-900 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Next Best Action</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    {data.nextBestAction.confidence}% Confidence
                  </span>
                </div>
              </div>
            </div>
            <button className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
              Execute
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <h4 className="text-xl font-bold text-white">{data.nextBestAction.action}</h4>
            <p className="text-muted-foreground">{data.nextBestAction.reason}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
