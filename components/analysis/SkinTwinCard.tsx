'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SkinTwin {
  twinId: string;
  displayName: string;
  matchPercentage: number;
  profile: {
    ageRange: string;
    skinType: string;
    sharedConcerns: string[];
  };
  treatmentJourney: {
    treatments: { name: string; nameThai: string; sessions: number; effectiveness: number }[];
    totalSessions: number;
    duration: string;
    totalInvestment: string;
  };
  results: {
    beforeScore: number;
    afterScore: number;
    improvement: number;
    satisfactionRating: number;
    testimonial: string;
  };
  beforeAfterAvailable: boolean;
}

interface SkinTwinCardProps {
  twins: SkinTwin[];
  statistics: {
    totalMatches: number;
    averageImprovement: number;
    mostPopularTreatment: string;
    averageSatisfaction: number;
  };
  insights: {
    messageThai: string;
    recommendedPath: string;
  };
}

export default function SkinTwinCard({ twins, statistics, insights }: SkinTwinCardProps) {
  const [expandedTwin, setExpandedTwin] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold flex items-center justify-center gap-2">
          👥 Skin Twin Matching
        </h3>
        <p className="text-sm text-muted-foreground">
          พบ {statistics.totalMatches} คนที่มีสภาพผิวคล้ายคุณ
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{statistics.averageImprovement}%</p>
            <p className="text-xs text-muted-foreground">Avg Improvement</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-500">{statistics.mostPopularTreatment}</p>
            <p className="text-xs text-muted-foreground">Top Treatment</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-500">{statistics.averageSatisfaction}⭐</p>
            <p className="text-xs text-muted-foreground">Satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Twin Cards */}
      <div className="space-y-3">
        {twins.map((twin) => (
          <Card 
            key={twin.twinId}
            className={cn(
              'cursor-pointer transition-all',
              expandedTwin === twin.twinId 
                ? 'border-primary bg-primary/5' 
                : 'hover:border-primary/50'
            )}
            onClick={() => setExpandedTwin(expandedTwin === twin.twinId ? null : twin.twinId)}
          >
            <CardContent className="p-4">
              {/* Header Row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {twin.displayName.charAt(3)}
                  </div>
                  <div>
                    <p className="font-semibold">{twin.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      อายุ {twin.profile.ageRange} • {twin.profile.skinType}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    'text-xl font-bold',
                    twin.matchPercentage >= 90 ? 'text-green-500' :
                    twin.matchPercentage >= 80 ? 'text-lime-500' : 'text-yellow-500'
                  )}>
                    {twin.matchPercentage}%
                  </span>
                  <p className="text-xs text-muted-foreground">Match</p>
                </div>
              </div>

              {/* Shared Concerns */}
              <div className="flex flex-wrap gap-1 mt-3">
                {twin.profile.sharedConcerns.map((concern, i) => (
                  <span 
                    key={i}
                    className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs"
                  >
                    {concern}
                  </span>
                ))}
              </div>

              {/* Results Summary */}
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-red-400">{twin.results.beforeScore}</span>
                  <span>→</span>
                  <span className="text-green-400">{twin.results.afterScore}</span>
                </div>
                <span className="text-green-500 font-medium">
                  +{twin.results.improvement}% improvement
                </span>
                <div className="flex">
                  {[...Array(twin.results.satisfactionRating)].map((_, i) => (
                    <span key={i} className="text-amber-400">⭐</span>
                  ))}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedTwin === twin.twinId && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Treatment Journey */}
                  <div>
                    <p className="text-sm font-medium mb-2">💊 Treatment Journey</p>
                    <div className="space-y-2">
                      {twin.treatmentJourney.treatments.map((treatment, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{treatment.nameThai}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{treatment.sessions} ครั้ง</span>
                            <span className={cn(
                              'font-medium',
                              treatment.effectiveness >= 90 ? 'text-green-500' : 'text-yellow-500'
                            )}>
                              {treatment.effectiveness}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      รวม {twin.treatmentJourney.totalSessions} ครั้ง • 
                      {twin.treatmentJourney.duration} • 
                      {twin.treatmentJourney.totalInvestment}
                    </div>
                  </div>

                  {/* Testimonial */}
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <p className="text-sm italic">"{twin.results.testimonial}"</p>
                  </div>

                  {/* Action */}
                  {twin.beforeAfterAvailable && (
                    <Button size="sm" variant="outline" className="w-full">
                      📷 ดูภาพ Before/After
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insight */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
        <CardContent className="p-4">
          <p className="font-medium text-purple-300">💡 {insights.messageThai}</p>
          <p className="text-sm text-muted-foreground mt-1">{insights.recommendedPath}</p>
        </CardContent>
      </Card>
    </div>
  );
}
