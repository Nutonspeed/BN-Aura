'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  WarningCircle, 
  Info, 
  Calendar,
  TrendUp,
  TrendDown,
  Minus,
  Share,
  Download,
  Clock
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface FoodItem {
  id: string;
  name_th: string;
  name_en?: string;
  category: string;
  subcategory: string;
  confidence: number;
  nutritionData: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  allergens: string[];
  ingredients: string[];
}

interface AnalysisResult {
  success: boolean;
  foodItems: FoodItem[];
  overallNutrition: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    totalSugar: number;
    totalSodium: number;
  };
  confidence: number;
  processingTimeMs: number;
  recommendations: string[];
  warnings?: string[];
  usageCount: number;
  maxUsage: number;
}

interface FoodAnalysisResultsProps {
  result: AnalysisResult;
  onSave?: (result: AnalysisResult) => void;
  onShare?: (result: AnalysisResult) => void;
  onNewAnalysis?: () => void;
}

export default function FoodAnalysisResults({
  result,
  onSave,
  onShare,
  onNewAnalysis
}: FoodAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'recommendations'>('overview');

  const getNutrientIcon = (nutrient: string, value: number, target?: number) => {
    if (!target) return <Minus className="w-4 h-4 text-gray-500" />;
    
    if (value > target * 1.2) return <TrendUp className="w-4 h-4 text-red-500" />;
    if (value < target * 0.8) return <TrendDown className="w-4 h-4 text-green-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getNutrientColor = (nutrient: string, value: number, target?: number) => {
    if (!target) return 'text-gray-600';
    
    if (nutrient === 'calories' && value > target * 1.2) return 'text-red-600';
    if (nutrient === 'sodium' && value > target * 1.2) return 'text-red-600';
    if (nutrient === 'sugar' && value > target * 1.2) return 'text-red-600';
    
    if (value < target * 0.8 && nutrient !== 'calories') return 'text-orange-600';
    
    return 'text-green-600';
  };

  const formatNutrientValue = (value: number, unit: string = 'g') => {
    return `${value.toFixed(1)}${unit}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'ความมั่นใจสูงมาก';
    if (confidence >= 0.7) return 'ความมั่นใจปานกลาง';
    return 'ความมั่นใจต่ำ';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              ผลการวิเคราะห์อาหาร
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>{result.processingTimeMs}ms</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">ความมั่นใจ:</span>
              <span className={cn("text-sm font-medium", getConfidenceColor(result.confidence))}>
                {getConfidenceText(result.confidence)} ({(result.confidence * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>การใช้งานวันนี้:</span>
              <span className="font-medium">{result.usageCount}/{result.maxUsage}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'overview'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              ภาพรวม
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'details'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              รายละเอียด
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'recommendations'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              คำแนะนำ
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Nutrition */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">โภชนาการรวม</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">แคลอรี่</p>
                    <p className="text-xl font-bold text-orange-600">
                      {result.overallNutrition.totalCalories.toFixed(0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">kcal</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">โปรตีน</p>
                    <p className="text-xl font-bold text-blue-600">
                      {result.overallNutrition.totalProtein.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">g</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">คาร์โบไฮเดรต</p>
                    <p className="text-xl font-bold text-purple-600">
                      {result.overallNutrition.totalCarbs.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">g</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">ไขมัน</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {result.overallNutrition.totalFat.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">g</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">ไฟเบอร์</p>
                    <p className="text-xl font-bold text-green-600">
                      {result.overallNutrition.totalFiber.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">g</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">โซเดียม</p>
                    <p className="text-xl font-bold text-red-600">
                      {result.overallNutrition.totalSodium.toFixed(0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">mg</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Food Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">รายการอาหารที่ตรวจพบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.foodItems.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.name_th}</span>
                      {item.name_en && (
                        <span className="text-xs text-gray-500">({item.name_en})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">{item.category}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className={cn("text-xs", getConfidenceColor(item.confidence))}>
                        {(item.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">
                      {item.nutritionData.calories.toFixed(0)} kcal
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="space-y-6">
          {result.foodItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {item.name_th}
                    {item.name_en && (
                      <span className="text-sm text-gray-500 ml-2">({item.name_en})</span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">ความมั่นใจ:</span>
                    <span className={cn("text-sm font-medium", getConfidenceColor(item.confidence))}>
                      {(item.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nutrition Details */}
                <div>
                  <h4 className="text-sm font-medium mb-2">ข้อมูลโภชนาการ</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">แคลอรี่</p>
                      <p className="text-sm font-bold text-orange-600">
                        {item.nutritionData.calories.toFixed(0)}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">โปรตีน</p>
                      <p className="text-sm font-bold text-blue-600">
                        {item.nutritionData.protein.toFixed(1)}g
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">คาร์บ</p>
                      <p className="text-sm font-bold text-purple-600">
                        {item.nutritionData.carbs.toFixed(1)}g
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">ไขมัน</p>
                      <p className="text-sm font-bold text-yellow-600">
                        {item.nutritionData.fat.toFixed(1)}g
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                {item.ingredients.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">ส่วนประกอบหลัก</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.ingredients.map((ingredient, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Allergens */}
                {item.allergens.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">สาระกวนในการแพ้</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.allergens.map((allergen, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  คำแนะนำ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <WarningCircle className="w-5 h-5" />
                  คำเตือน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                      <WarningCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-800">{warning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onNewAnalysis}
          variant="outline"
          className="flex-1"
        >
          วิเคราะห์ใหม่
        </Button>
        {onSave && (
          <Button
            onClick={() => onSave(result)}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            บันทึก
          </Button>
        )}
        {onShare && (
          <Button
            onClick={() => onShare(result)}
            variant="outline"
          >
            <Share className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
