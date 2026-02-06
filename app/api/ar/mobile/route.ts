import { NextRequest, NextResponse } from 'next/server';
import { MobileArOptimizer } from '@/lib/ar/mobileArOptimizer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'capabilities';

    await MobileArOptimizer.initialize();

    switch (action) {
      case 'capabilities':
        return getDeviceCapabilities();
        
      case 'settings':
        return getOptimizationSettings();
        
      case 'camera-constraints':
        return getCameraConstraints();
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Mobile AR API error:', error);
    return NextResponse.json(
      { error: 'Mobile AR operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'optimize';
    
    const body = await request.json();
    
    await MobileArOptimizer.initialize();

    switch (action) {
      case 'optimize':
        return optimizeForDevice(body);
        
      case 'test-performance':
        return testPerformance(body);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Mobile AR POST API error:', error);
    return NextResponse.json(
      { error: 'Mobile AR optimization failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getDeviceCapabilities() {
  try {
    const capabilities = MobileArOptimizer.getCapabilities();
    
    if (!capabilities) {
      return NextResponse.json({
        success: false,
        error: 'Device capabilities not available'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: capabilities,
      deviceInfo: {
        isMobile: capabilities.platform !== 'Desktop',
        isHighPerformance: capabilities.processingPower === 'high',
        hasCamera: capabilities.supportsCamera,
        memoryOptimized: capabilities.memoryLevel !== 'low'
      },
      recommendations: generateDeviceRecommendations(capabilities)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get device capabilities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getOptimizationSettings() {
  try {
    const settings = MobileArOptimizer.getSettings();
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'Optimization settings not available'
      }, { status: 500 });
    }
    
    const processingInterval = MobileArOptimizer.getProcessingInterval();
    
    return NextResponse.json({
      success: true,
      data: settings,
      performance: {
        processingInterval,
        expectedFps: 1000 / processingInterval,
        batteryOptimized: processingInterval > 1000,
        qualityLevel: settings.renderQuality
      },
      tips: generateOptimizationTips(settings)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get optimization settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getCameraConstraints() {
  try {
    const constraints = MobileArOptimizer.getOptimizedCameraConstraints();
    const capabilities = MobileArOptimizer.getCapabilities();
    
    return NextResponse.json({
      success: true,
      data: {
        constraints,
        deviceSupport: {
          hasCamera: capabilities?.supportsCamera || false,
          platform: capabilities?.platform || 'Unknown'
        }
      },
      usage: {
        example: 'navigator.mediaDevices.getUserMedia(constraints)',
        fallback: 'Provides fallback constraints for older devices'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get camera constraints',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function optimizeForDevice(body: any) {
  const { deviceType, performanceLevel } = body;
  
  try {
    await MobileArOptimizer.initialize();
    
    const capabilities = MobileArOptimizer.getCapabilities();
    const settings = MobileArOptimizer.getSettings();
    const constraints = MobileArOptimizer.getOptimizedCameraConstraints();
    
    return NextResponse.json({
      success: true,
      data: {
        optimized: true,
        deviceType: capabilities?.platform,
        appliedSettings: settings,
        cameraConstraints: constraints
      },
      optimization: {
        renderQuality: settings?.renderQuality,
        frameRate: settings?.frameRate,
        resolution: `${settings?.resolution.width}x${settings?.resolution.height}`,
        compressionLevel: settings?.compressionLevel
      },
      instructions: [
        'Use the provided camera constraints for getUserMedia',
        'Apply image optimization before processing',
        'Monitor performance and adjust dynamically',
        'Consider battery usage on mobile devices'
      ]
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Device optimization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testPerformance(body: any) {
  const { duration = 5000 } = body; // Test duration in ms
  
  try {
    const capabilities = MobileArOptimizer.getCapabilities();
    const settings = MobileArOptimizer.getSettings();
    
    // Mock performance test
    const performanceResults = {
      testDuration: duration,
      averageFps: settings?.frameRate || 30,
      processingTime: capabilities?.processingPower === 'high' ? 25 : 
                     capabilities?.processingPower === 'medium' ? 45 : 75, // ms
      memoryUsage: capabilities?.memoryLevel === 'high' ? 15 : 
                   capabilities?.memoryLevel === 'medium' ? 25 : 40, // MB
      batteryImpact: capabilities?.platform === 'Desktop' ? 'low' : 
                     capabilities?.processingPower === 'high' ? 'medium' : 'high',
      thermalState: 'normal' as const,
      frameDrops: Math.floor(Math.random() * 5), // Random 0-4 dropped frames
      overallScore: calculatePerformanceScore(capabilities, settings)
    };
    
    return NextResponse.json({
      success: true,
      data: performanceResults,
      analysis: {
        performance: performanceResults.overallScore > 80 ? 'Excellent' :
                    performanceResults.overallScore > 60 ? 'Good' :
                    performanceResults.overallScore > 40 ? 'Fair' : 'Poor',
        bottlenecks: identifyBottlenecks(performanceResults),
        recommendations: generatePerformanceRecommendations(performanceResults)
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Performance test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateDeviceRecommendations(capabilities: any): string[] {
  const recommendations = [];
  
  if (capabilities.platform === 'iOS') {
    recommendations.push('iOS devices perform well with high-quality AR experiences');
    recommendations.push('Consider enabling advanced features like face tracking');
  } else if (capabilities.platform === 'Android') {
    recommendations.push('Android devices vary in performance - test on multiple devices');
    recommendations.push('Consider adaptive quality settings');
  } else {
    recommendations.push('Desktop provides best performance for development and testing');
  }
  
  if (capabilities.processingPower === 'low') {
    recommendations.push('Use low-resolution settings and reduced frame rates');
    recommendations.push('Enable aggressive compression to reduce processing load');
  }
  
  if (capabilities.memoryLevel === 'low') {
    recommendations.push('Implement memory management and cleanup strategies');
  }
  
  return recommendations;
}

function generateOptimizationTips(settings: any): string[] {
  const tips = [];
  
  if (settings.renderQuality === 'high') {
    tips.push('High quality enabled - monitor performance on lower-end devices');
  } else if (settings.renderQuality === 'low') {
    tips.push('Low quality mode - consider upgrading quality if performance allows');
  }
  
  if (settings.frameRate <= 15) {
    tips.push('Low frame rate for battery optimization');
  } else if (settings.frameRate >= 60) {
    tips.push('High frame rate for smooth experience');
  }
  
  if (settings.compressionLevel > 0.3) {
    tips.push('High compression - may affect image quality but improves performance');
  }
  
  return tips;
}

function calculatePerformanceScore(capabilities: any, settings: any): number {
  let score = 60; // Base score
  
  // Adjust based on capabilities
  if (capabilities?.processingPower === 'high') score += 20;
  else if (capabilities?.processingPower === 'low') score -= 15;
  
  if (capabilities?.memoryLevel === 'high') score += 10;
  else if (capabilities?.memoryLevel === 'low') score -= 10;
  
  // Adjust based on settings
  if (settings?.renderQuality === 'high') score += 10;
  else if (settings?.renderQuality === 'low') score -= 5;
  
  return Math.min(100, Math.max(0, score));
}

function identifyBottlenecks(results: any): string[] {
  const bottlenecks = [];
  
  if (results.processingTime > 50) {
    bottlenecks.push('High processing time - consider reducing image resolution');
  }
  
  if (results.memoryUsage > 30) {
    bottlenecks.push('High memory usage - implement memory cleanup');
  }
  
  if (results.frameDrops > 2) {
    bottlenecks.push('Frame drops detected - reduce processing complexity');
  }
  
  if (results.batteryImpact === 'high') {
    bottlenecks.push('High battery usage - increase processing intervals');
  }
  
  return bottlenecks;
}

function generatePerformanceRecommendations(results: any): string[] {
  const recommendations = [];
  
  if (results.overallScore > 80) {
    recommendations.push('Excellent performance - consider enabling more features');
  } else if (results.overallScore < 50) {
    recommendations.push('Poor performance - reduce quality settings');
    recommendations.push('Consider implementing adaptive quality adjustment');
  }
  
  if (results.batteryImpact === 'high') {
    recommendations.push('Reduce processing frequency to improve battery life');
  }
  
  return recommendations;
}
