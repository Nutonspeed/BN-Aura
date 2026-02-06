/**
 * BN-Aura CRM Integration Hooks
 * Provides hooks for integrating with external CRM systems
 */

export interface CRMConfig {
  provider: 'hubspot' | 'salesforce' | 'zoho' | 'custom';
  apiKey?: string;
  apiUrl?: string;
  enabled: boolean;
}

export interface CRMContact {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  clinicId: string;
  customFields?: Record<string, unknown>;
}

export interface CRMDeal {
  id?: string;
  contactId: string;
  title: string;
  amount: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'won' | 'lost';
  treatment?: string;
}

export interface CRMEvent {
  type: 'contact_created' | 'deal_created' | 'analysis_completed' | 'booking_made';
  data: Record<string, unknown>;
  timestamp: string;
}

// CRM Integration Hook
export function useCRMIntegration(config: CRMConfig) {
  const syncContact = async (contact: CRMContact): Promise<{ success: boolean; externalId?: string }> => {
    if (!config.enabled) return { success: true };

    try {
      const response = await fetch('/api/integrations/crm/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config.provider, contact }),
      });
      const data = await response.json();
      return { success: data.success, externalId: data.externalId };
    } catch (error) {
      console.error('CRM sync failed:', error);
      return { success: false };
    }
  };

  const syncDeal = async (deal: CRMDeal): Promise<{ success: boolean; externalId?: string }> => {
    if (!config.enabled) return { success: true };

    try {
      const response = await fetch('/api/integrations/crm/deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config.provider, deal }),
      });
      const data = await response.json();
      return { success: data.success, externalId: data.externalId };
    } catch (error) {
      console.error('CRM deal sync failed:', error);
      return { success: false };
    }
  };

  const trackEvent = async (event: CRMEvent): Promise<void> => {
    if (!config.enabled) return;

    try {
      await fetch('/api/integrations/crm/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config.provider, event }),
      });
    } catch (error) {
      console.error('CRM event tracking failed:', error);
    }
  };

  return { syncContact, syncDeal, trackEvent };
}

// HubSpot specific integration
export const hubspotAdapter = {
  mapContact: (contact: CRMContact) => ({
    email: contact.email,
    firstname: contact.firstName,
    lastname: contact.lastName,
    phone: contact.phone,
    clinic_id: contact.clinicId,
  }),

  mapDeal: (deal: CRMDeal) => ({
    dealname: deal.title,
    amount: deal.amount.toString(),
    dealstage: deal.stage,
    treatment_type: deal.treatment,
  }),
};

// Salesforce specific integration
export const salesforceAdapter = {
  mapContact: (contact: CRMContact) => ({
    Email: contact.email,
    FirstName: contact.firstName,
    LastName: contact.lastName,
    Phone: contact.phone,
    Clinic_ID__c: contact.clinicId,
  }),

  mapDeal: (deal: CRMDeal) => ({
    Name: deal.title,
    Amount: deal.amount,
    StageName: deal.stage,
    Treatment_Type__c: deal.treatment,
  }),
};

export default { useCRMIntegration, hubspotAdapter, salesforceAdapter };
