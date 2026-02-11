'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import EnhancedFoodAnalyzer from '@/components/food-analysis/EnhancedFoodAnalyzer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  ChartBar, 
  Users, 
  Gear, 
  Plus,
  TrendUp,
  Calendar,
  Clock,
  ArrowLeft,
  Check,
  Warning,
  Info
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';

interface AnalysisSession {
  id: string;
  session_date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sugar: number;
  total_sodium: number;
  meals_analyzed: number;
  session_data: any;
}

interface UserPreferences {
  dietary_restrictions: string[];
  allergies: string[];
  preferences: {
    spiceLevel: 'mild' | 'medium' | 'hot';
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    lowSodium: boolean;
    lowSugar: boolean;
  };
  goals: {
    weightLoss?: boolean;
    weightGain?: boolean;
    muscleGain?: boolean;
    maintenance?: boolean;
    targetCalories?: number;
    macroTargets?: {
      protein: number;
      carbs: number;
      fat: number;
    };
  };
}

interface APIStatus {
  available_apis: {
    gemini: boolean;
    huggingface: boolean;
    calorieMama: boolean;
  };
  status: {
    gemini: string;
    huggingface: string;
    calorie_mama: string;
  };
  thai_foods_count: number;
  features: string[];
}

export default function EnhancedFoodAnalysisPage() {
  const { getClinicId, getUserId } = useAuth();
  const [activeView, setActiveView] = useState<'camera' | 'results' | 'history' | 'settings'>('camera');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<APIStatus | null>(null);

  const clinicId = getClinicId();
  const userId = getUserId();

  // Load API status
  useEffect(() => {
    if (!clinicId || !userId) return;

    const loadAPIStatus = async () => {
      try {
        const response = await fetch('/api/enhanced-food-analysis', {
          method: 'OPTIONS'
        });
        const data = await response.json();
        setApiStatus(data);
      } catch (error) {
        console.error('Error loading API status:', error);
      }
    };

    loadAPIStatus();
  }, [clinicId, userId]);

  // Load user preferences
  useEffect(() => {
    if (!clinicId || !userId) return;

    const loadPreferences = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('user_food_preferences')
          .select('*')
          .eq('user_id', userId)
          .eq('clinic_id', clinicId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Failed to load preferences:', error);
          return;
        }

        if (data) {
          setUserPreferences(data);
        } else {
          // Set default preferences
          const defaultPreferences: UserPreferences = {
            dietary_restrictions: [],
            allergies: [],
            preferences: {
              spiceLevel: 'medium',
              vegetarian: false,
              vegan: false,
              glutenFree: false,
              dairyFree: false,
              lowSodium: false,
              lowSugar: false
            },
            goals: {
              maintenance: true,
              targetCalories: 2000
            }
          };
          setUserPreferences(defaultPreferences);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, [clinicId, userId]);

  // Load analysis history
  useEffect(() => {
    if (!clinicId || !userId) return;

    const loadHistory = async () => {
      try {
        const response = await fetch(
          `/api/enhanced-food-analysis?userId=${userId}&clinicId=${clinicId}&limit=30`
        );
        const data = await response.json();

        if (data.success) {
          setAnalysisHistory(data.history || []);
        }
      } catch (error) {
        console.error('Error loading history:', error);
      }
    };

    loadHistory();
  }, [clinicId, userId]);

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result);
    setActiveView('results');
    setError(null);
    
    // Reload history after successful analysis
    setTimeout(() => {
      const loadHistory = async () => {
        try {
          const response = await fetch(
            `/api/enhanced-food-analysis?userId=${userId}&clinicId=${clinicId}&limit=30`
          );
          const data = await response.json();

          if (data.success) {
            setAnalysisHistory(data.history || []);
          }
        } catch (error) {
          console.error('Error reloading history:', error);
        }
      };
      loadHistory();
    }, 1000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setActiveView('camera');
  };

  const handleSaveAnalysis = async (result: any) => {
    // In a real implementation, this would save to a report or share
    console.log('Saving enhanced analysis result:', result);
  };

  const handleShareAnalysis = async (result: any) => {
    // In a real implementation, this would generate a shareable link
    console.log('Sharing enhanced analysis result:', result);
  };

  const handleNewAnalysis = () => {
    setAnalysisResult(null);
    setActiveView('camera');
    setError(null);
  };

  const getTotalCaloriesToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySession = analysisHistory.find(session => session.session_date === today);
    return todaySession?.total_calories || 0;
  };

  const getMealsAnalyzedToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySession = analysisHistory.find(session => session.session_date === today);
    return todaySession?.meals_analyzed || 0;
  };

  const getWeeklyAverage = () => {
    const last7Days = analysisHistory.slice(0, 7);
    if (last7Days.length === 0) return 0;
    
    const totalCalories = last7Days.reduce((sum, session) => sum + session.total_calories, 0);
    return Math.round(totalCalories / last7Days.length);
  };

  const getAPIStatusIcon = (isAvailable: boolean) => {
    if (isAvailable) {
      return <Check className="w-4 h-4 text-green-600" />;
    }
    return <Warning className="w-4 h-4 text-red-600" />;
  };

  if (!clinicId || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Enhanced AI Food Analysis</h1>
            <p className="text-gray-600">วิเคราะห์อาหารไทยด้วยหลาย AI รวมกัน</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setActiveView('settings')}
            variant="outline"
            size="sm"
          >
            <Gear className="w-4 h-4 mr-2" />
            การตั้งค่า
          </Button>
        </div>
      </div>

      {/* API Status Card */}
      {apiStatus && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gear className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">สถานะ API ที่ใช้:</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {getAPIStatusIcon(apiStatus.available_apis.gemini)}
                <div>
                  <p className="text-sm font-medium">Gemini Vision</p>
                  <p className="text-xs text-gray-600">{apiStatus.status.gemini}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getAPIStatusIcon(apiStatus.available_apis.huggingface)}
                <div>
                  <p className="text-sm font-medium">HuggingFace</p>
                  <p className="text-xs text-gray-600">{apiStatus.status.huggingface}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getAPIStatusIcon(apiStatus.available_apis.calorieMama)}
                <div>
                  <p className="text-sm font-medium">Calorie Mama</p>
                  <p className="text-xs text-gray-600">{apiStatus.status.calorie_mama}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-700">
              <p>Thai Foods: {apiStatus.thai_foods_count} เมนู</p>
              <p>Features: {apiStatus.features?.join(', ')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">แคลอรี่วันนี้</p>
                <p className="text-2xl font-bold text-orange-600">
                  {getTotalCaloriesToday().toLocaleString()}
                </p>
              </div>
              <div className="text-orange-600">
                <TrendUp className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">มื้อที่วิเคราะห์</p>
                <p className="text-2xl font-bold text-blue-600">
                  {getMealsAnalyzedToday()}
                </p>
              </div>
              <div className="text-blue-600">
                <Camera className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ค่าเฉลี่ย 7 วัน</p>
                <p className="text-2xl font-bold text-purple-600">
                  {getWeeklyAverage().toLocaleString()}
                </p>
              </div>
              <div className="text-purple-600">
                <ChartBar className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">วันที่ใช้งาน</p>
                <p className="text-2xl font-bold text-green-600">
                  {analysisHistory.length}
                </p>
              </div>
              <div className="text-green-600">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveView('camera')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeView === 'camera'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Camera className="w-4 h-4 inline mr-2" />
          วิเคราะห์
        </button>
        <button
          onClick={() => setActiveView('results')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeView === 'results'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          disabled={!analysisResult}
        >
          <ChartBar className="w-4 h-4 inline mr-2" />
          ผลลัพธ์
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeView === 'history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          ประวัติ
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeView === 'camera' && (
          <EnhancedFoodAnalyzer
            onAnalysisComplete={handleAnalysisComplete}
            onError={handleError}
            userId={userId}
            clinicId={clinicId}
            userPreferences={userPreferences}
          />
        )}

        {activeView === 'results' && analysisResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBar className="w-5 h-5" />
                ผลลัพธ์การวิเคราะห์ล่าสุด (Enhanced)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">แคลอรี่</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {analysisResult.totalNutrition.calories}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">โปรตีน</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {analysisResult.totalNutrition.protein.toFixed(1)}g
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">คาร์โบ</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {analysisResult.totalNutrition.carbs.toFixed(1)}g
                    </p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">ไขมัน</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {analysisResult.totalNutrition.fat.toFixed(1)}g
                    </p>
                  </div>
                </div>

                {/* AI Models Used */}
                {analysisResult.imageAnalysis?.aiModelsUsed && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-800 mb-2">AI Models ที่ใช้:</p>
                    <p className="text-sm text-purple-600">
                      {analysisResult.imageAnalysis.aiModelsUsed.join(', ')}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button onClick={handleNewAnalysis} variant="outline" className="flex-1">
                    วิเคราะห์รูปใหม่
                  </Button>
                  <Button onClick={() => handleSaveAnalysis(analysisResult)} className="flex-1">
                    บันทึกผลลัพธ์
                  </Button>
                  <Button onClick={() => handleShareAnalysis(analysisResult)} variant="outline">
                    แชร์
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeView === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle>ประวัติการวิเคราะห์ (Enhanced)</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisHistory.length > 0 ? (
                <div className="space-y-4">
                  {analysisHistory.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {new Date(session.session_date).toLocaleDateString('th-TH', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {session.meals_analyzed} มื้อ • {session.total_calories.toLocaleString()} แคลอรี่
                        </p>
                        {session.session_data?.apis_used && (
                          <p className="text-xs text-purple-600">
                            APIs: {Object.entries(session.session_data.apis_used)
                              .filter(([key, val]) => val)
                              .map(([key]) => key)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">โปรตีน</p>
                        <p className="font-medium text-blue-600">
                          {session.total_protein.toFixed(1)}g
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">ยังไม่มีประวัติการวิเคราะห์</p>
                  <Button
                    onClick={() => setActiveView('camera')}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    เริ่มวิเคราะห์
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <p className="font-medium">ข้อผิดพลาด:</p>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
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
                บูรณาการกับ API ที่มีอยู่แล้วใน BN-Aura สามารถจดแจกอาหารไทยได้แม่นยำสูง
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
