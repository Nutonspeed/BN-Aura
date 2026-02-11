'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Upload, 
  SpinnerGap, 
  CheckCircle,
  Clock,
  TrendUp,
  Warning,
  Info
} from '@phosphor-icons/react';

interface FoodComponent {
  name: string;
  name_th?: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  confidence: number;
  category: string;
}

interface AnalysisResult {
  success: boolean;
  components: FoodComponent[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  processingTime: number;
  recommendations: string[];
  warnings: string[];
  confidence: number;
  imageAnalysis: {
    detectedItems: number;
    recognitionAccuracy: number;
    portionAccuracy: number;
  };
}

interface RealFoodAnalyzerProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onError?: (error: string) => void;
  userId: string;
  clinicId: string;
  userPreferences?: any;
}

export default function RealFoodAnalyzer({ 
  onAnalysisComplete, 
  onError, 
  userId, 
  clinicId,
  userPreferences 
}: RealFoodAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setError(null);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/real-food-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage,
          userId,
          clinicId,
          userPreferences
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'การวิเคราะห์ล้มเหลว');
      }

      const analysisResult = data.result;
      setResult(analysisResult);
      onAnalysisComplete?.(analysisResult);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'การวิเคราะห์ล้มเหลว กรุณาลองใหม่';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'สูงมาก';
    if (confidence >= 0.7) return 'ปานกลาง';
    return 'ต่ำ';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🍽️ AI Food Analysis - Real System</h1>
        <p className="text-gray-600">วิเคราะห์อาหารไทยด้วย AI แม่นยำสูง</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            อัปโหลดรูปอาหาร
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedImage ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                ถ่ายรูปหรืออัปโหลดรูปอาหารที่ต้องการวิเคราะห์
              </p>
              <p className="text-sm text-gray-500 mb-4">
                รองรับอาหารไทย: ข้าวมันไก่, ต้มยำ, ผัดไทย, แกงเขียวหวาน และอื่นๆ
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="real-file-upload"
              />
              <label
                htmlFor="real-file-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                เลือกรูปภาพ
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected food"
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  เปลี่ยนรูป
                </Button>
              </div>

              {/* Analyze Button */}
              <div className="text-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  size="lg"
                  className="px-8"
                >
                  {isAnalyzing ? (
                    <>
                      <SpinnerGap className="w-5 h-5 mr-2 animate-spin" />
                      กำลังวิเคราะห์ด้วย AI...
                    </>
                  ) : (
                    <>
                      <TrendUp className="w-5 h-5 mr-2" />
                      วิเคราะห์อาหาร
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <Warning className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Result */}
      {result && (
        <div className="space-y-6">
          {/* Success Header */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">การวิเคราะห์เสร็จสมบูรณ์!</span>
                  <span className="text-sm">
                    (ใช้เวลา {result.processingTime}ms)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">ความมั่นใจ:</span>
                  <span className={`font-medium ${getConfidenceColor(result.confidence)}`}>
                    {getConfidenceText(result.confidence)} ({(result.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">🤖 ข้อมูลการวิเคราะห์ AI</p>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <span className="font-medium">จำนวนที่ตรวจพบ:</span> {result.imageAnalysis.detectedItems} รายการ
                    </div>
                    <div>
                      <span className="font-medium">ความแม่นยำการจดแจก:</span> {(result.imageAnalysis.recognitionAccuracy * 100).toFixed(0)}%
                    </div>
                    <div>
                      <span className="font-medium">ความแม่นยำปริมาณ:</span> {(result.imageAnalysis.portionAccuracy * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Nutrition */}
          <Card>
            <CardHeader>
              <CardTitle>📊 โภชนาการรวม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">แคลอรี่</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {result.totalNutrition.calories}
                  </p>
                  <p className="text-xs text-gray-500">kcal</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">โปรตีน</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {result.totalNutrition.protein.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">g</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">คาร์โบไฮเดรต</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {result.totalNutrition.carbs.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">g</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">ไขมัน</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {result.totalNutrition.fat.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">g</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">ใยอาหาร</p>
                  <p className="text-2xl font-bold text-green-600">
                    {result.totalNutrition.fiber.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">g</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">โซเดียม</p>
                  <p className="text-2xl font-bold text-red-600">
                    {result.totalNutrition.sodium}
                  </p>
                  <p className="text-xs text-gray-500">mg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Food Components */}
          <Card>
            <CardHeader>
              <CardTitle>🍽️ ส่วนประกอบอาหาร</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.components.map((component, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{component.name}</span>
                        {component.name_th && (
                          <span className="text-sm text-gray-500">
                            ({component.name_th})
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          ({component.portion})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-600">
                          หมวด: {component.category}
                        </span>
                        <span className={`text-xs ${getConfidenceColor(component.confidence)}`}>
                          ความมั่นใจ: {(component.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-orange-600">
                        {component.calories} kcal
                      </p>
                      <p className="text-xs text-gray-500">
                        โปรตีน {component.protein}g | คาร์โบ {component.carbs}g | ไขมัน {component.fat}g
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>💡 คำแนะนำ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <Warning className="w-5 h-5" />
                  คำเตือน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-yellow-100 rounded-lg"
                    >
                      <Warning className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">{warning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleReset} variant="outline" className="flex-1">
              วิเคราะห์รูปใหม่
            </Button>
            <Button className="flex-1">
              บันทึกผลลัพธ์
            </Button>
          </div>
        </div>
      )}

      {/* System Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">🤖 Real AI Food Analysis System</p>
              <p>
                ระบบวิเคราะห์อาหารด้วย AI จริง ใช้ Calorie Mama API และ Gemini Vision
                สามารถจดแจกอาหารไทยได้แม่นยำ คำนวณโภชนาการ และให้คำแนะนำส่วนบุคคล
              </p>
              <div className="mt-2 text-xs text-gray-500">
                <p>• รองรับอาหารไทย 12+ เมนูหลัก</p>
                <p>• ความแม่นยำสูงสุด 95%</p>
                <p>• ประมาณขนาดส่วนอัตโนมัติ</p>
                <p>• คำนวณโภชนาการครบถ้วน</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
