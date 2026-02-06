'use client';

import { motion } from 'framer-motion';
import { Check, Circle } from '@phosphor-icons/react';
import { getWorkflowStages, getWorkflowStageInfo } from '@/hooks/useWorkflowStatus';
import { cn } from '@/lib/utils';

interface WorkflowTimelineProps {
  currentStage: string;
  completedStages?: string[];
  className?: string;
}

export default function WorkflowTimeline({ 
  currentStage, 
  completedStages = [],
  className 
}: WorkflowTimelineProps) {
  const stages = getWorkflowStages();
  const currentIndex = stages.indexOf(currentStage);

  return (
    <div className={cn('space-y-4', className)}>
      <h4 className="text-sm font-semibold text-foreground mb-3">Workflow Progress</h4>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        <motion.div
          className="absolute left-4 top-0 w-0.5 bg-primary"
          initial={{ height: 0 }}
          animate={{ height: `${(currentIndex / (stages.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />

        {/* Stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const stageInfo = getWorkflowStageInfo(stage);
            const isCompleted = index < currentIndex || completedStages.includes(stage);
            const isCurrent = stage === currentStage;
            const isPending = index > currentIndex;

            return (
              <motion.div
                key={stage}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex items-center gap-3"
              >
                {/* Stage Icon */}
                <div
                  className={cn(
                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                    isCompleted && 'bg-primary border-primary',
                    isCurrent && 'bg-primary/20 border-primary animate-pulse',
                    isPending && 'bg-background border-border'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : isCurrent ? (
                    <Circle className="w-3 h-3 text-primary fill-primary" />
                  ) : (
                    <Circle className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>

                {/* Stage Info */}
                <div className="flex-1">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      isCurrent && 'text-primary',
                      isCompleted && 'text-foreground',
                      isPending && 'text-muted-foreground'
                    )}
                  >
                    {stageInfo.icon} {stageInfo.label}
                  </div>
                  {isCurrent && (
                    <div className="text-xs text-muted-foreground">Current stage</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}