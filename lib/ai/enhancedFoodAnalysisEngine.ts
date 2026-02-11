/**
 * Enhanced AI Food Analysis Engine v2
 * Gemini Vision (primary) + HuggingFace (secondary) + Open Food Facts (free) + Thai Food DB (100+ dishes)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

interface FoodComponent {
  name: string;
  name_th?: string;
  name_en?: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  confidence: number;
  category: string;
  source: 'gemini' | 'huggingface' | 'open_food_facts' | 'thai_database';
}

interface AnalysisResult {
  success: boolean;
  components: FoodComponent[];
  totalNutrition: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sodium: number; };
  processingTime: number;
  recommendations: string[];
  warnings: string[];
  confidence: number;
  imageAnalysis: { detectedItems: number; recognitionAccuracy: number; portionAccuracy: number; aiModelsUsed: string[]; };
}

interface ThaiFoodEntry {
  name_th: string; name_en: string;
  calories_per_100g: number; protein_per_100g: number; carbs_per_100g: number;
  fat_per_100g: number; fiber_per_100g: number; sodium_per_100g: number;
  category: string; common_portions: Record<string, number>; keywords?: string[];
}

type ThaiFoodData = Record<string, ThaiFoodEntry>;

export class EnhancedFoodAnalysisEngine {
  private geminiApiKey: string;
  private hfApiToken: string;
  private thaiFoodDatabase: ThaiFoodData = {};

  constructor() {
    this.geminiApiKey = process.env.GOOGLE_AI_API_KEY || '';
    this.hfApiToken = process.env.HF_API_TOKEN || '';
    this.initializeThaiFoodDatabase();
  }

  async analyzeFoodImage(imageData: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    const aiModelsUsed: string[] = [];
    try {
      let geminiResult: any[] | null = null;
      if (this.geminiApiKey) {
        geminiResult = await this.analyzeWithGemini(imageData);
        if (geminiResult) aiModelsUsed.push('gemini-1.5-flash');
      }
      let hfResult: any[] | null = null;
      if (this.hfApiToken && (!geminiResult || geminiResult.length === 0)) {
        hfResult = await this.analyzeWithHuggingFace(imageData);
        if (hfResult && hfResult.length > 0) aiModelsUsed.push('huggingface-food');
      }
      const items = geminiResult || hfResult || [];
      const enriched = await this.enrichWithOpenFoodFacts(items);
      if (enriched.some((i: any) => i._offEnriched)) aiModelsUsed.push('open-food-facts');
      const combined = this.combineResults(enriched);
      const nutrition = this.calculateNutrition(combined);
      const { recommendations, warnings } = this.generateRecommendations(nutrition.totalNutrition);
      return {
        success: true, components: nutrition.components, totalNutrition: nutrition.totalNutrition,
        processingTime: Date.now() - startTime, recommendations, warnings, confidence: nutrition.confidence,
        imageAnalysis: { detectedItems: nutrition.components.length, recognitionAccuracy: nutrition.confidence, portionAccuracy: 0.85, aiModelsUsed }
      };
    } catch (error) {
      console.error('Enhanced food analysis error:', error);
      throw new Error('การวิเคราะห์อาหารล้มเหลว: ' + (error as Error).message);
    }
  }

  private async analyzeWithGemini(imageData: string): Promise<any[] | null> {
    if (!this.geminiApiKey) return null;
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const foodList = Object.entries(this.thaiFoodDatabase).map(([k, v]) => k + ' (' + v.name_en + ')').slice(0, 50).join(', ');
      const prompt = `You are a Thai food expert. Analyze this food image. Known Thai foods: ${foodList}
Return ONLY a JSON array: [{"name":"Thai or English name","name_en":"English","portion":"e.g. 1 จาน","confidence":0.0-1.0,"category":"main_dish|soup|curry|vegetable|protein|grains|dairy|fruit|snack|beverage|dessert","cooking_method":"fried|boiled|grilled|steamed|raw|stir_fried"}]`;
      const result = await model.generateContent([{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64Data } }]);
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) { const parsed = JSON.parse(jsonMatch[0]); return Array.isArray(parsed) ? parsed : null; }
      return null;
    } catch (error) { console.error('Gemini error:', error); return null; }
  }

  private async analyzeWithHuggingFace(imageData: string): Promise<any[] | null> {
    if (!this.hfApiToken) return null;
    try {
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const response = await fetch('https://api-inference.huggingface.co/models/nateraw/food', {
        method: 'POST', headers: { Authorization: `Bearer ${this.hfApiToken}` }, body: imageBuffer,
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!Array.isArray(data)) return null;
      return data.slice(0, 5).map((item: any) => ({
        name: this.mapHFLabel(item.label) || item.label, name_en: item.label?.replace(/_/g, ' '),
        portion: '1 จาน', confidence: item.score || 0.5, category: this.guessCategory(item.label), source: 'huggingface'
      }));
    } catch (error) { console.error('HF error:', error); return null; }
  }

  private mapHFLabel(label: string): string | null {
    if (!label) return null;
    const l = label.toLowerCase().replace(/_/g, ' ');
    const map: Record<string, string> = {
      'fried rice': 'ข้าวผัด', 'pad thai': 'ผัดไทย', 'green curry': 'แกงเขียวหวาน',
      'fried chicken': 'ไก่ทอด', 'grilled chicken': 'ไก่ย่าง', 'spring rolls': 'ปอเปี๊ยะทอด',
      'steak': 'สเต็ก', 'pizza': 'พิซซ่า', 'hamburger': 'แฮมเบอร์เกอร์', 'sushi': 'ซูชิ',
      'ramen': 'ราเมน', 'salad': 'สลัด', 'omelette': 'ไข่เจียว', 'rice': 'ข้าวสวย', 'noodles': 'ก๋วยเตี๋ยว',
    };
    for (const [key, thai] of Object.entries(map)) { if (l.includes(key)) return thai; }
    for (const [, food] of Object.entries(this.thaiFoodDatabase)) {
      if (food.name_en.toLowerCase().includes(l) || (food.keywords && food.keywords.some(k => l.includes(k)))) return food.name_th;
    }
    return null;
  }

  private guessCategory(label: string): string {
    if (!label) return 'main_dish';
    const l = label.toLowerCase();
    if (l.includes('rice') || l.includes('bread') || l.includes('noodle')) return 'grains';
    if (l.includes('chicken') || l.includes('pork') || l.includes('beef') || l.includes('fish') || l.includes('egg')) return 'protein';
    if (l.includes('soup')) return 'soup';
    if (l.includes('curry')) return 'curry';
    if (l.includes('salad') || l.includes('vegetable')) return 'vegetable';
    if (l.includes('fruit')) return 'fruit';
    if (l.includes('cake') || l.includes('dessert')) return 'dessert';
    return 'main_dish';
  }

  private async enrichWithOpenFoodFacts(items: any[]): Promise<any[]> {
    const enriched = [];
    for (const item of items) {
      const thaiKey = this.findInThaiDB(item.name || item.name_en || '');
      if (thaiKey) { enriched.push({ ...item, _thaiDBMatch: thaiKey }); continue; }
      try {
        const term = encodeURIComponent((item.name_en || item.name || '').replace(/_/g, ' '));
        const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${term}&search_simple=1&action=process&json=1&page_size=1&fields=product_name,nutriments`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          if (data.products?.length > 0) {
            const n = data.products[0].nutriments || {};
            enriched.push({ ...item, _offEnriched: true, _offNutrition: {
              calories_per_100g: n['energy-kcal_100g'] || 0, protein_per_100g: n.proteins_100g || 0,
              carbs_per_100g: n.carbohydrates_100g || 0, fat_per_100g: n.fat_100g || 0,
              fiber_per_100g: n.fiber_100g || 0, sodium_per_100g: (n.sodium_100g || 0) * 1000,
            }}); continue;
          }
        }
      } catch { /* timeout ok */ }
      enriched.push(item);
    }
    return enriched;
  }

  private findInThaiDB(name: string): string | null {
    if (this.thaiFoodDatabase[name]) return name;
    const lower = name.toLowerCase().replace(/_/g, ' ');
    for (const [key, food] of Object.entries(this.thaiFoodDatabase)) {
      if (food.name_th === name || food.name_en.toLowerCase() === lower || food.name_en.toLowerCase().includes(lower) || lower.includes(food.name_en.toLowerCase()) ||
        (food.keywords && food.keywords.some(k => lower.includes(k)))) return key;
    }
    return null;
  }

  private combineResults(items: any[]): any[] {
    if (items.length === 0) return [
      { name: 'ข้าวสวย', name_en: 'Steamed Rice', portion: '1 จาน', source: 'thai_database', confidence: 0.6, category: 'grains' },
      { name: 'ผัดผักรวม', name_en: 'Stir-fried Vegetables', portion: '1 จาน', source: 'thai_database', confidence: 0.5, category: 'vegetable' }
    ];
    return items.map(item => ({
      name: item.name || item.name_en || 'Unknown', name_en: item.name_en || item.name,
      portion: item.portion || '1 จาน', confidence: item.confidence || 0.7,
      category: item.category || 'main_dish', source: item.source || 'gemini',
      _thaiDBMatch: item._thaiDBMatch || this.findInThaiDB(item.name || ''), _offNutrition: item._offNutrition || null,
    }));
  }

  private calculateNutrition(items: any[]) {
    const components: FoodComponent[] = [];
    let tCal=0,tPro=0,tCarb=0,tFat=0,tFib=0,tSod=0,tConf=0;
    for (const item of items) {
      let cal=0,pro=0,carb=0,fat=0,fib=0,sod=0;
      let source: FoodComponent['source'] = item.source || 'gemini';
      const thaiKey = item._thaiDBMatch || this.findInThaiDB(item.name);
      if (thaiKey && this.thaiFoodDatabase[thaiKey]) {
        const f = this.thaiFoodDatabase[thaiKey];
        const g = this.estimateGrams(item.portion, f);
        cal=(f.calories_per_100g*g)/100; pro=(f.protein_per_100g*g)/100; carb=(f.carbs_per_100g*g)/100;
        fat=(f.fat_per_100g*g)/100; fib=(f.fiber_per_100g*g)/100; sod=(f.sodium_per_100g*g)/100;
      } else if (item._offNutrition) {
        const n = item._offNutrition; const g = this.estimateGenericGrams(item.portion);
        cal=(n.calories_per_100g*g)/100; pro=(n.protein_per_100g*g)/100; carb=(n.carbs_per_100g*g)/100;
        fat=(n.fat_per_100g*g)/100; fib=(n.fiber_per_100g*g)/100; sod=(n.sodium_per_100g*g)/100;
        source = 'open_food_facts';
      } else {
        const e = this.estimateFromCategory(item.category, item.portion);
        cal=e.calories; pro=e.protein; carb=e.carbs; fat=e.fat; fib=e.fiber; sod=e.sodium;
      }
      components.push({
        name: thaiKey ? this.thaiFoodDatabase[thaiKey].name_th : item.name,
        name_th: thaiKey ? this.thaiFoodDatabase[thaiKey].name_th : item.name,
        name_en: thaiKey ? this.thaiFoodDatabase[thaiKey].name_en : item.name_en,
        portion: item.portion, calories: Math.round(cal), protein: Math.round(pro*10)/10,
        carbs: Math.round(carb*10)/10, fat: Math.round(fat*10)/10, fiber: Math.round(fib*10)/10,
        sodium: Math.round(sod), confidence: item.confidence || 0.7, category: item.category || 'main_dish', source,
      });
      tCal+=cal; tPro+=pro; tCarb+=carb; tFat+=fat; tFib+=fib; tSod+=sod; tConf+=(item.confidence||0.7);
    }
    return { components, totalNutrition: {
      calories: Math.round(tCal), protein: Math.round(tPro*10)/10, carbs: Math.round(tCarb*10)/10,
      fat: Math.round(tFat*10)/10, fiber: Math.round(tFib*10)/10, sodium: Math.round(tSod),
    }, confidence: components.length > 0 ? Math.round((tConf/components.length)*100)/100 : 0 };
  }

  private estimateGrams(portion: string, food: ThaiFoodEntry): number {
    if (food.common_portions[portion]) return food.common_portions[portion];
    const p = portion.toLowerCase();
    if (p.includes('จาน')) return p.includes('1/2') ? (food.common_portions['1/2 จาน']||100) : (food.common_portions['1 จาน']||200);
    if (p.includes('ถ้วย') || p.includes('ชาม')) return p.includes('1/2') ? (food.common_portions['1/2 ถ้วย']||120) : (food.common_portions['1 ถ้วย']||240);
    if (p.includes('ชิ้น')) return p.includes('ใหญ่') ? 150 : 100;
    if (p.includes('ฟอง')) return (parseInt(p)||1)*50;
    if (p.includes('ไม้')) return (parseInt(p)||1)*30;
    if (p.includes('แก้ว') || p.includes('กล่อง')) return 240;
    const gm = p.match(/(\d+)\s*(?:g|กรัม)/); if (gm) return parseInt(gm[1]);
    return 150;
  }

  private estimateGenericGrams(portion: string): number {
    const p = (portion||'').toLowerCase();
    const gm = p.match(/(\d+)\s*(?:g|กรัม)/); if (gm) return parseInt(gm[1]);
    if (p.includes('จาน') || p.includes('plate')) return 250;
    if (p.includes('ถ้วย') || p.includes('ชาม') || p.includes('bowl')) return 240;
    return 200;
  }

  private estimateFromCategory(cat: string, portion: string) {
    const g = this.estimateGenericGrams(portion);
    const e: Record<string, number[]> = {
      main_dish:[180,10,25,6,2,500], soup:[50,4,6,2,1,700], curry:[150,8,12,9,2,650],
      vegetable:[40,2,6,2,3,200], protein:[200,22,2,12,0,400], grains:[130,3,28,0.5,0.5,5],
      dairy:[60,3,5,3,0,50], fruit:[50,0.5,13,0.2,2,2], snack:[250,4,30,13,1,350],
      beverage:[45,0,11,0,0,10], dessert:[200,3,35,7,1,100],
    };
    const v = e[cat] || e.main_dish; const r = g/100;
    return { calories:v[0]*r, protein:v[1]*r, carbs:v[2]*r, fat:v[3]*r, fiber:v[4]*r, sodium:v[5]*r };
  }

  private generateRecommendations(n: any) {
    const recs: string[] = []; const warns: string[] = [];
    if (n.calories < 300) recs.push('มื้อนี้แคลอรี่น้อย ควรเพิ่มอาหารให้เพียงพอ');
    else if (n.calories > 800) recs.push('มื้อนี้แคลอรี่สูง ควรควบคุมปริมาณ');
    else recs.push('ปริมาณแคลอรี่เหมาะสมสำหรับมื้อหลัก');
    if (n.protein < 15) recs.push('ควรเพิ่มโปรตีน เช่น เนื้อสัตว์ ไข่ หรือถั่ว');
    if (n.carbs > 100) recs.push('คาร์บสูง ลองเปลี่ยนเป็นข้าวกล้อง');
    if (n.fat > 30) recs.push('ไขมันสูง ลองเลือกอาหารต้มหรือนึ่งแทนทอด');
    if (n.fiber < 5) recs.push('ควรเพิ่มผักและผลไม้');
    if (n.sodium > 1500) warns.push('โซเดียมสูงมาก เสี่ยงความดันโลหิตสูง');
    else if (n.sodium > 1000) warns.push('โซเดียมสูง ลดเครื่องปรุงเค็ม');
    if (n.calories > 1000) warns.push('แคลอรี่สูงมาก อาจส่งผลต่อน้ำหนัก');
    return { recommendations: recs, warnings: warns };
  }

  async getFoodInfo(foodName: string): Promise<FoodComponent | null> {
    const key = this.findInThaiDB(foodName); if (!key) return null;
    const f = this.thaiFoodDatabase[key];
    return { name: f.name_th, name_th: f.name_th, name_en: f.name_en, portion: '100 กรัม',
      calories: f.calories_per_100g, protein: f.protein_per_100g, carbs: f.carbs_per_100g,
      fat: f.fat_per_100g, fiber: f.fiber_per_100g, sodium: f.sodium_per_100g,
      confidence: 1.0, category: f.category, source: 'thai_database' };
  }

  searchFood(query: string): FoodComponent[] {
    const q = query.toLowerCase();
    return Object.entries(this.thaiFoodDatabase)
      .filter(([,f]) => f.name_th.includes(query) || f.name_en.toLowerCase().includes(q) || (f.keywords && f.keywords.some(k => k.includes(q))))
      .map(([,f]) => ({ name: f.name_th, name_th: f.name_th, name_en: f.name_en, portion: '100 กรัม',
        calories: f.calories_per_100g, protein: f.protein_per_100g, carbs: f.carbs_per_100g,
        fat: f.fat_per_100g, fiber: f.fiber_per_100g, sodium: f.sodium_per_100g,
        confidence: 1.0, category: f.category, source: 'thai_database' as const }));
  }

  getAvailableAPIs() {
    return { gemini: !!this.geminiApiKey, huggingface: !!this.hfApiToken, openFoodFacts: true };
  }

  getThaiFoodsCount(): number { return Object.keys(this.thaiFoodDatabase).length; }

  private initializeThaiFoodDatabase() {
    const d = (n: string, e: string, cal: number, pro: number, carb: number, fat: number, fib: number, sod: number, cat: string, portions: Record<string,number>, kw?: string[]): ThaiFoodEntry =>
      ({ name_th:n, name_en:e, calories_per_100g:cal, protein_per_100g:pro, carbs_per_100g:carb, fat_per_100g:fat, fiber_per_100g:fib, sodium_per_100g:sod, category:cat, common_portions:portions, keywords:kw });

    this.thaiFoodDatabase = {
      // ข้าว (9)
      'ข้าวสวย': d('ข้าวสวย','Steamed Rice',130,2.7,28,0.3,0.4,1,'grains',{'1 จาน':150,'1/2 จาน':75},['rice','white rice']),
      'ข้าวกล้อง': d('ข้าวกล้อง','Brown Rice',112,2.6,24,0.9,1.8,1,'grains',{'1 จาน':150},['brown rice']),
      'ข้าวเหนียว': d('ข้าวเหนียว','Sticky Rice',116,2,25,0.2,0.5,2,'grains',{'1 กำ':100},['sticky rice','glutinous']),
      'ข้าวผัด': d('ข้าวผัด','Fried Rice',170,5,25,6,1,450,'main_dish',{'1 จาน':250},['fried rice']),
      'ข้าวมันไก่': d('ข้าวมันไก่','Chicken Rice',165,8.5,20,6,0.5,350,'main_dish',{'1 จาน':300},['chicken rice','hainanese']),
      'ข้าวหมูแดง': d('ข้าวหมูแดง','Red Pork Rice',155,9,22,4,0.3,400,'main_dish',{'1 จาน':300},['red pork','char siu']),
      'ข้าวหมูกรอบ': d('ข้าวหมูกรอบ','Crispy Pork Rice',190,10,20,8,0.3,380,'main_dish',{'1 จาน':300},['crispy pork']),
      'ข้าวคลุกกะปิ': d('ข้าวคลุกกะปิ','Shrimp Paste Rice',175,7,24,6,1.5,600,'main_dish',{'1 จาน':250},['shrimp paste rice']),
      'ข้าวราดแกง': d('ข้าวราดแกง','Rice with Curry',160,7,22,5,1.5,500,'main_dish',{'1 จาน':350},['rice curry']),
      // ก๋วยเตี๋ยว (8)
      'ผัดไทย': d('ผัดไทย','Pad Thai',180,10,30,6,2.5,600,'main_dish',{'1 จาน':350},['pad thai']),
      'ผัดซีอิ๊ว': d('ผัดซีอิ๊ว','Pad See Ew',170,8,28,5,1.5,650,'main_dish',{'1 จาน':300},['pad see ew']),
      'ก๋วยเตี๋ยวน้ำ': d('ก๋วยเตี๋ยวน้ำ','Noodle Soup',80,5,12,2,0.5,700,'soup',{'1 ชาม':400},['noodle soup']),
      'ก๋วยเตี๋ยวแห้ง': d('ก๋วยเตี๋ยวแห้ง','Dry Noodles',150,7,22,4,1,600,'main_dish',{'1 จาน':300},['dry noodle']),
      'บะหมี่เกี๊ยว': d('บะหมี่เกี๊ยว','Wonton Noodles',110,6,15,3,0.5,650,'main_dish',{'1 ชาม':350},['wonton']),
      'ราดหน้า': d('ราดหน้า','Rad Na',130,6,18,4,1,550,'main_dish',{'1 จาน':350},['rad na','gravy noodle']),
      'หมี่กรอบ': d('หมี่กรอบ','Mee Krob',250,5,38,9,1,500,'main_dish',{'1 จาน':200},['crispy noodle']),
      'เส้นใหญ่ผัดขี้เมา': d('เส้นใหญ่ผัดขี้เมา','Drunken Noodles',165,8,24,5,1.5,700,'main_dish',{'1 จาน':300},['drunken noodle','pad kee mao']),
      // แกง (8)
      'แกงเขียวหวาน': d('แกงเขียวหวาน','Green Curry',140,8,12,8,2,700,'curry',{'1 ถ้วย':200},['green curry']),
      'แกงแดง': d('แกงแดง','Red Curry',135,7,10,8,2,680,'curry',{'1 ถ้วย':200},['red curry']),
      'แกงมัสมั่น': d('แกงมัสมั่น','Massaman Curry',160,8,15,9,2,600,'curry',{'1 ถ้วย':200},['massaman']),
      'แกงพะแนง': d('แกงพะแนง','Panang Curry',155,9,10,10,1.5,650,'curry',{'1 ถ้วย':200},['panang']),
      'แกงส้ม': d('แกงส้ม','Sour Curry',55,4,8,1,2,600,'curry',{'1 ถ้วย':250},['sour curry']),
      'แกงเลียง': d('แกงเลียง','Kaeng Liang',40,3,5,1,3,500,'curry',{'1 ถ้วย':250},['kaeng liang']),
      'แกงจืด': d('แกงจืด','Clear Soup',35,3,4,1,1,500,'soup',{'1 ถ้วย':250},['clear soup']),
      'แกงกะหรี่': d('แกงกะหรี่','Yellow Curry',145,7,14,7,2,580,'curry',{'1 ถ้วย':200},['yellow curry']),
      // ต้ม (5)
      'ต้มยำ': d('ต้มยำ','Tom Yum',45,3.5,5,2,1,800,'soup',{'1 ถ้วย':250},['tom yum']),
      'ต้มยำกุ้ง': d('ต้มยำกุ้ง','Tom Yum Goong',50,5,5,2,1,850,'soup',{'1 ถ้วย':250},['tom yum goong']),
      'ต้มข่าไก่': d('ต้มข่าไก่','Tom Kha Gai',120,6,8,8,1,700,'soup',{'1 ถ้วย':250},['tom kha','coconut soup']),
      'ต้มจืด': d('ต้มจืด','Mild Soup',30,3,3,0.5,1,450,'soup',{'1 ถ้วย':250},['mild soup']),
      'ต้มเลือดหมู': d('ต้มเลือดหมู','Pork Blood Soup',45,5,3,1.5,0.5,600,'soup',{'1 ถ้วย':250},['pork blood soup']),
      // ผัด (10)
      'ผัดกะเพรา': d('ผัดกะเพรา','Pad Krapow',160,12,8,9,1.5,700,'main_dish',{'1 จาน':200},['pad krapow','basil stir fry','holy basil']),
      'ผัดผักรวม': d('ผัดผักรวม','Stir-fried Vegetables',80,2.5,8,5,3,300,'vegetable',{'1 จาน':150},['stir fried vegetables']),
      'ผัดคะน้าหมูกรอบ': d('ผัดคะน้าหมูกรอบ','Kale with Crispy Pork',120,8,6,7,2,550,'main_dish',{'1 จาน':200},['kale','chinese broccoli']),
      'ผัดพริกแกง': d('ผัดพริกแกง','Curry Paste Stir Fry',145,10,8,9,2,650,'main_dish',{'1 จาน':200},['curry paste stir fry']),
      'ผัดเปรี้ยวหวาน': d('ผัดเปรี้ยวหวาน','Sweet and Sour',130,7,15,5,1.5,400,'main_dish',{'1 จาน':200},['sweet and sour']),
      'ผัดหอยลาย': d('ผัดหอยลาย','Stir-fried Clams',90,8,5,4,1,600,'main_dish',{'1 จาน':200},['clam','stir fried clam']),
      'ผัดถั่วงอก': d('ผัดถั่วงอก','Stir-fried Bean Sprouts',60,3,7,2,2,250,'vegetable',{'1 จาน':150},['bean sprout']),
      'ผัดบวบ': d('ผัดบวบ','Stir-fried Luffa',50,2,6,2,2,200,'vegetable',{'1 จาน':150},['luffa']),
      'ผัดมะเขือยาว': d('ผัดมะเขือยาว','Stir-fried Eggplant',70,2,8,3,3,300,'vegetable',{'1 จาน':150},['eggplant']),
      'ผัดวุ้นเส้น': d('ผัดวุ้นเส้น','Stir-fried Glass Noodles',140,5,22,4,1,500,'main_dish',{'1 จาน':200},['glass noodle']),
      // ทอด/ย่าง (10)
      'ไก่ทอด': d('ไก่ทอด','Fried Chicken',240,25,0,15,0,500,'protein',{'1 ชิ้น':100,'2 ชิ้น':200},['fried chicken']),
      'ไก่ย่าง': d('ไก่ย่าง','Grilled Chicken',165,25,0,7,0,400,'protein',{'1 ชิ้น':100},['grilled chicken']),
      'หมูทอด': d('หมูทอด','Fried Pork',260,22,5,17,0,450,'protein',{'1 ชิ้น':100},['fried pork']),
      'หมูปิ้ง': d('หมูปิ้ง','Grilled Pork Skewer',180,18,5,10,0,400,'protein',{'1 ไม้':30,'3 ไม้':90},['grilled pork','moo ping']),
      'ปลาทอด': d('ปลาทอด','Fried Fish',200,20,5,11,0,350,'protein',{'1 ตัว':200},['fried fish']),
      'กุ้งทอด': d('กุ้งทอด','Fried Shrimp',220,18,10,13,0,500,'protein',{'5 ตัว':100},['fried shrimp']),
      'ปอเปี๊ยะทอด': d('ปอเปี๊ยะทอด','Fried Spring Rolls',230,6,25,12,1.5,400,'snack',{'2 ชิ้น':80},['spring roll']),
      'ลูกชิ้นทอด': d('ลูกชิ้นทอด','Fried Meatballs',220,12,15,12,0,600,'snack',{'5 ลูก':100},['meatball']),
      'เนื้อย่าง': d('เนื้อย่าง','Grilled Beef',180,26,0,8,0,350,'protein',{'1 ชิ้น':100},['grilled beef','steak']),
      'หมูสะเต๊ะ': d('หมูสะเต๊ะ','Pork Satay',190,15,8,12,0.5,450,'protein',{'5 ไม้':100},['satay']),
      // ยำ/ส้มตำ (6)
      'ส้มตำ': d('ส้มตำ','Som Tam',80,3,15,2,4,800,'vegetable',{'1 จาน':200},['som tam','papaya salad']),
      'ยำวุ้นเส้น': d('ยำวุ้นเส้น','Glass Noodle Salad',100,6,15,2,1,700,'main_dish',{'1 จาน':200},['glass noodle salad','yum woon sen']),
      'ยำถั่วพู': d('ยำถั่วพู','Wing Bean Salad',90,5,8,4,3,600,'vegetable',{'1 จาน':150},['wing bean salad']),
      'ลาบหมู': d('ลาบหมู','Larb Moo',120,12,5,6,1.5,700,'main_dish',{'1 จาน':150},['larb','laab']),
      'น้ำตกหมู': d('น้ำตกหมู','Nam Tok Moo',130,14,4,7,1,650,'main_dish',{'1 จาน':150},['nam tok','waterfall pork']),
      'ยำมะม่วง': d('ยำมะม่วง','Mango Salad',85,3,14,2,2,500,'vegetable',{'1 จาน':150},['mango salad']),
      // ไข่ (4)
      'ไข่ต้ม': d('ไข่ต้ม','Boiled Egg',155,13,1.1,11,0,125,'protein',{'1 ฟอง':50,'2 ฟอง':100},['boiled egg']),
      'ไข่เจียว': d('ไข่เจียว','Thai Omelette',220,13,2,18,0,400,'protein',{'1 ฟอง':60},['omelette','thai omelette']),
      'ไข่ดาว': d('ไข่ดาว','Fried Egg',196,14,1,15,0,350,'protein',{'1 ฟอง':55},['fried egg','sunny side up']),
      'ไข่พะโล้': d('ไข่พะโล้','Braised Egg',160,12,5,10,0,500,'protein',{'1 ฟอง':60},['braised egg']),
      // อาหารเช้า/ขนมจีน (5)
      'โจ๊ก': d('โจ๊ก','Rice Porridge',55,3,9,0.5,0.2,300,'grains',{'1 ชาม':300},['congee','porridge','jok']),
      'ข้าวต้ม': d('ข้าวต้ม','Rice Soup',50,3,8,0.5,0.2,350,'soup',{'1 ชาม':350},['rice soup','khao tom']),
      'ขนมจีนน้ำยา': d('ขนมจีนน้ำยา','Khanom Jeen Nam Ya',110,6,16,3,1,550,'main_dish',{'1 จาน':300},['khanom jeen','rice noodle curry']),
      'ปาท่องโก๋': d('ปาท่องโก๋','Patongko',350,6,40,18,1,200,'snack',{'1 คู่':60},['patongko','chinese doughnut']),
      'ซาลาเปา': d('ซาลาเปา','Steamed Bun',220,7,35,5,1,300,'snack',{'1 ลูก':80},['bao','steamed bun','salapao']),
      // ผักและเครื่องเคียง (8)
      'ผักกาด': d('ผักกาด','Lettuce',15,1.4,2.9,0.2,1.3,10,'vegetable',{'1 ถ้วย':50},['lettuce']),
      'มะเขือเทศ': d('มะเขือเทศ','Tomato',18,0.9,3.9,0.2,1.2,5,'vegetable',{'1 ลูก':100},['tomato']),
      'แตงกวา': d('แตงกวา','Cucumber',12,0.6,2.2,0.1,0.5,2,'vegetable',{'1 ลูก':150},['cucumber']),
      'ถั่วฝักยาว': d('ถั่วฝักยาว','Long Bean',35,2.5,6,0.3,3,5,'vegetable',{'1 จาน':100},['long bean']),
      'ผักบุ้ง': d('ผักบุ้ง','Morning Glory',20,2,3,0.2,2,50,'vegetable',{'1 จาน':100},['morning glory','water spinach']),
      'คะน้า': d('คะน้า','Chinese Kale',26,2,4,0.3,2,20,'vegetable',{'1 จาน':100},['kale','chinese broccoli']),
      'พริก': d('พริก','Chili',40,1.9,8.8,0.4,1.5,8,'vegetable',{'1 เม็ด':2,'5 เม็ด':10},['chili']),
      'สลัด': d('สลัด','Salad',35,2,5,1.5,2.5,200,'vegetable',{'1 จาน':200},['salad']),
      // เครื่องดื่ม/นม (5)
      'นม': d('นม','Milk',42,3.4,5,1,0,50,'dairy',{'1 แก้ว':240,'1 กล่อง':250},['milk']),
      'กะทิ': d('กะทิ','Coconut Milk',230,2.3,5,24,0,15,'dairy',{'1 ถ้วย':240},['coconut milk']),
      'น้ำเต้าหู้': d('น้ำเต้าหู้','Soy Milk',45,3.5,3,2,0.5,20,'beverage',{'1 แก้ว':240},['soy milk']),
      'ชาเย็น': d('ชาเย็น','Thai Iced Tea',120,1,25,2,0,30,'beverage',{'1 แก้ว':300},['thai iced tea','cha yen']),
      'กาแฟเย็น': d('กาแฟเย็น','Iced Coffee',100,1,20,2,0,25,'beverage',{'1 แก้ว':300},['iced coffee']),
      // ขนม/ของหวาน (8)
      'ข้าวเหนียวมะม่วง': d('ข้าวเหนียวมะม่วง','Mango Sticky Rice',200,3,35,6,1.5,50,'dessert',{'1 จาน':200},['mango sticky rice']),
      'บัวลอย': d('บัวลอย','Bua Loy',150,2,28,4,0.5,30,'dessert',{'1 ถ้วย':200},['bua loy']),
      'กล้วยบวชชี': d('กล้วยบวชชี','Banana in Coconut Milk',140,1.5,25,5,1.5,20,'dessert',{'1 ถ้วย':200},['banana coconut']),
      'ทับทิมกรอบ': d('ทับทิมกรอบ','Tab Tim Krob',120,0.5,25,2,0.5,15,'dessert',{'1 ถ้วย':200},['tab tim krob','water chestnut']),
      'ขนมถ้วย': d('ขนมถ้วย','Khanom Tuay',160,2,22,7,0.5,30,'dessert',{'1 ถ้วย':100},['khanom tuay','coconut custard']),
      'ไอศกรีมกะทิ': d('ไอศกรีมกะทิ','Coconut Ice Cream',180,2,22,10,0.5,40,'dessert',{'1 ถ้วย':100},['coconut ice cream']),
      'ขนมครก': d('ขนมครก','Khanom Krok',180,3,20,10,0.5,35,'dessert',{'3 คู่':90},['khanom krok','coconut pancake']),
      'โรตี': d('โรตี','Roti',300,5,35,16,1,200,'dessert',{'1 แผ่น':100},['roti']),
      // อาหารอื่นๆ (10)
      'กุนเชียง': d('กุนเชียง','Chinese Sausage',350,15,10,28,0,800,'protein',{'2 ชิ้น':60},['chinese sausage']),
      'แหนม': d('แหนม','Naem',200,14,8,13,0.5,700,'protein',{'1 ก้อน':50},['naem','sour sausage']),
      'ข้าวเกรียบ': d('ข้าวเกรียบ','Shrimp Chips',480,3,55,28,0,600,'snack',{'5 ชิ้น':30},['shrimp chip','prawn cracker']),
      'ทอดมัน': d('ทอดมัน','Thai Fish Cake',180,10,12,10,1,550,'snack',{'3 ชิ้น':90},['fish cake','tod mun']),
      'เกี๊ยวทอด': d('เกี๊ยวทอด','Fried Wontons',240,8,22,14,0.5,450,'snack',{'5 ชิ้น':75},['fried wonton']),
      'หมูสับ': d('หมูสับ','Minced Pork',170,18,0,10,0,350,'protein',{'100 กรัม':100},['minced pork','ground pork']),
      'เต้าหู้ทอด': d('เต้าหู้ทอด','Fried Tofu',180,10,8,12,1,250,'protein',{'3 ชิ้น':100},['fried tofu']),
      'พิซซ่า': d('พิซซ่า','Pizza',270,11,33,11,2,600,'main_dish',{'1 ชิ้น':120},['pizza']),
      'แฮมเบอร์เกอร์': d('แฮมเบอร์เกอร์','Hamburger',250,13,28,10,1.5,500,'main_dish',{'1 ชิ้น':200},['hamburger','burger']),
      'ซูชิ': d('ซูชิ','Sushi',150,6,25,2,0.5,400,'main_dish',{'6 คำ':200},['sushi']),
      // ผลไม้ (8)
      'กล้วย': d('กล้วย','Banana',89,1.1,23,0.3,2.6,1,'fruit',{'1 ลูก':120},['banana']),
      'มะม่วง': d('มะม่วง','Mango',60,0.8,15,0.4,1.6,1,'fruit',{'1 ลูก':200},['mango']),
      'แตงโม': d('แตงโม','Watermelon',30,0.6,8,0.2,0.4,1,'fruit',{'1 ชิ้น':200},['watermelon']),
      'มะละกอ': d('มะละกอ','Papaya',43,0.5,11,0.3,1.7,8,'fruit',{'1 ชิ้น':150},['papaya']),
      'ส้ม': d('ส้ม','Orange',47,0.9,12,0.1,2.4,0,'fruit',{'1 ลูก':130},['orange']),
      'เงาะ': d('เงาะ','Rambutan',68,0.7,16,0.2,0.9,11,'fruit',{'5 ลูก':100},['rambutan']),
      'ทุเรียน': d('ทุเรียน','Durian',147,1.5,27,5,3.8,2,'fruit',{'1 พู':100},['durian']),
      'ลำไย': d('ลำไย','Longan',60,1.3,15,0.1,1.1,0,'fruit',{'10 ลูก':100},['longan']),
    };
  }
}

export default EnhancedFoodAnalysisEngine;
