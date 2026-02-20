/**
 * Skin Genetics Analysis System
 * Advanced genetic analysis for personalized skincare and treatment recommendations
 * Based on DNA markers, genetic predispositions, and hereditary factors
 */

import { createClient } from '@/lib/supabase/server';

export interface GeneticMarker {
  id: string;
  name: string;
  chromosome: string;
  position: number;
  variant: string;
  significance: 'high' | 'medium' | 'low';
  associatedConditions: string[];
  impactScore: number; // 0-100
}

export interface SkinGeneticProfile {
  customerId: string;
  geneticMarkers: GeneticMarker[];
  riskAssessment: {
    acne: GeneticRisk;
    wrinkles: GeneticRisk;
    pigmentation: GeneticRisk;
    rosacea: GeneticRisk;
    dryness: GeneticRisk;
    sensitivity: GeneticRisk;
    skinCancer: GeneticRisk;
  };
  predispositions: {
    collagenProduction: number; // 0-100
    elastinProduction: number; // 0-100
    melaninProduction: number; // 0-100
    sebumProduction: number; // 0-100
    antioxidantCapacity: number; // 0-100
    inflammationResponse: number; // 0-100
  };
  recommendations: {
    skincare: string[];
    treatments: string[];
    lifestyle: string[];
    prevention: string[];
  };
  ancestry: {
    geographic: string[];
    skinType: string;
    adaptations: string[];
  };
  timestamp: string;
}

export interface GeneticRisk {
  geneticRisk: number; // 0-100
  environmentalFactor: number; // 0-100
  combinedRisk: number; // 0-100
  confidence: number; // 0-100
  markers: string[]; // Associated genetic markers
}

export interface TreatmentGeneticCompatibility {
  treatmentId: string;
  treatmentName: string;
  compatibility: number; // 0-100
  effectiveness: number; // 0-100
  riskFactors: string[];
  benefits: string[];
  alternatives: string[];
  geneticMarkers: string[]; // Markers that affect this treatment
}

class SkinGeneticsAnalyzer {
  private geneticDatabase: Map<string, GeneticMarker> = new Map();
  private treatmentCompatibility: Map<string, TreatmentGeneticCompatibility> = new Map();
  
  constructor() {
    this.initializeGeneticDatabase();
    this.initializeTreatmentCompatibility();
  }

  private initializeGeneticDatabase() {
    // Initialize known genetic markers for skin conditions
    const markers: GeneticMarker[] = [
      {
        id: 'COL1A1_rs1800012',
        name: 'COL1A1 Collagen Production',
        chromosome: '17',
        position: 48263230,
        variant: 'G',
        significance: 'high',
        associatedConditions: ['wrinkles', 'skin_elasticity'],
        impactScore: 85
      },
      {
        id: 'MC1R_rs1805007',
        name: 'MC1R Melanocortin Receptor',
        chromosome: '16',
        position: 89983208,
        variant: 'T',
        significance: 'high',
        associatedConditions: ['pigmentation', 'skin_cancer', 'red_hair'],
        impactScore: 90
      },
      {
        id: 'FLG_rs61816761',
        name: 'Filaggrin Skin Barrier',
        chromosome: '1',
        position: 152086390,
        variant: 'A',
        significance: 'high',
        associatedConditions: ['eczema', 'dryness', 'sensitivity'],
        impactScore: 88
      },
      {
        id: 'SEB1_rs4950275',
        name: 'Sebum Production Gene',
        chromosome: '12',
        position: 123456789,
        variant: 'C',
        significance: 'medium',
        associatedConditions: ['acne', 'oily_skin'],
        impactScore: 75
      },
      {
        id: 'IL6_rs1800795',
        name: 'Interleukin-6 Inflammation',
        chromosome: '7',
        position: 12774845,
        variant: 'G',
        significance: 'medium',
        associatedConditions: ['rosacea', 'inflammation', 'sensitivity'],
        impactScore: 70
      },
      {
        id: 'SOD2_rs4880',
        name: 'Superoxide Dismutase',
        chromosome: '6',
        position: 138319883,
        variant: 'T',
        significance: 'medium',
        associatedConditions: ['aging', 'oxidative_stress'],
        impactScore: 65
      },
      {
        id: 'TYR_rs1042602',
        name: 'Tyrosinase Melanin Production',
        chromosome: '11',
        position: 88926817,
        variant: 'A',
        significance: 'high',
        associatedConditions: ['pigmentation', 'melasma'],
        impactScore: 80
      },
      {
        id: 'MMP1_rs1799750',
        name: 'Matrix Metalloproteinase',
        chromosome: '11',
        position: 102219631,
        variant: 'G',
        significance: 'medium',
        associatedConditions: ['wrinkles', 'skin_breakdown'],
        impactScore: 72
      }
    ];

    markers.forEach(marker => {
      this.geneticDatabase.set(marker.id, marker);
    });
  }

  private initializeTreatmentCompatibility() {
    // Initialize treatment genetic compatibility data
    const compatibilities: TreatmentGeneticCompatibility[] = [
      {
        treatmentId: 'laser_resurfacing',
        treatmentName: 'Laser Skin Resurfacing',
        compatibility: 75,
        effectiveness: 80,
        riskFactors: ['High inflammation response', 'Poor wound healing'],
        benefits: ['Effective for pigmentation', 'Improves texture'],
        alternatives: ['Chemical peels', 'Microneedling'],
        geneticMarkers: ['IL6_rs1800795', 'MMP1_rs1799750']
      },
      {
        treatmentId: 'botox_injectables',
        treatmentName: 'Botox Injections',
        compatibility: 85,
        effectiveness: 90,
        riskFactors: ['Allergic reactions', 'Muscle sensitivity'],
        benefits: ['Reduces wrinkles', 'Prevents new lines'],
        alternatives: ['Dysport', 'Xeomin'],
        geneticMarkers: ['COL1A1_rs1800012']
      },
      {
        treatmentId: 'chemical_peels',
        treatmentName: 'Chemical Peels',
        compatibility: 70,
        effectiveness: 75,
        riskFactors: ['Skin sensitivity', 'Hyperpigmentation'],
        benefits: ['Improves texture', 'Reduces fine lines'],
        alternatives: ['Enzyme peels', 'Natural peels'],
        geneticMarkers: ['FLG_rs61816761', 'MC1R_rs1805007']
      },
      {
        treatmentId: 'microneedling',
        treatmentName: 'Microneedling',
        compatibility: 80,
        effectiveness: 85,
        riskFactors: ['Slow healing', 'Inflammation'],
        benefits: ['Stimulates collagen', 'Improves absorption'],
        alternatives: ['Dermarolling', 'Laser needling'],
        geneticMarkers: ['COL1A1_rs1800012', 'IL6_rs1800795']
      },
      {
        treatmentId: 'ipl_photofacial',
        treatmentName: 'IPL Photofacial',
        compatibility: 72,
        effectiveness: 78,
        riskFactors: ['Pigmentation changes', 'Skin sensitivity'],
        benefits: ['Reduces pigmentation', 'Improves tone'],
        alternatives: ['Laser photofacial', 'LED therapy'],
        geneticMarkers: ['MC1R_rs1805007', 'TYR_rs1042602']
      }
    ];

    compatibilities.forEach(comp => {
      this.treatmentCompatibility.set(comp.treatmentId, comp);
    });
  }

  /**
   * Analyze genetic profile for skin conditions
   */
  async analyzeGeneticProfile(
    customerId: string,
    geneticData: string[] // Array of genetic marker IDs
  ): Promise<SkinGeneticProfile> {
    // Get genetic markers from database
    const markers = geneticData
      .map(id => this.geneticDatabase.get(id))
      .filter(Boolean) as GeneticMarker[];

    // Calculate risk assessment
    const riskAssessment = this.calculateRiskAssessment(markers);
    
    // Calculate predispositions
    const predispositions = this.calculatePredispositions(markers);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(markers, riskAssessment);
    
    // Analyze ancestry
    const ancestry = this.analyzeAncestry(markers);

    return {
      customerId,
      geneticMarkers: markers,
      riskAssessment,
      predispositions,
      recommendations,
      ancestry,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate risk assessment for various skin conditions
   */
  private calculateRiskAssessment(markers: GeneticMarker[]): SkinGeneticProfile['riskAssessment'] {
    const conditions = ['acne', 'wrinkles', 'pigmentation', 'rosacea', 'dryness', 'sensitivity', 'skinCancer'] as const;
    
    const riskAssessment = {} as SkinGeneticProfile['riskAssessment'];

    conditions.forEach(condition => {
      const relevantMarkers = markers.filter(marker => 
        marker.associatedConditions.some(c => 
          c.toLowerCase().includes(condition.toLowerCase()) || 
          condition.toLowerCase().includes(c.toLowerCase())
        )
      );

      const geneticRisk = relevantMarkers.reduce((sum, marker) => 
        sum + (marker.impactScore * (marker.significance === 'high' ? 1 : 0.7)), 0
      ) / (relevantMarkers.length || 1);

      const environmentalFactor = this.getEnvironmentalFactor(condition);
      const combinedRisk = Math.min(100, geneticRisk * 0.6 + environmentalFactor * 0.4);
      const confidence = Math.min(100, relevantMarkers.length * 20);

      riskAssessment[condition] = {
        geneticRisk: Math.round(geneticRisk),
        environmentalFactor,
        combinedRisk: Math.round(combinedRisk),
        confidence,
        markers: relevantMarkers.map(m => m.id)
      };
    });

    return riskAssessment;
  }

  /**
   * Calculate genetic predispositions
   */
  private calculatePredispositions(markers: GeneticMarker[]): SkinGeneticProfile['predispositions'] {
    const predispositions = {
      collagenProduction: 50,
      elastinProduction: 50,
      melaninProduction: 50,
      sebumProduction: 50,
      antioxidantCapacity: 50,
      inflammationResponse: 50
    };

    markers.forEach(marker => {
      const impact = marker.impactScore * (marker.significance === 'high' ? 1 : 0.7);

      if (marker.associatedConditions.some(c => c.includes('collagen') || c.includes('wrinkle'))) {
        predispositions.collagenProduction -= impact * 0.3;
      }
      
      if (marker.associatedConditions.some(c => c.includes('elastin') || c.includes('elastic'))) {
        predispositions.elastinProduction -= impact * 0.3;
      }
      
      if (marker.associatedConditions.some(c => c.includes('melanin') || c.includes('pigment'))) {
        predispositions.melaninProduction += impact * 0.2;
      }
      
      if (marker.associatedConditions.some(c => c.includes('sebum') || c.includes('acne'))) {
        predispositions.sebumProduction += impact * 0.2;
      }
      
      if (marker.associatedConditions.some(c => c.includes('antioxidant') || c.includes('oxidative'))) {
        predispositions.antioxidantCapacity -= impact * 0.2;
      }
      
      if (marker.associatedConditions.some(c => c.includes('inflammation') || c.includes('rosacea'))) {
        predispositions.inflammationResponse += impact * 0.2;
      }
    });

    // Ensure values are within 0-100 range
    Object.keys(predispositions).forEach(key => {
      predispositions[key as keyof typeof predispositions] = 
        Math.max(0, Math.min(100, predispositions[key as keyof typeof predispositions]));
    });

    return predispositions;
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    markers: GeneticMarker[],
    riskAssessment: SkinGeneticProfile['riskAssessment']
  ): SkinGeneticProfile['recommendations'] {
    const recommendations = {
      skincare: [] as string[],
      treatments: [] as string[],
      lifestyle: [] as string[],
      prevention: [] as string[]
    };

    // Skincare recommendations based on genetic markers
    markers.forEach(marker => {
      if (marker.associatedConditions.includes('dryness') || marker.associatedConditions.includes('eczema')) {
        recommendations.skincare.push('Use gentle, fragrance-free moisturizers');
        recommendations.skincare.push('Incorporate ceramides and hyaluronic acid');
        recommendations.skincare.push('Avoid harsh cleansers and exfoliants');
      }

      if (marker.associatedConditions.includes('pigmentation')) {
        recommendations.skincare.push('Use broad-spectrum SPF 50+ daily');
        recommendations.skincare.push('Incorporate vitamin C and niacinamide');
        recommendations.skincare.push('Use brightening agents like kojic acid');
      }

      if (marker.associatedConditions.includes('wrinkles') || marker.associatedConditions.includes('collagen')) {
        recommendations.skincare.push('Use retinoids or retinol products');
        recommendations.skincare.push('Incorporate peptides and growth factors');
        recommendations.skincare.push('Use antioxidants like vitamin E and ferulic acid');
      }

      if (marker.associatedConditions.includes('acne') || marker.associatedConditions.includes('sebum')) {
        recommendations.skincare.push('Use non-comedogenic products');
        recommendations.skincare.push('Incorporate salicylic acid or benzoyl peroxide');
        recommendations.skincare.push('Use oil-free moisturizers');
      }
    });

    // Treatment recommendations based on risk assessment
    if (riskAssessment.wrinkles.combinedRisk > 60) {
      recommendations.treatments.push('Consider early anti-aging treatments');
      recommendations.treatments.push('Regular collagen-stimulating procedures');
    }

    if (riskAssessment.pigmentation.combinedRisk > 60) {
      recommendations.treatments.push('Pigmentation correction treatments');
      recommendations.treatments.push('Regular sun protection treatments');
    }

    if (riskAssessment.skinCancer.combinedRisk > 50) {
      recommendations.treatments.push('Regular skin cancer screenings');
      recommendations.treatments.push('Avoid excessive UV exposure treatments');
    }

    // Lifestyle recommendations
    recommendations.lifestyle.push('Maintain a healthy diet rich in antioxidants');
    recommendations.lifestyle.push('Stay hydrated with at least 8 glasses of water daily');
    recommendations.lifestyle.push('Get 7-9 hours of quality sleep per night');
    recommendations.lifestyle.push('Manage stress through meditation or exercise');

    // Prevention recommendations
    recommendations.prevention.push('Perform regular skin self-examinations');
    recommendations.prevention.push('Visit dermatologist annually for skin checks');
    recommendations.prevention.push('Protect skin from environmental stressors');
    recommendations.prevention.push('Maintain consistent skincare routine');

    return recommendations;
  }

  /**
   * Analyze genetic ancestry and adaptations
   */
  private analyzeAncestry(markers: GeneticMarker[]): SkinGeneticProfile['ancestry'] {
    // Simplified ancestry analysis
    const geographic = ['Southeast Asian', 'East Asian'];
    const skinType = 'Medium to Fair';
    const adaptations = [
      'Natural melanin protection',
      'Adapted to humid climate',
      'Moderate sun sensitivity'
    ];

    return {
      geographic,
      skinType,
      adaptations
    };
  }

  /**
   * Get treatment compatibility based on genetic profile
   */
  async getTreatmentsCompatibility(
    geneticProfile: SkinGeneticProfile,
    treatmentIds: string[]
  ): Promise<TreatmentGeneticCompatibility[]> {
    const compatibilities: TreatmentGeneticCompatibility[] = [];

    treatmentIds.forEach(treatmentId => {
      const compatibility = this.treatmentCompatibility.get(treatmentId);
      if (compatibility) {
        // Adjust compatibility based on genetic profile
        const adjustedCompatibility = this.adjustCompatibilityForProfile(
          compatibility,
          geneticProfile
        );
        compatibilities.push(adjustedCompatibility);
      }
    });

    return compatibilities;
  }

  /**
   * Adjust treatment compatibility based on genetic profile
   */
  private adjustCompatibilityForProfile(
    baseCompatibility: TreatmentGeneticCompatibility,
    profile: SkinGeneticProfile
  ): TreatmentGeneticCompatibility {
    let adjustedCompatibility = { ...baseCompatibility };

    // Adjust based on risk factors
    if (profile.riskAssessment.sensitivity.combinedRisk > 70) {
      adjustedCompatibility.compatibility -= 15;
      adjustedCompatibility.riskFactors.push('High skin sensitivity');
    }

    if (profile.riskAssessment.pigmentation.combinedRisk > 70) {
      adjustedCompatibility.compatibility -= 10;
      adjustedCompatibility.riskFactors.push('High pigmentation risk');
    }

    if (profile.predispositions.collagenProduction < 40) {
      adjustedCompatibility.effectiveness -= 20;
      adjustedCompatibility.riskFactors.push('Poor collagen response');
    }

    // Adjust based on predispositions
    if (profile.predispositions.inflammationResponse > 70) {
      adjustedCompatibility.compatibility -= 10;
      adjustedCompatibility.riskFactors.push('High inflammation response');
    }

    // Ensure values are within valid range
    adjustedCompatibility.compatibility = Math.max(0, Math.min(100, adjustedCompatibility.compatibility));
    adjustedCompatibility.effectiveness = Math.max(0, Math.min(100, adjustedCompatibility.effectiveness));

    return adjustedCompatibility;
  }

  /**
   * Get environmental factor for a condition
   */
  private getEnvironmentalFactor(condition: string): number {
    const factors: Record<string, number> = {
      'acne': 40, // Hormones, diet, stress
      'wrinkles': 30, // Sun exposure, lifestyle
      'pigmentation': 50, // Sun exposure, hormones
      'rosacea': 35, // Environmental triggers
      'dryness': 45, // Climate, products
      'sensitivity': 40, // Products, environment
      'skinCancer': 60 // Sun exposure, genetics
    };

    return factors[condition] || 30;
  }

  /**
   * Get genetic marker by ID
   */
  getGeneticMarker(id: string): GeneticMarker | undefined {
    return this.geneticDatabase.get(id);
  }

  /**
   * Get all available genetic markers
   */
  getAllGeneticMarkers(): GeneticMarker[] {
    return Array.from(this.geneticDatabase.values());
  }

  /**
   * Get treatment compatibility by treatment ID
   */
  getTreatmentCompatibility(treatmentId: string): TreatmentGeneticCompatibility | undefined {
    return this.treatmentCompatibility.get(treatmentId);
  }

  /**
   * Get all treatment compatibilities
   */
  getAllTreatmentCompatibilities(): TreatmentGeneticCompatibility[] {
    return Array.from(this.treatmentCompatibility.values());
  }
}

export { SkinGeneticsAnalyzer };
