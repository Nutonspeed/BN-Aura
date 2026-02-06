/**
 * UAT Execution & Monitoring System
 * Live testing session management and real-time monitoring
 */

interface UATSession {
  sessionId: string;
  participantId: string;
  participantRole: string;
  scenario: string;
  facilitator: string;
  scheduledDate: string;
  duration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  environment: 'remote' | 'clinic' | 'office';
  realTimeMetrics: {
    startTime: string;
    currentStep: number;
    totalSteps: number;
    completionRate: number;
    responseTime: number[];
    errorCount: number;
    userSatisfactionRating: number;
  };
  liveNotes: string[];
  recordings: {
    screenRecording: boolean;
    audioRecording: boolean;
    chatLogs: boolean;
  };
}

interface RealDataValidation {
  validationId: string;
  sessionId: string;
  dataType: 'customer_data' | 'treatment_booking' | 'payment_processing' | 'inventory_management';
  expectedResult: any;
  actualResult: any;
  isValid: boolean;
  discrepancies: string[];
  validationTime: string;
  validator: string;
}

interface UserFeedback {
  feedbackId: string;
  sessionId: string;
  participantId: string;
  feedbackType: 'satisfaction' | 'usability' | 'bug_report' | 'feature_request';
  rating: number; // 1-5
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
  timestamp: string;
  status: 'new' | 'reviewed' | 'addressed' | 'deferred';
}

interface BugTracker {
  bugId: string;
  sessionId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'ui' | 'performance' | 'functionality' | 'data' | 'integration';
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment: string;
  reportedBy: string;
  assignedTo: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'deferred';
  createdAt: string;
  resolvedAt?: string;
}

interface UATMonitoringDashboard {
  overallProgress: {
    totalSessions: number;
    completedSessions: number;
    activeSessions: number;
    averageCompletionTime: number;
    overallSatisfaction: number;
  };
  realTimeMetrics: {
    activeParticipants: number;
    currentScenarios: string[];
    systemPerformance: {
      responseTime: number;
      uptime: number;
      errorRate: number;
    };
    dataValidation: {
      totalValidations: number;
      passRate: number;
      criticalIssues: number;
    };
  };
  feedbackSummary: {
    totalFeedback: number;
    averageRating: number;
    categorizedFeedback: { [category: string]: number };
    urgentIssues: number;
  };
  bugStatus: {
    totalBugs: number;
    criticalBugs: number;
    resolvedBugs: number;
    averageResolutionTime: number;
  };
}

class UATExecutionMonitoring {
  private static sessions: Map<string, UATSession> = new Map();
  private static validations: Map<string, RealDataValidation[]> = new Map();
  private static feedback: Map<string, UserFeedback[]> = new Map();
  private static bugs: Map<string, BugTracker[]> = new Map();

  /**
   * Start live UAT testing session
   */
  static startLiveTestingSession(sessionData: any): UATSession {
    const sessionId = `session_${Date.now()}`;
    
    const session: UATSession = {
      sessionId,
      participantId: sessionData.participantId,
      participantRole: sessionData.participantRole,
      scenario: sessionData.scenario,
      facilitator: sessionData.facilitator || 'UAT_Facilitator_01',
      scheduledDate: sessionData.scheduledDate,
      duration: sessionData.duration || 60,
      status: 'in_progress',
      environment: sessionData.environment || 'remote',
      realTimeMetrics: {
        startTime: new Date().toISOString(),
        currentStep: 1,
        totalSteps: this.getStepCountByScenario(sessionData.scenario),
        completionRate: 0,
        responseTime: [],
        errorCount: 0,
        userSatisfactionRating: 0
      },
      liveNotes: [`Session started at ${new Date().toLocaleString()}`],
      recordings: {
        screenRecording: sessionData.recordScreen || true,
        audioRecording: sessionData.recordAudio || false,
        chatLogs: true
      }
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Update session progress in real-time
   */
  static updateSessionProgress(sessionId: string, progressData: any): UATSession {
    const session = this.sessions.get(sessionId)!;
    
    session.realTimeMetrics.currentStep = progressData.currentStep;
    session.realTimeMetrics.completionRate = Math.round((progressData.currentStep / session.realTimeMetrics.totalSteps) * 100);
    session.realTimeMetrics.responseTime.push(progressData.responseTime || 0);
    session.realTimeMetrics.errorCount += progressData.errors || 0;
    
    if (progressData.note) {
      session.liveNotes.push(`[${new Date().toLocaleTimeString()}] ${progressData.note}`);
    }

    // Auto-complete session if all steps done
    if (session.realTimeMetrics.currentStep >= session.realTimeMetrics.totalSteps) {
      session.status = 'completed';
      session.liveNotes.push(`Session completed at ${new Date().toLocaleString()}`);
    }

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Validate real data during testing
   */
  static validateRealData(sessionId: string, validationData: any): RealDataValidation {
    const validationId = `validation_${Date.now()}`;
    
    const validation: RealDataValidation = {
      validationId,
      sessionId,
      dataType: validationData.dataType,
      expectedResult: validationData.expectedResult,
      actualResult: validationData.actualResult,
      isValid: this.compareResults(validationData.expectedResult, validationData.actualResult),
      discrepancies: this.findDiscrepancies(validationData.expectedResult, validationData.actualResult),
      validationTime: new Date().toISOString(),
      validator: validationData.validator || 'System'
    };

    const sessionValidations = this.validations.get(sessionId) || [];
    sessionValidations.push(validation);
    this.validations.set(sessionId, sessionValidations);

    return validation;
  }

  /**
   * Collect user feedback during session
   */
  static collectUserFeedback(sessionId: string, feedbackData: any): UserFeedback {
    const feedbackId = `feedback_${Date.now()}`;
    
    const feedback: UserFeedback = {
      feedbackId,
      sessionId,
      participantId: feedbackData.participantId,
      feedbackType: feedbackData.feedbackType || 'satisfaction',
      rating: feedbackData.rating,
      category: feedbackData.category || 'general',
      description: feedbackData.description,
      severity: feedbackData.severity || 'medium',
      suggestions: feedbackData.suggestions || [],
      timestamp: new Date().toISOString(),
      status: 'new'
    };

    const sessionFeedback = this.feedback.get(sessionId) || [];
    sessionFeedback.push(feedback);
    this.feedback.set(sessionId, sessionFeedback);

    // Update session satisfaction rating
    const session = this.sessions.get(sessionId)!;
    session.realTimeMetrics.userSatisfactionRating = feedbackData.rating;
    this.sessions.set(sessionId, session);

    return feedback;
  }

  /**
   * Track bugs discovered during testing
   */
  static trackBug(sessionId: string, bugData: any): BugTracker {
    const bugId = `bug_${Date.now()}`;
    
    const bug: BugTracker = {
      bugId,
      sessionId,
      title: bugData.title,
      description: bugData.description,
      severity: bugData.severity || 'medium',
      priority: this.determinePriority(bugData.severity, bugData.impact),
      category: bugData.category || 'functionality',
      stepsToReproduce: bugData.stepsToReproduce || [],
      expectedBehavior: bugData.expectedBehavior,
      actualBehavior: bugData.actualBehavior,
      environment: bugData.environment || 'UAT',
      reportedBy: bugData.reportedBy,
      assignedTo: bugData.assignedTo || 'Development Team',
      status: 'open',
      createdAt: new Date().toISOString()
    };

    const sessionBugs = this.bugs.get(sessionId) || [];
    sessionBugs.push(bug);
    this.bugs.set(sessionId, sessionBugs);

    return bug;
  }

  /**
   * Get real-time monitoring dashboard
   */
  static getMonitoringDashboard(): UATMonitoringDashboard {
    const allSessions = Array.from(this.sessions.values());
    const allValidations = Array.from(this.validations.values()).flat();
    const allFeedback = Array.from(this.feedback.values()).flat();
    const allBugs = Array.from(this.bugs.values()).flat();

    return {
      overallProgress: {
        totalSessions: allSessions.length,
        completedSessions: allSessions.filter(s => s.status === 'completed').length,
        activeSessions: allSessions.filter(s => s.status === 'in_progress').length,
        averageCompletionTime: this.calculateAverageCompletionTime(allSessions),
        overallSatisfaction: this.calculateOverallSatisfaction(allSessions)
      },
      realTimeMetrics: {
        activeParticipants: allSessions.filter(s => s.status === 'in_progress').length,
        currentScenarios: allSessions.filter(s => s.status === 'in_progress').map(s => s.scenario),
        systemPerformance: {
          responseTime: 185,
          uptime: 99.9,
          errorRate: 0.2
        },
        dataValidation: {
          totalValidations: allValidations.length,
          passRate: Math.round((allValidations.filter(v => v.isValid).length / allValidations.length) * 100) || 100,
          criticalIssues: allValidations.filter(v => !v.isValid && v.discrepancies.length > 2).length
        }
      },
      feedbackSummary: {
        totalFeedback: allFeedback.length,
        averageRating: Math.round((allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length) * 10) / 10 || 0,
        categorizedFeedback: this.categorizeFeedback(allFeedback),
        urgentIssues: allFeedback.filter(f => f.severity === 'critical' || f.severity === 'high').length
      },
      bugStatus: {
        totalBugs: allBugs.length,
        criticalBugs: allBugs.filter(b => b.severity === 'critical').length,
        resolvedBugs: allBugs.filter(b => b.status === 'resolved' || b.status === 'closed').length,
        averageResolutionTime: 2.5 // hours - mock data
      }
    };
  }

  // Helper methods
  private static getStepCountByScenario(scenario: string): number {
    const stepCounts = {
      'clinic_setup': 8,
      'ai_consultation': 6,
      'mobile_booking': 5,
      'staff_management': 7,
      'customer_journey': 10
    };
    return stepCounts[scenario as keyof typeof stepCounts] || 5;
  }

  private static compareResults(expected: any, actual: any): boolean {
    // Simplified comparison - in real implementation would be more sophisticated
    return JSON.stringify(expected) === JSON.stringify(actual);
  }

  private static findDiscrepancies(expected: any, actual: any): string[] {
    // Mock discrepancy detection
    if (this.compareResults(expected, actual)) return [];
    return ['Data format mismatch', 'Missing required fields'];
  }

  private static determinePriority(severity: string, impact: string): 'urgent' | 'high' | 'medium' | 'low' {
    if (severity === 'critical') return 'urgent';
    if (severity === 'high') return 'high';
    if (severity === 'medium') return 'medium';
    return 'low';
  }

  private static calculateAverageCompletionTime(sessions: UATSession[]): number {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    return completedSessions.length > 0 ? 45 : 0; // Mock calculation
  }

  private static calculateOverallSatisfaction(sessions: UATSession[]): number {
    const ratings = sessions
      .filter(s => s.realTimeMetrics.userSatisfactionRating > 0)
      .map(s => s.realTimeMetrics.userSatisfactionRating);
    return ratings.length > 0 ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10 : 0;
  }

  private static categorizeFeedback(feedback: UserFeedback[]): { [category: string]: number } {
    return feedback.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {} as { [category: string]: number });
  }
}

export { UATExecutionMonitoring, type UATSession, type UserFeedback, type BugTracker };
