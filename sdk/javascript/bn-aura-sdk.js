/**
 * BN-Aura Beauty Clinic API SDK for JavaScript/TypeScript
 * Official SDK for integrating with BN-Aura beauty clinic management system
 * @version 1.0.0
 */

class BNAuraSDK {
  constructor(config) {
    this.baseURL = config.baseURL || 'https://api.bn-aura.com/v1';
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Make HTTP request with authentication
   */
  async makeRequest(endpoint, method = 'GET', data = null, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'BN-Aura-SDK-JS/1.0.0'
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url.toString(), options);
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(`API Error: ${responseData.error || response.statusText}`);
      }

      return responseData;
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  /**
   * AI Sales Assistant Methods
   */
  async generateConsultation(customerId, skinAnalysis, preferences = {}) {
    return await this.makeRequest('/ai/sales-assistant', 'POST', {
      customerId,
      skinAnalysis,
      preferences
    }, { action: 'consultation' });
  }

  async getProductRecommendations(customerId, skinType, budget, concerns = []) {
    return await this.makeRequest('/ai/sales-assistant', 'POST', {
      customerId,
      skinType,
      budget,
      concerns
    }, { action: 'product-recommendation' });
  }

  async startAIChatbot(customerId, initialMessage) {
    return await this.makeRequest('/ai/sales-assistant', 'POST', {
      customerId,
      message: initialMessage
    }, { action: 'start-chat' });
  }

  /**
   * Mobile App Methods
   */
  async registerMobileUser(userData) {
    return await this.makeRequest('/mobile/sales-app', 'POST', userData, { 
      action: 'register-user' 
    });
  }

  async scheduleConsultation(customerId, salesStaffId, scheduledAt) {
    return await this.makeRequest('/mobile/sales-app', 'POST', {
      customerId,
      salesStaffId,
      scheduledAt
    }, { action: 'schedule-consultation' });
  }

  async bookTreatment(customerId, treatmentName, scheduledDate, price) {
    return await this.makeRequest('/mobile/sales-app', 'POST', {
      customerId,
      treatmentName,
      scheduledDate,
      price
    }, { action: 'book-treatment' });
  }

  async getMobileAnalytics() {
    return await this.makeRequest('/mobile/sales-app', 'GET');
  }

  /**
   * Analytics Methods
   */
  async trackSalesPerformance(salesPersonId, performanceData) {
    return await this.makeRequest('/analytics/advanced-sales', 'POST', {
      salesPersonId,
      performanceData
    }, { action: 'track-performance' });
  }

  async mapCustomerJourney(customerId, touchpoints) {
    return await this.makeRequest('/analytics/advanced-sales', 'POST', {
      customerId,
      touchpoints
    }, { action: 'map-journey' });
  }

  async getSalesOverview() {
    return await this.makeRequest('/analytics/advanced-sales', 'GET', null, { 
      type: 'overview' 
    });
  }

  async getConversionFunnel() {
    return await this.makeRequest('/analytics/advanced-sales', 'GET', null, { 
      type: 'conversion-funnel' 
    });
  }

  /**
   * Multi-Clinic Management Methods
   */
  async registerClinic(clinicData) {
    return await this.makeRequest('/management/multi-clinic', 'POST', clinicData, { 
      action: 'register-clinic' 
    });
  }

  async createFranchiseAgreement(clinicId, royaltyRate) {
    return await this.makeRequest('/management/multi-clinic', 'POST', {
      clinicId,
      royaltyRate
    }, { action: 'create-franchise' });
  }

  async centralizeCustomer(customerData) {
    return await this.makeRequest('/management/multi-clinic', 'POST', customerData, { 
      action: 'centralize-customer' 
    });
  }

  async generateCrossClinicReport(clinicIds) {
    return await this.makeRequest('/management/multi-clinic', 'POST', { clinicIds }, { 
      action: 'generate-report' 
    });
  }

  async getNetworkOverview() {
    return await this.makeRequest('/management/multi-clinic', 'GET');
  }

  /**
   * Partner API Methods
   */
  async registerSupplier(supplierData) {
    return await this.makeRequest('/partners/treatment', 'POST', supplierData, { 
      action: 'register-supplier' 
    });
  }

  async createPartnerOrder(orderData) {
    return await this.makeRequest('/partners/treatment', 'POST', orderData, { 
      action: 'create-order' 
    });
  }

  async createClinicReferral(referralData) {
    return await this.makeRequest('/partners/treatment', 'POST', referralData, { 
      action: 'create-referral' 
    });
  }

  async requestEquipmentService(serviceData) {
    return await this.makeRequest('/partners/treatment', 'POST', serviceData, { 
      action: 'request-service' 
    });
  }

  /**
   * Testing & Integration Methods
   */
  async runIntegrationTests() {
    return await this.makeRequest('/testing/integration', 'POST', {}, { 
      action: 'run-full-suite' 
    });
  }

  async runSecurityAudit() {
    return await this.makeRequest('/security/performance-audit', 'POST', {}, { 
      action: 'comprehensive-audit' 
    });
  }

  /**
   * Helper Methods
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  setBaseURL(baseURL) {
    this.baseURL = baseURL;
  }

  setTimeout(timeout) {
    this.timeout = timeout;
  }

  /**
   * Error handling utility
   */
  handleError(error) {
    console.error('BN-Aura SDK Error:', error.message);
    throw error;
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BNAuraSDK;
}

if (typeof window !== 'undefined') {
  window.BNAuraSDK = BNAuraSDK;
}

export default BNAuraSDK;
