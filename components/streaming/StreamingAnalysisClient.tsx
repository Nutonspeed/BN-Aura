/**
 * Streaming Analysis Client Component
 * Real-time skin analysis with progress tracking
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ClientStreamingHandler, StreamingChunk } from '@/lib/performance/streamingProcessor';
import { MOBILE_ERROR_MESSAGES } from '@/lib/performance/mobileOptimization';

interface StreamingAnalysisClientProps {
  onRequestAnalysis: (enableStreaming: boolean) => void;
  isAnalyzing: boolean;
  children?: React.ReactNode;
}

interface AnalysisProgress {
  stage: string;
  progress: number;
  message: string;
  timestamp: number;
}

interface AnalysisResult {
  stage: string;
  result: any;
  partial: boolean;
}

export function StreamingAnalysisClient({
  onRequestAnalysis,
  isAnalyzing,
  children
}: StreamingAnalysisClientProps) {
  const [progress, setProgress] = useState<AnalysisProgress[]>([]);
  const [partialResults, setPartialResults] = useState<AnalysisResult[]>([]);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const streamingHandlerRef = useRef<ClientStreamingHandler | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamingHandlerRef.current) {
        streamingHandlerRef.current.disconnect();
      }
    };
  }, []);

  const startStreamingAnalysis = async (analysisData: any) => {
    // Reset state
    setProgress([]);
    setPartialResults([]);
    setFinalResult(null);
    setError(null);
    setIsStreaming(true);

    // Generate session ID
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);

    // Create streaming handler
    const handler = new ClientStreamingHandler({
      onProgress: (chunk: StreamingChunk) => {
        console.log('Progress chunk:', chunk);
        setProgress(prev => [...prev, {
          stage: chunk.data.stage,
          progress: chunk.data.progress || 0,
          message: chunk.data.message || '',
          timestamp: chunk.timestamp
        }]);
      },
      onPartialResult: (chunk: StreamingChunk) => {
        console.log('Partial result:', chunk);
        setPartialResults(prev => [...prev, {
          stage: chunk.data.stage,
          result: chunk.data.result,
          partial: chunk.data.partial
        }]);
      },
      onFinalResult: (chunk: StreamingChunk) => {
        console.log('Final result:', chunk);
        setFinalResult(chunk.data.result);
        setIsStreaming(false);
      },
      onError: (chunk: StreamingChunk) => {
        console.error('Analysis error:', chunk);
        setError(chunk.data.error || 'Unknown error occurred');
        setIsStreaming(false);
      },
      onComplete: (chunk: StreamingChunk) => {
        console.log('Analysis complete:', chunk);
        setIsStreaming(false);
      }
    });

    streamingHandlerRef.current = handler;

    try {
      // Connect to streaming endpoint
      await handler.connect('/api/analysis/skin/streaming', {
        method: 'POST',
        body: analysisData,
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': newSessionId
        }
      });
    } catch (error) {
      console.error('Failed to start streaming:', error);
      setError('Failed to start streaming analysis');
      setIsStreaming(false);
    }
  };

  const stopStreaming = () => {
    if (streamingHandlerRef.current) {
      streamingHandlerRef.current.disconnect();
      streamingHandlerRef.current = null;
    }
    setIsStreaming(false);
  };

  const getProgressPercentage = () => {
    if (progress.length === 0) return 0;
    const latestProgress = progress[progress.length - 1];
    return latestProgress.progress || 0;
  };

  const getCurrentStage = () => {
    if (progress.length === 0) return '';
    const latestProgress = progress[progress.length - 1];
    return latestProgress.message || latestProgress.stage;
  };

  const getMobileOptimizationMessage = () => {
    if (progress.some(p => p.stage === 'preprocessing')) {
      return MOBILE_ERROR_MESSAGES.LOW_PERFORMANCE;
    }
    return '';
  };

  return (
    <div className="streaming-analysis-client">
      {children}

      {/* Progress Display */}
      {isStreaming && (
        <div className="streaming-progress">
          <div className="progress-header">
            <h3>กำลังวิเคราะห์ผิวหน้า...</h3>
            <span className="progress-percentage">{getProgressPercentage().toFixed(0)}%</span>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>

          {/* Current Stage */}
          <div className="current-stage">
            <p>{getCurrentStage()}</p>
            {getMobileOptimizationMessage() && (
              <p className="mobile-optimization">{getMobileOptimizationMessage()}</p>
            )}
          </div>

          {/* Progress Timeline */}
          <div className="progress-timeline">
            {progress.map((prog, index) => (
              <div key={index} className="progress-item">
                <span className="stage-name">{prog.stage}</span>
                <span className="stage-progress">{prog.progress.toFixed(0)}%</span>
              </div>
            ))}
          </div>

          {/* Partial Results */}
          {partialResults.length > 0 && (
            <div className="partial-results">
              <h4>ผลลัพธ์บางส่วน:</h4>
              {partialResults.map((result, index) => (
                <div key={index} className="partial-result-item">
                  <span className="result-stage">{result.stage}</span>
                  <span className="result-status">
                    {result.partial ? 'กำลังดำเนินการ...' : 'เสร็จสิ้น'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Stop Button */}
          <button 
            onClick={stopStreaming}
            className="stop-streaming-btn"
            disabled={!isStreaming}
          >
            หยุดการวิเคราะห์
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="analysis-error">
          <h3>❌ เกิดข้อผิดพลาด</h3>
          <p>{error}</p>
          <button onClick={() => setError(null)}>
            ปิด
          </button>
        </div>
      )}

      {/* Final Result */}
      {finalResult && (
        <div className="final-result">
          <h3>✅ วิเคราะห์ผิวเสร็จสิ้น</h3>
          <div className="result-summary">
            <p>เวลาที่ใช้: {finalResult.processingTime}ms</p>
            <p>ปรับให้เหมาะกับมือถือ: {finalResult.mobileOptimized ? 'ใช่' : 'ไม่ใช่'}</p>
            <p>สถานะ: {finalResult.combined ? 'รวมผลลัพธ์' : 'ผลลัพธ์เดี่ยว'}</p>
          </div>
          
          {/* Stage Results */}
          {finalResult.stages && finalResult.stages.map((stage: any, index: number) => (
            <div key={index} className="stage-result">
              <h4>{stage.stage}</h4>
              <pre>{JSON.stringify(stage, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}

      {/* Session Info */}
      {sessionId && (
        <div className="session-info">
          <small>Session ID: {sessionId}</small>
        </div>
      )}

      <style jsx>{`
        .streaming-analysis-client {
          width: 100%;
        }

        .streaming-progress {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .progress-header h3 {
          margin: 0;
          color: #333;
        }

        .progress-percentage {
          font-weight: bold;
          color: #007bff;
        }

        .progress-bar-container {
          width: 100%;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 15px;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #007bff, #0056b3);
          transition: width 0.3s ease;
        }

        .current-stage {
          margin-bottom: 15px;
        }

        .current-stage p {
          margin: 0 0 5px 0;
          color: #666;
        }

        .mobile-optimization {
          color: #ff6b6b;
          font-size: 0.9em;
        }

        .progress-timeline {
          max-height: 150px;
          overflow-y: auto;
          margin-bottom: 15px;
        }

        .progress-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #eee;
        }

        .stage-name {
          color: #333;
        }

        .stage-progress {
          color: #007bff;
          font-weight: bold;
        }

        .partial-results {
          margin-bottom: 15px;
        }

        .partial-results h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .partial-result-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }

        .result-stage {
          color: #666;
        }

        .result-status {
          color: #28a745;
        }

        .stop-streaming-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .stop-streaming-btn:hover {
          background: #c82333;
        }

        .stop-streaming-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .analysis-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }

        .analysis-error h3 {
          margin: 0 0 10px 0;
          color: #721c24;
        }

        .analysis-error p {
          margin: 0 0 15px 0;
          color: #721c24;
        }

        .analysis-error button {
          background: #721c24;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .final-result {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }

        .final-result h3 {
          margin: 0 0 15px 0;
          color: #155724;
        }

        .result-summary {
          margin-bottom: 15px;
        }

        .result-summary p {
          margin: 5px 0;
          color: #155724;
        }

        .stage-result {
          margin-top: 15px;
        }

        .stage-result h4 {
          margin: 0 0 10px 0;
          color: #155724;
        }

        .stage-result pre {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.9em;
        }

        .session-info {
          text-align: center;
          color: #6c757d;
          margin-top: 10px;
        }

        .session-info small {
          font-size: 0.8em;
        }
      `}</style>
    </div>
  );
}

export default StreamingAnalysisClient;
