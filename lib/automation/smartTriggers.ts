import { createClient } from '@/lib/supabase/client';
import { notificationEngine, NotificationType, NotificationChannel } from '@/lib/notifications/notificationEngine';
import { sendEmail, sendTemplateEmail } from '@/lib/email/resendService';

export interface AutomationRule {
  id: string;
  name: string;
  trigger: {
    type: 'lead_score' | 'churn_risk' | 'inactivity';
    condition: string; // e.g., "score >= 80"
    value: number;
  };
  action: {
    type: 'notify_sales' | 'send_email' | 'create_task';
    config: any;
  };
  isActive: boolean;
}

// Default Rules
export const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'hot-lead-alert',
    name: 'Hot Lead Alert',
    trigger: {
      type: 'lead_score',
      condition: '>=',
      value: 80
    },
    action: {
      type: 'notify_sales',
      config: {
        message: '🔥 Hot lead detected! Immediate follow-up recommended.',
        priority: 'high'
      }
    },
    isActive: true
  },
  {
    id: 'churn-risk-warning',
    name: 'Churn Risk Warning',
    trigger: {
      type: 'churn_risk',
      condition: '>=',
      value: 70
    },
    action: {
      type: 'notify_sales',
      config: {
        message: '⚠️ High churn risk detected. Consider re-engagement campaign.',
        priority: 'medium'
      }
    },
    isActive: true
  },
  {
    id: 'churn-prevention-email',
    name: 'Churn Prevention Email',
    trigger: {
      type: 'churn_risk',
      condition: '>=',
      value: 80
    },
    action: {
      type: 'send_email',
      config: {
        subject: 'We miss you! Exclusive offer inside.',
        templateId: 'win_back_offer', // This would map to a real template
        message: 'Hi there, we noticed you haven\'t visited in a while. Here is a 20% discount on your next treatment!',
        to_role: 'customer' // 'customer' or specific email
      }
    },
    isActive: true
  }
];

export class AutomationEngine {
  private supabase = createClient();

  async checkLeadTriggers(leadId: string, leadScore: number, clinicId: string) {
    const rules = DEFAULT_RULES.filter(r => r.trigger.type === 'lead_score' && r.isActive);

    for (const rule of rules) {
      if (this.evaluateCondition(leadScore, rule.trigger.condition, rule.trigger.value)) {
        await this.executeAction(rule.action, { leadId, score: leadScore, clinicId });
      }
    }
  }

  async checkChurnTriggers(customerId: string, churnScore: number, clinicId: string) {
    const rules = DEFAULT_RULES.filter(r => r.trigger.type === 'churn_risk' && r.isActive);

    for (const rule of rules) {
      if (this.evaluateCondition(churnScore, rule.trigger.condition, rule.trigger.value)) {
        await this.executeAction(rule.action, { customerId, score: churnScore, clinicId });
      }
    }
  }

  private evaluateCondition(actual: number, operator: string, target: number): boolean {
    switch (operator) {
      case '>=': return actual >= target;
      case '>': return actual > target;
      case '<=': return actual <= target;
      case '<': return actual < target;
      case '==': return actual === target;
      default: return false;
    }
  }

  private async executeAction(action: AutomationRule['action'], context: any) {
    console.log(`Executing automation action: ${action.type}`, context);

    switch (action.type) {
      case 'notify_sales':
        await notificationEngine.sendNotification({
          type: NotificationType.HOT_LEAD_ASSIGNED, // Reusing existing type or add GENERIC_ALERT
          title: 'Automation Alert',
          message: action.config.message,
          priority: action.config.priority || 'medium',
          channels: [NotificationChannel.IN_APP],
          clinicId: context.clinicId
        });
        break;
      
      case 'create_task':
        // Task creation handled by workflowEngine module
        console.log('Creating task:', action.config);
        break;

      case 'send_email':
        // If target is customer, fetch their email
        let toAddress = action.config.to;
        
        if (action.config.to_role === 'customer' && context.customerId) {
          const { data: customer } = await this.supabase
            .from('customers')
            .select('email')
            .eq('id', context.customerId)
            .single();
          
          if (customer?.email) {
            toAddress = customer.email;
          }
        } else if (action.config.to_role === 'sales_assigned' && context.leadId) {
           // Fetch sales staff email for lead...
           // Not implemented fully here, but placeholder
        }

        if (toAddress) {
          if (action.config.templateId) {
             // Mock template usage - in reality, we'd load an HTML template
             const html = `<div><h1>${action.config.subject}</h1><p>${action.config.message}</p></div>`;
             await sendTemplateEmail(toAddress, action.config.subject, html);
          } else {
             await sendEmail(toAddress, action.config.subject, action.config.message);
          }
          console.log(`Email sent to ${toAddress}`);
        } else {
          console.warn('No recipient found for email action');
        }
        break;
    }
  }
}

export const automationEngine = new AutomationEngine();
