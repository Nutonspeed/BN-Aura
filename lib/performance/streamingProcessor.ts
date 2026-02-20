/**
 * Streaming Processor Implementation
 * Real-time streaming for skin analysis with chunked responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { MobileOptimizationConfig } from './mobileOptimization';

export interface StreamingChunk {
  id: string;
  type: 'progress' | 'partial_result' | 'final_result' | 'error' | 'complete';
  data: any;
  timestamp: number;
  stage?: string;
  progress?: number;
}

interface ProcessingStage {
  name: string;
  weight: number;
  processor: () => Promise<any>;
  timeout?: number;
}

export class StreamingProcessor {
  private config: MobileOptimizationConfig;
  private onProgress?: (chunk: StreamingChunk) => void;
  private stages: ProcessingStage[] = [];
  private startTime: number = 0;

  constructor(
    config: MobileOptimizationConfig,
    onProgress?: (chunk: StreamingChunk) => void
  ) {
    this.config = config;
    this.onProgress = onProgress;
  }

  /**
   * Add processing stage
   */
  addStage(stage: ProcessingStage): void {
    this.stages.push(stage);
  }

  setOnProgress(callback?: (chunk: StreamingChunk) => void): void {
    this.onProgress = callback;
  }

  /**
   * Process all stages with streaming
   */
  async process(): Promise<any> {
    this.startTime = Date.now();
    const results: any[] = [];
    let totalProgress = 0;
    const totalWeight = this.stages.reduce((sum, stage) => sum + stage.weight, 0);

    // Send initial progress
    this.sendChunk({
      id: 'init',
      type: 'progress',
      data: { stage: 'initialization', progress: 0 },
      timestamp: Date.now()
    });

    try {
      for (const stage of this.stages) {
        // Send stage start progress
        this.sendChunk({
          id: `start-${stage.name}`,
          type: 'progress',
          data: { 
            stage: stage.name, 
            progress: totalProgress,
            message: `Starting ${stage.name}...`
          },
          timestamp: Date.now(),
          stage: stage.name
        });

        // Process stage with timeout
        const result = await this.processStageWithTimeout(stage);
        results.push(result);

        // Send partial result
        this.sendChunk({
          id: `partial-${stage.name}`,
          type: 'partial_result',
          data: { 
            stage: stage.name,
            result: result,
            partial: true
          },
          timestamp: Date.now(),
          stage: stage.name
        });

        // Update progress
        totalProgress += (stage.weight / totalWeight) * 100;

        // Send stage completion progress
        this.sendChunk({
          id: `complete-${stage.name}`,
          type: 'progress',
          data: { 
            stage: stage.name, 
            progress: totalProgress,
            message: `Completed ${stage.name}`
          },
          timestamp: Date.now(),
          stage: stage.name,
          progress: totalProgress
        });
      }

      // Send final result
      const finalResult = this.combineResults(results);
      this.sendChunk({
        id: 'final',
        type: 'final_result',
        data: finalResult,
        timestamp: Date.now()
      });

      // Send completion
      this.sendChunk({
        id: 'complete',
        type: 'complete',
        data: { 
          success: true,
          totalProcessingTime: Date.now() - this.startTime
        },
        timestamp: Date.now()
      });

      return finalResult;

    } catch (error) {
      // Send error
      this.sendChunk({
        id: 'error',
        type: 'error',
        data: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stage: this.stages[this.stages.length - 1]?.name || 'unknown'
        },
        timestamp: Date.now()
      });
      throw error;
    }
  }

  /**
   * Process single stage with timeout
   */
  private async processStageWithTimeout(stage: ProcessingStage): Promise<any> {
    const timeout = stage.timeout || this.config.maxProcessingTime;
    
    return Promise.race([
      stage.processor(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Stage ${stage.name} timeout after ${timeout}ms`)), timeout);
      })
    ]);
  }

  /**
   * Send chunk to callback
   */
  private sendChunk(chunk: StreamingChunk): void {
    if (this.onProgress) {
      this.onProgress(chunk);
    }
  }

  /**
   * Combine results from all stages
   */
  private combineResults(results: any[]): any {
    return {
      stages: results,
      combined: true,
      processingTime: Date.now() - this.startTime,
      mobileOptimized: this.config.useLightweightModels
    };
  }
}

/**
 * Create streaming response for Next.js API
 */
export function createStreamingResponse(
  processor: StreamingProcessor,
  options: {
    chunkDelay?: number;
    enableProgress?: boolean;
  } = {}
): Response {
  const { chunkDelay = 500, enableProgress = true } = options;
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Set up progress callback
        processor.setOnProgress((chunk: StreamingChunk) => {
          if (enableProgress || chunk.type === 'final_result' || chunk.type === 'error') {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));
            
            // Add delay for better UX on mobile
            if (chunkDelay > 0 && chunk.type === 'progress') {
              setTimeout(() => {}, chunkDelay);
            }
          }
        });

        // Start processing
        await processor.process();

      } catch (error) {
        // Send error chunk
        const errorChunk: StreamingChunk = {
          id: 'stream-error',
          type: 'error',
          data: { 
            error: error instanceof Error ? error.message : 'Stream error'
          },
          timestamp: Date.now()
        };
        
        const data = `data: ${JSON.stringify(errorChunk)}\n\n`;
        controller.enqueue(encoder.encode(data));
      } finally {
        processor.setOnProgress(undefined);
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  });
}

/**
 * Client-side streaming handler
 */
export class ClientStreamingHandler {
  private eventSource: EventSource | null = null;
  private callbacks: {
    onProgress?: (chunk: StreamingChunk) => void;
    onPartialResult?: (chunk: StreamingChunk) => void;
    onFinalResult?: (chunk: StreamingChunk) => void;
    onError?: (chunk: StreamingChunk) => void;
    onComplete?: (chunk: StreamingChunk) => void;
  } = {};

  constructor(callbacks: {
    onProgress?: (chunk: StreamingChunk) => void;
    onPartialResult?: (chunk: StreamingChunk) => void;
    onFinalResult?: (chunk: StreamingChunk) => void;
    onError?: (chunk: StreamingChunk) => void;
    onComplete?: (chunk: StreamingChunk) => void;
  }) {
    this.callbacks = callbacks;
  }

  /**
   * Connect to streaming endpoint
   */
  connect(url: string, options: {
    method?: 'GET' | 'POST';
    body?: any;
    headers?: Record<string, string>;
  } = {}): void {
    // Close existing connection
    this.disconnect();

    if (options.method === 'POST') {
      // For POST requests, we need to use fetch with streaming
      this.connectWithFetch(url, options);
    } else {
      // For GET requests, use EventSource
      this.connectWithEventSource(url);
    }
  }

  /**
   * Connect using EventSource (GET requests)
   */
  private connectWithEventSource(url: string): void {
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const chunk: StreamingChunk = JSON.parse(event.data);
        this.handleChunk(chunk);
      } catch (error) {
        console.error('Failed to parse streaming chunk:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      this.callbacks.onError?.({
        id: 'connection-error',
        type: 'error',
        data: { error: 'Connection error' },
        timestamp: Date.now()
      });
    };
  }

  /**
   * Connect using fetch with streaming (POST requests)
   */
  private async connectWithFetch(
    url: string, 
    options: { body?: any; headers?: Record<string, string> }
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(options.body)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(6);
              const streamingChunk: StreamingChunk = JSON.parse(data);
              this.handleChunk(streamingChunk);
            } catch (error) {
              console.error('Failed to parse streaming chunk:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Fetch streaming error:', error);
      this.callbacks.onError?.({
        id: 'fetch-error',
        type: 'error',
        data: { error: error instanceof Error ? error.message : 'Fetch error' },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle incoming chunk
   */
  private handleChunk(chunk: StreamingChunk): void {
    switch (chunk.type) {
      case 'progress':
        this.callbacks.onProgress?.(chunk);
        break;
      case 'partial_result':
        this.callbacks.onPartialResult?.(chunk);
        break;
      case 'final_result':
        this.callbacks.onFinalResult?.(chunk);
        break;
      case 'error':
        this.callbacks.onError?.(chunk);
        break;
      case 'complete':
        this.callbacks.onComplete?.(chunk);
        this.disconnect();
        break;
    }
  }

  /**
   * Disconnect from streaming
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

/**
 * Streaming performance monitor
 */
export class StreamingPerformanceMonitor {
  private metrics = new Map<string, {
    startTime: number;
    endTime?: number;
    chunksReceived: number;
    totalBytes: number;
    stages: Map<string, number>;
  }>();

  startSession(sessionId: string): void {
    this.metrics.set(sessionId, {
      startTime: Date.now(),
      chunksReceived: 0,
      totalBytes: 0,
      stages: new Map()
    });
  }

  recordChunk(sessionId: string, chunk: StreamingChunk, chunkSize: number): void {
    const metrics = this.metrics.get(sessionId);
    if (!metrics) return;

    metrics.chunksReceived++;
    metrics.totalBytes += chunkSize;

    if (chunk.stage) {
      const stageTime = metrics.stages.get(chunk.stage) || 0;
      metrics.stages.set(chunk.stage, stageTime + (chunk.timestamp - metrics.startTime));
    }
  }

  endSession(sessionId: string): void {
    const metrics = this.metrics.get(sessionId);
    if (metrics) {
      metrics.endTime = Date.now();
    }
  }

  getMetrics(sessionId: string) {
    const metrics = this.metrics.get(sessionId);
    if (!metrics) return null;

    const duration = metrics.endTime ? metrics.endTime - metrics.startTime : Date.now() - metrics.startTime;
    const throughput = duration > 0 ? (metrics.totalBytes / duration) * 1000 : 0;

    return {
      sessionId,
      duration,
      chunksReceived: metrics.chunksReceived,
      totalBytes: metrics.totalBytes,
      throughput,
      averageChunkSize: metrics.chunksReceived > 0 ? metrics.totalBytes / metrics.chunksReceived : 0,
      stages: Object.fromEntries(metrics.stages)
    };
  }

  clearSession(sessionId: string): void {
    this.metrics.delete(sessionId);
  }

  getAllSessions(): Array<ReturnType<typeof this.getMetrics>> {
    return Array.from(this.metrics.keys())
      .map(id => this.getMetrics(id))
      .filter(Boolean) as Array<ReturnType<typeof this.getMetrics>>;
  }
}
