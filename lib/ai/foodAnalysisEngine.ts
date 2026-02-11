/**
 * AI Food Analysis Engine
 * Core engine for analyzing food images and providing nutritional information
 * Integrates with Gemini Vision API and custom Thai food models
 */

export interface FoodItem {
  id: string;
  name_th: string;
  name_en?: string;
  category: string;
  subcategory: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  nutritionData: NutritionData;
  allergens: string[];
  ingredients: string[];
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  vitamins?: Record<string, number>;
  minerals?: Record<string, number>;
}

export interface AnalysisResult {
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
}

export interface UserFoodPreferences {
  dietaryRestrictions: string[];
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

export class FoodAnalysisEngine {
  private geminiApiKey: string;
  private supabaseClient: any;
  private thaiFoodDatabase: Map<string, any> = new Map();

  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.initializeThaiFoodDatabase();
  }

  /**
   * Initialize Thai food database from Supabase
   */
  private async initializeThaiFoodDatabase() {
    try {
      // This would be called during server initialization
      // For now, we'll load basic Thai food data
      this.loadBasicThaiFoodData();
    } catch (error) {
      console.error('Failed to initialize Thai food database:', error);
    }
  }

  /**
   * Load basic Thai food data
   */
  private loadBasicThaiFoodData() {
    const thaiFoods = [
      {
        name_th: 'ข้าวมันดกวัว',
        name_en: 'Khao Man Gai',
        category: 'main_dish',
        subcategory: 'thai_food',
        nutritionData: {
          calories: 130,
          protein: 7.5,
          carbs: 25,
          fat: 1.5,
          fiber: 1.2,
          sugar: 0.5,
          sodium: 350
        },
        allergens: ['gluten', 'dairy', 'nuts', 'soy'],
        ingredients: ['ข้าวมัน', 'ไก่ต้ววัวว', 'น้ำมันตะไค']
      },
      {
        name_th: 'ต้มยำ',
        name_en: 'Tom Yum Soup',
        category: 'main_dish',
        subcategory: 'thai_food',
        nutritionData: {
          calories: 45,
          protein: 3.5,
          carbs: 5,
          fat: 2,
          fiber: 1.0,
          sugar: 2.5,
          sodium: 800
        },
        allergens: ['gluten', 'dairy', 'nuts', 'shellfish'],
        ingredients: ['ต้ม', 'น้ำสต๊อ', 'พริกไทย', 'ตะไค', 'กระเทียม', 'น้ำปลา']
      },
      {
        name_th: 'ผัดไทยะไค',
        name_en: 'Pad Thai',
        category: 'main_dish',
        subcategory: 'thai_food',
        nutritionData: {
          calories: 180,
          protein: 10,
          carbs: 30,
          fat: 6,
          fiber: 2.5,
          sugar: 6,
          sodium: 600
        },
        allergens: ['gluten', 'dairy', 'nuts', 'eggs', 'shellfish'],
        ingredients: ['เส้นผัด', 'กะเทียม', 'ถั่วไข่', 'น้ำมันตะไค', 'ถั่ว', 'ผักชี', 'มะเขือ', 'ถั่วเปียก']
      },
      {
        name_th: 'แกงส้ว',
        name_en: 'Gaeng Som',
        category: 'main_dish',
        subcategory: 'thai_food',
        nutritionData: {
          calories: 120,
          protein: 8,
          carbs: 15,
          fat: 4,
          fiber: 2.0,
          sugar: 8,
          sodium: 900
        },
        allergens: ['gluten', 'dairy', 'nuts', 'shellfish'],
        ingredients: ['แกง', 'มะเขือ', 'พริกไทย', 'ตะไค', 'น้ำปลา', 'กะเทียม', 'ซังเขือ', 'ถั่วเปียก']
      },
      {
        name_th: 'ไข่ไทยะไค',
        name_en: 'Tom Kha Gai',
        category: 'main_dish',
        subcategory: 'thai_food',
        nutritionData: {
          calories: 140,
          protein: 12,
          carbs: 18,
          fat: 7,
          fiber: 1.5,
          sugar: 3,
          sodium: 700
        },
        allergens: ['gluten', 'dairy', 'nuts', 'shellfish'],
        ingredients: ['ไข่', 'มะเขือ', 'พริกไทย', 'ตะไค', 'น้ำมันตะไค', 'กะเทียม', 'ซังเขือ', 'ถั่วเปียก']
      },
      {
        name_th: 'หมูทอด',
        name_en: 'Moo Tod',
        category: 'main_dish',
        subcategory: 'thai_food',
        nutritionData: {
          calories: 200,
          protein: 15,
          carbs: 20,
          fat: 8,
          fiber: 1.8,
          sugar: 12,
          sodium: 500
        },
        allergens: ['gluten', 'dairy', 'nuts', 'eggs'],
        ingredients: ['หมู', 'ไข่', 'ถั่วไข่', 'น้ำมันตะไค', 'กระเทียม', 'พริกไทย', 'ตะไค']
      },
      {
        name_th: 'ก๋ยเตี๋ย',
        name_en: 'Pad See Ew',
        category: 'main_dish',
        subcategory: 'thai_food',
        nutritionData: {
          calories: 160,
          protein: 6,
          carbs: 25,
          fat: 5,
          fiber: 3.0,
          sugar: 10,
          sodium: 800
        },
        allergens: ['gluten', 'dairy', 'nuts', 'eggs'],
        ingredients: ['ก๋ยเตี๋ย', 'ถั่ว', 'น้ำมันตะไค', 'ซอส', 'กระเทียม', 'ถั่วไข่', 'ผักชี']
      },
      {
        name_th: 'คะน้าครั่ง',
        name_en: 'Khanom Krok Kreng',
        category: 'dessert',
        subcategory: 'thai_food',
        nutritionData: {
          calories: 250,
          protein: 5,
          carbs: 35,
          fat: 10,
          fiber: 2.0,
          sugar: 20,
          sodium: 400
        },
        allergens: ['gluten', 'dairy', 'nuts', 'eggs'],
        ingredients: ['คะน้า', 'มะพร้าว', 'กะทิ', 'น้ำตาล', 'มะพร้าว', 'ถั่วไข่', 'กะทิ', 'น้ำมันตะไค']
      },
      {
        name_th: 'ขนมไทย',
        name_en: 'Cha Yen',
        category: 'beverage',
        subcategory: 'thai_food',
        nutritionData: {
          calories: 60,
          protein: 0,
          carbs: 15,
          fat: 0,
          fiber: 0,
          sugar: 12,
          sodium: 50
        },
        allergens: ['gluten', 'dairy', 'nuts', 'caffeine'],
        ingredients: ['น้ำชา', 'น้ำตาล', 'น้ำมันตะไค', 'ใบชี', 'น้ำมะน']
      }
    ];

    thaiFoods.forEach(food => {
      this.thaiFoodDatabase.set(food.name_th.toLowerCase(), food);
      if (food.name_en) {
        this.thaiFoodDatabase.set(food.name_en.toLowerCase(), food);
      }
    });
  }

  /**
   * Analyze food image using AI
   */
  async analyzeFoodImage(
    imageData: string,
    userPreferences?: UserFoodPreferences
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      // Step 1: Use Gemini Vision API for food recognition
      const geminiResult = await this.analyzeWithGemini(imageData);

      // Step 2: Process results and match with Thai food database
      const processedResults = await this.processGeminiResults(
        geminiResult,
        userPreferences
      );

      // Step 3: Calculate overall nutrition
      const overallNutrition = this.calculateOverallNutrition(processedResults.foodItems);

      // Step 4: Generate recommendations
      const recommendations = this.generateRecommendations(
        processedResults.foodItems,
        overallNutrition,
        userPreferences
      );

      // Step 5: Check for warnings based on user preferences
      const warnings = this.checkWarnings(
        processedResults.foodItems,
        userPreferences
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        foodItems: processedResults.foodItems,
        overallNutrition,
        confidence: processedResults.confidence,
        processingTimeMs: processingTime,
        recommendations,
        warnings
      };
    } catch (error) {
      console.error('Food analysis failed:', error);
      return {
        success: false,
        foodItems: [],
        overallNutrition: {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          totalSugar: 0,
          totalSodium: 0
        },
        confidence: 0,
        processingTimeMs: Date.now() - startTime,
        recommendations: ['Analysis failed. Please try again.'],
        warnings: ['Unable to analyze image']
      };
    }
  }

  /**
   * Analyze image using Gemini Vision API
   */
  private async analyzeWithGemini(imageData: string): Promise<any> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this food image and identify all food items present. For each food item, provide:
                  1. Name in Thai and English
                  2. Category (main_dish, side_dish, beverage, dessert, snack)
                  3. Approximate portion size in grams
                  4. Confidence level (0-1)
                  5. Bounding box coordinates if multiple items
                  6. Key ingredients visible
                  7. Cooking method if identifiable

                  Focus on Thai cuisine but also identify international foods.
                  Be specific and detailed in your analysis.`
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageData
                  }
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Process Gemini results and match with Thai food database
   */
  private async processGeminiResults(
    geminiResult: any,
    userPreferences?: UserFoodPreferences
  ): Promise<{ foodItems: FoodItem[]; confidence: number }> {
    const foodItems: FoodItem[] = [];
    let totalConfidence = 0;

    try {
      // Parse Gemini response (this would need to be adapted based on actual API response format)
      const analysisText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract food items from the analysis
      const foodMatches = this.extractFoodItemsFromText(analysisText);
      
      for (const match of foodMatches) {
        const thaiFood = this.thaiFoodDatabase.get(match.name.toLowerCase());
        
        if (thaiFood) {
          const foodItem: FoodItem = {
            id: this.generateId(),
            name_th: thaiFood.name_th,
            name_en: thaiFood.name_en,
            category: thaiFood.category,
            subcategory: thaiFood.subcategory,
            confidence: match.confidence || 0.8,
            boundingBox: match.boundingBox,
            nutritionData: thaiFood.nutritionData,
            allergens: thaiFood.allergens,
            ingredients: thaiFood.ingredients
          };
          
          // Adjust nutrition based on portion size if provided
          if (match.portionSize && match.portionSize !== 100) {
            foodItem.nutritionData = this.adjustNutritionByPortion(
              foodItem.nutritionData,
              match.portionSize
            );
          }
          
          foodItems.push(foodItem);
          totalConfidence += foodItem.confidence;
        }
      }
      
      // Calculate average confidence
      const averageConfidence = foodItems.length > 0 ? totalConfidence / foodItems.length : 0;
      
      return { foodItems, confidence: averageConfidence };
    } catch (error) {
      console.error('Error processing Gemini results:', error);
      return { foodItems: [], confidence: 0 };
    }
  }

  /**
   * Extract food items from text analysis
   */
  private extractFoodItemsFromText(analysisText: string): Array<{
    name: string;
    confidence: number;
    portionSize?: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }> {
    const foodItems: Array<{
      name: string;
      confidence: number;
      portionSize?: number;
      boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }> = [];

    // This is a simplified version - in production, you'd use more sophisticated NLP
    // For now, we'll look for Thai food names in the text
    const thaiFoodNames = Array.from(this.thaiFoodDatabase.keys());
    
    for (const foodName of thaiFoodNames) {
      if (analysisText.toLowerCase().includes(foodName.toLowerCase())) {
        foodItems.push({
          name: foodName,
          confidence: 0.85, // Default confidence
          portionSize: 100 // Default portion
        });
      }
    }

    return foodItems;
  }

  /**
   * Adjust nutrition data based on portion size
   */
  private adjustNutritionByPortion(
    originalNutrition: NutritionData,
    portionSize: number
  ): NutritionData {
    const factor = portionSize / 100;
    return {
      calories: originalNutrition.calories * factor,
      protein: originalNutrition.protein * factor,
      carbs: originalNutrition.carbs * factor,
      fat: originalNutrition.fat * factor,
      fiber: originalNutrition.fiber * factor,
      sugar: originalNutrition.sugar * factor,
      sodium: originalNutrition.sodium * factor,
      vitamins: originalNutrition.vitamins ? 
        Object.fromEntries(
          Object.entries(originalNutrition.vitamins).map(([key, value]) => [key, value * factor])
        ) : undefined,
      minerals: originalNutrition.minerals ? 
        Object.fromEntries(
          Object.entries(originalNutrition.minerals).map(([key, value]) => [key, value * factor])
        ) : undefined
    };
  }

  /**
   * Calculate overall nutrition from food items
   */
  private calculateOverallNutrition(foodItems: FoodItem[]): {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    totalSugar: number;
    totalSodium: number;
  } {
    const totals = foodItems.reduce((acc, item) => {
      return {
        totalCalories: acc.totalCalories + item.nutritionData.calories,
        totalProtein: acc.totalProtein + item.nutritionData.protein,
        totalCarbs: acc.totalCarbs + item.nutritionData.carbs,
        totalFat: acc.totalFat + item.nutritionData.fat,
        totalFiber: acc.totalFiber + item.nutritionData.fiber,
        totalSugar: acc.totalSugar + item.nutritionData.sugar,
        totalSodium: acc.totalSodium + item.nutritionData.sodium
      };
    }, {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      totalSugar: 0,
      totalSodium: 0
    });

    return totals;
  }

  /**
   * Generate recommendations based on analysis results
   */
  private generateRecommendations(
    foodItems: FoodItem[],
    nutrition: {
      totalCalories: number;
      totalProtein: number;
      totalCarbs: number;
      totalFat: number;
      totalFiber: number;
      totalSugar: number;
      totalSodium: number;
    },
    userPreferences?: UserFoodPreferences
  ): string[] {
    const recommendations: string[] = [];

    // Calorie-based recommendations
    if (userPreferences?.goals?.targetCalories) {
      const calorieDifference = nutrition.totalCalories - userPreferences.goals.targetCalories;
      if (calorieDifference > 200) {
        recommendations.push(`This meal is ${calorieDifference} calories over your daily target.`);
      } else if (calorieDifference < -200) {
        recommendations.push(`This meal is ${Math.abs(calorieDifference)} calories under your daily target.`);
      }
    }

    // Protein recommendations
    if (userPreferences?.goals?.muscleGain && nutrition.totalProtein < 20) {
      recommendations.push('Consider adding more protein-rich foods to support muscle gain.');
    }

    // Sodium recommendations
    if (nutrition.totalSodium > 2000) {
      recommendations.push('This meal is high in sodium. Consider reducing salt intake.');
    }

    // Sugar recommendations
    if (nutrition.totalSugar > 50) {
      recommendations.push('This meal is high in sugar. Consider reducing added sugars.');
    }

    // Fiber recommendations
    if (nutrition.totalFiber < 10) {
      recommendations.push('This meal is low in fiber. Consider adding more vegetables.');
    }

    // Allergen warnings
    if (userPreferences?.allergies && userPreferences.allergies.length > 0) {
      const allergenWarnings = this.checkAllergens(foodItems, userPreferences.allergies);
      recommendations.push(...allergenWarnings);
    }

    // Thai cuisine specific recommendations
    const thaiDishes = foodItems.filter(item => item.subcategory === 'thai_food');
    if (thaiDishes.length > 0) {
      recommendations.push('Great choice! Thai cuisine offers balanced nutrition with fresh ingredients.');
    }

    return recommendations;
  }

  /**
   * Check for warnings based on user preferences
   */
  private checkWarnings(
    foodItems: FoodItem[],
    userPreferences?: UserFoodPreferences
  ): string[] {
    const warnings: string[] = [];

    if (!userPreferences) return warnings;

    // Check for allergens
    const allergenWarnings = this.checkAllergens(foodItems, userPreferences.allergies);
    warnings.push(...allergenWarnings);

    // Check for dietary restrictions
    if (userPreferences.dietaryRestrictions.includes('vegetarian')) {
      const nonVegetarian = foodItems.filter(item => 
        item.ingredients.some(ing => 
          ['หมู', 'ไก่', 'ถั่ว', 'ปลา'].some(meat => ing.includes(meat))
        )
      );
      if (nonVegetarian.length > 0) {
        warnings.push('This meal contains non-vegetarian ingredients.');
      }
    }

    if (userPreferences.dietaryRestrictions.includes('vegan')) {
      const nonVegan = foodItems.filter(item => 
        item.ingredients.some(ing => 
          ['หมู', 'ไก่', 'ถั่ว', 'ปลา', 'ไข่', 'นมำตะไค', 'ไข่'].some(animal => ing.includes(animal))
        )
      );
      if (nonVegan.length > 0) {
        warnings.push('This meal contains animal products.');
      }
    }

    if (userPreferences.preferences.lowSodium) {
      warnings.push('Low sodium preference noted — check sodium content.');
    }

    if (userPreferences.preferences.lowSugar) {
      warnings.push('Low sugar preference noted — check sugar content.');
    }

    return warnings;
  }

  /**
   * Check for allergens in food items
   */
  private checkAllergens(foodItems: FoodItem[], userAllergies: string[]): string[] {
    const warnings: string[] = [];
    
    for (const foodItem of foodItems) {
      for (const allergen of userAllergies) {
        if (foodItem.allergens.includes(allergen)) {
          warnings.push(`Warning: ${foodItem.name_th} contains ${allergen}`);
        }
      }
    }
    
    return warnings;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get food information from database
   */
  async getFoodInfo(foodName: string): Promise<FoodItem | null> {
    const food = this.thaiFoodDatabase.get(foodName.toLowerCase());
    
    if (!food) return null;

    return {
      id: this.generateId(),
      name_th: food.name_th,
      name_en: food.name_en,
      category: food.category,
      subcategory: food.subcategory,
      confidence: 1.0,
      nutritionData: food.nutritionData,
      allergens: food.allergens,
      ingredients: food.ingredients
    };
  }

  /**
   * Search food database
   */
  searchFood(query: string): FoodItem[] {
    const results: FoodItem[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const [key, food] of this.thaiFoodDatabase.entries()) {
      if (key.includes(lowerQuery) || food.name_en?.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: this.generateId(),
          name_th: food.name_th,
          name_en: food.name_en || '',
          category: food.category,
          subcategory: food.subcategory,
          confidence: 1.0,
          nutritionData: food.nutritionData,
          allergens: food.allergens,
          ingredients: food.ingredients
        });
      }
    }
    
    return results;
  }

  /**
   * Get nutrition summary for food items
   */
  getNutritionSummary(foodItems: FoodItem[]): {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    totalSugar: number;
    totalSodium: number;
  } {
    return this.calculateOverallNutrition(foodItems);
  }
}

export default FoodAnalysisEngine;
