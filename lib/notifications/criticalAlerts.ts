/**
 * Critical Alert System - System notifications when quota < 5%
 * As specified in original quota system spec
 */

interface CriticalAlert {
  id: string;
  type: 'quota_critical' | 'quota_depleted' | 'burn_rate_high';
  severity: 'warning' | 'critical' | 'urgent';
  clinicId: string;
  clinicName: string;
  message: string;
  details: {
    currentUsage: number;
    monthlyQuota: number;
    utilizationRate: number;
    estimatedDepletionDate?: string;
    recommendedAction: string;
    estimatedCost?: number;
  };
  timestamp: string;
  acknowledged: boolean;
  actionTaken: boolean;
}

interface NotificationConfig {
  criticalThreshold: number;  // Default 5%
  warningThreshold: number;   // Default 20%
  urgentThreshold: number;    // Default 1%
  enableEmailAlerts: boolean;
  enableSlackAlerts: boolean;
  enableSmsAlerts: boolean;
  recipients: {
    email: string[];
    slack: string[];
    sms: string[];
  };
}

class CriticalAlerts {
  private static alerts: CriticalAlert[] = [];
  private static config: NotificationConfig = {
    criticalThreshold: 5,
    warningThreshold: 20,
    urgentThreshold: 1,
    enableEmailAlerts: true,
    enableSlackAlerts: false,
    enableSmsAlerts: false,
    recipients: {
      email: ['admin@bntest.com'],
      slack: [],
      sms: []
    }
  };

  /**
   * Check quota levels and trigger alerts if necessary
   */
  static async checkQuotaLevels(clinicId: string, clinicName: string, currentUsage: number, monthlyQuota: number): Promise<CriticalAlert | null> {
    const utilizationRate = (currentUsage / monthlyQuota) * 100;
    const remainingPercentage = 100 - utilizationRate;

    // Check if alert should be triggered
    let alertType: 'quota_critical' | 'quota_depleted' | null = null;
    let severity: 'warning' | 'critical' | 'urgent' = 'warning';

    if (remainingPercentage <= this.config.urgentThreshold) {
      alertType = 'quota_depleted';
      severity = 'urgent';
    } else if (remainingPercentage <= this.config.criticalThreshold) {
      alertType = 'quota_critical';
      severity = 'critical';
    } else if (remainingPercentage <= this.config.warningThreshold) {
      alertType = 'quota_critical';
      severity = 'warning';
    }

    if (!alertType) return null;

    // Check if alert already exists for this clinic
    const existingAlert = this.alerts.find(alert => 
      alert.clinicId === clinicId && 
      alert.type === alertType && 
      !alert.acknowledged &&
      Date.now() - new Date(alert.timestamp).getTime() < 3600000 // Within last hour
    );

    if (existingAlert) return null; // Don't spam alerts

    // Create new alert
    const alert: CriticalAlert = {
      id: crypto.randomUUID(),
      type: alertType,
      severity,
      clinicId,
      clinicName,
      message: this.generateAlertMessage(alertType, severity, clinicName, remainingPercentage),
      details: {
        currentUsage,
        monthlyQuota,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
        recommendedAction: this.generateRecommendedAction(severity, remainingPercentage),
        estimatedCost: this.calculateEstimatedTopUpCost(monthlyQuota - currentUsage)
      },
      timestamp: new Date().toISOString(),
      acknowledged: false,
      actionTaken: false
    };

    // Store alert
    this.alerts.push(alert);

    // Send notifications
    await this.sendNotifications(alert);

    console.log(`🚨 Critical Alert Generated: ${alert.message}`);
    return alert;
  }

  /**
   * Check burn rate and trigger high usage alerts
   */
  static async checkBurnRateAlert(clinicId: string, clinicName: string, dailyBurnRate: number, daysUntilDepletion: number | null): Promise<CriticalAlert | null> {
    if (daysUntilDepletion === null || daysUntilDepletion > 7) return null;

    // Check for existing burn rate alert
    const existingAlert = this.alerts.find(alert => 
      alert.clinicId === clinicId && 
      alert.type === 'burn_rate_high' && 
      !alert.acknowledged &&
      Date.now() - new Date(alert.timestamp).getTime() < 86400000 // Within last 24 hours
    );

    if (existingAlert) return null;

    const severity: 'warning' | 'critical' | 'urgent' = 
      daysUntilDepletion <= 1 ? 'urgent' : 
      daysUntilDepletion <= 3 ? 'critical' : 'warning';

    const alert: CriticalAlert = {
      id: crypto.randomUUID(),
      type: 'burn_rate_high',
      severity,
      clinicId,
      clinicName,
      message: `${clinicName}: Burn rate สูงผิดปกติ - คาดว่า quota จะหมดใน ${daysUntilDepletion} วัน`,
      details: {
        currentUsage: 0, // Will be filled by caller
        monthlyQuota: 0, // Will be filled by caller
        utilizationRate: 0,
        estimatedDepletionDate: new Date(Date.now() + (daysUntilDepletion * 24 * 60 * 60 * 1000)).toISOString(),
        recommendedAction: daysUntilDepletion <= 3 
          ? 'ต้องเติม quota ทันที และตรวจสอบสาเหตุการใช้งานสูง'
          : 'เตรียมแผนเติม quota และ monitor การใช้งาน',
        estimatedCost: Math.round(dailyBurnRate * daysUntilDepletion * 60) // ฿60 per scan
      },
      timestamp: new Date().toISOString(),
      acknowledged: false,
      actionTaken: false
    };

    this.alerts.push(alert);
    await this.sendNotifications(alert);

    console.log(`📈 Burn Rate Alert Generated: ${alert.message}`);
    return alert;
  }

  /**
   * Get all active alerts
   */
  static getActiveAlerts(): CriticalAlert[] {
    return this.alerts
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => {
        const severityOrder = { urgent: 3, critical: 2, warning: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Get alerts by clinic
   */
  static getClinicAlerts(clinicId: string): CriticalAlert[] {
    return this.alerts
      .filter(alert => alert.clinicId === clinicId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Acknowledge an alert
   */
  static acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    console.log(`✅ Alert ${alertId} acknowledged by user ${userId}`);
    return true;
  }

  /**
   * Mark alert as action taken
   */
  static markActionTaken(alertId: string, action: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.actionTaken = true;
    alert.details.recommendedAction = `Completed: ${action}`;
    console.log(`🎯 Action taken on alert ${alertId}: ${action}`);
    return true;
  }

  /**
   * Get alert statistics
   */
  static getAlertStats() {
    const now = Date.now();
    const last24Hours = this.alerts.filter(alert => 
      now - new Date(alert.timestamp).getTime() < 86400000
    );
    const last7Days = this.alerts.filter(alert => 
      now - new Date(alert.timestamp).getTime() < 604800000
    );

    return {
      total: this.alerts.length,
      active: this.getActiveAlerts().length,
      last24Hours: last24Hours.length,
      last7Days: last7Days.length,
      byType: {
        quota_critical: this.alerts.filter(a => a.type === 'quota_critical').length,
        quota_depleted: this.alerts.filter(a => a.type === 'quota_depleted').length,
        burn_rate_high: this.alerts.filter(a => a.type === 'burn_rate_high').length
      },
      bySeverity: {
        urgent: this.alerts.filter(a => a.severity === 'urgent').length,
        critical: this.alerts.filter(a => a.severity === 'critical').length,
        warning: this.alerts.filter(a => a.severity === 'warning').length
      },
      actionTaken: this.alerts.filter(a => a.actionTaken).length,
      acknowledged: this.alerts.filter(a => a.acknowledged).length
    };
  }

  /**
   * Private helper methods
   */
  private static generateAlertMessage(type: string, severity: string, clinicName: string, remainingPercentage: number): string {
    const remaining = Math.round(remainingPercentage * 10) / 10;
    
    if (type === 'quota_depleted') {
      return `🚨 URGENT: ${clinicName} - Quota เกือบหมด! เหลือเพียง ${remaining}%`;
    } else if (severity === 'critical') {
      return `⚠️ CRITICAL: ${clinicName} - Quota ใกล้หมด เหลือ ${remaining}% (< 5%)`;
    } else {
      return `⚠️ WARNING: ${clinicName} - Quota เหลือ ${remaining}% - ควรเตรียมแผนเติม`;
    }
  }

  private static generateRecommendedAction(severity: string, remainingPercentage: number): string {
    if (severity === 'urgent') {
      return 'ต้องเติม quota ทันทีเพื่อไม่ให้ระบบหยุดทำงาน';
    } else if (severity === 'critical') {
      return 'เติม quota ภายใน 24 ชั่วโมง และ review การใช้งาน';
    } else {
      return 'วางแผนเติม quota ในสัปดาห์นี้ และ monitor การใช้งาน';
    }
  }

  private static calculateEstimatedTopUpCost(remainingQuota: number): number {
    // Suggest top-up that covers remaining quota + 50% buffer
    const suggestedTopUp = Math.max(50, Math.ceil(remainingQuota * 1.5 / 50) * 50);
    return suggestedTopUp * 48; // ฿48 per scan in top-up packages
  }

  /**
   * Send notifications via configured channels
   */
  private static async sendNotifications(alert: CriticalAlert): Promise<void> {
    try {
      // Email notifications
      if (this.config.enableEmailAlerts && this.config.recipients.email.length > 0) {
        await this.sendEmailNotification(alert);
      }

      // Slack notifications (if configured)
      if (this.config.enableSlackAlerts && this.config.recipients.slack.length > 0) {
        await this.sendSlackNotification(alert);
      }

      // SMS notifications (if configured)
      if (this.config.enableSmsAlerts && this.config.recipients.sms.length > 0) {
        await this.sendSmsNotification(alert);
      }

      // In-app notification (always enabled)
      await this.sendInAppNotification(alert);

    } catch (error) {
      console.error('Failed to send notifications:', error);
    }
  }

  private static async sendEmailNotification(alert: CriticalAlert): Promise<void> {
    // In production, integrate with email service (SendGrid, etc.)
    console.log(`📧 Email Alert Sent: ${alert.message}`);
    console.log(`Recipients: ${this.config.recipients.email.join(', ')}`);
  }

  private static async sendSlackNotification(alert: CriticalAlert): Promise<void> {
    // In production, integrate with Slack API
    console.log(`💬 Slack Alert Sent: ${alert.message}`);
  }

  private static async sendSmsNotification(alert: CriticalAlert): Promise<void> {
    // In production, integrate with SMS service (Twilio, etc.)
    console.log(`📱 SMS Alert Sent: ${alert.message}`);
  }

  private static async sendInAppNotification(alert: CriticalAlert): Promise<void> {
    // Store in NotificationCenter for in-app display
    console.log(`🔔 In-App Notification: ${alert.message}`);
  }

  /**
   * Configuration management
   */
  static updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Critical Alert configuration updated');
  }

  static getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Export alerts for reporting
   */
  static exportAlerts(timeRange?: { start: string; end: string }) {
    let filteredAlerts = this.alerts;

    if (timeRange) {
      const startTime = new Date(timeRange.start).getTime();
      const endTime = new Date(timeRange.end).getTime();
      filteredAlerts = this.alerts.filter(alert => {
        const alertTime = new Date(alert.timestamp).getTime();
        return alertTime >= startTime && alertTime <= endTime;
      });
    }

    return {
      totalAlerts: filteredAlerts.length,
      alerts: filteredAlerts,
      statistics: this.getAlertStats(),
      exportTime: new Date().toISOString()
    };
  }
}

export { CriticalAlerts, type CriticalAlert, type NotificationConfig };
