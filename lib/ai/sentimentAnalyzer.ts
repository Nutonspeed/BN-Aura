import { callGemini } from '@/lib/ai';
import { ConversationMessage } from '@/lib/conversations/conversationManager';

export interface SentimentAnalysis {
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0-1
  satisfaction_score: number; // 0-10
  key_concerns: string[];
  positive_signals: string[];
  improvement_suggestions: string[];
  emotional_tone: 'excited' | 'curious' | 'hesitant' | 'frustrated' | 'satisfied' | 'neutral';
}

/**
 * Analyze customer sentiment from conversation messages
 * Uses AI to detect emotions, concerns, and satisfaction levels
 */
export async function analyzeConversationSentiment(
  messages: ConversationMessage[],
  clinicId: string
): Promise<SentimentAnalysis> {
  if (!messages || messages.length === 0) {
    return {
      overall_sentiment: 'neutral',
      confidence: 0,
      satisfaction_score: 5,
      key_concerns: [],
      positive_signals: [],
      improvement_suggestions: [],
      emotional_tone: 'neutral'
    };
  }

  // Format conversation for analysis
  const conversationText = messages
    .map(m => `[${m.role}]: ${m.content}`)
    .join('\n');

  const prompt = `วิเคราะห์อารมณ์และความพึงพอใจของลูกค้าจากการสนทนาต่อไปนี้:

${conversationText}

วิเคราะห์และตอบกลับในรูปแบบ JSON (ใช้ภาษาไทยสำหรับ array values):
{
  "overall_sentiment": "positive/neutral/negative",
  "confidence": 0.85,
  "satisfaction_score": 7.5,
  "emotional_tone": "excited/curious/hesitant/frustrated/satisfied/neutral",
  "key_concerns": ["ราคา", "ผลลัพธ์"],
  "positive_signals": ["สนใจ treatment", "ถามรายละเอียดมาก"],
  "improvement_suggestions": ["ให้ข้อมูลราคาชัดเจนขึ้น", "แสดงผลลัพธ์ก่อน-หลัง"]
}

เกณฑ์การให้คะแนน satisfaction_score (0-10):
- 8-10: ลูกค้าพอใจมาก พร้อมซื้อ
- 6-7: ลูกค้าสนใจ แต่ยังมีข้อสงสัย
- 4-5: ลูกค้าลังเล มีข้อกังวล
- 0-3: ลูกค้าไม่พอใจ หรือไม่สนใจ`;

  try {
    const response = await callGemini(prompt, 'gemini-2.0-flash', {
      clinicId,
      useCache: false // Don't cache sentiment analysis
    });

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]) as SentimentAnalysis;
      return analysis;
    }

    // Fallback if JSON parsing fails
    return {
      overall_sentiment: 'neutral',
      confidence: 0.5,
      satisfaction_score: 5,
      key_concerns: ['ไม่สามารถวิเคราะห์ได้'],
      positive_signals: [],
      improvement_suggestions: [],
      emotional_tone: 'neutral'
    };
  } catch (error) {
    console.error('Sentiment analysis failed:', error);
    throw error;
  }
}

/**
 * Get sentiment emoji based on overall sentiment
 */
export function getSentimentEmoji(sentiment: SentimentAnalysis['overall_sentiment']): string {
  switch (sentiment) {
    case 'positive':
      return '😊';
    case 'negative':
      return '😟';
    default:
      return '😐';
  }
}

/**
 * Get sentiment color for UI
 */
export function getSentimentColor(sentiment: SentimentAnalysis['overall_sentiment']): string {
  switch (sentiment) {
    case 'positive':
      return 'text-green-500';
    case 'negative':
      return 'text-red-500';
    default:
      return 'text-yellow-500';
  }
}

/**
 * Get satisfaction level label
 */
export function getSatisfactionLevel(score: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (score >= 8) {
    return {
      label: 'พอใจมาก',
      color: 'text-emerald-500',
      emoji: '🤩'
    };
  } else if (score >= 6) {
    return {
      label: 'สนใจ',
      color: 'text-green-500',
      emoji: '👍'
    };
  } else if (score >= 4) {
    return {
      label: 'ลังเล',
      color: 'text-yellow-500',
      emoji: '🤔'
    };
  } else {
    return {
      label: 'ไม่พอใจ',
      color: 'text-red-500',
      emoji: '😞'
    };
  }
}

/**
 * Analyze sentiment for multiple conversations (batch)
 */
export async function batchAnalyzeSentiment(
  conversations: Array<{ id: string; messages: ConversationMessage[] }>,
  clinicId: string
): Promise<Map<string, SentimentAnalysis>> {
  const results = new Map<string, SentimentAnalysis>();
  
  // Process in parallel with rate limiting
  const batchSize = 5;
  for (let i = 0; i < conversations.length; i += batchSize) {
    const batch = conversations.slice(i, i + batchSize);
    
    const analyses = await Promise.all(
      batch.map(conv => 
        analyzeConversationSentiment(conv.messages, clinicId)
          .catch(err => {
            console.error(`Failed to analyze conversation ${conv.id}:`, err);
            return null;
          })
      )
    );
    
    batch.forEach((conv, index) => {
      if (analyses[index]) {
        results.set(conv.id, analyses[index]!);
      }
    });
  }
  
  return results;
}
