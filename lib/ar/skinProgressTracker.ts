/**
 * Skin Progress Time-lapse System
 */

interface ProgressPhoto {
  id: string;
  customerId: string;
  treatmentId: string;
  captureDate: string;
  imageData: string;
  analysisData: {
    textureScore: number;
    wrinkleScore: number;
    overallScore: number;
  };
  dayNumber: number;
}

interface TreatmentProgress {
  id: string;
  customerId: string;
  treatmentType: string;
  startDate: string;
  photos: ProgressPhoto[];
  overallImprovement: number;
}

class SkinProgressTracker {
  private static progressRecords: Map<string, TreatmentProgress> = new Map();

  static async startProgressTracking(customerId: string, treatmentType: string): Promise<string> {
    const progressId = `progress_${Date.now()}`;
    
    const progress: TreatmentProgress = {
      id: progressId,
      customerId,
      treatmentType,
      startDate: new Date().toISOString(),
      photos: [],
      overallImprovement: 0
    };

    this.progressRecords.set(progressId, progress);
    return progressId;
  }

  static async captureProgressPhoto(progressId: string, imageData: string): Promise<ProgressPhoto | null> {
    const progress = this.progressRecords.get(progressId);
    if (!progress) return null;

    const dayNumber = Math.floor((Date.now() - new Date(progress.startDate).getTime()) / (24 * 60 * 60 * 1000)) + 1;
    
    const photo: ProgressPhoto = {
      id: `photo_${Date.now()}`,
      customerId: progress.customerId,
      treatmentId: progress.id,
      captureDate: new Date().toISOString(),
      imageData,
      analysisData: {
        textureScore: 70 + Math.random() * 25,
        wrinkleScore: 60 + Math.random() * 30,
        overallScore: 65 + Math.random() * 30
      },
      dayNumber
    };

    progress.photos.push(photo);
    
    // Update improvement
    if (progress.photos.length > 1) {
      const firstPhoto = progress.photos[0];
      const latestPhoto = progress.photos[progress.photos.length - 1];
      progress.overallImprovement = latestPhoto.analysisData.overallScore - firstPhoto.analysisData.overallScore;
    }

    return photo;
  }

  static async comparePhotos(photoId1: string, photoId2: string): Promise<any> {
    const allPhotos = Array.from(this.progressRecords.values()).flatMap(p => p.photos);
    const photo1 = allPhotos.find(p => p.id === photoId1);
    const photo2 = allPhotos.find(p => p.id === photoId2);

    if (!photo1 || !photo2) return null;

    return {
      beforePhoto: photo1,
      afterPhoto: photo2,
      improvements: {
        texture: photo2.analysisData.textureScore - photo1.analysisData.textureScore,
        wrinkles: photo1.analysisData.wrinkleScore - photo2.analysisData.wrinkleScore,
        overall: photo2.analysisData.overallScore - photo1.analysisData.overallScore
      },
      daysDifference: photo2.dayNumber - photo1.dayNumber
    };
  }

  static generateTimeLapse(progressId: string): any {
    const progress = this.progressRecords.get(progressId);
    if (!progress || progress.photos.length < 2) return null;

    return {
      frames: progress.photos.map(photo => ({
        photo,
        day: photo.dayNumber,
        score: photo.analysisData.overallScore
      })),
      totalDays: progress.photos[progress.photos.length - 1].dayNumber,
      improvement: progress.overallImprovement
    };
  }

  static getProgress(progressId: string): TreatmentProgress | null {
    return this.progressRecords.get(progressId) || null;
  }

  static getCustomerProgress(customerId: string): TreatmentProgress[] {
    return Array.from(this.progressRecords.values()).filter(p => p.customerId === customerId);
  }
}

export { SkinProgressTracker, type ProgressPhoto, type TreatmentProgress };
