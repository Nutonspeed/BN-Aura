/**
 * Real-time AI Coaching System
 * Provides real-time guidance and coaching during aesthetic treatments
 * Uses computer vision, voice recognition, and AI to enhance treatment quality
 */

import { createClient } from '@/lib/supabase/server';

export interface CoachingSession {
  id: string;
  treatmentId: string;
  customerId: string;
  staffId: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  treatmentType: string;
  currentStep: string;
  progress: number; // 0-100
}

export interface CoachingEvent {
  id: string;
  sessionId: string;
  timestamp: string;
  eventType: 'guidance' | 'warning' | 'correction' | 'recommendation' | 'checkpoint';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  confidence: number; // 0-100
  data?: any; // Additional event data
  acknowledged: boolean;
}

export interface TreatmentStep {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  requirements: string[];
  checkpoints: Checkpoint[];
  commonIssues: CommonIssue[];
  tips: string[];
}

export interface Checkpoint {
  id: string;
  name: string;
  description: string;
  position: number; // 0-100, where in the step this should occur
  criteria: string[];
  tolerance: number; // Acceptable deviation
}

export interface CommonIssue {
  id: string;
  name: string;
  description: string;
  symptoms: string[];
  causes: string[];
  solutions: string[];
  prevention: string[];
}

export interface RealtimeFeedback {
  timestamp: string;
  type: 'posture' | 'technique' | 'pressure' | 'timing' | 'safety';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion: string;
  confidence: number;
}

export interface VoiceCommand {
  command: string;
  intent: 'pause' | 'resume' | 'repeat' | 'help' | 'next_step' | 'previous_step' | 'adjust_pressure' | 'check_status';
  confidence: number;
  timestamp: string;
}

class RealtimeAICoach {
  private activeSessions: Map<string, CoachingSession> = new Map();
  private treatmentSteps: Map<string, TreatmentStep[]> = new Map();
  private voiceCommands: Map<string, string[]> = new Map();
  
  constructor() {
    this.initializeTreatmentSteps();
    this.initializeVoiceCommands();
  }

  private initializeTreatmentSteps() {
    // Initialize treatment steps for different treatment types
    const steps: Record<string, TreatmentStep[]> = {
      'facial_treatment': [
        {
          id: 'cleanse',
          name: 'Cleansing',
          description: 'Thoroughly cleanse the skin',
          duration: 120,
          requirements: ['Cleansing product', 'Cotton pads', 'Warm water'],
          checkpoints: [
            {
              id: 'cleanse_start',
              name: 'Start Cleansing',
              description: 'Begin cleansing process',
              position: 0,
              criteria: ['Product applied', 'Gentle circular motions'],
              tolerance: 10
            },
            {
              id: 'cleanse_complete',
              name: 'Complete Cleansing',
              description: 'Finish cleansing process',
              position: 90,
              criteria: ['All areas covered', 'Product removed'],
              tolerance: 5
            }
          ],
          commonIssues: [
            {
              id: 'harsh_cleansing',
              name: 'Harsh Cleansing',
              description: 'Using too much pressure or harsh products',
              symptoms: ['Redness', 'Irritation', 'Discomfort'],
              causes: ['Excessive pressure', 'Wrong product', 'Hot water'],
              solutions: ['Use gentle pressure', 'Switch to mild cleanser', 'Use lukewarm water'],
              prevention: ['Train on proper technique', 'Use appropriate products']
            }
          ],
          tips: [
            'Use gentle circular motions',
            'Avoid eye area',
            'Rinse thoroughly'
          ]
        },
        {
          id: 'exfoliate',
          name: 'Exfoliation',
          description: 'Remove dead skin cells',
          duration: 180,
          requirements: ['Exfoliating product', 'Brush or sponge'],
          checkpoints: [
            {
              id: 'exfoliate_start',
              name: 'Start Exfoliation',
              description: 'Begin exfoliation process',
              position: 0,
              criteria: ['Product ready', 'Client comfortable'],
              tolerance: 10
            },
            {
              id: 'exfoliate_complete',
              name: 'Complete Exfoliation',
              description: 'Finish exfoliation process',
              position: 90,
              criteria: ['All areas treated', 'Product removed'],
              tolerance: 5
            }
          ],
          commonIssues: [
            {
              id: 'over_exfoliation',
              name: 'Over-exfoliation',
              description: 'Exfoliating too aggressively',
              symptoms: ['Redness', 'Peeling', 'Sensitivity'],
              causes: ['Too much pressure', 'Wrong frequency', 'Harsh product'],
              solutions: ['Reduce pressure', 'Increase intervals', 'Use milder product'],
              prevention: ['Follow recommended frequency', 'Use appropriate products']
            }
          ],
          tips: [
            'Use gentle pressure',
            'Avoid sensitive areas',
            'Rinse thoroughly'
          ]
        }
      ],
      'laser_treatment': [
        {
          id: 'preparation',
          name: 'Preparation',
          description: 'Prepare skin and equipment',
          duration: 300,
          requirements: ['Laser device', 'Protective eyewear', 'Cooling gel'],
          checkpoints: [
            {
              id: 'prep_start',
              name: 'Start Preparation',
              description: 'Begin preparation process',
              position: 0,
              criteria: ['Equipment ready', 'Client protected'],
              tolerance: 5
            },
            {
              id: 'prep_complete',
              name: 'Complete Preparation',
              description: 'Finish preparation process',
              position: 90,
              criteria: ['Area cleaned', 'Gel applied'],
              tolerance: 5
            }
          ],
          commonIssues: [
            {
              id: 'improper_preparation',
              name: 'Improper Preparation',
              description: 'Inadequate preparation before treatment',
              symptoms: ['Uneven treatment', 'Client discomfort', 'Reduced effectiveness'],
              causes: ['Rushed preparation', 'Missing steps', 'Wrong products'],
              solutions: ['Follow checklist', 'Take adequate time', 'Use correct products'],
              prevention: ['Standardize preparation process', 'Regular training']
            }
          ],
          tips: [
            'Follow manufacturer guidelines',
            'Test equipment before use',
            'Ensure client comfort'
          ]
        }
      ],
      'injectable_treatment': [
        {
          id: 'consultation',
          name: 'Consultation',
          description: 'Consult with client about treatment',
          duration: 600,
          requirements: ['Treatment plan', 'Consent form', 'Medical history'],
          checkpoints: [
            {
              id: 'consult_start',
              name: 'Start Consultation',
              description: 'Begin consultation process',
              position: 0,
              criteria: ['Client ready', 'Documents prepared'],
              tolerance: 10
            },
            {
              id: 'consult_complete',
              name: 'Complete Consultation',
              description: 'Finish consultation process',
              position: 90,
              criteria: ['Consent obtained', 'Questions answered'],
              tolerance: 5
            }
          ],
          commonIssues: [
            {
              id: 'incomplete_consultation',
              name: 'Incomplete Consultation',
              description: 'Missing important consultation steps',
              symptoms: ['Client uncertainty', 'Legal issues', 'Poor outcomes'],
              causes: ['Rushed process', 'Missing information', 'Poor communication'],
              solutions: ['Use consultation checklist', 'Allow adequate time', 'Improve communication'],
              prevention: ['Standardize consultation process', 'Regular training']
            }
          ],
          tips: [
            'Listen to client concerns',
            'Explain risks and benefits',
            'Document everything'
          ]
        }
      ]
    };

    Object.entries(steps).forEach(([treatmentType, stepList]) => {
      this.treatmentSteps.set(treatmentType, stepList);
    });
  }

  private initializeVoiceCommands() {
    const commands: Record<string, string[]> = {
      'facial_treatment': [
        'pause cleansing',
        'resume cleansing',
        'repeat instructions',
        'next step',
        'check progress',
        'adjust pressure',
        'help cleansing'
      ],
      'laser_treatment': [
        'pause laser',
        'resume laser',
        'check settings',
        'adjust power',
        'emergency stop',
        'next area',
        'help laser'
      ],
      'injectable_treatment': [
        'pause injection',
        'resume injection',
        'check dosage',
        'adjust needle',
        'next injection',
        'help injection'
      ]
    };

    Object.entries(commands).forEach(([treatmentType, commandList]) => {
      this.voiceCommands.set(treatmentType, commandList);
    });
  }

  /**
   * Start a new coaching session
   */
  async startCoachingSession(
    treatmentId: string,
    customerId: string,
    staffId: string,
    treatmentType: string
  ): Promise<CoachingSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CoachingSession = {
      id: sessionId,
      treatmentId,
      customerId,
      staffId,
      startTime: new Date().toISOString(),
      status: 'active',
      treatmentType,
      currentStep: 'preparation',
      progress: 0
    };

    this.activeSessions.set(sessionId, session);

    // Store session in database
    await this.storeSession(session);

    // Log session start
    await this.logCoachingEvent(sessionId, {
      eventType: 'checkpoint',
      severity: 'low',
      message: `Coaching session started for ${treatmentType}`,
      confidence: 100
    });

    return session;
  }

  /**
   * Process real-time feedback from computer vision
   */
  async processRealtimeFeedback(
    sessionId: string,
    feedback: RealtimeFeedback
  ): Promise<CoachingEvent[]> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'active') {
      throw new Error('Session not found or not active');
    }

    const events: CoachingEvent[] = [];

    // Analyze feedback and generate coaching events
    if (feedback.type === 'posture' && feedback.severity === 'error') {
      events.push(await this.createCoachingEvent(sessionId, {
        eventType: 'correction',
        severity: 'high',
        message: feedback.message,
        confidence: feedback.confidence,
        data: { feedbackType: feedback.type, suggestion: feedback.suggestion }
      }));
    }

    if (feedback.type === 'technique' && feedback.severity === 'warning') {
      events.push(await this.createCoachingEvent(sessionId, {
        eventType: 'guidance',
        severity: 'medium',
        message: feedback.message,
        confidence: feedback.confidence,
        data: { feedbackType: feedback.type, suggestion: feedback.suggestion }
      }));
    }

    if (feedback.type === 'safety' && feedback.severity === 'error') {
      events.push(await this.createCoachingEvent(sessionId, {
        eventType: 'warning',
        severity: 'critical',
        message: feedback.message,
        confidence: feedback.confidence,
        data: { feedbackType: feedback.type, suggestion: feedback.suggestion }
      }));
    }

    return events;
  }

  /**
   * Process voice command
   */
  async processVoiceCommand(
    sessionId: string,
    command: VoiceCommand
  ): Promise<CoachingEvent> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'active') {
      throw new Error('Session not found or not active');
    }

    let responseMessage = '';
    const eventType: CoachingEvent['eventType'] = 'guidance';

    switch (command.intent) {
      case 'pause':
        await this.pauseSession(sessionId);
        responseMessage = 'Session paused';
        break;
      
      case 'resume':
        await this.resumeSession(sessionId);
        responseMessage = 'Session resumed';
        break;
      
      case 'help':
        responseMessage = this.getCurrentStepHelp(session);
        break;
      
      case 'next_step':
        await this.moveToNextStep(sessionId);
        responseMessage = 'Moving to next step';
        break;
      
      case 'check_status':
        responseMessage = this.getSessionStatus(session);
        break;
      
      default:
        responseMessage = 'Command not recognized';
        break;
    }

    return await this.createCoachingEvent(sessionId, {
      eventType,
      severity: 'low',
      message: responseMessage,
      confidence: command.confidence,
      data: { voiceCommand: command.command, intent: command.intent }
    });
  }

  /**
   * Get current coaching events for a session
   */
  async getSessionEvents(sessionId: string): Promise<CoachingEvent[]> {
    try {
      const supabase = await createClient();
      
      const { data } = await supabase
        .from('coaching_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(50);

      return data || [];
    } catch (error) {
      console.error('Failed to get session events:', error);
      return [];
    }
  }

  /**
   * Update session progress
   */
  async updateSessionProgress(
    sessionId: string,
    progress: number,
    currentStep?: string
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.progress = progress;
    if (currentStep) {
      session.currentStep = currentStep;
    }

    this.activeSessions.set(sessionId, session);
    await this.storeSession(session);
  }

  /**
   * Complete coaching session
   */
  async completeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.status = 'completed';
    session.endTime = new Date().toISOString();
    session.progress = 100;

    this.activeSessions.set(sessionId, session);
    await this.storeSession(session);

    // Log session completion
    await this.logCoachingEvent(sessionId, {
      eventType: 'checkpoint',
      severity: 'low',
      message: 'Coaching session completed successfully',
      confidence: 100
    });
  }

  // Private helper methods
  private async createCoachingEvent(
    sessionId: string,
    eventData: Partial<CoachingEvent>
  ): Promise<CoachingEvent> {
    const event: CoachingEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      timestamp: new Date().toISOString(),
      eventType: eventData.eventType || 'guidance',
      severity: eventData.severity || 'low',
      message: eventData.message || '',
      confidence: eventData.confidence || 50,
      data: eventData.data,
      acknowledged: false
    };

    // Store event in database
    await this.storeEvent(event);

    return event;
  }

  private async storeSession(session: CoachingSession): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('coaching_sessions')
        .upsert({
          id: session.id,
          treatment_id: session.treatmentId,
          customer_id: session.customerId,
          staff_id: session.staffId,
          start_time: session.startTime,
          end_time: session.endTime,
          status: session.status,
          treatment_type: session.treatmentType,
          current_step: session.currentStep,
          progress: session.progress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  private async storeEvent(event: CoachingEvent): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('coaching_events')
        .insert({
          id: event.id,
          session_id: event.sessionId,
          timestamp: event.timestamp,
          event_type: event.eventType,
          severity: event.severity,
          message: event.message,
          confidence: event.confidence,
          data: event.data,
          acknowledged: event.acknowledged,
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Failed to store event:', error);
    }
  }

  private async logCoachingEvent(
    sessionId: string,
    eventData: Partial<CoachingEvent>
  ): Promise<void> {
    await this.createCoachingEvent(sessionId, eventData);
  }

  private async pauseSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.status = 'paused';
    this.activeSessions.set(sessionId, session);
    await this.storeSession(session);
  }

  private async resumeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.status = 'active';
    this.activeSessions.set(sessionId, session);
    await this.storeSession(session);
  }

  private getCurrentStepHelp(session: CoachingSession): string {
    const steps = this.treatmentSteps.get(session.treatmentType);
    if (!steps) return 'No help available for this treatment type';

    const currentStepData = steps.find(step => step.id === session.currentStep);
    if (!currentStepData) return 'Current step not found';

    return currentStepData.description + '. Tips: ' + currentStepData.tips.join('. ');
  }

  private getSessionStatus(session: CoachingSession): string {
    return `Session ${session.status}, Progress: ${session.progress}%, Current step: ${session.currentStep}`;
  }

  private async moveToNextStep(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const steps = this.treatmentSteps.get(session.treatmentType);
    if (!steps) return;

    const currentIndex = steps.findIndex(step => step.id === session.currentStep);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      session.currentStep = nextStep.id;
      session.progress = ((currentIndex + 1) / steps.length) * 100;
      
      this.activeSessions.set(sessionId, session);
      await this.storeSession(session);
    }
  }

  // Public methods for external access
  getActiveSession(sessionId: string): CoachingSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  getAllActiveSessions(): CoachingSession[] {
    return Array.from(this.activeSessions.values());
  }

  getTreatmentSteps(treatmentType: string): TreatmentStep[] {
    return this.treatmentSteps.get(treatmentType) || [];
  }

  getVoiceCommands(treatmentType: string): string[] {
    return this.voiceCommands.get(treatmentType) || [];
  }
}

export { RealtimeAICoach };
