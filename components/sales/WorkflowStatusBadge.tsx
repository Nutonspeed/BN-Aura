'use client';

import { motion } from 'framer-motion';
import { getWorkflowStageInfo } from '@/hooks/useWorkflowStatus';
import { cn } from '@/lib/utils';

interface WorkflowStatusBadgeProps {
  stage: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function WorkflowStatusBadge({ 
  stage, 
  size = 'md', 
  showIcon = true,
  className 
}: WorkflowStatusBadgeProps) {
  const stageInfo = getWorkflowStageInfo(stage);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        stageInfo.color,
        'text-white',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <span>{stageInfo.icon}</span>}
      <span>{stageInfo.label}</span>
    </motion.div>
  );
}