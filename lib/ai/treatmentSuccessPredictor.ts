/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Treatment Success Prediction Engine
 * AI-powered prediction of treatment success rates based on historical data
 * and patient characteristics
 */

import { createClient } from '@/lib/supabase/server';

export interface PatientProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  skinType: string;
  skinConditions: string[];
  previousTreatments: string[];
  lifestyleFactors: {
    stress: 'low' | 'medium' | 'high';
    sleep: 'poor' | 'average' | 'good';
    diet: 'poor' | 'average' | 'good';
    smoking: boolean;
    alcohol: 'none' | 'occasional' | 'regular';
  };
  environmentalFactors: {
    pollution: 'low' | 'medium' | 'high';
    sunExposure: 'low' | 'medium' | 'high';
    climate: 'dry' | 'humid' | 'temperate';
  };
}

export interface TreatmentCharacteristics {
  id: string;
  name: string;
  category: 'facial' | 'laser' | 'injectable' | 'body' | 'wellness';
  intensity: 'low' | 'medium' | 'high';
  duration: number; // in minutes
  recoveryTime: number; // in days
  sessionsRequired: number;
  priceRange: {
    min: number;
    max: number;
  };
  contraindications: string[];
  bestFor: string[];
}

export interface SuccessPrediction {
  treatmentId: string;
  treatmentName: string;
  successProbability: number; // 0-100
  confidenceScore: number; // 0-100
  expectedResults: {
    improvement: number; // percentage improvement
    satisfaction: number; // expected satisfaction score
    longevity: number; // how long results last (months)
  };
  risks: {
    low: number; // probability
    medium: number; // probability
    high: number; // probability
  };
  recommendations: string[];
  alternatives: {
    treatmentId: string;
    treatmentName: string;
    successProbability: number;
    reason: string;
  }[];
  processingTime: number;
}

class TreatmentSuccessPredictor {
  private modelWeights: Map<string, number> = new Map();
  
  constructor() {
    this.initializeModelWeights();
  }

  private initializeModelWeights() {
    // Feature weights for ML model
    this.modelWeights.set('age', 0.15);
    this.modelWeights.set('skinType', 0.20);
    this.modelWeights.set('skinConditions', 0.18);
    this.modelWeights.set('previousTreatments', 0.12);
    this.modelWeights.set('lifestyle', 0.15);
    this.modelWeights.set('environmental', 0.10);
    this.modelWeights.set('treatmentMatch', 0.10);
  }

  /**
   * Predict success probability for multiple treatments
   */
  async predictTreatmentSuccess(
    patientProfile: PatientProfile,
    treatmentIds: string[]
  ): Promise<SuccessPrediction[]> {
    const startTime = Date.now();
    const supabase = await createClient();

    // Fetch treatment details
    const { data: treatments } = await supabase
      .from('treatments')
      .select('*')
      .in('id', treatmentIds);

    if (!treatments) {
      throw new Error('Treatments not found');
    }

    // Fetch historical data for ML training
    const historicalData = await this.getHistoricalTreatmentData(patientProfile);

    const predictions: SuccessPrediction[] = [];

    for (const treatment of treatments) {
      const prediction = await this.predictSingleTreatment(
        patientProfile,
        treatment,
        historicalData
      );
      predictions.push(prediction);
    }

    // Sort by success probability
    predictions.sort((a, b) => b.successProbability - a.successProbability);

    return predictions.map(p => ({
      ...p,
      processingTime: Date.now() - startTime
    }));
  }

  /**
   * Predict success for a single treatment
   */
  private async predictSingleTreatment(
    patientProfile: PatientProfile,
    treatment: any,
    historicalData: any[]
  ): Promise<SuccessPrediction> {
    // Calculate base success score
    let successScore = this.calculateBaseSuccessScore(patientProfile, treatment);
    
    // Adjust based on historical data
    const historicalAdjustment = this.calculateHistoricalAdjustment(
      patientProfile,
      treatment,
      historicalData
    );
    
    successScore *= historicalAdjustment;

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(
      patientProfile,
      treatment,
      historicalData
    );

    // Calculate expected results
    const expectedResults = this.calculateExpectedResults(
      patientProfile,
      treatment,
      successScore
    );

    // Calculate risks
    const risks = this.calculateRisks(patientProfile, treatment);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      patientProfile,
      treatment,
      successScore,
      risks
    );

    // Find alternatives
    const alternatives = await this.findAlternatives(
      patientProfile,
      treatment,
      successScore
    );

    return {
      treatmentId: treatment.id,
      treatmentName: treatment.names?.en || treatment.names?.th || 'Unknown Treatment',
      successProbability: Math.round(Math.min(95, Math.max(5, successScore * 100))),
      confidenceScore: Math.round(confidenceScore * 100),
      expectedResults,
      risks,
      recommendations,
      alternatives,
      processingTime: 0
    };
  }

  /**
   * Calculate base success score using feature weights
   */
  private calculateBaseSuccessScore(
    patientProfile: PatientProfile,
    treatment: any
  ): number {
    let score = 0.5; // Base score

    // Age factor
    const ageScore = this.calculateAgeScore(patientProfile.age, treatment);
    score += (ageScore - 0.5) * this.modelWeights.get('age')!;

    // Skin type compatibility
    const skinTypeScore = this.calculateSkinTypeScore(patientProfile.skinType, treatment);
    score += (skinTypeScore - 0.5) * this.modelWeights.get('skinType')!;

    // Skin conditions compatibility
    const conditionsScore = this.calculateConditionsScore(patientProfile.skinConditions, treatment);
    score += (conditionsScore - 0.5) * this.modelWeights.get('skinConditions')!;

    // Previous treatments experience
    const previousTreatmentsScore = this.calculatePreviousTreatmentsScore(
      patientProfile.previousTreatments,
      treatment
    );
    score += (previousTreatmentsScore - 0.5) * this.modelWeights.get('previousTreatments')!;

    // Lifestyle factors
    const lifestyleScore = this.calculateLifestyleScore(patientProfile.lifestyleFactors, treatment);
    score += (lifestyleScore - 0.5) * this.modelWeights.get('lifestyle')!;

    // Environmental factors
    const environmentalScore = this.calculateEnvironmentalScore(
      patientProfile.environmentalFactors,
      treatment
    );
    score += (environmentalScore - 0.5) * this.modelWeights.get('environmental')!;

    // Treatment match score
    const treatmentMatchScore = this.calculateTreatmentMatchScore(patientProfile, treatment);
    score += (treatmentMatchScore - 0.5) * this.modelWeights.get('treatmentMatch')!;

    return Math.min(1, Math.max(0, score));
  }

  private calculateAgeScore(age: number, treatment: any): number {
    // Different treatments work better for different age groups
    const ageGroups = {
      'anti-aging': { min: 30, max: 60, optimal: 45 },
      'acne': { min: 15, max: 35, optimal: 25 },
      'pigmentation': { min: 25, max: 55, optimal: 40 },
      'general': { min: 20, max: 65, optimal: 35 }
    };

    const category = treatment.category || 'general';
    const ageGroup = ageGroups[category as keyof typeof ageGroups] || ageGroups.general;

    if (age < ageGroup.min || age > ageGroup.max) {
      return 0.3; // Outside optimal range
    }

    const distance = Math.abs(age - ageGroup.optimal);
    const maxDistance = Math.max(ageGroup.optimal - ageGroup.min, ageGroup.max - ageGroup.optimal);
    
    return 0.3 + (0.7 * (1 - distance / maxDistance));
  }

  private calculateSkinTypeScore(skinType: string, treatment: any): number {
    // Treatment compatibility with skin types
    const compatibility: Record<string, Record<string, number>> = {
      'oily': {
        'facial': 0.8,
        'laser': 0.7,
        'injectable': 0.6,
        'body': 0.7,
        'wellness': 0.5
      },
      'dry': {
        'facial': 0.9,
        'laser': 0.5,
        'injectable': 0.8,
        'body': 0.6,
        'wellness': 0.7
      },
      'combination': {
        'facial': 0.8,
        'laser': 0.7,
        'injectable': 0.7,
        'body': 0.7,
        'wellness': 0.6
      },
      'sensitive': {
        'facial': 0.6,
        'laser': 0.4,
        'injectable': 0.5,
        'body': 0.5,
        'wellness': 0.8
      }
    };

    const category = treatment.category || 'facial';
    return compatibility[skinType]?.[category] || 0.5;
  }

  private calculateConditionsScore(conditions: string[], treatment: any): number {
    // How well treatment addresses specific skin conditions
    const conditionTreatmentMap: Record<string, Record<string, number>> = {
      'acne': {
        'facial': 0.8,
        'laser': 0.9,
        'injectable': 0.6,
        'body': 0.4,
        'wellness': 0.5
      },
      'wrinkles': {
        'facial': 0.7,
        'laser': 0.8,
        'injectable': 0.9,
        'body': 0.3,
        'wellness': 0.6
      },
      'pigmentation': {
        'facial': 0.7,
        'laser': 0.9,
        'injectable': 0.5,
        'body': 0.4,
        'wellness': 0.4
      },
      'rosacea': {
        'facial': 0.6,
        'laser': 0.4,
        'injectable': 0.3,
        'body': 0.2,
        'wellness': 0.7
      }
    };

    if (conditions.length === 0) return 0.7; // No specific conditions

    const category = treatment.category || 'facial';
    let totalScore = 0;
    
    for (const condition of conditions) {
      totalScore += conditionTreatmentMap[condition]?.[category] || 0.5;
    }

    return totalScore / conditions.length;
  }

  private calculatePreviousTreatmentsScore(
    previousTreatments: string[],
    treatment: any
  ): number {
    // Previous experience with similar treatments
    if (previousTreatments.length === 0) return 0.6; // No experience

    // Check if similar treatments were done before
    const similarCount = previousTreatments.filter(prev => 
      this.areTreatmentsSimilar(prev, treatment.id)
    ).length;

    if (similarCount > 0) {
      return 0.8; // Has experience with similar treatments
    }

    return 0.5; // No similar experience
  }

  private calculateLifestyleScore(lifestyle: any, treatment: any): number {
    let score = 0.5;

    // Stress affects healing
    if (lifestyle.stress === 'low') score += 0.1;
    else if (lifestyle.stress === 'high') score -= 0.1;

    // Sleep affects recovery
    if (lifestyle.sleep === 'good') score += 0.1;
    else if (lifestyle.sleep === 'poor') score -= 0.1;

    // Diet affects skin health
    if (lifestyle.diet === 'good') score += 0.1;
    else if (lifestyle.diet === 'poor') score -= 0.1;

    // Smoking affects healing
    if (lifestyle.smoking) score -= 0.15;

    // Alcohol affects recovery
    if (lifestyle.alcohol === 'regular') score -= 0.1;
    else if (lifestyle.alcohol === 'none') score += 0.05;

    return Math.min(1, Math.max(0, score));
  }

  private calculateEnvironmentalScore(environmental: any, treatment: any): number {
    let score = 0.5;

    // Pollution affects skin
    if (environmental.pollution === 'high') score -= 0.1;
    else if (environmental.pollution === 'low') score += 0.05;

    // Sun exposure affects treatment results
    if (treatment.category === 'laser' && environmental.sunExposure === 'high') {
      score -= 0.15; // High sun exposure bad for laser treatments
    }

    // Climate affects skin
    if (environmental.climate === 'dry' && treatment.category === 'facial') {
      score -= 0.1;
    }

    return Math.min(1, Math.max(0, score));
  }

  private calculateTreatmentMatchScore(
    patientProfile: PatientProfile,
    treatment: any
  ): number {
    let score = 0.5;

    // Check contraindications
    if (treatment.contraindications) {
      for (const contraindication of treatment.contraindications) {
        if (this.hasContraindication(patientProfile, contraindication)) {
          score -= 0.2;
        }
      }
    }

    // Check "best for" criteria
    if (treatment.bestFor) {
      for (const criteria of treatment.bestFor) {
        if (this.matchesCriteria(patientProfile, criteria)) {
          score += 0.15;
        }
      }
    }

    return Math.min(1, Math.max(0, score));
  }

  private calculateHistoricalAdjustment(
    patientProfile: PatientProfile,
    treatment: any,
    historicalData: any[]
  ): number {
    if (historicalData.length === 0) return 1.0;

    // Find similar patients in historical data
    const similarPatients = historicalData.filter(patient => 
      this.arePatientsSimilar(patientProfile, patient)
    );

    if (similarPatients.length === 0) return 1.0;

    // Calculate average success rate for similar patients
    const successRates = similarPatients
      .filter(patient => patient.treatmentId === treatment.id)
      .map(patient => patient.successRate);

    if (successRates.length === 0) return 1.0;

    const averageSuccess = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;
    
    // Adjust current score based on historical data
    return 0.7 + (0.6 * averageSuccess); // Weight between 0.7 and 1.3
  }

  private calculateConfidenceScore(
    patientProfile: PatientProfile,
    treatment: any,
    historicalData: any[]
  ): number {
    let confidence = 0.5; // Base confidence

    // More historical data = higher confidence
    const similarPatients = historicalData.filter(patient => 
      this.arePatientsSimilar(patientProfile, patient)
    );
    
    confidence += Math.min(0.3, similarPatients.length * 0.05);

    // Complete patient profile = higher confidence
    const profileCompleteness = this.calculateProfileCompleteness(patientProfile);
    confidence += profileCompleteness * 0.2;

    return Math.min(1, confidence);
  }

  private calculateExpectedResults(
    patientProfile: PatientProfile,
    treatment: any,
    successScore: number
  ): SuccessPrediction['expectedResults'] {
    const baseImprovement = this.getBaseImprovement(treatment.category);
    const improvement = Math.round(baseImprovement * successScore);

    const baseSatisfaction = this.getBaseSatisfaction(treatment.category);
    const satisfaction = Math.round(baseSatisfaction * successScore);

    const baseLongevity = this.getBaseLongevity(treatment.category);
    const longevity = Math.round(baseLongevity * (0.8 + 0.4 * successScore));

    return {
      improvement,
      satisfaction,
      longevity
    };
  }

  private calculateRisks(
    patientProfile: PatientProfile,
    treatment: any
  ): SuccessPrediction['risks'] {
    let lowRisk = 0.7;
    let mediumRisk = 0.25;
    let highRisk = 0.05;

    // Adjust risks based on patient factors
    if (patientProfile.age > 50) {
      highRisk += 0.05;
      mediumRisk += 0.05;
      lowRisk -= 0.1;
    }

    if (patientProfile.lifestyleFactors.smoking) {
      highRisk += 0.05;
      mediumRisk += 0.05;
      lowRisk -= 0.1;
    }

    if (treatment.intensity === 'high') {
      highRisk += 0.1;
      mediumRisk += 0.1;
      lowRisk -= 0.2;
    }

    // Normalize
    const total = lowRisk + mediumRisk + highRisk;
    return {
      low: lowRisk / total,
      medium: mediumRisk / total,
      high: highRisk / total
    };
  }

  private generateRecommendations(
    patientProfile: PatientProfile,
    treatment: any,
    successScore: number,
    risks: SuccessPrediction['risks']
  ): string[] {
    const recommendations: string[] = [];

    if (successScore > 0.8) {
      recommendations.push('Excellent candidate for this treatment');
    } else if (successScore > 0.6) {
      recommendations.push('Good candidate with expected positive results');
    } else {
      recommendations.push('Consider alternative treatments for better results');
    }

    if (risks.high > 0.2) {
      recommendations.push('Higher risk profile - ensure proper consultation');
    }

    if (patientProfile.lifestyleFactors.stress === 'high') {
      recommendations.push('Consider stress management techniques for better results');
    }

    if (patientProfile.lifestyleFactors.sleep === 'poor') {
      recommendations.push('Improve sleep quality for optimal recovery');
    }

    if (treatment.category === 'laser' && patientProfile.environmentalFactors.sunExposure === 'high') {
      recommendations.push('Strict sun protection required before and after treatment');
    }

    return recommendations;
  }

  private async findAlternatives(
    patientProfile: PatientProfile,
    treatment: any,
    currentSuccessScore: number
  ): Promise<SuccessPrediction['alternatives']> {
    // This would typically query for similar treatments
    // For now, return empty array
    return [];
  }

  // Helper methods
  private areTreatmentsSimilar(treatment1: string, treatment2: string): boolean {
    // Simplified similarity check
    return treatment1.substring(0, 3) === treatment2.substring(0, 3);
  }

  private hasContraindication(patientProfile: PatientProfile, contraindication: string): boolean {
    // Check if patient has any contraindications
    return false; // Simplified
  }

  private matchesCriteria(patientProfile: PatientProfile, criteria: string): boolean {
    // Check if patient matches treatment criteria
    return false; // Simplified
  }

  private arePatientsSimilar(profile1: PatientProfile, profile2: any): boolean {
    // Simplified similarity check
    return Math.abs(profile1.age - profile2.age) < 10;
  }

  private calculateProfileCompleteness(profile: PatientProfile): number {
    // Calculate how complete the patient profile is
    let completeness = 0;
    let totalFields = 0;

    // Check various fields
    if (profile.age) { completeness += 1; }
    totalFields++;

    if (profile.gender) { completeness += 1; }
    totalFields++;

    if (profile.skinType) { completeness += 1; }
    totalFields++;

    if (profile.skinConditions.length > 0) { completeness += 1; }
    totalFields++;

    return completeness / totalFields;
  }

  private getBaseImprovement(category: string): number {
    const improvements: Record<string, number> = {
      'facial': 65,
      'laser': 75,
      'injectable': 80,
      'body': 60,
      'wellness': 50
    };
    return improvements[category] || 60;
  }

  private getBaseSatisfaction(category: string): number {
    const satisfactions: Record<string, number> = {
      'facial': 4.2,
      'laser': 4.5,
      'injectable': 4.7,
      'body': 4.0,
      'wellness': 4.3
    };
    return satisfactions[category] || 4.2;
  }

  private getBaseLongevity(category: string): number {
    const longevity: Record<string, number> = {
      'facial': 3,
      'laser': 12,
      'injectable': 9,
      'body': 6,
      'wellness': 4
    };
    return longevity[category] || 6;
  }

  private async getHistoricalTreatmentData(patientProfile: PatientProfile): Promise<any[]> {
    // In a real implementation, this would query the database
    // For now, return empty array
    return [];
  }
}

export { TreatmentSuccessPredictor };
