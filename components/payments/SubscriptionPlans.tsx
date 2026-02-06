'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Check, Zap, Crown, Building2, Rocket } from 'lucide-react';
import { subscriptionPlans, formatTHB, createSubscription } from '@/lib/payments/stripeService';

const planIcons = {
  starter: <Zap size={24} />,
  professional: <Rocket size={24} />,
  premium: <Crown size={24} />,
  enterprise: <Building2 size={24} />,
};

interface Props {
  clinicId: string;
  currentPlan?: string;
}

export function SubscriptionPlans({ clinicId, currentPlan }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true);
    try {
      // In production, integrate with Stripe Elements for payment
      console.log(`[Subscription] Upgrading to ${planId}`);
      // const result = await createSubscription(clinicId, planId, paymentMethodId);
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {subscriptionPlans.map((plan) => {
        const isCurrentPlan = currentPlan === plan.id;
        const isPopular = plan.id === 'professional';

        return (
          <Card
            key={plan.id}
            className={`relative ${isPopular ? 'border-primary shadow-lg' : ''} ${
              isCurrentPlan ? 'bg-primary/5' : ''
            }`}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                แนะนำ
              </div>
            )}

            <CardHeader className="text-center pb-2">
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                isPopular ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {planIcons[plan.id as keyof typeof planIcons]}
              </div>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">{formatTHB(plan.amount)}</span>
                <span className="text-muted-foreground">/เดือน</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={isCurrentPlan ? 'outline' : isPopular ? 'default' : 'outline'}
                disabled={isCurrentPlan || isLoading}
                onClick={() => handleSubscribe(plan.id)}
              >
                {isCurrentPlan ? 'แพ็กเกจปัจจุบัน' : 'เลือกแพ็กเกจ'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default SubscriptionPlans;
