'use client';

import { motion } from 'framer-motion';
import { SmileyWink, SmileyMeh, SmileyXEyes, SpinnerGap } from '@phosphor-icons/react';
import { SentimentAnalysis, getSentimentColor, getSatisfactionLevel } from '@/lib/ai/sentimentAnalyzer';
import { cn } from '@/lib/utils';

interface SentimentBadgeProps {
  sentiment: SentimentAnalysis | null;
  loading?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export default function SentimentBadge({ 
  sentiment, 
  loading = false,
  compact = false,
  onClick 
}: SentimentBadgeProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
        <SpinnerGap className="w-4 h-4 animate-spin text-muted-foreground" />
        {!compact && (
          <span className="text-xs text-muted-foreground">Analyzing...</span>
        )}
      </div>
    );
  }

  if (!sentiment) {
    return null;
  }

  const SentimentIcon = 
    sentiment.overall_sentiment === 'positive' ? SmileyWink :
    sentiment.overall_sentiment === 'negative' ? SmileyXEyes :
    SmileyMeh;

  const satisfactionLevel = getSatisfactionLevel(sentiment.satisfaction_score);

  if (compact) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full",
          "bg-white/5 border cursor-pointer hover:bg-white/10 transition-all",
          sentiment.overall_sentiment === 'positive' && "border-green-500/30",
          sentiment.overall_sentiment === 'negative' && "border-red-500/30",
          sentiment.overall_sentiment === 'neutral' && "border-yellow-500/30"
        )}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <SentimentIcon className={cn(
          "w-3.5 h-3.5",
          getSentimentColor(sentiment.overall_sentiment)
        )} />
        <span className={cn(
          "text-xs font-bold",
          satisfactionLevel.color
        )}>
          {sentiment.satisfaction_score.toFixed(1)}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "p-4 rounded-2xl border cursor-pointer",
        "hover:border-primary/50 transition-all",
        sentiment.overall_sentiment === 'positive' && "bg-green-500/5 border-green-500/20",
        sentiment.overall_sentiment === 'negative' && "bg-red-500/5 border-red-500/20",
        sentiment.overall_sentiment === 'neutral' && "bg-yellow-500/5 border-yellow-500/20"
      )}
      onClick={onClick}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon & Sentiment */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl",
            sentiment.overall_sentiment === 'positive' && "bg-green-500/20",
            sentiment.overall_sentiment === 'negative' && "bg-red-500/20",
            sentiment.overall_sentiment === 'neutral' && "bg-yellow-500/20"
          )}>
            <SentimentIcon className={cn(
              "w-5 h-5",
              getSentimentColor(sentiment.overall_sentiment)
            )} />
          </div>
          
          <div>
            <p className={cn(
              "text-sm font-bold capitalize",
              getSentimentColor(sentiment.overall_sentiment)
            )}>
              {sentiment.overall_sentiment === 'positive' && 'Positive'}
              {sentiment.overall_sentiment === 'negative' && 'Negative'}
              {sentiment.overall_sentiment === 'neutral' && 'Neutral'}
            </p>
            <p className="text-xs text-muted-foreground">
              Confidence: {(sentiment.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Satisfaction Score */}
        <div className="text-right">
          <div className="flex items-center gap-1">
            <span className="text-2xl">{satisfactionLevel.emoji}</span>
            <span className={cn(
              "text-3xl font-black",
              satisfactionLevel.color
            )}>
              {sentiment.satisfaction_score.toFixed(1)}
            </span>
          </div>
          <p className={cn(
            "text-xs font-medium",
            satisfactionLevel.color
          )}>
            {satisfactionLevel.label}
          </p>
        </div>
      </div>

      {/* Key Concerns */}
      {sentiment.key_concerns.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs font-bold text-muted-foreground mb-2">
            Key Concerns:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sentiment.key_concerns.map((concern, i) => (
              <span 
                key={i}
                className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded-full"
              >
                {concern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Positive Signals */}
      {sentiment.positive_signals.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-bold text-muted-foreground mb-2">
            Positive Signals:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sentiment.positive_signals.map((signal, i) => (
              <span 
                key={i}
                className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}