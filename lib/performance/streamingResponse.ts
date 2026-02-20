/**
 * Streaming Response Implementation
 * Progressive loading, real-time progress, and background processing
 */


interface StreamingChunk {
  id: string;
  type: 'progress' | 'result' | 'error' | 'complete';
  data: any;
  timestamp: number;
}

interface StreamingOptions {
  chunkDelay?: number;
  enableProgress?: boolean;
  maxChunkSize?: number;
}

/**
 * Create streaming response for skin analysis
 */
export function createStreamingResponse(
  analysisPromise: Promise<any>,
  options: StreamingOptions = {}
) {
  const {
    chunkDelay = 500,
    enableProgress = true,
    maxChunkSize = 1024
  } = options;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial progress
        if (enableProgress) {
          sendChunk(controller, {
            id: 'init',
            type: 'progress',
            data: { stage: 'initialization', progress: 0 },
            timestamp: Date.now()
          });
        }

        // Process analysis with progress updates
        const result = await processWithStreamingProgress(
          analysisPromise,
          controller,
          enableProgress,
          chunkDelay
        );

        // Send final result
        sendChunk(controller, {
          id: 'final',
          type: 'result',
          data: result,
          timestamp: Date.now()
        });

        // Send completion signal
        sendChunk(controller, {
          id: 'complete',
          type: 'complete',
          data: { success: true },
          timestamp: Date.now()
        });

      } catch (error) {
        // Send error
        sendChunk(controller, {
          id: 'error',
          type: 'error',
          data: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now()
          },
          timestamp: Date.now()
        });
      } finally {
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
    },
  });
}

/**
 * Process analysis with streaming progress updates
 */
async function processWithStreamingProgress<T>(
  analysisPromise: Promise<T>,
  controller: ReadableStreamDefaultController,
  enableProgress: boolean,
  chunkDelay: number
): Promise<T> {
  // Simulate progress stages for better UX
  const stages = [
    { name: 'preprocessing', weight: 20, message: 'เตรียมรูปภาพ...' },
    { name: 'face-detection', weight: 15, message: 'ตรวจจับใบหน้า...' },
    { name: 'skin-analysis', weight: 40, message: 'วิเคราะห์สภาพผิว...' },
    { name: 'ai-processing', weight: 20, message: 'ประมวลผล AI...' },
    { name: 'finalizing', weight: 5, message: 'กำลังเสร็จสิ้น...' }
  ];

  let currentProgress = 0;

  // Start the actual analysis
  const analysisTask = analysisPromise;

  // Send progress updates while analysis runs
  for (const stage of stages) {
    if (enableProgress) {
      sendChunk(controller, {
        id: `progress-${stage.name}`,
        type: 'progress',
        data: { 
          stage: stage.name, 
          progress: currentProgress,
          message: stage.message
        },
        timestamp: Date.now()
      });
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, chunkDelay));
    currentProgress += stage.weight;
  }

  // Wait for actual analysis to complete
  const result = await analysisTask;

  return result;
}

/**
 * Send chunk to stream
 */
function sendChunk(
  controller: ReadableStreamDefaultController,
  chunk: StreamingChunk
) {
  const data = `data: ${JSON.stringify(chunk)}\n\n`;
  controller.enqueue(new TextEncoder().encode(data));
}

/**
 * Streaming response handler for client-side
 */
export class StreamingResponseHandler {
  private eventSource: EventSource | null = null;
  private onProgress?: (data: any) => void;
  private onResult?: (data: any) => void;
  private onError?: (error: any) => void;
  private onComplete?: () => void;

  constructor(options: {
    onProgress?: (data: any) => void;
    onResult?: (data: any) => void;
    onError?: (error: any) => void;
    onComplete?: () => void;
  }) {
    this.onProgress = options.onProgress;
    this.onResult = options.onResult;
    this.onError = options.onError;
    this.onComplete = options.onComplete;
  }

  connect(url: string): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

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
      console.error('Streaming error:', error);
      this.onError?.(error);
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private handleChunk(chunk: StreamingChunk): void {
    switch (chunk.type) {
      case 'progress':
        this.onProgress?.(chunk.data);
        break;
      case 'result':
        this.onResult?.(chunk.data);
        break;
      case 'error':
        this.onError?.(chunk.data);
        break;
      case 'complete':
        this.onComplete?.();
        this.disconnect();
        break;
    }
  }
}

/**
 * Background processing queue
 */
export class BackgroundProcessingQueue {
  private static instance: BackgroundProcessingQueue;
  private queue: Array<{
    id: string;
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    priority: number;
  }> = [];
  private isProcessing = false;
  private maxConcurrent = 2;

  static getInstance(): BackgroundProcessingQueue {
    if (!BackgroundProcessingQueue.instance) {
      BackgroundProcessingQueue.instance = new BackgroundProcessingQueue();
    }
    return BackgroundProcessingQueue.instance;
  }

  add<T>(
    task: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9);
      
      this.queue.push({
        id,
        task,
        resolve,
        reject,
        priority
      });

      // Sort by priority (higher priority first)
      this.queue.sort((a, b) => b.priority - a.priority);

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    const tasksToProcess = this.queue.splice(0, this.maxConcurrent);
    
    await Promise.allSettled(
      tasksToProcess.map(async (queueItem) => {
        try {
          const result = await queueItem.task();
          queueItem.resolve(result);
        } catch (error) {
          queueItem.reject(error);
        }
      })
    );

    this.isProcessing = false;
    
    // Process next batch if there are more items
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  clear(): void {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

/**
 * Progressive image loader
 */
export class ProgressiveImageLoader {
  private static instance: ProgressiveImageLoader;
  private cache = new Map<string, string>();

  static getInstance(): ProgressiveImageLoader {
    if (!ProgressiveImageLoader.instance) {
      ProgressiveImageLoader.instance = new ProgressiveImageLoader();
    }
    return ProgressiveImageLoader.instance;
  }

  async loadImageProgressively(
    imageUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    // Check cache first
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!;
    }

    try {
      // Create image object for progressive loading
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Convert to base64
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          this.cache.set(imageUrl, base64);
          resolve(base64);
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        // Simulate progressive loading
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          onProgress?.(progress);
          
          if (progress >= 100) {
            clearInterval(progressInterval);
          }
        }, 100);

        img.src = imageUrl;
      });
    } catch (error) {
      throw new Error(`Progressive image loading failed: ${error}`);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

/**
 * Performance monitoring for streaming
 */
export class StreamingPerformanceMonitor {
  private static instance: StreamingPerformanceMonitor;
  private metrics = new Map<string, {
    startTime: number;
    endTime?: number;
    chunksReceived: number;
    totalBytes: number;
  }>();

  static getInstance(): StreamingPerformanceMonitor {
    if (!StreamingPerformanceMonitor.instance) {
      StreamingPerformanceMonitor.instance = new StreamingPerformanceMonitor();
    }
    return StreamingPerformanceMonitor.instance;
  }

  startTracking(sessionId: string): void {
    this.metrics.set(sessionId, {
      startTime: Date.now(),
      chunksReceived: 0,
      totalBytes: 0
    });
  }

  recordChunk(sessionId: string, chunkSize: number): void {
    const metrics = this.metrics.get(sessionId);
    if (metrics) {
      metrics.chunksReceived++;
      metrics.totalBytes += chunkSize;
    }
  }

  endTracking(sessionId: string): void {
    const metrics = this.metrics.get(sessionId);
    if (metrics) {
      metrics.endTime = Date.now();
    }
  }

  getMetrics(sessionId: string) {
    const metrics = this.metrics.get(sessionId);
    if (!metrics) return null;

    const duration = metrics.endTime ? metrics.endTime - metrics.startTime : Date.now() - metrics.startTime;
    const throughput = duration > 0 ? (metrics.totalBytes / duration) * 1000 : 0; // bytes per second

    return {
      duration,
      chunksReceived: metrics.chunksReceived,
      totalBytes: metrics.totalBytes,
      throughput,
      averageChunkSize: metrics.chunksReceived > 0 ? metrics.totalBytes / metrics.chunksReceived : 0
    };
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}
