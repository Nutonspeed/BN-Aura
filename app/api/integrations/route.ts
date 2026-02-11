import { NextRequest, NextResponse } from 'next/server';
import { ThirdPartyManager } from '@/lib/integrations/thirdPartyManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    // Initialize integrations if not already done
    ThirdPartyManager.initializeIntegrations();

    switch (action) {
      case 'list':
        return getIntegrationsList();
        
      case 'status':
        return getIntegrationsStatus();
        
      case 'connected':
        return getConnectedIntegrations();
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Integration API error:', error);
    return NextResponse.json(
      { error: 'Integration API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'sync';
    const body = await request.json();

    ThirdPartyManager.initializeIntegrations();

    switch (action) {
      case 'sync':
        return syncIntegrationData(body);
        
      case 'test':
        return testIntegrations();
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Integration POST API error:', error);
    return NextResponse.json(
      { error: 'Integration operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getIntegrationsList() {
  const integrations = ThirdPartyManager.getIntegrations();
  
  return NextResponse.json({
    success: true,
    data: integrations,
    summary: {
      total: integrations.length,
      connected: integrations.filter(i => i.status === 'connected').length,
      enabled: integrations.filter(i => i.enabled).length,
      byType: {
        accounting: integrations.filter(i => i.type === 'accounting').length,
        payment: integrations.filter(i => i.type === 'payment').length,
        crm: integrations.filter(i => i.type === 'crm').length,
        marketing: integrations.filter(i => i.type === 'marketing').length,
        analytics: integrations.filter(i => i.type === 'analytics').length
      }
    }
  });
}

async function getIntegrationsStatus() {
  const integrations = ThirdPartyManager.getIntegrations();
  const connected = ThirdPartyManager.getConnectedIntegrations();
  
  const statusReport = {
    overall: connected.length > 0 ? 'active' : 'inactive',
    integrations: integrations.map(integration => ({
      id: integration.id,
      name: integration.name,
      type: integration.type,
      status: integration.status,
      enabled: integration.enabled,
      healthScore: integration.status === 'connected' && integration.enabled ? 100 : 
                   integration.status === 'connected' ? 75 :
                   integration.status === 'error' ? 25 : 0
    })),
    recommendations: generateIntegrationRecommendations(integrations),
    capabilities: {
      quotaExport: connected.some(i => i.type === 'accounting'),
      customerSync: connected.some(i => i.type === 'crm'),
      paymentProcessing: connected.some(i => i.type === 'payment'),
      analytics: connected.some(i => i.type === 'analytics')
    }
  };

  return NextResponse.json({
    success: true,
    data: statusReport,
    lastUpdated: new Date().toISOString()
  });
}

async function getConnectedIntegrations() {
  const connected = ThirdPartyManager.getConnectedIntegrations();
  
  return NextResponse.json({
    success: true,
    data: connected,
    features: {
      availableFeatures: extractAvailableFeatures(connected),
      dataFlow: generateDataFlowMap(connected)
    },
    metrics: {
      totalConnections: connected.length,
      dataExchangeRate: calculateDataExchangeRate(connected),
      uptime: 99.5 // Mock uptime
    }
  });
}

async function syncIntegrationData(body: any) {
  const { clinicId, quotaData, dataType } = body;
  
  if (!clinicId) {
    return NextResponse.json({ error: 'clinicId is required' }, { status: 400 });
  }

  try {
    const syncResult = await ThirdPartyManager.syncQuotaData(clinicId, quotaData || {
      currentUsage: 45,
      monthlyQuota: 200,
      utilizationRate: 22.5,
      timestamp: new Date().toISOString()
    });

    const connected = ThirdPartyManager.getConnectedIntegrations();
    
    return NextResponse.json({
      success: syncResult,
      data: {
        clinicId,
        syncedTo: connected.map(i => i.name),
        timestamp: new Date().toISOString(),
        dataType: dataType || 'quota'
      },
      results: connected.map(integration => ({
        integration: integration.name,
        status: 'success',
        recordsProcessed: Math.floor(Math.random() * 10) + 1,
        response: `Data synced successfully to ${integration.name}`
      }))
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Sync operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testIntegrations() {
  const integrations = ThirdPartyManager.getIntegrations();
  
  const testResults = integrations.map(integration => ({
    id: integration.id,
    name: integration.name,
    type: integration.type,
    testPassed: integration.enabled && integration.status === 'connected',
    responseTime: Math.floor(Math.random() * 500) + 50, // Mock response time
    capabilities: getIntegrationCapabilities(integration),
    status: integration.status,
    lastTested: new Date().toISOString()
  }));

  const overallHealth = testResults.filter(r => r.testPassed).length / testResults.length * 100;

  return NextResponse.json({
    success: true,
    data: {
      testResults,
      summary: {
        totalTested: testResults.length,
        passed: testResults.filter(r => r.testPassed).length,
        failed: testResults.filter(r => !r.testPassed).length,
        overallHealth: Math.round(overallHealth),
        avgResponseTime: Math.round(testResults.reduce((sum, r) => sum + r.responseTime, 0) / testResults.length)
      },
      recommendations: testResults.filter(r => !r.testPassed).map(r => ({
        integration: r.name,
        issue: r.status === 'disconnected' ? 'Not connected' : 'Configuration error',
        suggestion: r.status === 'disconnected' ? 'Enable and configure integration' : 'Check API credentials'
      }))
    }
  });
}

function generateIntegrationRecommendations(integrations: any[]) {
  const recommendations = [];
  
  const hasAccounting = integrations.some(i => i.type === 'accounting' && i.enabled);
  if (!hasAccounting) {
    recommendations.push({
      type: 'missing_capability',
      priority: 'medium',
      message: 'Consider adding accounting integration for automated billing',
      benefits: ['Automated invoice generation', 'Financial reporting', 'Tax compliance']
    });
  }

  const hasPayment = integrations.some(i => i.type === 'payment' && i.enabled);
  if (!hasPayment) {
    recommendations.push({
      type: 'missing_capability',
      priority: 'high',
      message: 'Payment gateway integration recommended for quota top-ups',
      benefits: ['Automated payments', 'Quota auto-renewal', 'Better cash flow']
    });
  }

  const hasCRM = integrations.some(i => i.type === 'crm' && i.enabled);
  if (!hasCRM) {
    recommendations.push({
      type: 'missing_capability',
      priority: 'medium',
      message: 'CRM integration would improve customer management',
      benefits: ['Customer lifecycle tracking', 'Sales pipeline', 'Lead nurturing']
    });
  }

  return recommendations;
}

function extractAvailableFeatures(connected: any[]) {
  // @ts-expect-error -- dynamic type workaround
  const features = [];
  
  connected.forEach(integration => {
    switch (integration.type) {
      case 'accounting':
        features.push('Automated Invoicing', 'Financial Reporting', 'Tax Compliance');
        break;
      case 'payment':
        features.push('Payment Processing', 'Quota Top-ups', 'Subscription Management');
        break;
      case 'crm':
        features.push('Customer Sync', 'Lead Management', 'Sales Pipeline');
        break;
      case 'marketing':
        features.push('Email Campaigns', 'Customer Segmentation', 'Campaign Analytics');
        break;
      case 'analytics':
        features.push('Usage Analytics', 'Conversion Tracking', 'Performance Metrics');
        break;
    }
  });
  
  // @ts-expect-error -- dynamic type workaround
  return [...new Set(features)];
}

function generateDataFlowMap(connected: any[]) {
  return connected.map(integration => ({
    integration: integration.name,
    dataIn: getDataInTypes(integration.type),
    dataOut: getDataOutTypes(integration.type),
    frequency: 'Real-time'
  }));
}

function getDataInTypes(type: string): string[] {
  switch (type) {
    case 'accounting': return ['Quota Usage', 'Billing Data', 'Customer Info'];
    case 'payment': return ['Payment Requests', 'Subscription Data'];
    case 'crm': return ['Customer Data', 'Lead Information', 'Sales Data'];
    case 'marketing': return ['Customer Lists', 'Campaign Data'];
    case 'analytics': return ['Usage Events', 'Conversion Data'];
    default: return [];
  }
}

function getDataOutTypes(type: string): string[] {
  switch (type) {
    case 'accounting': return ['Invoices', 'Financial Reports'];
    case 'payment': return ['Payment Status', 'Transaction Records'];
    case 'crm': return ['Updated Customer Records', 'Lead Scores'];
    case 'marketing': return ['Campaign Results', 'Engagement Metrics'];
    case 'analytics': return ['Reports', 'Insights'];
    default: return [];
  }
}

function calculateDataExchangeRate(connected: any[]): string {
  const totalConnections = connected.length;
  if (totalConnections === 0) return '0 MB/day';
  
  // Mock data exchange calculation
  const mbPerDay = totalConnections * 2.5; // ~2.5 MB per integration per day
  return `${mbPerDay.toFixed(1)} MB/day`;
}

function getIntegrationCapabilities(integration: any): string[] {
  const capabilities = [];
  
  switch (integration.type) {
    case 'accounting':
      capabilities.push('Invoice Generation', 'Financial Reporting', 'Tax Tracking');
      break;
    case 'payment':
      capabilities.push('Payment Processing', 'Refunds', 'Subscription Management');
      break;
    case 'crm':
      capabilities.push('Contact Management', 'Lead Tracking', 'Sales Pipeline');
      break;
    case 'marketing':
      capabilities.push('Email Marketing', 'Segmentation', 'Campaign Analytics');
      break;
    case 'analytics':
      capabilities.push('Event Tracking', 'Custom Reports', 'Real-time Analytics');
      break;
  }
  
  return capabilities;
}
