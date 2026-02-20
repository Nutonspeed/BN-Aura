'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendUp,
  TrendDown,
  WarningCircle,
  CheckCircle,
  Target,
  ChartBar,
  Lightbulb,
  Star,
  Shield
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface SuccessPrediction {
  treatmentId: string;
  treatmentName: string;
  successProbability: number;
  confidenceScore: number;
  expectedResults: {
    improvement: number;
    satisfaction: number;
    longevity: number;
  };
  risks: {
    low: number;
    medium: number;
    high: number;
  };
  recommendations: string[];
  alternatives: {
    treatmentId: string;
    treatmentName: string;
    successProbability: number;
    reason: string;
  }[];
  processingTime: number;
}

interface TreatmentSuccessPredictionProps {
  predictions: SuccessPrediction[];
  summary?: {
    totalTreatments: number;
    averageSuccess: number;
    topRecommendation: SuccessPrediction;
    confidence: number;
  };
  onSelectTreatment?: (treatmentId: string) => void;
  className?: string;
}

export default function TreatmentSuccessPrediction({
  predictions,
  summary,
  onSelectTreatment,
  className
}: TreatmentSuccessPredictionProps) {
  const [selectedPrediction, setSelectedPrediction] = useState<SuccessPrediction | null>(null);
  const [expandedView, setExpandedView] = useState(false);

  const getSuccessColor = (probability: number) => {
    if (probability >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (probability >= 60) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (probability >= 40) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const getSuccessIcon = (probability: number) => {
    if (probability >= 80) return <TrendUp className="w-5 h-5" />;
    if (probability >= 60) return <CheckCircle className="w-5 h-5" />;
    if (probability >= 40) return <WarningCircle className="w-5 h-5" />;
    return <TrendDown className="w-5 h-5" />;
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'bg-emerald-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
    }
  };

  const formatProbability = (value: number) => `${value}%`;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-400" />
            Treatment Success Prediction
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            AI-powered analysis of treatment success rates
          </p>
        </div>
        {summary && (
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {formatProbability(summary.averageSuccess)}
            </div>
            <div className="text-xs text-gray-400">Average Success Rate</div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <ChartBar className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Total Treatments</span>
            </div>
            <div className="text-xl font-bold text-white">{summary.totalTreatments}</div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-400">Top Success Rate</span>
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {formatProbability(summary.topRecommendation.successProbability)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Confidence</span>
            </div>
            <div className="text-xl font-bold text-blue-400">{summary.confidence}%</div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-400">Top Treatment</span>
            </div>
            <div className="text-sm font-bold text-white truncate">
              {summary.topRecommendation.treatmentName}
            </div>
          </div>
        </div>
      )}

      {/* Predictions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Treatment Predictions</h3>
          <button
            onClick={() => setExpandedView(!expandedView)}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            {expandedView ? 'Compact View' : 'Detailed View'}
          </button>
        </div>

        <div className={cn(
          'space-y-3',
          expandedView ? 'max-h-none' : 'max-h-96 overflow-y-auto'
        )}>
          {predictions.map((prediction, index) => (
            <motion.div
              key={prediction.treatmentId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all duration-300',
                selectedPrediction?.treatmentId === prediction.treatmentId
                  ? 'bg-purple-500/10 border-purple-500/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              )}
              onClick={() => {
                setSelectedPrediction(prediction);
                onSelectTreatment?.(prediction.treatmentId);
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-lg border',
                    getSuccessColor(prediction.successProbability)
                  )}>
                    {getSuccessIcon(prediction.successProbability)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{prediction.treatmentName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">Success Rate:</span>
                      <span className={cn(
                        'text-sm font-bold',
                        prediction.successProbability >= 80 ? 'text-emerald-400' :
                        prediction.successProbability >= 60 ? 'text-blue-400' :
                        prediction.successProbability >= 40 ? 'text-yellow-400' : 'text-red-400'
                      )}>
                        {formatProbability(prediction.successProbability)}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        Confidence: {prediction.confidenceScore}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {formatProbability(prediction.successProbability)}
                  </div>
                  <div className="text-xs text-gray-400">Success</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden mb-3">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    prediction.successProbability >= 80 ? 'bg-emerald-500' :
                    prediction.successProbability >= 60 ? 'bg-blue-500' :
                    prediction.successProbability >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${prediction.successProbability}%` }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.8 }}
                />
              </div>

              {/* Expected Results */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-xs text-gray-400">Improvement</div>
                  <div className="text-sm font-bold text-white">
                    {prediction.expectedResults.improvement}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400">Satisfaction</div>
                  <div className="text-sm font-bold text-white">
                    {prediction.expectedResults.satisfaction}/5
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400">Longevity</div>
                  <div className="text-sm font-bold text-white">
                    {prediction.expectedResults.longevity}mo
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-400">Risk:</span>
                <div className="flex gap-1">
                  {Object.entries(prediction.risks).map(([risk, probability]) => (
                    <div
                      key={risk}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        risk === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                        risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      )}
                    >
                      {risk.charAt(0).toUpperCase() + risk.slice(1)}: {Math.round(probability * 100)}%
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations (Expanded View) */}
              {expandedView && prediction.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-semibold text-gray-400">Recommendations</span>
                  </div>
                  <ul className="space-y-1">
                    {prediction.recommendations.slice(0, 2).map((rec, i) => (
                      <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detailed View Modal */}
      <AnimatePresence>
        {selectedPrediction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPrediction(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {selectedPrediction.treatmentName}
                </h3>
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Success Probability */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Success Probability</span>
                  <span className="text-2xl font-bold text-white">
                    {formatProbability(selectedPrediction.successProbability)}
                  </span>
                </div>
                <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      'h-full rounded-full',
                      selectedPrediction.successProbability >= 80 ? 'bg-emerald-500' :
                      selectedPrediction.successProbability >= 60 ? 'bg-blue-500' :
                      selectedPrediction.successProbability >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedPrediction.successProbability}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>

              {/* Expected Results */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Expected Results</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-white/5 rounded-lg text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      {selectedPrediction.expectedResults.improvement}%
                    </div>
                    <div className="text-xs text-gray-400">Improvement</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {selectedPrediction.expectedResults.satisfaction}/5
                    </div>
                    <div className="text-xs text-gray-400">Satisfaction</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {selectedPrediction.expectedResults.longevity}
                    </div>
                    <div className="text-xs text-gray-400">Months</div>
                  </div>
                </div>
              </div>

              {/* Risk Analysis */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Risk Analysis</h4>
                <div className="space-y-2">
                  {Object.entries(selectedPrediction.risks).map(([risk, probability]) => (
                    <div key={risk} className="flex items-center justify-between">
                      <span className="text-sm text-gray-400 capitalize">{risk} Risk</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-black/20 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              risk === 'low' ? 'bg-emerald-500' :
                              risk === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                            )}
                            style={{ width: `${probability * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white">
                          {Math.round(probability * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {selectedPrediction.recommendations.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Recommendations</h4>
                  <ul className="space-y-2">
                    {selectedPrediction.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onSelectTreatment?.(selectedPrediction.treatmentId);
                    setSelectedPrediction(null);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all"
                >
                  Select This Treatment
                </button>
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
