'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Upload, 
  SpinnerGap, 
  CheckCircle,
  ArrowRight,
  Clock,
  ArrowUp
} from '@phosphor-icons/react';

interface FoodComponent {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

interface AnalysisResult {
  success: boolean;
  components: FoodComponent[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  processingTime: number;
  recommendations: string[];
}

export default function DemoFoodAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Demo AI Analysis - จำลองการวิเคราะห์
  const performDemoAnalysis = async (imageData: string): Promise<AnalysisResult> => {
    // จำลอง processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Demo food components - จำลอง AI วิเคราะห์
    const demoComponents: FoodComponent[] = [
      {
        name: 'ข้าวสวย',
        portion: '150 กรัม (1 จาน)',
        calories: 525,
        protein: 12,
        carbs: 115,
        fat: 1,
        confidence: 0.95
      },
      {
        name: 'อกไก่ย่าง',
        portion: '120 กรัม (1 ชิ้น)',
        calories: 198,
        protein: 36,
        carbs: 0,
        fat: 4,
        confidence: 0.92
      },
      {
        name: 'พักกาดขาว',
        portion: '30 กรัม (2 ใบ)',
        calories: 5,
        protein: 0.5,
        carbs: 1,
        fat: 0,
        confidence: 0.88
      },
      {
        name: 'มะเขือเทศ',
        portion: '60 กรัม (5-6 ลูก)',
        calories: 11,
        protein: 0.5,
        carbs: 2,
        fat: 0,
        confidence: 0.85
      },
      {
        name: 'นม',
        portion: '240 มล (1 แก้ว)',
        calories: 101,
        protein: 8,
        carbs: 12,
        fat: 2,
        confidence: 0.90
      }
    ];

    const totalNutrition = demoComponents.reduce((acc, component) => ({
      calories: acc.calories + component.calories,
      protein: acc.protein + component.protein,
      carbs: acc.carbs + component.carbs,
      fat: acc.fat + component.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const recommendations = [
      'มีโปรตีนสูงเหมาะสำหรับคนออกกำลังกาย',
      'คาร์โบไฮเดรตอยู่ในเกณฑ์ที่ดี',
      'ควรเพิ่มผักเพื่อให้ได้ใยอาหารมากขึ้น',
      'มีสมดุลของสารอาหารที่ดี'
    ];

    return {
      success: true,
      components: demoComponents,
      totalNutrition,
      processingTime: 2000,
      recommendations
    };
  };

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
      const analysisResult = await performDemoAnalysis(selectedImage);
      setResult(analysisResult);
    } catch (error) {
      setError('การวิเคราะห์ล้มเหลว กรุณาลองใหม่');
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🍽️ AI Food Analysis Demo</h1>
        <p className="text-gray-600">วิเคราะห์อาหารจากรูปภาพด้วย AI - ทดสอบระบบจริง</p>
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
                คลิกเพื่ออัปโหลดรูปอาหารที่ต้องการวิเคราะห์
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
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
                      กำลังวิเคราะห์...
                    </>
                  ) : (
                    <>
                      <ArrowUp className="w-5 h-5 mr-2" />
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
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Analysis Result */}
      {result && (
        <div className="space-y-6">
          {/* Success Header */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">การวิเคราะห์เสร็จสมบูรณ์!</span>
                <span className="text-sm">
                  (ใช้เวลา {result.processingTime}ms)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Nutrition */}
          <Card>
            <CardHeader>
              <CardTitle>📊 โภชนาการรวม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <span className="text-sm text-gray-500">
                          ({component.portion})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-600">
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

      {/* Demo Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">🧪 ระบบทดสอบ (Demo)</p>
              <p>
                นี่คือระบบทดสอบ AI Food Analysis ที่จำลองการวิเคราะห์อาหาร
                ในอนาคตจะใช้ AI จริงในการวิเคราะห์รูปภาพที่อัปโหลด
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
