'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface Alert {
  type: string;
  severity: string;
  icon: string;
  titleThai: string;
  messageThai: string;
  action: string;
}

interface RoutineStep {
  order: number;
  stepThai: string;
  product: string;
  importance: string;
  note?: string;
}

interface EnvironmentAdvisorCardProps {
  location?: string;
  skinType?: string;
  concerns?: string[];
}

export default function EnvironmentAdvisorCard({
  location = 'Bangkok',
  skinType = 'combination',
  concerns = [],
}: EnvironmentAdvisorCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeRoutine, setActiveRoutine] = useState<'morning' | 'evening'>('morning');

  useEffect(() => {
    fetchAdvice();
  }, [location, skinType]);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analysis/environment?location=${location}&skinType=${skinType}&concerns=${concerns.join(',')}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Fetch advice error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'extreme': return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'high': return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      default: return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลสภาพอากาศ...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Header with Environment Info */}
      <Card className="bg-gradient-to-br from-sky-500/10 to-blue-600/10 border-sky-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                🌤️ Environment Advisor
              </h3>
              <p className="text-sm text-muted-foreground">
                {data.environment.location} • {new Date().toLocaleDateString('th-TH', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{data.environment.temperature}°C</p>
              <p className="text-sm text-muted-foreground">
                💧 {data.environment.humidity}%
              </p>
            </div>
          </div>

          {/* Environment Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className={cn(
              'p-3 rounded-lg text-center',
              data.environment.uvIndex >= 8 ? 'bg-red-500/20' : 
              data.environment.uvIndex >= 6 ? 'bg-orange-500/20' : 'bg-green-500/20'
            )}>
              <p className="text-2xl font-bold">☀️ {data.environment.uvIndex}</p>
              <p className="text-xs text-muted-foreground">UV Index</p>
            </div>
            <div className={cn(
              'p-3 rounded-lg text-center',
              data.environment.airQuality.pm25 >= 50 ? 'bg-orange-500/20' : 'bg-green-500/20'
            )}>
              <p className="text-2xl font-bold">💨 {data.environment.airQuality.pm25}</p>
              <p className="text-xs text-muted-foreground">PM2.5</p>
            </div>
            <div className="p-3 rounded-lg text-center bg-blue-500/20">
              <p className="text-2xl font-bold">{data.environment.weather === 'sunny' ? '☀️' : '⛅'}</p>
              <p className="text-xs text-muted-foreground">Weather</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {data.alerts?.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert: Alert, i: number) => (
            <Card key={i} className={cn('border-2', getSeverityColor(alert.severity))}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{alert.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{alert.titleThai}</p>
                    <p className="text-sm opacity-80">{alert.messageThai}</p>
                    <p className="text-xs mt-1 font-medium">👉 {alert.action}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Routine Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveRoutine('morning')}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg font-medium transition-all',
                activeRoutine === 'morning'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800'
              )}
            >
              ☀️ Morning Routine
            </button>
            <button
              onClick={() => setActiveRoutine('evening')}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg font-medium transition-all',
                activeRoutine === 'evening'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800'
              )}
            >
              🌙 Evening Routine
            </button>
          </div>

          {/* Routine Steps */}
          <div className="space-y-3">
            {(activeRoutine === 'morning' ? data.morningRoutine : data.eveningRoutine)?.map(
              (step: RoutineStep) => (
                <div 
                  key={step.order}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    step.importance === 'essential' ? 'bg-green-500/10 border border-green-500/30' :
                    step.importance === 'recommended' ? 'bg-blue-500/10 border border-blue-500/30' :
                    'bg-gray-500/10 border border-gray-500/30'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    step.importance === 'essential' ? 'bg-green-500 text-white' :
                    step.importance === 'recommended' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  )}>
                    {step.order}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{step.stepThai}</p>
                    <p className="text-sm text-muted-foreground">{step.product}</p>
                    {step.note && (
                      <p className="text-xs text-amber-500 mt-1">⚠️ {step.note}</p>
                    )}
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    step.importance === 'essential' ? 'bg-green-500/20 text-green-400' :
                    step.importance === 'recommended' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  )}>
                    {step.importance === 'essential' ? 'จำเป็น' :
                     step.importance === 'recommended' ? 'แนะนำ' : 'เสริม'}
                  </span>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lifestyle Tips */}
      <Card className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/20">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            💡 Lifestyle Tips วันนี้
          </h4>
          <ul className="space-y-2">
            {data.lifestyleTips?.map((tip: string, i: number) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-green-500">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Week Forecast */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3">📅 UV Forecast สัปดาห์นี้</h4>
          <div className="flex gap-2 overflow-x-auto">
            {data.weekForecast?.map((day: any, i: number) => (
              <div key={i} className="flex-1 min-w-[60px] text-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-muted-foreground">{day.day}</p>
                <p className="text-xl my-1">{day.weather}</p>
                <p className={cn(
                  'text-sm font-bold',
                  day.uvIndex >= 9 ? 'text-red-500' :
                  day.uvIndex >= 6 ? 'text-orange-500' : 'text-green-500'
                )}>
                  UV {day.uvIndex}
                </p>
                <p className="text-xs text-muted-foreground">{day.skinTip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
