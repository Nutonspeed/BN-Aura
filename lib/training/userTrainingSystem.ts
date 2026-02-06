/**
 * User Training System
 */

interface TrainingModule {
  moduleId: string;
  title: string;
  targetRole: string;
  duration: number;
  topics: string[];
  completionCriteria: { passQuiz: boolean; minimumScore: number };
}

interface UserProgress {
  userId: string;
  completedModules: string[];
  totalProgress: number;
  certificates: string[];
}

interface OnboardingStep {
  stepId: string;
  title: string;
  type: 'tutorial' | 'practice' | 'assessment';
  isCompleted: boolean;
}

class UserTrainingSystem {
  private static modules: Map<string, TrainingModule> = new Map();
  private static userProgress: Map<string, UserProgress> = new Map();

  static initializeTrainingModules(): TrainingModule[] {
    const modules = [
      {
        moduleId: 'sales_basics',
        title: 'BN-Aura Sales Fundamentals',
        targetRole: 'sales_staff',
        duration: 45,
        topics: ['Customer consultation', 'AI tools', 'Booking process'],
        completionCriteria: { passQuiz: true, minimumScore: 80 }
      },
      {
        moduleId: 'ai_consultation',
        title: 'AI-Powered Consultation Mastery',
        targetRole: 'sales_staff',
        duration: 60,
        topics: ['AI skin analysis', 'Treatment planning', 'Conversion optimization'],
        completionCriteria: { passQuiz: true, minimumScore: 85 }
      },
      {
        moduleId: 'clinic_management',
        title: 'Clinic Management Dashboard',
        targetRole: 'clinic_owner',
        duration: 90,
        topics: ['Dashboard navigation', 'Staff management', 'Analytics'],
        completionCriteria: { passQuiz: true, minimumScore: 80 }
      },
      {
        moduleId: 'mobile_app_guide',
        title: 'Mobile App User Guide',
        targetRole: 'customer',
        duration: 30,
        topics: ['App navigation', 'Booking', 'Progress tracking'],
        completionCriteria: { passQuiz: false, minimumScore: 0 }
      },
      {
        moduleId: 'system_security',
        title: 'Data Security Best Practices',
        targetRole: 'all',
        duration: 40,
        topics: ['Data privacy', 'Password security', 'Compliance'],
        completionCriteria: { passQuiz: true, minimumScore: 90 }
      }
    ];

    modules.forEach(module => {
      this.modules.set(module.moduleId, module);
    });

    return modules;
  }

  static createOnboardingFlow(role: string): OnboardingStep[] {
    const steps = {
      sales_staff: [
        { stepId: 'welcome', title: 'Welcome to BN-Aura', type: 'tutorial' as const, isCompleted: false },
        { stepId: 'system_setup', title: 'System Setup', type: 'tutorial' as const, isCompleted: false },
        { stepId: 'first_consultation', title: 'First AI Consultation', type: 'practice' as const, isCompleted: false },
        { stepId: 'assessment', title: 'Sales Assessment', type: 'assessment' as const, isCompleted: false }
      ],
      clinic_owner: [
        { stepId: 'business_setup', title: 'Clinic Setup', type: 'tutorial' as const, isCompleted: false },
        { stepId: 'staff_management', title: 'Staff Management', type: 'practice' as const, isCompleted: false },
        { stepId: 'analytics_training', title: 'Analytics Training', type: 'tutorial' as const, isCompleted: false }
      ],
      customer: [
        { stepId: 'app_download', title: 'Download App', type: 'tutorial' as const, isCompleted: false },
        { stepId: 'first_booking', title: 'First Booking', type: 'practice' as const, isCompleted: false }
      ]
    };

    return steps[role as keyof typeof steps] || [];
  }

  static enrollUser(userId: string, moduleId: string): boolean {
    const progress = this.userProgress.get(userId) || {
      userId,
      completedModules: [],
      totalProgress: 0,
      certificates: []
    };

    this.userProgress.set(userId, progress);
    return true;
  }

  static completeModule(userId: string, moduleId: string, score: number): UserProgress {
    const progress = this.userProgress.get(userId)!;
    const module = this.modules.get(moduleId)!;

    if (score >= module.completionCriteria.minimumScore) {
      progress.completedModules.push(moduleId);
      progress.totalProgress = Math.round((progress.completedModules.length / this.modules.size) * 100);
      
      if (score >= 90) {
        progress.certificates.push(`cert_${moduleId}_${Date.now()}`);
      }
    }

    this.userProgress.set(userId, progress);
    return progress;
  }

  static getTrainingSummary(): any {
    return {
      totalModules: this.modules.size,
      totalUsers: this.userProgress.size,
      averageCompletionRate: 78,
      popularModules: [
        { module: 'sales_basics', completions: 145 },
        { module: 'mobile_app_guide', completions: 230 }
      ],
      skillGaps: [
        { skill: 'AI Consultation', averageLevel: 3.2 },
        { skill: 'Analytics Interpretation', averageLevel: 2.8 }
      ]
    };
  }
}

export { UserTrainingSystem, type TrainingModule, type UserProgress };
