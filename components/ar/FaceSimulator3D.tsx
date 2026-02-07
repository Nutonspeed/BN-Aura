'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { 
  Camera,
  Sparkle
} from '@phosphor-icons/react';
export default function FaceSimulator3D({ customerId }: { customerId: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceData, setFaceData] = useState<any>(null);
  const [treatmentType, setTreatmentType] = useState<'filler' | 'botox'>('filler');
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      alert('กรุณาอนุญาตการเข้าถึงกล้อง');
    }
  };

  const captureAndSimulate = async () => {
    if (!videoRef.current) return;
    
    setIsCapturing(true);
    
    try {
      // Start session if not exists
      if (!sessionId) {
        const startResponse = await fetch('/api/ar/session?action=start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, sessionType: '3d_simulation' })
        });
        const startResult = await startResponse.json();
        if (startResult.success) {
          setSessionId(startResult.data.sessionId);
        }
      }

      // Capture face
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');

      // Send for processing
      const captureResponse = await fetch('/api/ar/session?action=capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, imageData })
      });
      const captureResult = await captureResponse.json();

      if (captureResult.success) {
        setFaceData(captureResult.data);
        
        // Run simulation
        const simResponse = await fetch('/api/ar/session?action=simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, treatmentType, targetAreas: ['cheeks', 'lips'] })
        });
        const simResult = await simResponse.json();
        
        if (simResult.success) {
          alert(`✨ ${treatmentType} simulation completed! Confidence: ${Math.round(simResult.data.confidence * 100)}%`);
        }
      }
    } catch (error) {
      alert('การจำลองล้มเหลว กรุณาลองใหม่');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkle className="w-5 h-5 text-purple-500" />
          <h3 className="font-bold">3D Face Simulator</h3>
        </div>

        {/* Video Preview */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[4/3]">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          {faceData && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
              Face: {Math.round(faceData.confidence * 100)}%
            </div>
          )}
        </div>

        {/* Treatment Type */}
        <div className="flex gap-2">
          <Button 
            variant={treatmentType === 'filler' ? 'default' : 'outline'}
            size="sm" 
            onClick={() => setTreatmentType('filler')}
            className="flex-1"
          >
            Filler
          </Button>
          <Button 
            variant={treatmentType === 'botox' ? 'default' : 'outline'}
            size="sm" 
            onClick={() => setTreatmentType('botox')}
            className="flex-1"
          >
            Botox
          </Button>
        </div>

        {/* Controls */}
        <div className="space-y-2">
          <Button onClick={startCamera} className="w-full" variant="outline">
            <Camera className="w-4 h-4 mr-2" />
            Start Camera
          </Button>
          <Button 
            onClick={captureAndSimulate} 
            disabled={isCapturing || !videoRef.current?.srcObject}
            className="w-full"
          >
            {isCapturing ? 'Processing...' : `Simulate ${treatmentType}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
