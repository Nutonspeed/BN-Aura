/**
 * Pilot Launch Execution System
 * Manage production launch with 3 pilot clinics
 */

interface PilotClinicStatus {
  clinicId: string;
  clinicName: string;
  location: string;
  onboardingStatus: 'pending' | 'in_progress' | 'completed';
  goLiveDate: string;
  currentPhase: 'setup' | 'training' | 'testing' | 'live' | 'monitoring';
  metrics: {
    dailyActiveUsers: number;
    totalBookings: number;
    aiConsultations: number;
    satisfactionScore: number;
    issuesReported: number;
    issuesResolved: number;
  };
  healthScore: number;
  supportTickets: number;
  lastActivity: string;
}

interface OnboardingChecklist {
  clinicId: string;
  steps: OnboardingStep[];
  completionRate: number;
  estimatedCompletion: string;
}

interface OnboardingStep {
  stepId: string;
  stepName: string;
  category: 'technical' | 'training' | 'data' | 'verification';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedTo: string;
  dueDate: string;
  completedDate?: string;
  notes: string[];
}

interface PilotMetrics {
  overallHealth: 'excellent' | 'good' | 'needs_attention' | 'critical';
  totalClinics: number;
  liveClinics: number;
  averageSatisfaction: number;
  totalBookings: number;
  totalConsultations: number;
  systemUptime: number;
  criticalIssues: number;
  daysSinceLaunch: number;
}

class PilotLaunchExecution {
  private static pilotClinics: Map<string, PilotClinicStatus> = new Map();
  private static onboardingChecklists: Map<string, OnboardingChecklist> = new Map();

  /**
   * Initialize pilot launch with selected clinics
   */
  static initializePilotLaunch(): PilotClinicStatus[] {
    const pilots = [
      {
        clinicId: 'pilot_bangkok_001',
        clinicName: 'Elite Beauty Bangkok',
        location: 'Bangkok, Sukhumvit',
        onboardingStatus: 'in_progress' as const,
        goLiveDate: '2025-02-17',
        currentPhase: 'setup' as const,
        metrics: {
          dailyActiveUsers: 0,
          totalBookings: 0,
          aiConsultations: 0,
          satisfactionScore: 0,
          issuesReported: 0,
          issuesResolved: 0
        },
        healthScore: 100,
        supportTickets: 0,
        lastActivity: new Date().toISOString()
      },
      {
        clinicId: 'pilot_phuket_001',
        clinicName: 'Phuket Beauty Center',
        location: 'Phuket, Patong',
        onboardingStatus: 'pending' as const,
        goLiveDate: '2025-02-19',
        currentPhase: 'setup' as const,
        metrics: {
          dailyActiveUsers: 0,
          totalBookings: 0,
          aiConsultations: 0,
          satisfactionScore: 0,
          issuesReported: 0,
          issuesResolved: 0
        },
        healthScore: 100,
        supportTickets: 0,
        lastActivity: new Date().toISOString()
      },
      {
        clinicId: 'pilot_chiangmai_001',
        clinicName: 'Northern Aesthetics',
        location: 'Chiang Mai, Nimman',
        onboardingStatus: 'pending' as const,
        goLiveDate: '2025-02-21',
        currentPhase: 'setup' as const,
        metrics: {
          dailyActiveUsers: 0,
          totalBookings: 0,
          aiConsultations: 0,
          satisfactionScore: 0,
          issuesReported: 0,
          issuesResolved: 0
        },
        healthScore: 100,
        supportTickets: 0,
        lastActivity: new Date().toISOString()
      }
    ];

    pilots.forEach(pilot => {
      this.pilotClinics.set(pilot.clinicId, pilot);
      this.createOnboardingChecklist(pilot.clinicId);
    });

    return pilots;
  }

  /**
   * Create onboarding checklist for a clinic
   */
  static createOnboardingChecklist(clinicId: string): OnboardingChecklist {
    const checklist: OnboardingChecklist = {
      clinicId,
      steps: [
        { stepId: 'tech_01', stepName: 'System Account Setup', category: 'technical', status: 'completed', assignedTo: 'Tech Team', dueDate: '2025-02-10', completedDate: '2025-02-09', notes: ['Admin accounts created'] },
        { stepId: 'tech_02', stepName: 'Data Migration', category: 'data', status: 'in_progress', assignedTo: 'Data Team', dueDate: '2025-02-12', notes: ['Customer data import 60% complete'] },
        { stepId: 'tech_03', stepName: 'Integration Testing', category: 'technical', status: 'pending', assignedTo: 'QA Team', dueDate: '2025-02-14', notes: [] },
        { stepId: 'train_01', stepName: 'Owner Training Session', category: 'training', status: 'pending', assignedTo: 'Training Team', dueDate: '2025-02-13', notes: [] },
        { stepId: 'train_02', stepName: 'Staff Training Session', category: 'training', status: 'pending', assignedTo: 'Training Team', dueDate: '2025-02-15', notes: [] },
        { stepId: 'verify_01', stepName: 'Go-Live Verification', category: 'verification', status: 'pending', assignedTo: 'Launch Team', dueDate: '2025-02-16', notes: [] }
      ],
      completionRate: 17,
      estimatedCompletion: '2025-02-16'
    };

    this.onboardingChecklists.set(clinicId, checklist);
    return checklist;
  }

  /**
   * Update onboarding step status
   */
  static updateOnboardingStep(clinicId: string, stepId: string, status: string, notes?: string): OnboardingChecklist {
    const checklist = this.onboardingChecklists.get(clinicId)!;
    const step = checklist.steps.find(s => s.stepId === stepId);
    
    if (step) {
      step.status = status as any;
      if (status === 'completed') {
        step.completedDate = new Date().toISOString();
      }
      if (notes) {
        step.notes.push(notes);
      }
    }

    // Recalculate completion rate
    const completedSteps = checklist.steps.filter(s => s.status === 'completed').length;
    checklist.completionRate = Math.round((completedSteps / checklist.steps.length) * 100);

    this.onboardingChecklists.set(clinicId, checklist);
    return checklist;
  }

  /**
   * Update clinic metrics (simulating live data)
   */
  static updateClinicMetrics(clinicId: string, metricsUpdate: any): PilotClinicStatus {
    const clinic = this.pilotClinics.get(clinicId)!;
    
    clinic.metrics = { ...clinic.metrics, ...metricsUpdate };
    clinic.lastActivity = new Date().toISOString();
    
    // Calculate health score based on metrics
    clinic.healthScore = this.calculateHealthScore(clinic.metrics);

    this.pilotClinics.set(clinicId, clinic);
    return clinic;
  }

  /**
   * Get overall pilot launch metrics
   */
  static getPilotMetrics(): PilotMetrics {
    const clinics = Array.from(this.pilotClinics.values());
    const liveClinics = clinics.filter(c => c.currentPhase === 'live' || c.currentPhase === 'monitoring');

    return {
      overallHealth: this.determineOverallHealth(clinics),
      totalClinics: clinics.length,
      liveClinics: liveClinics.length,
      averageSatisfaction: clinics.reduce((sum, c) => sum + c.metrics.satisfactionScore, 0) / clinics.length || 0,
      totalBookings: clinics.reduce((sum, c) => sum + c.metrics.totalBookings, 0),
      totalConsultations: clinics.reduce((sum, c) => sum + c.metrics.aiConsultations, 0),
      systemUptime: 99.9,
      criticalIssues: clinics.reduce((sum, c) => sum + (c.metrics.issuesReported - c.metrics.issuesResolved), 0),
      daysSinceLaunch: 0
    };
  }

  /**
   * Go live with a pilot clinic
   */
  static goLiveClinic(clinicId: string): PilotClinicStatus {
    const clinic = this.pilotClinics.get(clinicId)!;
    
    clinic.onboardingStatus = 'completed';
    clinic.currentPhase = 'live';
    clinic.lastActivity = new Date().toISOString();

    this.pilotClinics.set(clinicId, clinic);
    return clinic;
  }

  // Helper methods
  private static calculateHealthScore(metrics: any): number {
    let score = 100;
    
    if (metrics.satisfactionScore < 4.0) score -= 20;
    if (metrics.issuesReported - metrics.issuesResolved > 5) score -= 30;
    if (metrics.dailyActiveUsers === 0 && metrics.totalBookings > 0) score -= 10;

    return Math.max(0, score);
  }

  private static determineOverallHealth(clinics: PilotClinicStatus[]): 'excellent' | 'good' | 'needs_attention' | 'critical' {
    const avgHealth = clinics.reduce((sum, c) => sum + c.healthScore, 0) / clinics.length;
    
    if (avgHealth >= 90) return 'excellent';
    if (avgHealth >= 70) return 'good';
    if (avgHealth >= 50) return 'needs_attention';
    return 'critical';
  }
}

export { PilotLaunchExecution, type PilotClinicStatus, type OnboardingChecklist, type PilotMetrics };
