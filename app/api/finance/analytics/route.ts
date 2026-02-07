import { NextRequest, NextResponse } from 'next/server';
import { AdvancedFinancialAnalytics } from '@/lib/finance/advancedFinancialAnalytics';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'record';
    
    const body = await request.json();

    switch (action) {
      case 'record':
        return recordTransaction(body);
        
      case 'generate-report':
        return generateReport(body);
        
      case 'analyze-customer':
        return analyzeCustomer(body);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Financial analytics API error:', error);
    return NextResponse.json(
      { error: 'Financial analytics failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'reports';
    const reportId = searchParams.get('reportId');
    const clinicId = searchParams.get('clinicId');

    switch (action) {
      case 'reports':
        return getReports(reportId);
        
      case 'transactions':
        return getTransactions(clinicId);
        
      case 'dashboard':
        return getFinancialDashboard(clinicId);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get financial data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function recordTransaction(body: any) {
  const { customerId, clinicId, serviceId, serviceName, revenue } = body;
  
  if (!customerId || !clinicId || !serviceId || !serviceName || !revenue) {
    return NextResponse.json({ 
      error: 'Missing required fields: customerId, clinicId, serviceId, serviceName, revenue' 
    }, { status: 400 });
  }
  
  try {
    const transactionId = AdvancedFinancialAnalytics.recordTransaction(
      customerId, clinicId, serviceId, serviceName, revenue
    );
    
    return NextResponse.json({
      success: true,
      data: {
        transactionId,
        customerId,
        serviceName,
        revenue
      },
      message: `Financial transaction recorded: ${serviceName} - ฿${revenue.toLocaleString()}`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to record transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateReport(body: any) {
  const { clinicId, startDate, endDate, reportType = 'monthly' } = body;
  
  if (!clinicId || !startDate || !endDate) {
    return NextResponse.json({ 
      error: 'Missing required fields: clinicId, startDate, endDate' 
    }, { status: 400 });
  }
  
  try {
    const report = AdvancedFinancialAnalytics.generateProfitLossReport(
      clinicId, startDate, endDate
    );
    
    return NextResponse.json({
      success: true,
      data: report,
      insights: {
        profitabilityStatus: report.summary.overallMargin > 25 ? 'Excellent' :
                           report.summary.overallMargin > 15 ? 'Good' :
                           report.summary.overallMargin > 5 ? 'Fair' : 'Poor',
        topCustomers: report.breakdown.byCustomer
          .filter(c => c.profitability === 'high')
          .length,
        topServices: report.breakdown.byService
          .sort((a, b) => b.profitMargin - a.profitMargin)
          .slice(0, 3)
          .map(s => ({ name: s.serviceName, margin: s.profitMargin }))
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function analyzeCustomer(body: any) {
  const { customerId, clinicId } = body;
  
  if (!customerId || !clinicId) {
    return NextResponse.json({ 
      error: 'Missing customerId or clinicId' 
    }, { status: 400 });
  }
  
  try {
    // Get all transactions to find customer data
    const transactions = AdvancedFinancialAnalytics.getTransactions()
      .filter(t => t.customerId === customerId && t.clinicId === clinicId);
      
    if (transactions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No transactions found for customer'
      }, { status: 404 });
    }
    
    const totalRevenue = transactions.reduce((sum, t) => sum + t.revenue, 0);
    const totalProfit = transactions.reduce((sum, t) => sum + t.netProfit, 0);
    const profitMargin = (totalProfit / totalRevenue) * 100;
    
    const analysis = {
      customerId,
      totalRevenue,
      totalProfit,
      profitMargin,
      serviceCount: transactions.length,
      averageOrderValue: totalRevenue / transactions.length,
      lastServiceDate: transactions[transactions.length - 1]?.date,
      // @ts-ignore
      topServices: this.getTopServices(transactions),
      // @ts-ignore
      profitTrend: this.calculateProfitTrend(transactions)
    };
    
    return NextResponse.json({
      success: true,
      data: analysis,
      recommendations: generateCustomerRecommendations(analysis)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Customer analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getReports(reportId?: string | null) {
  try {
    if (reportId) {
      const report = AdvancedFinancialAnalytics.getReport(reportId);
      
      if (!report) {
        return NextResponse.json({
          success: false,
          error: 'Report not found'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: report
      });
    }
    
    // Return summary of available reports
    return NextResponse.json({
      success: true,
      data: {
        availableReports: ['profit-loss', 'customer-analysis', 'service-performance'],
        samplePeriods: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
        exportFormats: ['json', 'csv', 'pdf']
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getTransactions(clinicId?: string | null) {
  try {
    const allTransactions = AdvancedFinancialAnalytics.getTransactions();
    const transactions = clinicId 
      ? allTransactions.filter(t => t.clinicId === clinicId)
      : allTransactions;
    
    return NextResponse.json({
      success: true,
      data: {
        transactions,
        summary: {
          totalTransactions: transactions.length,
          totalRevenue: transactions.reduce((sum, t) => sum + t.revenue, 0),
          totalProfit: transactions.reduce((sum, t) => sum + t.netProfit, 0),
          averageMargin: transactions.length > 0 
            ? transactions.reduce((sum, t) => sum + t.profitMargin, 0) / transactions.length 
            : 0
        }
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get transactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getFinancialDashboard(clinicId?: string | null) {
  try {
    if (!clinicId) {
      return NextResponse.json({ 
        error: 'Missing clinicId' 
      }, { status: 400 });
    }
    
    const transactions = AdvancedFinancialAnalytics.getTransactions()
      .filter(t => t.clinicId === clinicId);
    
    if (transactions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No financial data available yet',
          recommendations: ['Start recording transactions', 'Set up service pricing', 'Configure cost allocations']
        }
      });
    }
    
    // Calculate dashboard metrics
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const thisMonthTransactions = transactions.filter(t => new Date(t.date) >= thisMonth);
    const lastMonthTransactions = transactions.filter(t => 
      new Date(t.date) >= lastMonth && new Date(t.date) < thisMonth);
    
    const thisMonthRevenue = thisMonthTransactions.reduce((sum, t) => sum + t.revenue, 0);
    const lastMonthRevenue = lastMonthTransactions.reduce((sum, t) => sum + t.revenue, 0);
    const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    
    const dashboard = {
      overview: {
        totalRevenue: transactions.reduce((sum, t) => sum + t.revenue, 0),
        totalProfit: transactions.reduce((sum, t) => sum + t.netProfit, 0),
        totalTransactions: transactions.length,
        averageMargin: transactions.reduce((sum, t) => sum + t.profitMargin, 0) / transactions.length
      },
      monthlyMetrics: {
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth,
        thisMonthTransactions: thisMonthTransactions.length
      },
      topServices: getTopServicesByRevenue(transactions),
      profitableCustomers: getProfitableCustomers(transactions),
      alerts: generateFinancialAlerts(transactions)
    };
    
    return NextResponse.json({
      success: true,
      data: dashboard,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateCustomerRecommendations(analysis: any): string[] {
  const recommendations = [];
  
  if (analysis.profitMargin > 30) {
    recommendations.push('High-value customer - consider VIP treatment and loyalty programs');
  } else if (analysis.profitMargin < 10) {
    recommendations.push('Low-margin customer - review service pricing or focus on upselling');
  }
  
  if (analysis.serviceCount === 1) {
    recommendations.push('New customer - excellent opportunity for cross-selling');
  }
  
  if (analysis.averageOrderValue > 5000) {
    recommendations.push('High spender - perfect for premium service packages');
  }
  
  return recommendations;
}

function getTopServicesByRevenue(transactions: any[]): any[] {
  const serviceMap = new Map();
  
  transactions.forEach(t => {
    const existing = serviceMap.get(t.serviceId) || { revenue: 0, count: 0, name: t.serviceName };
    existing.revenue += t.revenue;
    existing.count += 1;
    serviceMap.set(t.serviceId, existing);
  });
  
  return Array.from(serviceMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function getProfitableCustomers(transactions: any[]): any[] {
  const customerMap = new Map();
  
  transactions.forEach(t => {
    const existing = customerMap.get(t.customerId) || { profit: 0, revenue: 0, count: 0 };
    existing.profit += t.netProfit;
    existing.revenue += t.revenue;
    existing.count += 1;
    customerMap.set(t.customerId, existing);
  });
  
  return Array.from(customerMap.entries())
    .map(([id, data]) => ({
      customerId: id,
      totalProfit: data.profit,
      totalRevenue: data.revenue,
      profitMargin: (data.profit / data.revenue) * 100,
      serviceCount: data.count
    }))
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 10);
}

function generateFinancialAlerts(transactions: any[]): string[] {
  const alerts = [];
  
  const avgMargin = transactions.reduce((sum, t) => sum + t.profitMargin, 0) / transactions.length;
  
  if (avgMargin < 15) {
    alerts.push('Overall profit margin is below 15% - consider reviewing pricing strategy');
  }
  
  const lowMarginServices = transactions.filter(t => t.profitMargin < 10);
  if (lowMarginServices.length > transactions.length * 0.2) {
    alerts.push('20%+ of services have low margins - review cost structure');
  }
  
  const recentTransactions = transactions.filter(t => 
    new Date(t.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  if (recentTransactions.length === 0) {
    alerts.push('No transactions in the last 7 days - check business activity');
  }
  
  return alerts;
}
