/**
 * Environment-Aware Advisor
 * Provides personalized skincare advice based on weather, UV, and air quality
 * Daily touchpoint feature for continuous engagement
 */

interface EnvironmentData {
  location: string;
  temperature: number; // Celsius
  humidity: number; // Percentage
  uvIndex: number; // 0-11+
  airQuality: {
    aqi: number; // Air Quality Index
    pm25: number;
    pollutant: string;
  };
  weather: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  season: 'summer' | 'rainy' | 'winter';
}

interface DailyAdvice {
  advisoryId: string;
  timestamp: string;
  environment: EnvironmentData;
  alerts: Alert[];
  morningRoutine: RoutineStep[];
  eveningRoutine: RoutineStep[];
  productRecommendations: ProductTip[];
  lifestyleTips: string[];
  weekForecast: DayForecast[];
}

interface Alert {
  type: 'uv' | 'pollution' | 'humidity' | 'temperature';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  icon: string;
  title: string;
  titleThai: string;
  message: string;
  messageThai: string;
  action: string;
}

interface RoutineStep {
  order: number;
  step: string;
  stepThai: string;
  product: string;
  importance: 'essential' | 'recommended' | 'optional';
  note?: string;
}

interface ProductTip {
  category: string;
  recommendation: string;
  reason: string;
}

interface DayForecast {
  day: string;
  weather: string;
  uvIndex: number;
  skinTip: string;
}

class EnvironmentAdvisor {
  
  /**
   * Get daily skincare advice based on environment
   */
  static getDailyAdvice(
    location: string = 'Bangkok',
    skinType: string = 'combination',
    concerns: string[] = []
  ): DailyAdvice {
    // Simulated environment data (in production, fetch from weather API)
    const environment = this.getEnvironmentData(location);
    
    const alerts = this.generateAlerts(environment);
    const morningRoutine = this.generateMorningRoutine(environment, skinType, concerns);
    const eveningRoutine = this.generateEveningRoutine(environment, skinType, concerns);
    const productRecommendations = this.getProductRecommendations(environment, skinType);
    const lifestyleTips = this.getLifestyleTips(environment);
    const weekForecast = this.getWeekForecast(location);

    return {
      advisoryId: `ENV-${Date.now()}`,
      timestamp: new Date().toISOString(),
      environment,
      alerts,
      morningRoutine,
      eveningRoutine,
      productRecommendations,
      lifestyleTips,
      weekForecast,
    };
  }

  /**
   * Get environment data (simulated - would use real API in production)
   */
  private static getEnvironmentData(location: string): EnvironmentData {
    // Simulated Bangkok weather
    const hour = new Date().getHours();
    const isAfternoon = hour >= 10 && hour <= 16;
    
    return {
      location,
      temperature: isAfternoon ? 34 : 28,
      humidity: 75,
      uvIndex: isAfternoon ? 11 : 3,
      airQuality: {
        aqi: 85,
        pm25: 45,
        pollutant: 'PM2.5',
      },
      weather: 'sunny',
      season: 'summer',
    };
  }

  /**
   * Generate alerts based on environment
   */
  private static generateAlerts(env: EnvironmentData): Alert[] {
    const alerts: Alert[] = [];

    // UV Alert
    if (env.uvIndex >= 8) {
      alerts.push({
        type: 'uv',
        severity: env.uvIndex >= 11 ? 'extreme' : 'high',
        icon: '☀️',
        title: 'Extreme UV',
        titleThai: 'แสง UV สูงมาก',
        message: `UV Index: ${env.uvIndex} - Reapply sunscreen every 2 hours`,
        messageThai: `ค่า UV: ${env.uvIndex} - ทาครีมกันแดดซ้ำทุก 2 ชม.`,
        action: 'ใช้ SPF50+ PA++++ และสวมหมวก/ร่ม',
      });
    } else if (env.uvIndex >= 6) {
      alerts.push({
        type: 'uv',
        severity: 'medium',
        icon: '🌤️',
        title: 'High UV',
        titleThai: 'แสง UV สูง',
        message: `UV Index: ${env.uvIndex} - Sun protection needed`,
        messageThai: `ค่า UV: ${env.uvIndex} - ต้องป้องกันแสงแดด`,
        action: 'ใช้ SPF30+ และหลีกเลี่ยงแดดจัดช่วง 10.00-16.00',
      });
    }

    // Pollution Alert
    if (env.airQuality.pm25 >= 50) {
      alerts.push({
        type: 'pollution',
        severity: env.airQuality.pm25 >= 100 ? 'extreme' : env.airQuality.pm25 >= 75 ? 'high' : 'medium',
        icon: '💨',
        title: 'Air Pollution',
        titleThai: 'มลพิษทางอากาศ',
        message: `PM2.5: ${env.airQuality.pm25} µg/m³ - Double cleanse tonight`,
        messageThai: `PM2.5: ${env.airQuality.pm25} µg/m³ - ล้างหน้า 2 ขั้นตอนคืนนี้`,
        action: 'ใช้ Cleansing Oil/Balm ก่อนล้างหน้าปกติ',
      });
    }

    // Humidity Alert
    if (env.humidity >= 80) {
      alerts.push({
        type: 'humidity',
        severity: 'medium',
        icon: '💧',
        title: 'High Humidity',
        titleThai: 'ความชื้นสูง',
        message: `Humidity: ${env.humidity}% - Use lighter products`,
        messageThai: `ความชื้น: ${env.humidity}% - ใช้ผลิตภัณฑ์เบาบาง`,
        action: 'เลือก Gel หรือ Water-based moisturizer',
      });
    } else if (env.humidity <= 40) {
      alerts.push({
        type: 'humidity',
        severity: 'medium',
        icon: '🏜️',
        title: 'Low Humidity',
        titleThai: 'ความชื้นต่ำ',
        message: `Humidity: ${env.humidity}% - Extra hydration needed`,
        messageThai: `ความชื้น: ${env.humidity}% - ต้องเพิ่มความชุ่มชื้น`,
        action: 'ใช้ Hyaluronic Acid และ Facial Mist',
      });
    }

    // Temperature Alert
    if (env.temperature >= 35) {
      alerts.push({
        type: 'temperature',
        severity: 'high',
        icon: '🌡️',
        title: 'High Temperature',
        titleThai: 'อากาศร้อนจัด',
        message: `${env.temperature}°C - Keep skin cool and hydrated`,
        messageThai: `${env.temperature}°C - รักษาความเย็นและชุ่มชื้นของผิว`,
        action: 'พกสเปรย์ฉีดหน้า ดื่มน้ำมากๆ',
      });
    }

    return alerts;
  }

  /**
   * Generate morning routine based on environment
   */
  private static generateMorningRoutine(
    env: EnvironmentData,
    skinType: string,
    concerns: string[]
  ): RoutineStep[] {
    const routine: RoutineStep[] = [
      {
        order: 1,
        step: 'Cleanser',
        stepThai: 'ล้างหน้า',
        product: skinType === 'oily' ? 'Gel Cleanser' : 'Gentle Cleanser',
        importance: 'essential',
      },
      {
        order: 2,
        step: 'Toner',
        stepThai: 'โทนเนอร์',
        product: env.humidity >= 70 ? 'Hydrating Toner (เบาบาง)' : 'Hydrating Toner',
        importance: 'recommended',
      },
      {
        order: 3,
        step: 'Serum',
        stepThai: 'เซรั่ม',
        product: 'Vitamin C Serum',
        importance: 'recommended',
        note: 'ต้านอนุมูลอิสระจากมลพิษ',
      },
      {
        order: 4,
        step: 'Moisturizer',
        stepThai: 'มอยส์เจอไรเซอร์',
        product: env.humidity >= 70 ? 'Gel Moisturizer' : 'Cream Moisturizer',
        importance: 'essential',
      },
      {
        order: 5,
        step: 'Sunscreen',
        stepThai: 'ครีมกันแดด',
        product: env.uvIndex >= 8 ? 'SPF50+ PA++++' : 'SPF30+ PA+++',
        importance: 'essential',
        note: env.uvIndex >= 8 ? '⚠️ ทาซ้ำทุก 2 ชม.' : undefined,
      },
    ];

    return routine;
  }

  /**
   * Generate evening routine based on environment
   */
  private static generateEveningRoutine(
    env: EnvironmentData,
    skinType: string,
    concerns: string[]
  ): RoutineStep[] {
    const routine: RoutineStep[] = [];

    // Double cleanse if pollution is high
    if (env.airQuality.pm25 >= 35) {
      routine.push({
        order: 1,
        step: 'Oil Cleanser',
        stepThai: 'ออยล์ล้างหน้า',
        product: 'Cleansing Oil/Balm',
        importance: 'essential',
        note: 'ล้างมลพิษและครีมกันแดด',
      });
    }

    routine.push(
      {
        order: routine.length + 1,
        step: 'Cleanser',
        stepThai: 'โฟมล้างหน้า',
        product: skinType === 'oily' ? 'Gel Cleanser' : 'Gentle Cleanser',
        importance: 'essential',
      },
      {
        order: routine.length + 2,
        step: 'Toner',
        stepThai: 'โทนเนอร์',
        product: 'Hydrating Toner',
        importance: 'recommended',
      },
      {
        order: routine.length + 3,
        step: 'Treatment',
        stepThai: 'ทรีทเมนต์',
        product: concerns.includes('สิว') ? 'Salicylic Acid' : 'Retinol 0.5%',
        importance: 'recommended',
        note: 'ใช้ 2-3 ครั้ง/สัปดาห์',
      },
      {
        order: routine.length + 4,
        step: 'Moisturizer',
        stepThai: 'มอยส์เจอไรเซอร์',
        product: env.humidity <= 50 ? 'Rich Cream' : 'Light Moisturizer',
        importance: 'essential',
      }
    );

    return routine;
  }

  /**
   * Get product recommendations based on environment
   */
  private static getProductRecommendations(env: EnvironmentData, skinType: string): ProductTip[] {
    const tips: ProductTip[] = [];

    if (env.uvIndex >= 8) {
      tips.push({
        category: 'Sunscreen',
        recommendation: 'Physical/Mineral Sunscreen SPF50+ PA++++',
        reason: `UV Index ${env.uvIndex} - ต้องใช้ค่าสูงสุด`,
      });
    }

    if (env.airQuality.pm25 >= 35) {
      tips.push({
        category: 'Cleanser',
        recommendation: 'Cleansing Oil + Gentle Foam',
        reason: `PM2.5 ${env.airQuality.pm25} - ต้อง Double Cleanse`,
      });
      tips.push({
        category: 'Serum',
        recommendation: 'Antioxidant Serum (Vitamin C/E)',
        reason: 'ปกป้องผิวจากมลพิษ',
      });
    }

    if (env.humidity >= 70 && skinType === 'oily') {
      tips.push({
        category: 'Moisturizer',
        recommendation: 'Oil-free Gel Moisturizer',
        reason: `ความชื้น ${env.humidity}% + ผิวมัน`,
      });
    }

    return tips;
  }

  /**
   * Get lifestyle tips
   */
  private static getLifestyleTips(env: EnvironmentData): string[] {
    const tips: string[] = [];

    tips.push(`💧 ดื่มน้ำอย่างน้อย ${env.temperature >= 32 ? '3' : '2'} ลิตร/วัน`);
    
    if (env.uvIndex >= 6) {
      tips.push('🧢 สวมหมวกและแว่นกันแดดเมื่อออกแดด');
      tips.push('⏰ หลีกเลี่ยงออกแดดช่วง 10.00-16.00 น.');
    }

    if (env.airQuality.pm25 >= 50) {
      tips.push('😷 สวมหน้ากากอนามัยเมื่อออกนอกบ้าน');
      tips.push('🏠 ใช้เครื่องฟอกอากาศในห้อง');
    }

    tips.push('😴 นอนหลับให้เพียงพอ 7-8 ชม./คืน');
    tips.push('🥗 ทานผักผลไม้ที่มี Antioxidants');

    return tips.slice(0, 5);
  }

  /**
   * Get week forecast
   */
  private static getWeekForecast(location: string): DayForecast[] {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date().getDay();
    
    return days.slice(0, 5).map((day, i) => {
      const uvIndex = Math.floor(Math.random() * 5) + 7; // 7-11
      const weathers = ['☀️', '⛅', '🌧️', '☁️'];
      const weather = weathers[Math.floor(Math.random() * weathers.length)];
      
      return {
        day,
        weather,
        uvIndex,
        skinTip: uvIndex >= 9 ? 'ทาซ้ำทุก 2 ชม.' : uvIndex >= 6 ? 'ใช้ SPF30+' : 'ป้องกันปกติ',
      };
    });
  }

  /**
   * Get sample result
   */
  static getSampleResult(): DailyAdvice {
    return this.getDailyAdvice('Bangkok', 'combination', ['ฝ้า', 'รูขุมขน']);
  }
}

export { EnvironmentAdvisor };
export type { DailyAdvice, EnvironmentData, Alert };
