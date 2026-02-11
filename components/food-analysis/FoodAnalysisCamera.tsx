'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Upload, 
  SpinnerGap, 
  CheckCircle, 
  WarningCircle,
  ArrowRight
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface FoodAnalysisCameraProps {
  onAnalysisComplete: (result: any) => void;
  onError: (error: string) => void;
  userId: string;
  clinicId: string;
  userPreferences?: any;
}

export default function FoodAnalysisCamera({
  onAnalysisComplete,
  onError,
  userId,
  clinicId,
  userPreferences
}: FoodAnalysisCameraProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      onError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการอนุญาตการเข้าถึงกล้อง');
    }
  }, [onError]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    
    // Stop camera after capture
    stopCamera();
  }, [stopCamera]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Analyze captured image
  const analyzeImage = useCallback(async () => {
    if (!capturedImage) return;

    setIsProcessing(true);

    try {
      // Convert base64 to blob for API
      const response = await fetch('/api/food-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: capturedImage,
          userId,
          clinicId,
          userPreferences
        })
      });

      const result = await response.json();

      if (result.success) {
        onAnalysisComplete(result);
      } else {
        onError(result.error || 'การวิเคราะห์ล้มเหลว');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      onError('เกิดข้อผิดพลาดในการวิเคราะห์ กรุณาลองใหม่');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, userId, clinicId, userPreferences, onAnalysisComplete, onError]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError('ขนาดไฟล์ต้องไม่เกิน 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      stopCamera();
    };
    reader.readAsDataURL(file);
  }, [onError, stopCamera]);

  // Cleanup on unmount
  useState(() => {
    return () => {
      stopCamera();
    };
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          วิเคราะห์อาหาร
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!capturedImage ? (
          <div className="space-y-4">
            {/* Camera preview */}
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {!stream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">กดปุ่มเพื่อเปิดกล้อง</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              {!stream ? (
                <Button
                  onClick={startCamera}
                  className="flex-1"
                  disabled={isCapturing}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  เปิดกล้อง
                </Button>
              ) : (
                <>
                  <Button
                    onClick={capturePhoto}
                    className="flex-1"
                    disabled={isCapturing}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    ถ่ายรูป
                  </Button>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    disabled={isCapturing}
                  >
                    ยกเลิก
                  </Button>
                </>
              )}
            </div>

            {/* File upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                หรืออัปโหลดรูปภาพจากอุปกรณ์
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm"
              >
                เลือกไฟล์
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Captured image preview */}
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={capturedImage}
                alt="Captured food"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Image info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-800">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  ถ่ายรูปสำเร็จแล้ว
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1"
                disabled={isProcessing}
              >
                ถ่ายใหม่
              </Button>
              <Button
                onClick={analyzeImage}
                className="flex-1"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <SpinnerGap className="w-4 h-4 mr-2 animate-spin" />
                    กำลังวิเคราะห์...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    วิเคราะห์
                  </>
                )}
              </Button>
            </div>

            {/* Tips */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2 text-amber-800">
                <WarningCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">คำแนะนำ:</p>
                  <ul className="text-xs space-y-1">
                    <li>• ถ่ายรูปในที่สว่างและชัดเจน</li>
                    <li>• จัดอาหารให้เห็นชัดเจนทั้งหมด</li>
                    <li>• หลีกเลี่ยงเงาและแสสะท้อน</li>
                    <li>• ถ่ายในระยะที่เหมาะสม</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
