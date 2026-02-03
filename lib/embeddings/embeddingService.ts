import { embed, embedMany } from 'ai';
import { getAIProvider } from '@/lib/ai';
import { ConversationMessage } from '@/lib/conversations/conversationManager';

export interface CustomerProfileForEmbedding {
  full_name: string;
  skinAnalysis?: {
    concerns: string[];
  };
  budget?: string;
  previousTreatments?: string[];
  [key: string]: any;
}

export class EmbeddingService {
  private modelId = 'text-embedding-004';

  constructor(private options: { clinicId?: string; userId?: string } = {}) {}

  private get model() {
    const google = getAIProvider(this.options);
    return google.textEmbeddingModel(this.modelId);
  }

  async generateConversationEmbedding(
    messages: ConversationMessage[]
  ): Promise<number[]> {
    const text = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
    
    // Truncate if too long (approx check, Google's limit is tokens but char count helps avoid massive errors)
    const truncatedText = text.length > 20000 ? text.substring(0, 20000) : text;

    const { embedding } = await embed({
      model: this.model,
      value: truncatedText,
    });

    return embedding;
  }

  async generateCustomerProfileEmbedding(
    customer: CustomerProfileForEmbedding
  ): Promise<number[]> {
    const parts = [
      `Name: ${customer.full_name}`,
    ];

    if (customer.skinAnalysis?.concerns?.length) {
      parts.push(`Concerns: ${customer.skinAnalysis.concerns.join(', ')}`);
    }

    if (customer.budget) {
      parts.push(`Budget: ${customer.budget}`);
    }

    if (customer.previousTreatments?.length) {
      parts.push(`History: ${customer.previousTreatments.join(', ')}`);
    }

    const profile = parts.join('\n');
    
    const { embedding } = await embed({
      model: this.model,
      value: profile,
    });
    
    return embedding;
  }

  async batchGenerate(texts: string[]): Promise<number[][]> {
    const { embeddings } = await embedMany({
      model: this.model,
      values: texts,
    });
    return embeddings;
  }
}
