'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ScoreRevealProps {
  score: number;
  label?: string;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  showGrade?: boolean;
  className?: string;
}

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'A+', color: 'text-emerald-400' };
  if (score >= 80) return { grade: 'A', color: 'text-green-400' };
  if (score >= 70) return { grade: 'B+', color: 'text-lime-400' };
  if (score >= 60) return { grade: 'B', color: 'text-yellow-400' };
  if (score >= 50) return { grade: 'C+', color: 'text-orange-400' };
  if (score >= 40) return { grade: 'C', color: 'text-orange-500' };
  return { grade: 'D', color: 'text-red-400' };
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  return '#ef4444';
}

const sizes = {
  sm: { outer: 100, stroke: 6, fontSize: 'text-2xl', labelSize: 'text-[10px]' },
  md: { outer: 140, stroke: 8, fontSize: 'text-4xl', labelSize: 'text-xs' },
  lg: { outer: 180, stroke: 10, fontSize: 'text-5xl', labelSize: 'text-sm' },
};

export default function ScoreReveal({
  score,
  label = 'Overall Score',
  maxScore = 100,
  size = 'lg',
  delay = 300,
  showGrade = true,
  className,
}: ScoreRevealProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const animRef = useRef<number | null>(null);

  const { outer, stroke, fontSize, labelSize } = sizes[size];
  const radius = (outer - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / maxScore) * circumference;
  const dashOffset = circumference - progress;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
      const duration = 1500;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplayScore(Math.round(eased * score));

        if (t < 1) {
          animRef.current = requestAnimationFrame(animate);
        }
      };

      animRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [score, delay]);

  const scoreColor = getScoreColor(displayScore);
  const { grade, color: gradeColor } = getGrade(score);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: outer, height: outer }}>
        {/* Background glow */}
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-xl transition-opacity duration-1000',
            isRevealed ? 'opacity-30' : 'opacity-0'
          )}
          style={{ backgroundColor: scoreColor }}
        />

        <svg width={outer} height={outer} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={stroke}
          />
          {/* Progress circle */}
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isRevealed ? dashOffset : circumference}
            className="transition-all duration-[1500ms] ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${scoreColor})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(fontSize, 'font-bold text-white tabular-nums')}>
            {displayScore}
          </span>
          <span className={cn(labelSize, 'text-gray-400 -mt-1')}>/{maxScore}</span>
        </div>
      </div>

      {/* Label */}
      <p className="text-sm text-gray-400 mt-2">{label}</p>

      {/* Grade Badge */}
      {showGrade && isRevealed && (
        <div className={cn(
          'mt-2 px-4 py-1 rounded-full border text-sm font-bold',
          'animate-[fadeIn_0.5s_ease-out_1.5s_both]',
          gradeColor,
          'border-current/30 bg-current/10'
        )}>
          <span style={{ color: 'inherit' }}>Grade {grade}</span>
        </div>
      )}
    </div>
  );
}

/* Mini score for inline use */
export function MiniScore({ score, label, className }: { score: number; label: string; className?: string }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();
    let frame: number;

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(eased * score));
      if (t < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const color = getScoreColor(score);

  return (
    <div className={cn('text-center', className)}>
      <p className="text-3xl font-bold tabular-nums" style={{ color }}>{displayScore}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
