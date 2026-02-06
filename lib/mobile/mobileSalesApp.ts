/**
 * Mobile Sales App Integration System
 */

interface MobileUser {
  userId: string;
  userType: 'sales' | 'customer';
  profile: { name: string; phone: string; clinicId: string };
  deviceInfo: { platform: 'ios' | 'android'; pushToken?: string };
}

interface MobileConsultation {
  consultationId: string;
  customerId: string;
  salesStaffId: string;
  status: 'scheduled' | 'completed';
  scheduledAt: string;
  recommendations: { treatments: string[]; estimatedCost: number };
}

interface MobileBooking {
  bookingId: string;
  customerId: string;
  treatmentName: string;
  scheduledDate: string;
  price: number;
  status: 'confirmed' | 'completed';
}

interface ProgressTracking {
  trackingId: string;
  customerId: string;
  treatmentId: string;
  completedSessions: number;
  totalSessions: number;
  improvementScore: number;
  photos: { before: string[]; after: string[] };
}

class MobileSalesApp {
  private static users: Map<string, MobileUser> = new Map();
  private static consultations: Map<string, MobileConsultation> = new Map();
  private static bookings: Map<string, MobileBooking> = new Map();
  private static progress: Map<string, ProgressTracking> = new Map();

  static registerUser(userData: any): MobileUser {
    const userId = `mobile_${Date.now()}`;
    const user: MobileUser = { ...userData, userId };
    this.users.set(userId, user);
    return user;
  }

  static scheduleConsultation(customerId: string, salesStaffId: string, scheduledAt: string): MobileConsultation {
    const consultationId = `consult_${Date.now()}`;
    const consultation: MobileConsultation = {
      consultationId,
      customerId,
      salesStaffId,
      status: 'scheduled',
      scheduledAt,
      recommendations: { treatments: [], estimatedCost: 0 }
    };
    
    this.consultations.set(consultationId, consultation);
    return consultation;
  }

  static bookTreatment(customerId: string, treatmentName: string, scheduledDate: string, price: number): MobileBooking {
    const bookingId = `booking_${Date.now()}`;
    const booking: MobileBooking = {
      bookingId,
      customerId,
      treatmentName,
      scheduledDate,
      price,
      status: 'confirmed'
    };
    
    this.bookings.set(bookingId, booking);
    return booking;
  }

  static startProgressTracking(customerId: string, treatmentId: string, totalSessions: number): ProgressTracking {
    const trackingId = `progress_${customerId}_${treatmentId}`;
    const progress: ProgressTracking = {
      trackingId,
      customerId,
      treatmentId,
      completedSessions: 0,
      totalSessions,
      improvementScore: 0,
      photos: { before: [], after: [] }
    };
    
    this.progress.set(trackingId, progress);
    return progress;
  }

  static getMobileAnalytics(): any {
    return {
      totalUsers: this.users.size,
      consultationsToday: 12,
      bookingsToday: 8,
      activeProgressTracking: this.progress.size,
      averageImprovement: 78
    };
  }
}

export { MobileSalesApp, type MobileUser, type MobileBooking };
