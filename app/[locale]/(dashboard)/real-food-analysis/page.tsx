'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import RealFoodAnalyzer from '@/components/food-analysis/RealFoodAnalyzer';
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
  ArrowLeft
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

export default function RealFoodAnalysisPage() {
  const { getClinicId, getUserId } = useAuth();
  const [activeView, setActiveView] = useState<'camera' | 'results' | 'history' | 'settings'>('camera');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clinicId = getClinicId();
  const userId = getUserId();

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
          `/api/real-food-analysis?userId=${userId}&clinicId=${clinicId}&limit=30`
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
            `/api/real-food-analysis?userId=${userId}&clinicId=${clinicId}&limit=30`
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
    console.log('Saving analysis result:', result);
  };

  const handleShareAnalysis = async (result: any) => {
    // In a real implementation, this would generate a shareable link
    console.log('Sharing analysis result:', result);
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
            <h1 className="text-2xl font-bold">AI Food Analysis - Real System</h1>
            <p className="text-gray-600">วิเคราะห์อาหารไทยด้วย AI แม่นยำสูง</p>
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
          <RealFoodAnalyzer
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
                ผลลัพธ์การวิเคราะห์ล่าสุด
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
              <CardTitle>ประวัติการวิเคราะห์</CardTitle>
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
    </div>
  );
}
