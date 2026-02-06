import { NextRequest, NextResponse } from 'next/server';
import { SkinProgressTracker } from '@/lib/ar/skinProgressTracker';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'start';
    
    const body = await request.json();

    switch (action) {
      case 'start':
        return startProgressTracking(body);
        
      case 'capture':
        return captureProgressPhoto(body);
        
      case 'compare':
        return comparePhotos(body);
        
      case 'timelapse':
        return generateTimeLapse(body);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Progress tracking API error:', error);
    return NextResponse.json(
      { error: 'Progress tracking failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'progress';
    const progressId = searchParams.get('progressId');
    const customerId = searchParams.get('customerId');

    switch (action) {
      case 'progress':
        return getProgress(progressId);
        
      case 'customer':
        return getCustomerProgress(customerId);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get progress data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function startProgressTracking(body: any) {
  const { customerId, treatmentType } = body;
  
  if (!customerId || !treatmentType) {
    return NextResponse.json({ 
      error: 'Missing customerId or treatmentType' 
    }, { status: 400 });
  }
  
  try {
    const progressId = await SkinProgressTracker.startProgressTracking(customerId, treatmentType);
    
    return NextResponse.json({
      success: true,
      data: {
        progressId,
        customerId,
        treatmentType,
        startDate: new Date().toISOString()
      },
      guidelines: {
        photoSchedule: [
          'Day 1: Baseline photo',
          'Day 7: First week progress',
          'Day 14: Two week progress',
          'Day 30: Monthly progress',
          'Day 60: Final results'
        ],
        photoTips: [
          'Use consistent lighting conditions',
          'Take photos at same time of day',
          'Use same camera angle and distance',
          'Ensure face is clean and makeup-free',
          'Take photos in good natural light'
        ]
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to start progress tracking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function captureProgressPhoto(body: any) {
  const { progressId, imageData, notes } = body;
  
  if (!progressId || !imageData) {
    return NextResponse.json({ 
      error: 'Missing progressId or imageData' 
    }, { status: 400 });
  }
  
  try {
    const photo = await SkinProgressTracker.captureProgressPhoto(progressId, imageData);
    
    if (!photo) {
      return NextResponse.json({
        success: false,
        error: 'Failed to capture progress photo',
        reason: 'Progress tracking session not found'
      }, { status: 404 });
    }
    
    const progress = SkinProgressTracker.getProgress(progressId);
    
    return NextResponse.json({
      success: true,
      data: {
        photoId: photo.id,
        dayNumber: photo.dayNumber,
        analysisData: photo.analysisData,
        captureDate: photo.captureDate
      },
      progress: {
        totalPhotos: progress?.photos.length || 0,
        overallImprovement: progress?.overallImprovement || 0,
        treatmentType: progress?.treatmentType
      },
      analysis: {
        textureScore: photo.analysisData.textureScore,
        wrinkleScore: photo.analysisData.wrinkleScore,
        overallScore: photo.analysisData.overallScore,
        quality: photo.analysisData.overallScore > 80 ? 'Excellent' :
                photo.analysisData.overallScore > 60 ? 'Good' : 'Fair'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Photo capture failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function comparePhotos(body: any) {
  const { photoId1, photoId2 } = body;
  
  if (!photoId1 || !photoId2) {
    return NextResponse.json({ 
      error: 'Missing photoId1 or photoId2' 
    }, { status: 400 });
  }
  
  try {
    const comparison = await SkinProgressTracker.comparePhotos(photoId1, photoId2);
    
    if (!comparison) {
      return NextResponse.json({
        success: false,
        error: 'Photo comparison failed',
        reason: 'One or both photos not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: comparison,
      summary: {
        daysDifference: comparison.daysDifference,
        overallImprovement: comparison.improvements.overall,
        significantChanges: [
          comparison.improvements.texture > 5 ? 'Improved skin texture' : null,
          comparison.improvements.wrinkles > 5 ? 'Reduced wrinkles' : null,
          comparison.improvements.overall > 10 ? 'Significant overall improvement' : null
        ].filter(Boolean)
      },
      visualization: {
        beforeAfterAvailable: true,
        metricsChart: true,
        improvementHighlights: true
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Photo comparison failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateTimeLapse(body: any) {
  const { progressId } = body;
  
  if (!progressId) {
    return NextResponse.json({ 
      error: 'Missing progressId' 
    }, { status: 400 });
  }
  
  try {
    const timelapse = SkinProgressTracker.generateTimeLapse(progressId);
    
    if (!timelapse) {
      return NextResponse.json({
        success: false,
        error: 'Time-lapse generation failed',
        reason: 'Progress not found or insufficient photos (minimum 2 required)'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      data: timelapse,
      animation: {
        totalFrames: timelapse.frames.length,
        duration: `${timelapse.totalDays} days`,
        improvementTrend: timelapse.improvement > 0 ? 'Improving' : 'Stable',
        exportFormats: ['MP4 Video', 'GIF Animation', 'PDF Report']
      },
      insights: {
        progressRate: timelapse.improvement / timelapse.totalDays,
        bestDay: timelapse.frames.reduce((best, frame) => 
          frame.score > best.score ? frame : best, timelapse.frames[0]).day,
        averageScore: timelapse.frames.reduce((sum, frame) => sum + frame.score, 0) / timelapse.frames.length
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Time-lapse generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getProgress(progressId?: string | null) {
  if (!progressId) {
    return NextResponse.json({ 
      error: 'Missing progressId' 
    }, { status: 400 });
  }

  try {
    const progress = SkinProgressTracker.getProgress(progressId);
    
    if (!progress) {
      return NextResponse.json({
        success: false,
        error: 'Progress not found'
      }, { status: 404 });
    }
    
    const daysSinceStart = Math.floor(
      (Date.now() - new Date(progress.startDate).getTime()) / (24 * 60 * 60 * 1000)
    ) + 1;
    
    return NextResponse.json({
      success: true,
      data: progress,
      statistics: {
        daysSinceStart,
        totalPhotos: progress.photos.length,
        overallImprovement: progress.overallImprovement,
        averageScore: progress.photos.length > 0 
          ? progress.photos.reduce((sum, p) => sum + p.analysisData.overallScore, 0) / progress.photos.length 
          : 0,
        lastPhotoDate: progress.photos.length > 0 
          ? progress.photos[progress.photos.length - 1].captureDate 
          : null
      },
      recommendations: generateProgressRecommendations(progress)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getCustomerProgress(customerId?: string | null) {
  if (!customerId) {
    return NextResponse.json({ 
      error: 'Missing customerId' 
    }, { status: 400 });
  }

  try {
    const progressList = SkinProgressTracker.getCustomerProgress(customerId);
    
    return NextResponse.json({
      success: true,
      data: {
        customerId,
        progressRecords: progressList,
        totalTreatments: progressList.length,
        activeTreatments: progressList.filter(p => !p.photos.some(photo => 
          Math.floor((Date.now() - new Date(photo.captureDate).getTime()) / (24 * 60 * 60 * 1000)) > 90
        )).length
      },
      summary: {
        bestImprovement: progressList.reduce((best, p) => 
          p.overallImprovement > best ? p.overallImprovement : best, 0),
        totalPhotos: progressList.reduce((sum, p) => sum + p.photos.length, 0),
        treatmentTypes: [...new Set(progressList.map(p => p.treatmentType))]
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get customer progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateProgressRecommendations(progress: any): string[] {
  const recommendations = [];
  
  if (progress.photos.length === 0) {
    recommendations.push('Take your first baseline photo to start tracking');
  } else if (progress.photos.length < 3) {
    recommendations.push('Take more regular photos for better progress tracking');
  }
  
  if (progress.overallImprovement > 15) {
    recommendations.push('Excellent progress! Continue current treatment plan');
  } else if (progress.overallImprovement > 5) {
    recommendations.push('Good progress. Consider adjusting treatment intensity');
  } else if (progress.photos.length > 2) {
    recommendations.push('Consult with practitioner about treatment adjustments');
  }
  
  const daysSinceLastPhoto = progress.photos.length > 0 
    ? Math.floor((Date.now() - new Date(progress.photos[progress.photos.length - 1].captureDate).getTime()) / (24 * 60 * 60 * 1000))
    : 0;
    
  if (daysSinceLastPhoto > 7) {
    recommendations.push('Consider taking a new progress photo');
  }
  
  return recommendations;
}
