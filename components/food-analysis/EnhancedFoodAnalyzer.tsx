'use client';

import { useState, useRef, useEffect } from 'react';
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
  Info,
  Gear,
  Check
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
  source: 'gemini' | 'huggingface' | 'calorie_mama' | 'thai_database';
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
    aiModelsUsed: string[];
  };
  apis_used?: {
    gemini: boolean;
    huggingface: boolean;
    calorieMama: boolean;
  };
}

interface EnhancedFoodAnalyzerProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onError?: (error: string) => void;
  userId: string;
  clinicId: string;
  userPreferences?: any;
}

export default function EnhancedFoodAnalyzer({ 
  onAnalysisComplete, 
  onError, 
  userId, 
  clinicId,
  userPreferences 
}: EnhancedFoodAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableAPIs, setAvailableAPIs] = useState<any>(null);
  const [isLoadingAPIs, setIsLoadingAPIs] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ตรวจสอบ API ที่มีอยู่
  useEffect(() => {
    const checkAPIs = async () => {
      try {
        const response = await fetch('/api/enhanced-food-analysis', {
          method: 'OPTIONS'
        });
        const data = await response.json();
        setAvailableAPIs(data);
      } catch (error) {
        console.error('Failed to check APIs:', error);
        setAvailableAPIs({
          available_apis: { gemini: false, huggingface: false, calorieMama: false }
        });
      } finally {
        setIsLoadingAPIs(false);
      }
    };

    checkAPIs();
  }, []);

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
      const response = await fetch('/api/enhanced-food-analysis', {
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

  const getAPIStatusIcon = (apiName: string, isAvailable: boolean) => {
    if (isAvailable) {
      return <Check className="w-4 h-4 text-green-600" />;
    }
    return <Warning className="w-4 h-4 text-red-600" />;
  };

  const getAPIStatusText = (apiName: string, isAvailable: boolean) => {
    if (isAvailable) return 'พร้อมใช้งาน';
    return 'ยังไม่ได้ตั้งค่า';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'gemini':
        return <span className="text-blue-600">🤖</span>;
      case 'huggingface':
        return <span className="text-purple-600">🧠</span>;
      case 'calorie_mama':
        return <span className="text-orange-600">🍽️</span>;
      default:
        return <span className="text-gray-600">📊</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🚀 Enhanced AI Food Analysis</h1>
        <p className="text-gray-600">วิเคราะห์อาหารไทยด้วยหลาย AI รวมกัน</p>
      </div>

      {/* API Status */}
      {!isLoadingAPIs && availableAPIs && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gear className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">สถานะ API ที่ใช้:</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {getAPIStatusIcon('Gemini', availableAPIs.available_apis.gemini)}
                <div>
                  <p className="text-sm font-medium">Gemini Vision</p>
                  <p className="text-xs text-gray-600">
                    {getAPIStatusText('Gemini', availableAPIs.available_apis.gemini)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getAPIStatusIcon('HuggingFace', availableAPIs.available_apis.huggingface)}
                <div>
                  <p className="text-sm font-medium">HuggingFace</p>
                  <p className="text-xs text-gray-600">
                    {getAPIStatusText('HuggingFace', availableAPIs.available_apis.huggingface)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getAPIStatusIcon('Calorie Mama', availableAPIs.available_apis.calorieMama)}
                <div>
                  <p className="text-sm font-medium">Calorie Mama</p>
                  <p className="text-xs text-gray-600">
                    {getAPIStatusText('Calorie Mama', availableAPIs.available_apis.calorieMama)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-700">
              <p>Thai Foods: {availableAPIs.thai_foods_count} เมนู</p>
              <p>Features: {availableAPIs.features?.join(', ')}</p>
            </div>
          </CardContent>
        </Card>
      )}

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
                id="enhanced-file-upload"
              />
              <label
                htmlFor="enhanced-file-upload"
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
                      กำลังวิเคราะห์ด้วยหลาย AI...
                    </>
                  ) : (
                    <>
                      <TrendUp className="w-5 h-5 mr-2" />
                      วิเคราะห์อาหารแบบ Enhanced
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
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-purple-800">
                  <p className="font-medium mb-1">🤖 Enhanced AI Analysis</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <span className="font-medium">จำนวนที่ตรวจพบ:</span> {result.imageAnalysis.detectedItems} รายการ
                    </div>
                    <div>
                      <span className="font-medium">ความแม่นยำการจดแจก:</span> {(result.imageAnalysis.recognitionAccuracy * 100).toFixed(0)}%
                    </div>
                    <div>
                      <span className="font-medium">ความแม่นยำปริมาณ:</span> {(result.imageAnalysis.portionAccuracy * 100).toFixed(0)}%
                    </div>
                    <div>
                      <span className="font-medium">AI Models ที่ใช้:</span> {result.imageAnalysis.aiModelsUsed?.join(', ') || 'N/A'}
                    </div>
                  </div>
                  {result.apis_used && (
                    <div className="mt-2 text-xs">
                      <p>APIs ที่ใช้: {Object.entries(result.apis_used).filter(([key, val]) => val).map(([key]) => key).join(', ')}</p>
                    </div>
                  )}
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
                        {getSourceIcon(component.source)}
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
                        <span className="text-xs text-gray-600">
                          แหล่ง: {component.source}
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
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">🚀 Enhanced AI Food Analysis System</p>
              <p>
                ระบบวิเคราะห์อาหารด้วย AI แบบ multi-API ใช้ Gemini Vision + HuggingFace + Calorie Mama
                สามารถจดแจกอาหารไทยได้แม่นยำสูง คำนวณโภชนาการครบถ้วน และให้คำแนะนำส่วนบุคคล
              </p>
              <div className="mt-2 text-xs text-gray-600">
                <p>• รองรับอาหารไทย 15+ เมนูหลัก</p>
                <p>• ความแม่นยำสูงสุด 95%+ (เมื่อใช้หลาย API)</p>
                <p>• ประมาณขนาดส่วนอัตโนมัติ</p>
                <p>• คำนวณโภชนาการครบถ้วน</p>
                <p>• บูรณาการกับ API ที่มีอยู่แล้วใน BN-Aura</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
