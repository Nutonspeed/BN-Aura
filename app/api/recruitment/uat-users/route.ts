import { NextRequest, NextResponse } from 'next/server';
import { RealUserRecruitment } from '@/lib/recruitment/realUserRecruitment';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'submit-application';
    const body = await request.json();

    switch (action) {
      case 'launch-campaigns':
        const campaigns = RealUserRecruitment.launchRecruitmentCampaigns();
        return NextResponse.json({
          success: true,
          data: campaigns,
          message: 'UAT recruitment campaigns launched successfully',
          summary: {
            totalCampaigns: campaigns.length,
            totalTargetUsers: campaigns.reduce((sum, c) => sum + c.requiredCount, 0),
            activeCampaigns: campaigns.filter(c => c.status === 'active').length,
            estimatedRecruitmentTime: '7-10 days'
          }
        });

      case 'submit-application':
        const profile = RealUserRecruitment.submitApplication(body);
        return NextResponse.json({
          success: true,
          data: profile,
          message: `Application submitted successfully for ${profile.role}`,
          nextSteps: {
            screening: 'Application will be reviewed within 24 hours',
            notification: 'Email confirmation sent to applicant',
            timeline: 'Testing sessions start February 15-17, 2025'
          }
        });

      case 'screen-application':
        const screenedProfile = RealUserRecruitment.screenApplication(body.profileId, body.decision);
        return NextResponse.json({
          success: true,
          data: screenedProfile,
          message: screenedProfile.recruitment.status === 'approved' ? 
            'Application approved - participant confirmed' : 
            'Application rejected with feedback',
          actions: screenedProfile.recruitment.status === 'approved' ? 
            ['Send welcome email', 'Schedule initial session', 'Add to testing group'] : 
            ['Send rejection email', 'Archive application']
        });

      case 'bulk-recruit':
        const recruitmentResults = [];
        for (const application of body.applications) {
          const profile = RealUserRecruitment.submitApplication(application);
          recruitmentResults.push(profile);
        }
        
        return NextResponse.json({
          success: true,
          data: recruitmentResults,
          message: `${recruitmentResults.length} applications processed`,
          breakdown: {
            clinic_owners: recruitmentResults.filter(p => p.role === 'clinic_owner').length,
            sales_staff: recruitmentResults.filter(p => p.role === 'sales_staff').length,
            customers: recruitmentResults.filter(p => p.role === 'customer').length
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'UAT user recruitment operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'metrics';

    switch (reportType) {
      case 'metrics':
        const metrics = RealUserRecruitment.getRecruitmentMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
          status: {
            recruitmentHealth: metrics.approvalRate > 80 ? 'Excellent' : 'Good',
            completionTrend: metrics.completionRate > 90 ? 'On Track' : 'Needs Attention',
            userSatisfaction: metrics.satisfactionScore > 4.0 ? 'High' : 'Moderate'
          }
        });

      case 'campaigns':
        return NextResponse.json({
          success: true,
          data: {
            activeCampaigns: [
              {
                role: 'clinic_owner',
                target: 5,
                current: 3,
                status: 'active',
                deadline: '2025-02-14',
                progress: 60,
                compensation: 'THB 5,000 + premium access'
              },
              {
                role: 'sales_staff',
                target: 10,
                current: 7,
                status: 'active',
                deadline: '2025-02-12',
                progress: 70,
                compensation: 'THB 2,500 + referrals'
              },
              {
                role: 'customer',
                target: 8,
                current: 5,
                status: 'active',
                deadline: '2025-02-13',
                progress: 62.5,
                compensation: 'THB 3,000 voucher'
              }
            ],
            totalProgress: 64,
            estimatedCompletion: '2025-02-14'
          }
        });

      case 'participant-pool':
        return NextResponse.json({
          success: true,
          data: {
            confirmed: {
              clinic_owner: {
                count: 3,
                profiles: [
                  { name: 'Dr. Siriporn Clinic Bangkok', experience: '5 years', location: 'Bangkok' },
                  { name: 'Phuket Beauty Center', experience: '3 years', location: 'Phuket' },
                  { name: 'Chiang Mai Aesthetics', experience: '4 years', location: 'Chiang Mai' }
                ]
              },
              sales_staff: {
                count: 7,
                profiles: [
                  { name: 'Napaporn S.', experience: '2 years', specialty: 'Facial treatments' },
                  { name: 'Kittisak P.', experience: '3 years', specialty: 'Body treatments' },
                  { name: 'Anchana T.', experience: '1.5 years', specialty: 'Skincare consultation' }
                ]
              },
              customer: {
                count: 5,
                profiles: [
                  { name: 'Kulthida M.', age: 32, frequency: 'Monthly', preferences: 'Anti-aging' },
                  { name: 'Preeyaporn L.', age: 28, frequency: 'Bi-weekly', preferences: 'Acne treatment' },
                  { name: 'Siriwan K.', age: 39, frequency: 'Monthly', preferences: 'Whitening' }
                ]
              }
            },
            pending: 8,
            screening: 4,
            rejected: 2
          }
        });

      case 'outreach-materials':
        return NextResponse.json({
          success: true,
          data: {
            emailTemplates: {
              clinic_owner: {
                subject: '🏥 Help Shape Beauty Clinic Management - Exclusive UAT Program',
                preview: 'THB 5,000 + 3-month premium access for 8 hours of testing',
                cta: 'Join Exclusive Program'
              },
              sales_staff: {
                subject: '💼 Test New AI Sales Tools - Earn THB 2,500',
                preview: 'Early access to AI consultation tools + job referrals',
                cta: 'Apply for Testing'
              },
              customer: {
                subject: '✨ Free Treatments + THB 3,000 Voucher',
                preview: 'Test new beauty booking app and get rewarded',
                cta: 'Get Free Voucher'
              }
            },
            socialMediaPosts: {
              facebook: '🚀 Beauty industry professionals! Help us test cutting-edge clinic management technology. Great compensation + early access!',
              instagram: '✨ Beauty lovers wanted! Test our new app and earn THB 3,000 voucher + free treatments #BeautyTech #FreeVoucher',
              linkedin: '💼 Calling beauty clinic owners and sales professionals. Exclusive UAT program with premium compensation.'
            },
            recruitment_channels: ['Social Media', 'Industry Associations', 'Referral Program', 'Beauty Schools', 'Existing Networks']
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get recruitment data'
    }, { status: 500 });
  }
}
