/**
 * Clinic Onboarding System
 * Automated onboarding workflow for pilot clinics
 */

interface OnboardingWorkflow {
  workflowId: string;
  clinicId: string;
  clinicName: string;
  startDate: string;
  targetGoLiveDate: string;
  currentStage: number;
  totalStages: number;
  stages: OnboardingStage[];
  assignedTeam: TeamMember[];
  automatedTasks: AutomatedTask[];
  manualTasks: ManualTask[];
  completionPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
}

interface OnboardingStage {
  stageId: string;
  stageName: string;
  order: number;
  duration: number; // hours
  tasks: string[];
  prerequisites: string[];
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
}

interface TeamMember {
  memberId: string;
  name: string;
  role: string;
  responsibilities: string[];
  contactInfo: string;
}

interface AutomatedTask {
  taskId: string;
  taskName: string;
  type: 'data_import' | 'system_config' | 'integration' | 'notification';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  progress: number;
  logs: string[];
}

interface ManualTask {
  taskId: string;
  taskName: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  notes: string[];
  completedBy?: string;
  completedAt?: string;
}

class ClinicOnboardingSystem {
  private static workflows: Map<string, OnboardingWorkflow> = new Map();

  /**
   * Create onboarding workflow for a clinic
   */
  static createOnboardingWorkflow(clinicData: any): OnboardingWorkflow {
    const workflowId = `workflow_${clinicData.clinicId}_${Date.now()}`;

    const workflow: OnboardingWorkflow = {
      workflowId,
      clinicId: clinicData.clinicId,
      clinicName: clinicData.clinicName,
      startDate: new Date().toISOString(),
      targetGoLiveDate: clinicData.targetGoLiveDate,
      currentStage: 1,
      totalStages: 5,
      stages: this.createDefaultStages(),
      assignedTeam: this.assignOnboardingTeam(clinicData.clinicSize),
      automatedTasks: this.createAutomatedTasks(clinicData.clinicId),
      manualTasks: this.createManualTasks(clinicData.clinicId, clinicData.clinicName),
      completionPercentage: 0,
      status: 'in_progress'
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  /**
   * Execute automated onboarding tasks
   */
  static executeAutomatedTasks(workflowId: string): AutomatedTask[] {
    const workflow = this.workflows.get(workflowId)!;
    
    workflow.automatedTasks.forEach(task => {
      if (task.status === 'pending') {
        task.status = 'running';
        task.startTime = new Date().toISOString();
        task.logs.push(`Task started at ${new Date().toLocaleString()}`);
        
        // Simulate task completion
        task.progress = 100;
        task.status = 'completed';
        task.endTime = new Date().toISOString();
        task.logs.push(`Task completed successfully`);
      }
    });

    this.updateWorkflowProgress(workflowId);
    this.workflows.set(workflowId, workflow);
    return workflow.automatedTasks;
  }

  /**
   * Complete a manual task
   */
  static completeManualTask(workflowId: string, taskId: string, completedBy: string, notes?: string): ManualTask {
    const workflow = this.workflows.get(workflowId)!;
    const task = workflow.manualTasks.find(t => t.taskId === taskId)!;

    task.status = 'completed';
    task.completedBy = completedBy;
    task.completedAt = new Date().toISOString();
    if (notes) task.notes.push(notes);

    this.updateWorkflowProgress(workflowId);
    this.workflows.set(workflowId, workflow);
    return task;
  }

  /**
   * Get onboarding status summary
   */
  static getOnboardingStatus(workflowId: string): any {
    const workflow = this.workflows.get(workflowId)!;
    
    return {
      workflow: {
        id: workflow.workflowId,
        clinic: workflow.clinicName,
        status: workflow.status,
        progress: workflow.completionPercentage,
        currentStage: workflow.stages[workflow.currentStage - 1]?.stageName || 'Not Started',
        targetGoLive: workflow.targetGoLiveDate
      },
      stages: workflow.stages.map(s => ({
        name: s.stageName,
        status: s.status,
        tasks: s.tasks.length
      })),
      tasks: {
        automated: {
          total: workflow.automatedTasks.length,
          completed: workflow.automatedTasks.filter(t => t.status === 'completed').length,
          running: workflow.automatedTasks.filter(t => t.status === 'running').length
        },
        manual: {
          total: workflow.manualTasks.length,
          completed: workflow.manualTasks.filter(t => t.status === 'completed').length,
          pending: workflow.manualTasks.filter(t => t.status === 'pending').length
        }
      },
      team: workflow.assignedTeam.map(m => ({ name: m.name, role: m.role })),
      estimatedCompletion: this.calculateEstimatedCompletion(workflow)
    };
  }

  // Helper methods
  private static createDefaultStages(): OnboardingStage[] {
    return [
      { stageId: 'stage_1', stageName: 'Account & System Setup', order: 1, duration: 4, tasks: ['Create admin accounts', 'Configure permissions', 'Set up clinic profile'], prerequisites: [], status: 'in_progress' },
      { stageId: 'stage_2', stageName: 'Data Migration', order: 2, duration: 8, tasks: ['Import customer data', 'Import treatment history', 'Import inventory'], prerequisites: ['stage_1'], status: 'pending' },
      { stageId: 'stage_3', stageName: 'Integration & Testing', order: 3, duration: 6, tasks: ['Configure integrations', 'Run system tests', 'Verify data integrity'], prerequisites: ['stage_2'], status: 'pending' },
      { stageId: 'stage_4', stageName: 'Training & Certification', order: 4, duration: 8, tasks: ['Owner training', 'Staff training', 'Certification exam'], prerequisites: ['stage_3'], status: 'pending' },
      { stageId: 'stage_5', stageName: 'Go-Live Verification', order: 5, duration: 4, tasks: ['Final checklist', 'Go-live approval', 'Launch support setup'], prerequisites: ['stage_4'], status: 'pending' }
    ];
  }

  private static assignOnboardingTeam(clinicSize: string): TeamMember[] {
    return [
      { memberId: 'tm_001', name: 'Somchai P.', role: 'Onboarding Manager', responsibilities: ['Overall coordination', 'Timeline management'], contactInfo: 'somchai@bnaura.com' },
      { memberId: 'tm_002', name: 'Pranee K.', role: 'Technical Specialist', responsibilities: ['System setup', 'Data migration'], contactInfo: 'pranee@bnaura.com' },
      { memberId: 'tm_003', name: 'Wichai S.', role: 'Training Coordinator', responsibilities: ['Training delivery', 'Certification'], contactInfo: 'wichai@bnaura.com' }
    ];
  }

  private static createAutomatedTasks(clinicId: string): AutomatedTask[] {
    return [
      { taskId: 'auto_001', taskName: 'Create Clinic Workspace', type: 'system_config', status: 'pending', progress: 0, logs: [] },
      { taskId: 'auto_002', taskName: 'Import Customer Database', type: 'data_import', status: 'pending', progress: 0, logs: [] },
      { taskId: 'auto_003', taskName: 'Configure AI Models', type: 'system_config', status: 'pending', progress: 0, logs: [] },
      { taskId: 'auto_004', taskName: 'Setup Monitoring & Alerts', type: 'integration', status: 'pending', progress: 0, logs: [] },
      { taskId: 'auto_005', taskName: 'Send Welcome Notifications', type: 'notification', status: 'pending', progress: 0, logs: [] }
    ];
  }

  private static createManualTasks(clinicId: string, clinicName: string): ManualTask[] {
    return [
      { taskId: 'manual_001', taskName: 'Verify clinic business documents', assignedTo: 'Onboarding Manager', dueDate: '2025-02-10', status: 'pending', notes: [] },
      { taskId: 'manual_002', taskName: 'Schedule owner training session', assignedTo: 'Training Coordinator', dueDate: '2025-02-12', status: 'pending', notes: [] },
      { taskId: 'manual_003', taskName: 'Review data migration results', assignedTo: 'Technical Specialist', dueDate: '2025-02-13', status: 'pending', notes: [] },
      { taskId: 'manual_004', taskName: 'Conduct go-live readiness review', assignedTo: 'Onboarding Manager', dueDate: '2025-02-16', status: 'pending', notes: [] }
    ];
  }

  private static updateWorkflowProgress(workflowId: string): void {
    const workflow = this.workflows.get(workflowId)!;
    const totalTasks = workflow.automatedTasks.length + workflow.manualTasks.length;
    const completedTasks = workflow.automatedTasks.filter(t => t.status === 'completed').length +
                          workflow.manualTasks.filter(t => t.status === 'completed').length;
    
    workflow.completionPercentage = Math.round((completedTasks / totalTasks) * 100);
    
    if (workflow.completionPercentage === 100) {
      workflow.status = 'completed';
    }
  }

  private static calculateEstimatedCompletion(workflow: OnboardingWorkflow): string {
    const remainingHours = workflow.stages
      .filter(s => s.status !== 'completed')
      .reduce((sum, s) => sum + s.duration, 0);
    
    const completionDate = new Date();
    completionDate.setHours(completionDate.getHours() + remainingHours);
    return completionDate.toISOString().split('T')[0];
  }
}

export { ClinicOnboardingSystem, type OnboardingWorkflow, type AutomatedTask, type ManualTask };
