'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Redirect: /sales/ai-analysis → /sales/skin-analysis
 * The AI Skin Analysis features have been consolidated into the main skin-analysis page
 * with the full HuggingFace multi-model + Gemini pipeline.
 */
export default function SalesAIAnalysisRedirect() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale || 'th';

  useEffect(() => {
    router.replace(`/${locale}/sales/skin-analysis`);
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Redirecting to AI Skin Analysis...</p>
    </div>
  );
}
