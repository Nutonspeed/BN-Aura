import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

export interface VoCData {
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topConcerns: Array<{ topic: string; count: number }>;
  recentFeedback: Array<{
    id: string;
    customer: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    comment: string;
    date: string;
  }>;
  satisfactionTrend: Array<{ date: string; score: number }>;
}

export class VoCService {
  private async getClient(): Promise<SupabaseClient> {
    return await createClient();
  }

  async getVoCAnalytics(clinicId: string, periodDays: number = 30): Promise<VoCData> {
    const supabase = await this.getClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const { data: conversations, error } = await supabase
      .from('customer_conversations')
      .select('id, created_at, summary, metadata, customer:customers(full_name)')
      .eq('clinic_id', clinicId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching VoC data:', error);
      throw error;
    }

    // Process data
    const sentimentDist = { positive: 0, neutral: 0, negative: 0 };
    const concernsMap: Record<string, number> = {};
    const feedbackList: VoCData['recentFeedback'] = [];
    const trendMap: Record<string, { total: number; count: number }> = {};

    conversations?.forEach((conv: any) => {
      const sentiment = conv.metadata?.sentiment;
      
      // Sentiment Distribution
      if (sentiment?.overall_sentiment) {
        const key = sentiment.overall_sentiment as keyof typeof sentimentDist;
        if (key in sentimentDist) {
          sentimentDist[key]++;
        } else {
          sentimentDist.neutral++;
        }
      } else {
        sentimentDist.neutral++; // Default if no analysis
      }

      // Recent Feedback
      if (feedbackList.length < 10) {
        feedbackList.push({
          id: conv.id,
          customer: conv.customer?.full_name || 'Anonymous',
          sentiment: sentiment?.overall_sentiment || 'neutral',
          comment: conv.summary || 'No summary available',
          date: conv.created_at
        });
      }

      // Top Concerns (from sentiment analysis)
      if (sentiment?.key_concerns && Array.isArray(sentiment.key_concerns)) {
        sentiment.key_concerns.forEach((concern: string) => {
          // Normalize concern text (simple lowercase for now)
          const normalized = concern.toLowerCase().trim();
          concernsMap[normalized] = (concernsMap[normalized] || 0) + 1;
        });
      }

      // Satisfaction Trend
      if (sentiment?.satisfaction_score !== undefined) {
        const dateKey = new Date(conv.created_at).toISOString().split('T')[0];
        if (!trendMap[dateKey]) trendMap[dateKey] = { total: 0, count: 0 };
        trendMap[dateKey].total += Number(sentiment.satisfaction_score);
        trendMap[dateKey].count++;
      }
    });

    // Format Concerns
    const topConcerns = Object.entries(concernsMap)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Format Trend (Fill missing dates optional, here we just show active days)
    const satisfactionTrend = Object.entries(trendMap)
      .map(([date, stats]) => ({
        date,
        score: Number((stats.total / stats.count).toFixed(1))
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      sentimentDistribution: sentimentDist,
      topConcerns,
      recentFeedback: feedbackList,
      satisfactionTrend
    };
  }
}
