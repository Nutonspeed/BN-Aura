import { NextRequest, NextResponse } from 'next/server';
import { QuotaManager } from '@/lib/quota/quotaManager';
import { QuotaCache } from '@/lib/quota/quotaCache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('test') || 'cache';
    const clinicId = searchParams.get('clinicId') || 'a1b2c3d4-e5f6-7890-abcd-1234567890ab';

    switch (testType) {
      case 'cache':
        return await testCachePerformance(clinicId);
      
      case 'concurrent':
        return await testConcurrentRequests(clinicId);
      
      case 'stats':
        return await getCacheStats();
      
      case 'warmup':
        return await warmupCache(clinicId);
      
      case 'benchmark':
        return await benchmarkQueries(clinicId);
      
      default:
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });
    }

  } catch (error) {
    console.error('Performance test error:', error);
    return NextResponse.json(
      { error: 'Performance test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function testCachePerformance(clinicId: string) {
  const results = {
    testType: 'cache_performance',
    clinicId,
    tests: [] as any[]
  };

  // Reset cache for clean test
  QuotaCache.reset();

  // Test 1: Cold cache (first request)
  const coldStart = Date.now();
  const coldResult = await QuotaManager.getQuotaConfig(clinicId);
  const coldTime = Date.now() - coldStart;

  results.tests.push({
    name: 'Cold Cache',
    duration: coldTime,
    success: !!coldResult,
    cacheHit: false
  });

  // Test 2: Warm cache (second request)
  const warmStart = Date.now();
  const warmResult = await QuotaManager.getQuotaConfig(clinicId);
  const warmTime = Date.now() - warmStart;

  results.tests.push({
    name: 'Warm Cache',
    duration: warmTime,
    success: !!warmResult,
    cacheHit: true
  });

  // Test 3: Multiple sequential requests
  const sequentialStart = Date.now();
  const sequentialPromises = [];
  for (let i = 0; i < 10; i++) {
    sequentialPromises.push(QuotaManager.getQuotaConfig(clinicId));
  }
  await Promise.all(sequentialPromises);
  const sequentialTime = Date.now() - sequentialStart;

  results.tests.push({
    name: '10 Sequential Requests',
    duration: sequentialTime,
    avgPerRequest: Math.round(sequentialTime / 10),
    success: true,
    cacheHit: true
  });

  // Get cache stats
  const cacheStats = QuotaCache.getStats();

  return NextResponse.json({
    success: true,
    results,
    cacheStats,
    performance: {
      speedupRatio: Math.round(coldTime / warmTime * 10) / 10,
      cacheEfficiency: `${cacheStats.hitRate}%`
    }
  });
}

async function testConcurrentRequests(clinicId: string) {
  QuotaCache.reset();

  const concurrentCount = 50;
  const start = Date.now();

  // Create concurrent requests
  const promises = Array(concurrentCount).fill(null).map(async (_, i) => {
    const requestStart = Date.now();
    const result = await QuotaManager.getQuotaConfig(clinicId);
    const duration = Date.now() - requestStart;
    return { id: i, success: !!result, duration };
  });

  const results = await Promise.all(promises);
  const totalDuration = Date.now() - start;

  const successful = results.filter(r => r.success).length;
  const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / results.length;

  return NextResponse.json({
    success: true,
    testType: 'concurrent_requests',
    totalRequests: concurrentCount,
    successful,
    failed: concurrentCount - successful,
    totalDuration,
    avgDurationPerRequest: Math.round(avgDuration),
    requestsPerSecond: Math.round((concurrentCount / totalDuration) * 1000),
    cacheStats: QuotaCache.getStats()
  });
}

async function getCacheStats() {
  const stats = QuotaCache.getStats();
  
  return NextResponse.json({
    success: true,
    testType: 'cache_stats',
    stats: {
      ...stats,
      memoryUsage: `${Math.round(JSON.stringify(stats).length / 1024)}KB`,
      uptime: Date.now() - (stats.avgAge || 0)
    },
    recommendations: generateCacheRecommendations(stats)
  });
}

async function warmupCache(clinicId: string) {
  const start = Date.now();
  
  try {
    await QuotaCache.warmUp(clinicId, QuotaManager);
    const duration = Date.now() - start;
    
    return NextResponse.json({
      success: true,
      testType: 'cache_warmup',
      clinicId,
      duration,
      message: 'Cache warmed up successfully',
      cacheStats: QuotaCache.getStats()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      testType: 'cache_warmup',
      error: error instanceof Error ? error.message : 'Warmup failed'
    });
  }
}

async function benchmarkQueries(clinicId: string) {
  const benchmarks = [];
  
  // Benchmark 1: getQuotaConfig
  QuotaCache.reset();
  const quotaConfigTimes = [];
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    await QuotaManager.getQuotaConfig(clinicId);
    quotaConfigTimes.push(Date.now() - start);
  }
  
  benchmarks.push({
    operation: 'getQuotaConfig',
    runs: quotaConfigTimes.length,
    times: quotaConfigTimes,
    avg: Math.round(quotaConfigTimes.reduce((a, b) => a + b, 0) / quotaConfigTimes.length),
    min: Math.min(...quotaConfigTimes),
    max: Math.max(...quotaConfigTimes)
  });

  // Benchmark 2: checkQuotaAvailability
  const quotaCheckTimes = [];
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    await QuotaManager.checkQuotaAvailability(clinicId);
    quotaCheckTimes.push(Date.now() - start);
  }
  
  benchmarks.push({
    operation: 'checkQuotaAvailability',
    runs: quotaCheckTimes.length,
    times: quotaCheckTimes,
    avg: Math.round(quotaCheckTimes.reduce((a, b) => a + b, 0) / quotaCheckTimes.length),
    min: Math.min(...quotaCheckTimes),
    max: Math.max(...quotaCheckTimes)
  });

  return NextResponse.json({
    success: true,
    testType: 'benchmark_queries',
    benchmarks,
    cacheStats: QuotaCache.getStats(),
    summary: {
      totalTests: benchmarks.reduce((acc, b) => acc + b.runs, 0),
      avgResponseTime: Math.round(benchmarks.reduce((acc, b) => acc + b.avg, 0) / benchmarks.length)
    }
  });
}

function generateCacheRecommendations(stats: any) {
  const recommendations = [];

  if (stats.hitRate < 50) {
    recommendations.push('Low cache hit rate - consider increasing cache TTL');
  }

  if (stats.cacheSize > 1000) {
    recommendations.push('Large cache size - consider implementing cache size limits');
  }

  if (stats.avgAge > 300000) { // 5 minutes
    recommendations.push('Old cache entries - consider reducing TTL for fresher data');
  }

  if (recommendations.length === 0) {
    recommendations.push('Cache performance is optimal');
  }

  return recommendations;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, clinicId } = body;

    switch (action) {
      case 'reset-cache':
        QuotaCache.reset();
        return NextResponse.json({
          success: true,
          message: 'Cache reset successfully'
        });

      case 'stress-test':
        return await runStressTest(clinicId || 'a1b2c3d4-e5f6-7890-abcd-1234567890ab');

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'POST operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function runStressTest(clinicId: string) {
  const stressResults = {
    testType: 'stress_test',
    startTime: new Date().toISOString(),
    phases: [] as any[]
  };

  // Phase 1: Light load (10 requests/second for 5 seconds)
  const lightLoadStart = Date.now();
  const lightLoadPromises = [];
  for (let i = 0; i < 50; i++) {
    lightLoadPromises.push(
      new Promise(resolve => {
        setTimeout(async () => {
          const start = Date.now();
          const result = await QuotaManager.getQuotaConfig(clinicId);
          resolve({ duration: Date.now() - start, success: !!result });
        }, (i % 10) * 100); // Spread over 1 second intervals
      })
    );
  }

  const lightLoadResults = await Promise.all(lightLoadPromises);
  const lightLoadDuration = Date.now() - lightLoadStart;

  stressResults.phases.push({
    name: 'Light Load',
    requests: 50,
    duration: lightLoadDuration,
    successful: lightLoadResults.filter((r: any) => r.success).length,
    avgResponseTime: Math.round(lightLoadResults.reduce((acc: number, r: any) => acc + r.duration, 0) / lightLoadResults.length)
  });

  // Phase 2: Heavy load (100 concurrent requests)
  const heavyLoadStart = Date.now();
  const heavyLoadPromises = Array(100).fill(null).map(async () => {
    const start = Date.now();
    const result = await QuotaManager.getQuotaConfig(clinicId);
    return { duration: Date.now() - start, success: !!result };
  });

  const heavyLoadResults = await Promise.all(heavyLoadPromises);
  const heavyLoadDuration = Date.now() - heavyLoadStart;

  stressResults.phases.push({
    name: 'Heavy Load',
    requests: 100,
    duration: heavyLoadDuration,
    successful: heavyLoadResults.filter(r => r.success).length,
    avgResponseTime: Math.round(heavyLoadResults.reduce((acc, r) => acc + r.duration, 0) / heavyLoadResults.length)
  });

  return NextResponse.json({
    success: true,
    results: stressResults,
    finalStats: QuotaCache.getStats(),
    endTime: new Date().toISOString()
  });
}
