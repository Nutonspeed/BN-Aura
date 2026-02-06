/**
 * Business Optimization System
 */

interface OptimizationTask {
  taskId: string;
  category: 'bug_fix' | 'performance' | 'ux_improvement' | 'training_update';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string;
  estimatedHours: number;
  businessValue: string;
}

interface OptimizationReport {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  categoryBreakdown: { [category: string]: number };
  businessImpact: {
    performanceImprovement: number;
    userSatisfactionIncrease: number;
    bugReduction: number;
  };
}

class BusinessOptimization {
  private static tasks: Map<string, OptimizationTask> = new Map();

  static createOptimizationPlan(): OptimizationTask[] {
    const tasks = [
      {
        taskId: 'bug_001',
        category: 'bug_fix' as const,
        priority: 'critical' as const,
        title: 'Fix mobile app crash on iOS 14',
        status: 'in_progress' as const,
        assignedTo: 'Mobile Team',
        estimatedHours: 16,
        businessValue: 'Prevents customer loss and booking failures'
      },
      {
        taskId: 'perf_001',
        category: 'performance' as const,
        priority: 'high' as const,
        title: 'Optimize AI consultation response time',
        status: 'pending' as const,
        assignedTo: 'AI Team',
        estimatedHours: 24,
        businessValue: 'Faster consultations increase satisfaction'
      },
      {
        taskId: 'ux_001',
        category: 'ux_improvement' as const,
        priority: 'medium' as const,
        title: 'Improve mobile app navigation',
        status: 'pending' as const,
        assignedTo: 'UX Team',
        estimatedHours: 20,
        businessValue: 'Higher customer conversion and retention'
      },
      {
        taskId: 'train_001',
        category: 'training_update' as const,
        priority: 'medium' as const,
        title: 'Update sales staff training materials',
        status: 'pending' as const,
        assignedTo: 'Training Team',
        estimatedHours: 8,
        businessValue: 'Improved staff performance'
      }
    ];

    tasks.forEach(task => {
      this.tasks.set(task.taskId, task);
    });

    return tasks;
  }

  static completeTask(taskId: string): OptimizationTask {
    const task = this.tasks.get(taskId)!;
    task.status = 'completed';
    this.tasks.set(taskId, task);
    return task;
  }

  static getOptimizationReport(): OptimizationReport {
    const allTasks = Array.from(this.tasks.values());
    
    return {
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      completionRate: Math.round((allTasks.filter(t => t.status === 'completed').length / allTasks.length) * 100),
      categoryBreakdown: {
        bug_fix: allTasks.filter(t => t.category === 'bug_fix').length,
        performance: allTasks.filter(t => t.category === 'performance').length,
        ux_improvement: allTasks.filter(t => t.category === 'ux_improvement').length,
        training_update: allTasks.filter(t => t.category === 'training_update').length
      },
      businessImpact: {
        performanceImprovement: 35,
        userSatisfactionIncrease: 25,
        bugReduction: 80
      }
    };
  }
}

export { BusinessOptimization, type OptimizationTask, type OptimizationReport };
