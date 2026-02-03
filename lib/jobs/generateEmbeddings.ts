import { createAdminClient } from '@/lib/supabase/admin';
import { EmbeddingService } from '@/lib/embeddings/embeddingService';
import { ConversationMessage } from '@/lib/conversations/conversationManager';

export async function generateAllEmbeddings(clinicId: string) {
  const supabase = createAdminClient();
  const embeddingService = new EmbeddingService({ clinicId });
  
  console.log(`Starting embedding generation for clinic: ${clinicId}`);

  // 1. Generate conversation embeddings
  // Fetch conversations that don't have embeddings yet or were recently updated
  // For this batch job, we'll focus on active/completed ones.
  // We might want to filter by those with NULL message_embeddings
  
  const { data: conversations, error: convError } = await supabase
    .from('customer_conversations')
    .select('id, messages')
    .eq('clinic_id', clinicId)
    .is('message_embeddings', null) // Only process those missing embeddings
    .limit(50); // Batch size to avoid timeouts

  if (convError) {
    console.error('Error fetching conversations:', convError);
  } else if (conversations && conversations.length > 0) {
    console.log(`Processing ${conversations.length} conversations...`);
    
    for (const conv of conversations) {
      try {
        const messages = conv.messages as ConversationMessage[];
        if (!messages || messages.length === 0) continue;

        const embedding = await embeddingService.generateConversationEmbedding(messages);
        
        const { error: updateError } = await supabase
          .from('customer_conversations')
          .update({ message_embeddings: embedding })
          .eq('id', conv.id);

        if (updateError) {
          console.error(`Failed to update embedding for conversation ${conv.id}:`, updateError);
        }
      } catch (err) {
        console.error(`Failed to generate embedding for conversation ${conv.id}:`, err);
      }
    }
  }

  // 2. Generate customer embeddings
  const { data: customers, error: custError } = await supabase
    .from('customers')
    .select('id, full_name, metadata') // Assuming metadata contains skin analysis etc for now if not in separate columns
    .eq('clinic_id', clinicId)
    .is('preference_embedding', null)
    .limit(50);

  if (custError) {
    console.error('Error fetching customers:', custError);
  } else if (customers && customers.length > 0) {
    console.log(`Processing ${customers.length} customers...`);
    
    for (const customer of customers) {
      try {
        // Construct a profile object from customer data
        // Adjust fields based on actual schema. 
        // We read 'metadata' which often stores flexible fields like skinAnalysis in this project structure
        const metadata = customer.metadata || {};
        
        const profile = {
          full_name: customer.full_name || 'Unknown',
          skinAnalysis: metadata.skinAnalysis,
          budget: metadata.budget,
          previousTreatments: metadata.history // Example mapping
        };

        const embedding = await embeddingService.generateCustomerProfileEmbedding(profile);
        
        const { error: updateError } = await supabase
          .from('customers')
          .update({ preference_embedding: embedding })
          .eq('id', customer.id);

        if (updateError) {
          console.error(`Failed to update embedding for customer ${customer.id}:`, updateError);
        }
      } catch (err) {
        console.error(`Failed to generate embedding for customer ${customer.id}:`, err);
      }
    }
  }
  
  console.log('Embedding generation batch completed.');
}
