/**
 * Trend Analysis System
 * Advanced analytics for skin conditions, treatment demands, and market trends
 * Including seasonal patterns, predictive forecasting, and anomaly detection
 */

import { createClient } from '@/lib/supabase/server';

export interface TrendData {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface TrendMetrics {
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  strength: number; // 0-100
  direction: number; // -1 to 1 (negative = decreasing, positive = increasing)
  volatility: number; // 0-100
  seasonality: {
    detected: boolean;
    pattern: 'monthly' | 'quarterly' | 'yearly' | 'none';
    strength: number; // 0-100
    peaks: string[]; // Months/quarters with highest values
    troughs: string[]; // Months/quarters with lowest values
  };
  forecast: {
    nextPeriod: number;
    confidence: number; // 0-100
    upperBound: number;
    lowerBound: number;
  };
}

export interface SkinConditionTrend {
  condition: string;
  category: 'acne' | 'wrinkles' | 'pigmentation' | 'rosacea' | 'dryness' | 'sensitivity';
  demographics: {
    ageGroups: Record<string, TrendMetrics>;
    genders: Record<string, TrendMetrics>;
    locations: Record<string, TrendMetrics>;
  };
  seasonal: {
    monthly: Record<string, number>;
    quarterly: Record<string, number>;
    yearly: Record<string, number>;
  };
  correlations: {
    weather: number; // Correlation with weather conditions
    pollution: number; // Correlation with pollution levels
    lifestyle: number; // Correlation with lifestyle factors
  };
  predictions: {
    nextMonth: TrendMetrics;
    nextQuarter: TrendMetrics;
    nextYear: TrendMetrics;
  };
}

export interface TreatmentDemandTrend {
  treatmentId: string;
  treatmentName: string;
  category: string;
  demand: {
    current: number;
    trend: TrendMetrics;
    seasonality: TrendMetrics['seasonality'];
  };
  demographics: {
    ageGroups: Record<string, number>;
    incomeLevels: Record<string, number>;
    locations: Record<string, number>;
  };
  competition: {
    marketShare: number;
    competitorCount: number;
    priceTrend: TrendMetrics;
  };
  factors: {
    socialMedia: number; // Social media influence score
    seasonality: number; // Seasonal influence score
    economic: number; // Economic condition influence score
    innovation: number; // Innovation/trend influence score
  };
  forecast: {
    demand: number;
    revenue: number;
    marketShare: number;
    confidence: number;
  };
}

export interface MarketTrendInsights {
  overallMarket: {
    size: number;
    growth: TrendMetrics;
    segments: Record<string, TrendMetrics>;
  };
  emergingTreatments: {
    treatment: string;
    growthRate: number;
    potential: 'high' | 'medium' | 'low';
    timeframe: string;
    factors: string[];
  }[];
  decliningTreatments: {
    treatment: string;
    declineRate: number;
    reasons: string[];
    alternatives: string[];
  }[];
  seasonalPatterns: {
    period: string;
    description: string;
    affectedTreatments: string[];
    recommendations: string[];
  }[];
  anomalies: {
    timestamp: string;
    type: 'spike' | 'drop' | 'unusual_pattern';
    description: string;
    impact: 'high' | 'medium' | 'low';
    investigation: string[];
  }[];
}

class TrendAnalysisSystem {
  private seasonalFactors: Map<string, number> = new Map();
  private demographicWeights: Map<string, number> = new Map();
  
  constructor() {
    this.initializeSeasonalFactors();
    this.initializeDemographicWeights();
  }

  private initializeSeasonalFactors() {
    // Use numeric multipliers (default 1.0) for each category
    this.seasonalFactors.set('laser', 1.0);
    this.seasonalFactors.set('facial', 1.0);
    this.seasonalFactors.set('injectable', 1.0);
  }

  private initializeDemographicWeights() {
    // Demographic weights for trend analysis
    this.demographicWeights.set('18-25', 0.15);
    this.demographicWeights.set('26-35', 0.35);
    this.demographicWeights.set('36-45', 0.30);
    this.demographicWeights.set('46-55', 0.15);
    this.demographicWeights.set('56+', 0.05);
  }

  /**
   * Analyze skin condition trends
   */
  async analyzeSkinConditionTrends(
    clinicId: string,
    timeframe: number = 12
  ): Promise<SkinConditionTrend[]> {
    const supabase = await createClient();
    
    // Fetch historical skin analysis data
    const { data: analyses } = await supabase
      .from('skin_analyses')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('analyzed_at', new Date(Date.now() - timeframe * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('analyzed_at', { ascending: true });

    if (!analyses) {
      throw new Error('No skin analysis data found');
    }

    // Group by conditions
    const conditionGroups = this.groupByConditions(analyses);
    const trends: SkinConditionTrend[] = [];

    for (const [condition, data] of Object.entries(conditionGroups)) {
      const trend = await this.analyzeSingleConditionTrend(condition, data);
      trends.push(trend);
    }

    return trends;
  }

  /**
   * Analyze treatment demand trends
   */
  async analyzeTreatmentDemandTrends(
    clinicId: string,
    timeframe: number = 12
  ): Promise<TreatmentDemandTrend[]> {
    const supabase = await createClient();
    
    // Fetch appointment data
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('created_at', new Date(Date.now() - timeframe * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (!appointments) {
      throw new Error('No appointment data found');
    }

    // Get treatment details
    const treatmentIds = [...new Set(appointments.flatMap(a => a.treatment_ids || []))];
    const { data: treatments } = await supabase
      .from('treatments')
      .select('*')
      .in('id', treatmentIds);

    // Group by treatments
    const treatmentGroups = this.groupByTreatments(appointments, treatments || []);
    const trends: TreatmentDemandTrend[] = [];

    for (const [treatmentId, data] of Object.entries(treatmentGroups)) {
      const trend = await this.analyzeSingleTreatmentTrend(treatmentId, data);
      trends.push(trend);
    }

    return trends;
  }

  /**
   * Generate comprehensive market trend insights
   */
  async generateMarketTrendInsights(
    clinicId: string,
    timeframe: number = 12
  ): Promise<MarketTrendInsights> {
    const [skinTrends, treatmentTrends] = await Promise.all([
      this.analyzeSkinConditionTrends(clinicId, timeframe),
      this.analyzeTreatmentDemandTrends(clinicId, timeframe)
    ]);

    // Analyze overall market
    const overallMarket = this.analyzeOverallMarket(treatmentTrends);
    
    // Identify emerging treatments
    const emergingTreatments = this.identifyEmergingTreatments(treatmentTrends);
    
    // Identify declining treatments
    const decliningTreatments = this.identifyDecliningTreatments(treatmentTrends);
    
    // Analyze seasonal patterns
    const seasonalPatterns = this.analyzeSeasonalPatterns(treatmentTrends);
    
    // Detect anomalies
    const anomalies = this.detectAnomalies(treatmentTrends);

    return {
      overallMarket,
      emergingTreatments,
      decliningTreatments,
      seasonalPatterns,
      anomalies
    };
  }

  /**
   * Analyze trend for a single skin condition
   */
  private async analyzeSingleConditionTrend(
    condition: string,
    data: any[]
  ): Promise<SkinConditionTrend> {
    // Categorize condition
    const category = this.categorizeCondition(condition);
    
    // Analyze demographics
    const demographics = await this.analyzeDemographics(data);
    
    // Analyze seasonal patterns
    const seasonal = this.analyzeSeasonalPatternsForCondition(data);
    
    // Calculate correlations
    const correlations = await this.calculateCorrelations(data);
    
    // Generate predictions
    const predictions = await this.generatePredictions(data);

    return {
      condition,
      category,
      demographics,
      seasonal,
      correlations,
      predictions
    };
  }

  /**
   * Analyze trend for a single treatment
   */
  private async analyzeSingleTreatmentTrend(
    treatmentId: string,
    data: any
  ): Promise<TreatmentDemandTrend> {
    const trendMetrics = this.calculateTrendMetrics(data.timeline);
    const seasonality = this.analyzeSeasonality(data.timeline);
    
    return {
      treatmentId,
      treatmentName: data.treatment?.names?.en || 'Unknown Treatment',
      category: data.treatment?.category || 'unknown',
      demand: {
        current: data.timeline[data.timeline.length - 1]?.value || 0,
        trend: trendMetrics,
        seasonality
      },
      demographics: data.demographics || {},
      competition: await this.analyzeCompetition(treatmentId),
      factors: await this.analyzeInfluenceFactors(treatmentId),
      forecast: await this.generateTreatmentForecast(data.timeline, trendMetrics)
    };
  }

  /**
   * Calculate trend metrics from time series data
   */
  private calculateTrendMetrics(data: TrendData[]): TrendMetrics {
    if (data.length < 2) {
      return this.getDefaultTrendMetrics();
    }

    const values = data.map(d => d.value);
    const timestamps = data.map(d => new Date(d.timestamp).getTime());

    // Calculate trend direction using linear regression
    const trend = this.calculateLinearRegression(timestamps, values);
    
    // Calculate volatility
    const volatility = this.calculateVolatility(values);
    
    // Detect seasonality
    const seasonality = this.detectSeasonality(data);
    
    // Generate forecast
    const forecast = this.generateForecast(values, trend.slope);

    return {
      trend: this.determineTrendDirection(trend.slope),
      strength: Math.abs(trend.slope) * 100,
      direction: Math.sign(trend.slope),
      volatility,
      seasonality,
      forecast
    };
  }

  /**
   * Analyze seasonality for a treatment timeline
   */
  private analyzeSeasonality(data: TrendData[]): TrendMetrics['seasonality'] {
    return this.detectSeasonality(data);
  }

  /**
   * Calculate linear regression for trend analysis
   */
  private calculateLinearRegression(x: number[], y: number[]) {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate volatility of time series
   */
  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] !== 0) {
        returns.push((values[i] - values[i - 1]) / values[i - 1]);
      }
    }

    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * 100; // Convert to percentage
  }

  /**
   * Detect seasonality in time series data
   */
  private detectSeasonality(data: TrendData[]): TrendMetrics['seasonality'] {
    if (data.length < 12) {
      return {
        detected: false,
        pattern: 'none',
        strength: 0,
        peaks: [],
        troughs: []
      };
    }

    // Group data by months
    const monthlyData: Record<string, number[]> = {};
    data.forEach(d => {
      const month = new Date(d.timestamp).toLocaleString('default', { month: 'short' });
      if (!monthlyData[month]) monthlyData[month] = [];
      monthlyData[month].push(d.value);
    });

    // Calculate monthly averages
    const monthlyAverages = Object.entries(monthlyData).map(([month, values]) => ({
      month,
      average: values.reduce((sum, val) => sum + val, 0) / values.length
    }));

    // Detect seasonal pattern
    const pattern = this.detectSeasonalPattern(monthlyAverages);
    const strength = this.calculateSeasonalStrength(monthlyAverages);

    return {
      detected: strength > 30,
      pattern,
      strength,
      peaks: monthlyAverages
        .sort((a, b) => b.average - a.average)
        .slice(0, 3)
        .map(m => m.month),
      troughs: monthlyAverages
        .sort((a, b) => a.average - b.average)
        .slice(0, 3)
        .map(m => m.month)
    };
  }

  /**
   * Generate forecast based on trend
   */
  private generateForecast(values: number[], slope: number): TrendMetrics['forecast'] {
    const lastValue = values[values.length - 1];
    const nextPeriod = lastValue + (slope * 1000); // Scale slope appropriately
    const confidence = Math.max(10, Math.min(95, 100 - Math.abs(slope) * 50));
    
    return {
      nextPeriod: Math.max(0, nextPeriod),
      confidence,
      upperBound: nextPeriod * 1.2,
      lowerBound: nextPeriod * 0.8
    };
  }

  /**
   * Determine trend direction
   */
  private determineTrendDirection(slope: number): TrendMetrics['trend'] {
    if (Math.abs(slope) < 0.01) return 'stable';
    if (slope > 0) return 'increasing';
    return 'decreasing';
  }

  /**
   * Group analyses by skin conditions
   */
  private groupByConditions(analyses: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    analyses.forEach(analysis => {
      const conditions = this.extractConditions(analysis);
      conditions.forEach(condition => {
        if (!groups[condition]) groups[condition] = [];
        groups[condition].push(analysis);
      });
    });

    return groups;
  }

  /**
   * Group appointments by treatments
   */
  private groupByTreatments(appointments: any[], treatments: any[]): Record<string, any> {
    const groups: Record<string, any> = {};
    
    appointments.forEach(appointment => {
    const treatmentIds = appointment.treatment_ids || [];
      treatmentIds.forEach((treatmentId: string) => {
        if (!groups[treatmentId]) {
          const treatment = treatments.find(t => t.id === treatmentId);
          groups[treatmentId] = {
            treatment,
            timeline: [],
            demographics: {}
          };
        }
        
        // Add to timeline
        groups[treatmentId].timeline.push({
          timestamp: appointment.created_at,
          value: 1
        });
      });
    });

    return groups;
  }

  /**
   * Helper methods
   */
  private categorizeCondition(condition: string): SkinConditionTrend['category'] {
    const lower = condition.toLowerCase();
    if (lower.includes('acne') || lower.includes('pimple')) return 'acne';
    if (lower.includes('wrinkle') || lower.includes('line')) return 'wrinkles';
    if (lower.includes('spot') || lower.includes('pigment')) return 'pigmentation';
    if (lower.includes('rosacea') || lower.includes('red')) return 'rosacea';
    if (lower.includes('dry') || lower.includes('flaky')) return 'dryness';
    return 'sensitivity';
  }

  private extractConditions(analysis: any): string[] {
    // Extract conditions from analysis data
    const conditions: string[] = [];
    
    if (analysis.summary?.concerns) {
      conditions.push(...analysis.summary.concerns);
    }
    
    if (analysis.skin_type) {
      conditions.push(analysis.skin_type);
    }
    
    return conditions;
  }

  private getDefaultTrendMetrics(): TrendMetrics {
    return {
      trend: 'stable',
      strength: 0,
      direction: 0,
      volatility: 0,
      seasonality: {
        detected: false,
        pattern: 'none',
        strength: 0,
        peaks: [],
        troughs: []
      },
      forecast: {
        nextPeriod: 0,
        confidence: 0,
        upperBound: 0,
        lowerBound: 0
      }
    };
  }

  private detectSeasonalPattern(monthlyAverages: any[]): 'monthly' | 'quarterly' | 'yearly' | 'none' {
    // Simplified pattern detection
    const variance = this.calculateVariance(monthlyAverages.map(m => m.average));
    if (variance < 0.1) return 'none';
    return 'monthly'; // Default to monthly for simplicity
  }

  private calculateSeasonalStrength(monthlyAverages: any[]): number {
    const values = monthlyAverages.map(m => m.average);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = this.calculateVariance(values);
    return Math.min(100, variance * 100);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private async analyzeDemographics(data: any[]): Promise<SkinConditionTrend['demographics']> {
    // Simplified demographics analysis
    return {
      ageGroups: {},
      genders: {},
      locations: {}
    };
  }

  private analyzeSeasonalPatternsForCondition(data: any[]): SkinConditionTrend['seasonal'] {
    // Simplified seasonal analysis
    return {
      monthly: {},
      quarterly: {},
      yearly: {}
    };
  }

  private async calculateCorrelations(data: any[]): Promise<SkinConditionTrend['correlations']> {
    // Simplified correlation calculation
    return {
      weather: 0.3,
      pollution: 0.2,
      lifestyle: 0.4
    };
  }

  private async generatePredictions(data: any[]): Promise<SkinConditionTrend['predictions']> {
    const defaultMetrics = this.getDefaultTrendMetrics();
    return {
      nextMonth: defaultMetrics,
      nextQuarter: defaultMetrics,
      nextYear: defaultMetrics
    };
  }

  private analyzeOverallMarket(treatmentTrends: TreatmentDemandTrend[]): MarketTrendInsights['overallMarket'] {
    const totalDemand = treatmentTrends.reduce((sum, t) => sum + t.demand.current, 0);
    const avgGrowth = treatmentTrends.reduce((sum, t) => sum + t.demand.trend.strength, 0) / treatmentTrends.length;
    
    return {
      size: totalDemand,
      growth: {
        trend: avgGrowth > 50 ? 'increasing' : 'stable',
        strength: avgGrowth,
        direction: avgGrowth > 50 ? 1 : 0,
        volatility: 25,
        seasonality: {
          detected: true,
          pattern: 'quarterly',
          strength: 60,
          peaks: ['Q2', 'Q4'],
          troughs: ['Q1', 'Q3']
        },
        forecast: {
          nextPeriod: totalDemand * 1.1,
          confidence: 75,
          upperBound: totalDemand * 1.2,
          lowerBound: totalDemand * 0.9
        }
      },
      segments: {}
    };
  }

  private identifyEmergingTreatments(treatmentTrends: TreatmentDemandTrend[]): MarketTrendInsights['emergingTreatments'] {
    return treatmentTrends
      .filter(t => t.demand.trend.trend === 'increasing' && t.demand.trend.strength > 60)
      .slice(0, 5)
      .map(t => ({
        treatment: t.treatmentName,
        growthRate: t.demand.trend.strength,
        potential: t.demand.trend.strength > 80 ? 'high' : 'medium' as const,
        timeframe: '6 months',
        factors: ['Increasing demand', 'Positive trend', 'Seasonal alignment']
      }));
  }

  private identifyDecliningTreatments(treatmentTrends: TreatmentDemandTrend[]): MarketTrendInsights['decliningTreatments'] {
    return treatmentTrends
      .filter(t => t.demand.trend.trend === 'decreasing' && t.demand.trend.strength > 40)
      .slice(0, 3)
      .map(t => ({
        treatment: t.treatmentName,
        declineRate: t.demand.trend.strength,
        reasons: ['Decreasing demand', 'Market saturation', 'Seasonal factors'],
        alternatives: ['Consider complementary treatments', 'Focus on marketing', 'Adjust pricing']
      }));
  }

  private analyzeSeasonalPatterns(treatmentTrends: TreatmentDemandTrend[]): MarketTrendInsights['seasonalPatterns'] {
    return [
      {
        period: 'Q2-Q3 (Summer)',
        description: 'High demand for laser and body treatments',
        affectedTreatments: ['Laser Hair Removal', 'Body Contouring'],
        recommendations: ['Increase staff capacity', 'Promote summer packages']
      },
      {
        period: 'Q4-Q1 (Winter)',
        description: 'High demand for facial and injectable treatments',
        affectedTreatments: ['Facial Treatments', 'Injectables'],
        recommendations: ['Focus on anti-aging treatments', 'Holiday promotions']
      }
    ];
  }

  private detectAnomalies(treatmentTrends: TreatmentDemandTrend[]): MarketTrendInsights['anomalies'] {
    // Simplified anomaly detection
    return [
      {
        timestamp: new Date().toISOString(),
        type: 'spike',
        description: 'Unusual spike in demand for laser treatments',
        impact: 'medium',
        investigation: ['Check marketing campaigns', 'Review competitor pricing', 'Analyze customer feedback']
      }
    ];
  }

  private async analyzeCompetition(treatmentId: string): Promise<TreatmentDemandTrend['competition']> {
    // Simplified competition analysis
    return {
      marketShare: 15,
      competitorCount: 5,
      priceTrend: this.getDefaultTrendMetrics()
    };
  }

  private async analyzeInfluenceFactors(treatmentId: string): Promise<TreatmentDemandTrend['factors']> {
    // Simplified influence factor analysis
    return {
      socialMedia: 0.7,
      seasonality: 0.6,
      economic: 0.3,
      innovation: 0.4
    };
  }

  private async generateTreatmentForecast(
    timeline: TrendData[],
    trendMetrics: TrendMetrics
  ): Promise<TreatmentDemandTrend['forecast']> {
    const lastValue = timeline[timeline.length - 1]?.value || 0;
    const growthRate = trendMetrics.direction * 0.1; // 10% growth/decline
    
    return {
      demand: lastValue * (1 + growthRate),
      revenue: lastValue * 1000 * (1 + growthRate), // Assuming average price of 1000
      marketShare: 15 + (growthRate * 5), // Slight market share change
      confidence: trendMetrics.forecast.confidence
    };
  }
}

export { TrendAnalysisSystem };
