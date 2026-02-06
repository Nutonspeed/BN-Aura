/**
 * Webhook Integration Service for BN-Aura
 * Send events to external systems (CRM, Marketing, etc.)
 */

interface WebhookConfig {
  url: string;
  secret?: string;
  headers?: Record<string, string>;
  retryAttempts?: number;
}

interface WebhookEvent {
  type: string;
  timestamp: string;
  data: any;
  clinicId?: string;
  userId?: string;
}

interface WebhookResult {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
}

type EventType = 
  | 'analysis.completed'
  | 'analysis.saved'
  | 'appointment.created'
  | 'appointment.confirmed'
  | 'appointment.cancelled'
  | 'customer.created'
  | 'customer.updated'
  | 'treatment.completed'
  | 'payment.received'
  | 'notification.sent';

class WebhookService {
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = {
      retryAttempts: 3,
      ...config,
    };
  }

  /**
   * Send webhook event
   */
  async send(event: WebhookEvent): Promise<WebhookResult> {
    const payload = {
      event: event.type,
      timestamp: event.timestamp || new Date().toISOString(),
      data: event.data,
      metadata: {
        clinicId: event.clinicId,
        userId: event.userId,
        source: 'bn-aura',
        version: '2.0',
      },
    };

    let lastError: string | undefined;
    
    for (let attempt = 1; attempt <= (this.config.retryAttempts || 3); attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-BN-Aura-Event': event.type,
          'X-BN-Aura-Timestamp': payload.timestamp,
          ...this.config.headers,
        };

        // Add signature if secret is configured
        if (this.config.secret) {
          const signature = await this.generateSignature(JSON.stringify(payload));
          headers['X-BN-Aura-Signature'] = signature;
        }

        const response = await fetch(this.config.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const responseData = await response.json().catch(() => ({}));
          return {
            success: true,
            statusCode: response.status,
            response: responseData,
          };
        }

        lastError = `HTTP ${response.status}: ${response.statusText}`;
      } catch (error: any) {
        lastError = error.message;
      }

      // Wait before retry (exponential backoff)
      if (attempt < (this.config.retryAttempts || 3)) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return {
      success: false,
      error: lastError,
    };
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private async generateSignature(payload: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.config.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Send analysis completed event
   */
  async sendAnalysisCompleted(data: {
    analysisId: string;
    customerId?: string;
    customerName: string;
    overallScore: number;
    skinAge: number;
    concerns: string[];
    recommendations: string[];
  }): Promise<WebhookResult> {
    return this.send({
      type: 'analysis.completed',
      timestamp: new Date().toISOString(),
      data,
    });
  }

  /**
   * Send appointment created event
   */
  async sendAppointmentCreated(data: {
    appointmentId: string;
    customerId: string;
    customerName: string;
    treatmentId: string;
    treatmentName: string;
    scheduledAt: string;
    staffId?: string;
  }): Promise<WebhookResult> {
    return this.send({
      type: 'appointment.created',
      timestamp: new Date().toISOString(),
      data,
    });
  }

  /**
   * Send customer created event
   */
  async sendCustomerCreated(data: {
    customerId: string;
    fullName: string;
    email?: string;
    phone?: string;
    source: string;
    assignedSalesId?: string;
  }): Promise<WebhookResult> {
    return this.send({
      type: 'customer.created',
      timestamp: new Date().toISOString(),
      data,
    });
  }

  /**
   * Send treatment completed event
   */
  async sendTreatmentCompleted(data: {
    treatmentId: string;
    customerId: string;
    customerName: string;
    treatmentName: string;
    completedAt: string;
    staffId: string;
    notes?: string;
  }): Promise<WebhookResult> {
    return this.send({
      type: 'treatment.completed',
      timestamp: new Date().toISOString(),
      data,
    });
  }
}

// Webhook Manager for multiple endpoints
class WebhookManager {
  private webhooks: Map<string, WebhookService> = new Map();

  /**
   * Register a webhook endpoint
   */
  register(name: string, config: WebhookConfig): void {
    this.webhooks.set(name, new WebhookService(config));
  }

  /**
   * Unregister a webhook endpoint
   */
  unregister(name: string): void {
    this.webhooks.delete(name);
  }

  /**
   * Send event to all registered webhooks
   */
  async broadcast(event: WebhookEvent): Promise<Map<string, WebhookResult>> {
    const results = new Map<string, WebhookResult>();
    
    const promises = Array.from(this.webhooks.entries()).map(async ([name, service]) => {
      const result = await service.send(event);
      results.set(name, result);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Send event to specific webhook
   */
  async sendTo(name: string, event: WebhookEvent): Promise<WebhookResult | null> {
    const service = this.webhooks.get(name);
    if (!service) return null;
    return service.send(event);
  }

  /**
   * Get registered webhook names
   */
  getRegistered(): string[] {
    return Array.from(this.webhooks.keys());
  }
}

// Factory function
function createWebhookService(url: string, secret?: string): WebhookService {
  return new WebhookService({ url, secret });
}

function createWebhookManager(): WebhookManager {
  return new WebhookManager();
}

export { 
  WebhookService, 
  WebhookManager, 
  createWebhookService, 
  createWebhookManager 
};
export type { WebhookConfig, WebhookEvent, WebhookResult, EventType };
