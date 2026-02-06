import { NextRequest, NextResponse } from 'next/server';
import { SmartInventoryManager } from '@/lib/inventory/smartInventoryManager';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'add-item';
    
    const body = await request.json();

    switch (action) {
      case 'add-item':
        return addInventoryItem(body);
        
      case 'record-usage':
        return recordUsage(body);
        
      case 'generate-order':
        return generateOrder(body);
        
      case 'predict-stockout':
        return predictStockout(body);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Smart inventory API error:', error);
    return NextResponse.json(
      { error: 'Smart inventory operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'inventory';
    const clinicId = searchParams.get('clinicId');

    switch (action) {
      case 'inventory':
        return getInventory(clinicId);
        
      case 'alerts':
        return getAlerts(clinicId);
        
      case 'orders':
        return getOrders(clinicId);
        
      case 'dashboard':
        return getInventoryDashboard(clinicId);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get inventory data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function addInventoryItem(body: any) {
  const { itemId, clinicId, name, category, currentStock, reorderPoint, unitCost, supplierId, supplierName, leadTimeDays } = body;
  
  if (!itemId || !clinicId || !name || !category || currentStock === undefined || !reorderPoint || !unitCost || !supplierId) {
    return NextResponse.json({ 
      error: 'Missing required fields: itemId, clinicId, name, category, currentStock, reorderPoint, unitCost, supplierId' 
    }, { status: 400 });
  }
  
  try {
    const inventoryItem = {
      itemId,
      clinicId,
      name,
      category,
      currentStock,
      reorderPoint,
      unitCost,
      supplierId,
      supplierName: supplierName || 'Unknown Supplier',
      leadTimeDays: leadTimeDays || 7,
      lastUsageDate: new Date().toISOString()
    };
    
    SmartInventoryManager.addInventoryItem(inventoryItem);
    
    return NextResponse.json({
      success: true,
      data: inventoryItem,
      message: `Inventory item added: ${name}`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to add inventory item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function recordUsage(body: any) {
  const { itemId, quantity } = body;
  
  if (!itemId || quantity === undefined || quantity <= 0) {
    return NextResponse.json({ 
      error: 'Missing or invalid fields: itemId, quantity (must be positive)' 
    }, { status: 400 });
  }
  
  try {
    SmartInventoryManager.recordUsage(itemId, quantity);
    
    return NextResponse.json({
      success: true,
      data: {
        itemId,
        quantityUsed: quantity,
        timestamp: new Date().toISOString()
      },
      message: `Usage recorded: -${quantity} units`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to record usage',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateOrder(body: any) {
  const { itemId } = body;
  
  if (!itemId) {
    return NextResponse.json({ 
      error: 'Missing itemId' 
    }, { status: 400 });
  }
  
  try {
    const inventory = SmartInventoryManager.getInventory();
    const item = inventory.find(i => i.itemId === itemId);
    
    if (!item) {
      return NextResponse.json({
        success: false,
        error: 'Item not found'
      }, { status: 404 });
    }
    
    const orderId = SmartInventoryManager.generateAutoOrder(item);
    
    return NextResponse.json({
      success: true,
      data: {
        orderId,
        itemId,
        itemName: item.name,
        currentStock: item.currentStock,
        reorderPoint: item.reorderPoint
      },
      message: `Auto purchase order generated: ${orderId}`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function predictStockout(body: any) {
  const { itemId } = body;
  
  if (!itemId) {
    return NextResponse.json({ 
      error: 'Missing itemId' 
    }, { status: 400 });
  }
  
  try {
    const prediction = SmartInventoryManager.predictStockOut(itemId);
    
    const daysUntilStockOut = Math.floor((new Date(prediction.stockOutDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    
    return NextResponse.json({
      success: true,
      data: {
        itemId,
        stockOutDate: prediction.stockOutDate,
        daysUntilStockOut,
        recommendedQuantity: prediction.recommendedQuantity,
        urgency: daysUntilStockOut <= 3 ? 'critical' : daysUntilStockOut <= 7 ? 'urgent' : 'normal'
      },
      analysis: {
        risk: daysUntilStockOut <= 7 ? 'High' : daysUntilStockOut <= 14 ? 'Medium' : 'Low',
        recommendation: daysUntilStockOut <= 3 
          ? 'Order immediately - critical stock level'
          : daysUntilStockOut <= 7 
          ? 'Order within 24 hours - urgent restock needed'
          : 'Monitor stock levels - order when convenient'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to predict stockout',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getInventory(clinicId?: string | null) {
  try {
    const inventory = SmartInventoryManager.getInventory(clinicId || undefined);
    
    const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
    const categoryBreakdown = inventory.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as any);
    
    return NextResponse.json({
      success: true,
      data: {
        items: inventory,
        summary: {
          totalItems: inventory.length,
          totalValue,
          categoryBreakdown
        }
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get inventory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getAlerts(clinicId?: string | null) {
  if (!clinicId) {
    return NextResponse.json({ 
      error: 'Missing clinicId' 
    }, { status: 400 });
  }
  
  try {
    const alerts = SmartInventoryManager.getInventoryAlerts(clinicId);
    
    const alertLevel = alerts.outOfStock.length > 0 ? 'critical' :
                     alerts.lowStock.length > 5 ? 'high' :
                     alerts.lowStock.length > 0 ? 'medium' : 'low';
    
    return NextResponse.json({
      success: true,
      data: {
        alerts,
        alertLevel,
        summary: {
          outOfStockCount: alerts.outOfStock.length,
          lowStockCount: alerts.lowStock.length,
          totalInventoryValue: alerts.totalValue,
          healthScore: Math.round((1 - (alerts.outOfStock.length + alerts.lowStock.length * 0.5) / Math.max(SmartInventoryManager.getInventory(clinicId).length, 1)) * 100)
        }
      },
      recommendations: generateInventoryRecommendations(alerts)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get inventory alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getOrders(clinicId?: string | null) {
  try {
    const orders = SmartInventoryManager.getOrders(clinicId || undefined);
    
    const orderStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      ordered: orders.filter(o => o.status === 'ordered').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      autoGenerated: orders.filter(o => o.autoGenerated).length,
      totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0)
    };
    
    return NextResponse.json({
      success: true,
      data: {
        orders,
        stats: orderStats
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getInventoryDashboard(clinicId?: string | null) {
  if (!clinicId) {
    return NextResponse.json({ 
      error: 'Missing clinicId' 
    }, { status: 400 });
  }
  
  try {
    const inventory = SmartInventoryManager.getInventory(clinicId);
    const orders = SmartInventoryManager.getOrders(clinicId);
    const alerts = SmartInventoryManager.getInventoryAlerts(clinicId);
    
    const dashboard = {
      overview: {
        totalItems: inventory.length,
        totalValue: alerts.totalValue,
        lowStockAlerts: alerts.lowStock.length,
        outOfStockAlerts: alerts.outOfStock.length,
        activeOrders: orders.filter(o => o.status !== 'delivered').length
      },
      recentActivity: {
        recentOrders: orders.slice(-5).map(order => ({
          orderId: order.orderId,
          supplier: order.supplierName,
          amount: order.totalAmount,
          status: order.status,
          auto: order.autoGenerated
        })),
        criticalItems: alerts.outOfStock.concat(alerts.lowStock.slice(0, 5))
      },
      predictions: inventory
        .filter(item => item.currentStock <= item.reorderPoint * 1.5)
        .slice(0, 5)
        .map(item => {
          const prediction = SmartInventoryManager.predictStockOut(item.itemId);
          return {
            itemName: item.name,
            currentStock: item.currentStock,
            stockOutDate: prediction.stockOutDate,
            recommendedQuantity: prediction.recommendedQuantity
          };
        })
    };
    
    return NextResponse.json({
      success: true,
      data: dashboard,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get inventory dashboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateInventoryRecommendations(alerts: any): string[] {
  const recommendations = [];
  
  if (alerts.outOfStock.length > 0) {
    recommendations.push(`${alerts.outOfStock.length} items out of stock - immediate ordering required`);
  }
  
  if (alerts.lowStock.length > 5) {
    recommendations.push('Multiple items below reorder point - consider bulk ordering discounts');
  }
  
  if (alerts.totalValue < 50000) {
    recommendations.push('Low inventory value - ensure adequate stock for operations');
  } else if (alerts.totalValue > 200000) {
    recommendations.push('High inventory value - review stock levels to optimize cash flow');
  }
  
  return recommendations;
}
