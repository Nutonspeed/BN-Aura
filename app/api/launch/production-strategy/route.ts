import { NextRequest, NextResponse } from 'next/server';
import { ProductionLaunchStrategy } from '@/lib/launch/productionLaunchStrategy';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'create-strategy';
    const body = await request.json();

    switch (action) {
      case 'create-strategy':
        const goToMarketStrategy = ProductionLaunchStrategy.createGoToMarketStrategy();
        return NextResponse.json({
          success: true,
          data: goToMarketStrategy,
          message: 'Go-to-market strategy created successfully',
          insights: {
            totalTiers: goToMarketStrategy.pricingTiers.length,
            priceRange: `THB ${Math.min(...goToMarketStrategy.pricingTiers.map(t => t.monthlyPrice))} - ${Math.max(...goToMarketStrategy.pricingTiers.map(t => t.monthlyPrice))}`,
            marketingChannels: goToMarketStrategy.marketingChannels.length,
            monthlyTarget: goToMarketStrategy.salesTargets.monthly,
            quarterlyTarget: goToMarketStrategy.salesTargets.quarterly
          }
        });

      case 'select-pilots':
        const pilots = ProductionLaunchStrategy.selectPilotClinics();
        return NextResponse.json({
          success: true,
          data: pilots,
          message: `${pilots.length} pilot clinics selected for launch`,
          summary: {
            totalPilots: pilots.length,
            locations: [...new Set(pilots.map(p => p.location.split(',')[0]))],
            sizeDistribution: {
              small: pilots.filter(p => p.size === 'small').length,
              medium: pilots.filter(p => p.size === 'medium').length,
              large: pilots.filter(p => p.size === 'large').length
            },
            averageTechReadiness: Math.round((pilots.reduce((sum, p) => sum + p.techReadiness, 0) / pilots.length) * 10) / 10,
            totalStaff: pilots.reduce((sum, p) => sum + p.staffCount, 0)
          }
        });

      case 'create-rollout':
        const phases = ProductionLaunchStrategy.definePhasedRollout();
        return NextResponse.json({
          success: true,
          data: phases,
          message: `${phases.length}-phase rollout plan created`,
          timeline: {
            totalPhases: phases.length,
            totalDuration: phases.reduce((sum, p) => sum + p.duration, 0),
            totalTargetClinics: phases.reduce((sum, p) => sum + p.targetClinics, 0),
            phaseBreakdown: phases.map(p => ({
              phase: p.phaseName,
              duration: `${p.duration} days`,
              targets: p.targetClinics
            }))
          }
        });

      case 'launch-pilot':
        return NextResponse.json({
          success: true,
          data: {
            launchId: `launch_pilot_${Date.now()}`,
            phase: 'Pilot Launch',
            status: 'initiated',
            clinics: body.selectedClinics || 3,
            startDate: new Date().toISOString(),
            estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          message: 'Pilot launch initiated successfully',
          nextSteps: [
            'Onboard pilot clinics with dedicated support',
            'Begin daily monitoring and feedback collection',
            'Weekly progress reviews with clinic owners',
            'Prepare for Phase 2 early adopter recruitment'
          ]
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Production launch strategy operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';

    switch (reportType) {
      case 'summary':
        const summary = ProductionLaunchStrategy.getLaunchSummary();
        return NextResponse.json({
          success: true,
          data: summary,
          status: {
            readiness: 'Production Ready',
            confidence: 'High',
            riskLevel: 'Low-Medium',
            timeline: `${summary.estimatedDuration} days to full rollout`
          }
        });

      case 'market-analysis':
        return NextResponse.json({
          success: true,
          data: {
            totalMarket: {
              thailandClinics: 500,
              targetSegments: {
                small: { count: 300, percentage: 60 },
                medium: { count: 150, percentage: 30 },
                large: { count: 50, percentage: 10 }
              },
              geographicDistribution: {
                bangkok: 40,
                phuket: 15,
                chiangmai: 10,
                pattaya: 8,
                others: 27
              }
            },
            competitiveAnalysis: {
              currentSolutions: [
                { name: 'Traditional Systems', marketShare: 45, weaknesses: ['Outdated', 'No AI', 'Poor mobile'] },
                { name: 'Basic Software', marketShare: 35, weaknesses: ['Limited features', 'No analytics'] },
                { name: 'Custom Solutions', marketShare: 20, weaknesses: ['Expensive', 'Maintenance issues'] }
              ],
              bnAuraAdvantages: ['AI-powered consultation', 'Mobile-first design', 'Comprehensive analytics', 'Affordable pricing']
            },
            marketOpportunity: {
              totalAddressableMarket: 'THB 250M annually',
              servicableAddressableMarket: 'THB 100M annually',
              targetMarketPenetration: '20% in Year 1',
              projectedRevenue: 'THB 50M Year 1'
            }
          }
        });

      case 'risk-assessment':
        return NextResponse.json({
          success: true,
          data: {
            overallRisk: 'Medium',
            riskCategories: {
              technical: {
                level: 'Low',
                risks: ['System scalability', 'Integration issues'],
                mitigation: ['Load testing completed', '24/7 monitoring', 'Auto-scaling infrastructure']
              },
              market: {
                level: 'Medium',
                risks: ['Competition response', 'Market adoption rate'],
                mitigation: ['Strong value proposition', 'Pilot validation', 'Competitive pricing']
              },
              business: {
                level: 'Low',
                risks: ['Revenue targets', 'Customer retention'],
                mitigation: ['Conservative projections', 'Customer success program', 'Flexible pricing']
              },
              operational: {
                level: 'Medium',
                risks: ['Support capacity', 'Training effectiveness'],
                mitigation: ['Dedicated support team', 'Comprehensive training materials', 'Partner network']
              }
            },
            contingencyPlans: [
              'Adjust pricing strategy based on market response',
              'Scale support team based on demand',
              'Modify feature roadmap based on feedback',
              'Partner with industry leaders if needed'
            ]
          }
        });

      case 'success-metrics':
        return NextResponse.json({
          success: true,
          data: {
            launchMetrics: {
              pilot: {
                duration: '30 days',
                targets: {
                  satisfaction: '4.5/5.0',
                  uptime: '99.5%',
                  issues: 'Less than 5 critical bugs',
                  adoption: '100% feature utilization'
                }
              },
              earlyAdopter: {
                duration: '45 days',
                targets: {
                  onboarding: '4 clinics/week',
                  retention: '95%',
                  satisfaction: '4.2/5.0',
                  revenue: 'THB 500K/month'
                }
              },
              generalAvailability: {
                duration: '90 days',
                targets: {
                  marketPenetration: '15%',
                  monthlyRevenue: 'THB 4M',
                  customerCount: '100 clinics',
                  nps: '50+'
                }
              }
            },
            businessMetrics: {
              financial: {
                revenueGrowth: '25% monthly',
                customerAcquisitionCost: 'THB 15,000',
                lifetimeValue: 'THB 150,000',
                paybackPeriod: '10 months'
              },
              operational: {
                supportTickets: 'Less than 2 per clinic per month',
                resolutionTime: 'Less than 2 hours',
                training: '95% completion rate',
                onboarding: 'Less than 7 days'
              }
            }
          }
        });

      case 'competitive-positioning':
        return NextResponse.json({
          success: true,
          data: {
            positioning: 'AI-Powered Beauty Clinic Management Platform',
            keyDifferentiators: [
              'First AI consultation system in Thai beauty industry',
              'Mobile-first design for modern clinics',
              'Comprehensive analytics and reporting',
              'Affordable subscription pricing',
              'Thai language optimized'
            ],
            competitiveMatrix: {
              features: {
                bnAura: { ai: true, mobile: true, analytics: true, pricing: 'competitive', support: 'excellent' },
                competitor1: { ai: false, mobile: false, analytics: 'basic', pricing: 'high', support: 'good' },
                competitor2: { ai: false, mobile: true, analytics: false, pricing: 'low', support: 'basic' }
              }
            },
            valueProposition: {
              primary: 'Increase clinic revenue by 30% through AI-powered customer insights',
              secondary: [
                'Reduce administrative time by 50%',
                'Improve customer satisfaction with personalized consultations',
                'Scale operations with mobile-first approach',
                'Make data-driven business decisions'
              ]
            }
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get production launch strategy data'
    }, { status: 500 });
  }
}
