// Comprehensive Audit Logging System for BN-Aura
// Tracks all critical actions for security and compliance

import { createAdminClient } from '@/lib/supabase/admin';
import InputValidator from './input-validator';

export interface AuditLogEntry {
  id?: string;
  user_id?: string;
  clinic_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security';
  status: 'success' | 'failure' | 'warning';
  metadata?: Record<string, any>;
}

export interface AuditLogFilter {
  user_id?: string;
  clinic_id?: string;
  action?: string;
  resource_type?: string;
  severity?: AuditLogEntry['severity'];
  category?: AuditLogEntry['category'];
  status?: AuditLogEntry['status'];
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

class AuditLogger {
  private static instance: AuditLogger;
  private adminClient = createAdminClient();
    // @ts-ignore
  private validator = InputValidator.getInstance();

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      // Sanitize and validate input
      const sanitizedEntry = this.sanitizeAuditEntry(entry);
      
      // Add timestamp
      const auditEntry: AuditLogEntry = {
        ...sanitizedEntry,
        timestamp: new Date().toISOString()
      };

      // Store in database
      const { error } = await this.adminClient
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to log audit entry:', error);
        // Don't throw - audit logging failure shouldn't break the application
      }

      // Check for critical security events and send alerts
      if (auditEntry.severity === 'critical') {
        await this.sendSecurityAlert(auditEntry);
      }

    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  /**
   * Query audit logs
   */
  async getLogs(filter: AuditLogFilter = {}): Promise<{
    logs: AuditLogEntry[];
    total: number;
  }> {
    try {
      let query = this.adminClient
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      if (filter.clinic_id) {
        query = query.eq('clinic_id', filter.clinic_id);
      }
      if (filter.action) {
        query = query.eq('action', filter.action);
      }
      if (filter.resource_type) {
        query = query.eq('resource_type', filter.resource_type);
      }
      if (filter.severity) {
        query = query.eq('severity', filter.severity);
      }
      if (filter.category) {
        query = query.eq('category', filter.category);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.start_date) {
        query = query.gte('timestamp', filter.start_date);
      }
      if (filter.end_date) {
        query = query.lte('timestamp', filter.end_date);
      }

      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 20) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        logs: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Get audit logs error:', error);
      return {
        logs: [],
        total: 0
      };
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(filter: Partial<AuditLogFilter> = {}): Promise<{
    totalLogs: number;
    criticalEvents: number;
    failedLogins: number;
    dataAccessEvents: number;
    topUsers: Array<{ user_id: string; count: number }>;
    topActions: Array<{ action: string; count: number }>;
    recentActivity: AuditLogEntry[];
  }> {
    try {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Get recent logs
      const { logs: recentLogs } = await this.getLogs({
        start_date: dayAgo,
        limit: 100,
        ...filter
      });

      // Count by category
      const criticalEvents = recentLogs.filter(log => log.severity === 'critical').length;
      const failedLogins = recentLogs.filter(log => 
        log.action === 'login' && log.status === 'failure'
      ).length;
      const dataAccessEvents = recentLogs.filter(log => 
        log.category === 'data_access'
      ).length;

      // Top users
      const userCounts = recentLogs.reduce((acc, log) => {
        if (log.user_id) {
          acc[log.user_id] = (acc[log.user_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topUsers = Object.entries(userCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([user_id, count]) => ({ user_id, count }));

      // Top actions
      const actionCounts = recentLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topActions = Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      return {
        totalLogs: recentLogs.length,
        criticalEvents,
        failedLogins,
        dataAccessEvents,
        topUsers,
        topActions,
        recentActivity: recentLogs.slice(0, 10)
      };
    } catch (error) {
      console.error('Get audit statistics error:', error);
      return {
        totalLogs: 0,
        criticalEvents: 0,
        failedLogins: 0,
        dataAccessEvents: 0,
        topUsers: [],
        topActions: [],
        recentActivity: []
      };
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(event: {
    user_id?: string;
    action: 'login' | 'logout' | 'register' | 'password_reset' | 'password_change';
    status: 'success' | 'failure';
    details?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    await this.log({
      user_id: event.user_id,
      action: event.action,
      resource_type: 'user',
      details: event.details || {},
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      severity: event.status === 'failure' ? 'high' : 'low',
      category: 'authentication',
      status: event.status
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(event: {
    user_id: string;
    clinic_id?: string;
    action: 'read' | 'export' | 'search';
    resource_type: string;
    resource_id?: string;
    details?: Record<string, any>;
    ip_address?: string;
  }): Promise<void> {
    await this.log({
      user_id: event.user_id,
      clinic_id: event.clinic_id,
      action: event.action,
      resource_type: event.resource_type,
      resource_id: event.resource_id,
      details: event.details || {},
      ip_address: event.ip_address,
      severity: 'low',
      category: 'data_access',
      status: 'success'
    });
  }

  /**
   * Log data modification events
   */
  async logDataModification(event: {
    user_id: string;
    clinic_id?: string;
    action: 'create' | 'update' | 'delete';
    resource_type: string;
    resource_id?: string;
    details: Record<string, any>;
    ip_address?: string;
  }): Promise<void> {
    await this.log({
      user_id: event.user_id,
      clinic_id: event.clinic_id,
      action: event.action,
      resource_type: event.resource_type,
      resource_id: event.resource_id,
      details: event.details,
      ip_address: event.ip_address,
      severity: event.action === 'delete' ? 'medium' : 'low',
      category: 'data_modification',
      status: 'success'
    });
  }

  /**
   * Log security events
   */
  async logSecurity(event: {
    user_id?: string;
    action: string;
    details: Record<string, any>;
    severity: 'medium' | 'high' | 'critical';
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    await this.log({
      user_id: event.user_id,
      action: event.action,
      resource_type: 'system',
      details: event.details,
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      severity: event.severity,
      category: 'security',
      status: 'warning'
    });
  }

  /**
   * Sanitize audit entry to prevent injection
   */
  private sanitizeAuditEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Omit<AuditLogEntry, 'id' | 'timestamp'> {
    const sanitized = {
      ...entry,
      action: this.validator.sanitizeString(entry.action),
      resource_type: this.validator.sanitizeString(entry.resource_type),
      details: this.validator.validateSqlParams(entry.details || {}),
      ip_address: this.validator.sanitizeString(entry.ip_address || ''),
      user_agent: this.validator.sanitizeString(entry.user_agent || ''),
      metadata: entry.metadata ? this.validator.validateSqlParams(entry.metadata) : undefined
    };

    return sanitized;
  }

  /**
   * Send security alert for critical events
   */
  private async sendSecurityAlert(entry: AuditLogEntry): Promise<void> {
    try {
      // In a real implementation, this would send notifications via:
      // - Email
      // - Slack/Teams
      // - SMS
      // - Push notifications
      
      console.error('CRITICAL SECURITY EVENT:', {
        action: entry.action,
        user_id: entry.user_id,
        details: entry.details,
        timestamp: entry.timestamp
      });
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  async cleanup(retentionDays: number = 365): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { error } = await this.adminClient
        .from('audit_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) {
        throw error;
      }

      console.log(`Cleaned up audit logs older than ${retentionDays} days`);
    } catch (error) {
      console.error('Failed to cleanup audit logs:', error);
    }
  }

  /**
   * Export audit logs for compliance
   */
  async exportLogs(filter: AuditLogFilter = {}): Promise<{
    data: string;
    filename: string;
    mimeType: string;
  }> {
    try {
      const { logs } = await this.getLogs(filter);
      
      const csvData = this.convertToCSV(logs);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      return {
        data: csvData,
        filename: `audit-logs-${timestamp}.csv`,
        mimeType: 'text/csv'
      };
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      throw new Error('Failed to export audit logs');
    }
  }

  /**
   * Convert logs to CSV format
   */
  private convertToCSV(logs: AuditLogEntry[]): string {
    const headers = [
      'timestamp', 'user_id', 'clinic_id', 'action', 'resource_type',
      'resource_id', 'severity', 'category', 'status', 'ip_address',
      'user_agent', 'details'
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.timestamp,
        log.user_id || '',
        log.clinic_id || '',
        log.action,
        log.resource_type,
        log.resource_id || '',
        log.severity,
        log.category,
        log.status,
        log.ip_address || '',
        log.user_agent || '',
        JSON.stringify(log.details).replace(/"/g, '""')
      ].map(field => `"${field}"`).join(','))
    ];

    return csvRows.join('\n');
  }
}

/**
 * Middleware for automatic audit logging
 */
export function withAuditLogging(options: {
  action: string;
  resourceType: string;
  category?: AuditLogEntry['category'];
  getUserId?: (req: Request) => string | undefined;
  getClinicId?: (req: Request) => string | undefined;
}) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(req: Request, ...args: any[]) {
      const auditLogger = AuditLogger.getInstance();
      const startTime = Date.now();
      
      try {
        // Get user and clinic IDs
        const userId = options.getUserId?.(req);
        const clinicId = options.getClinicId?.(req);
        
        // Get request metadata
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                  req.headers.get('x-real-ip') || 
                  'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        // Execute the original method
        const result = await method.apply(this, [req, ...args]);
        
        // Log successful execution
        await auditLogger.log({
          user_id: userId,
          clinic_id: clinicId,
          action: options.action,
          resource_type: options.resourceType,
          details: {
            duration: Date.now() - startTime,
            method: req.method,
            url: req.url
          },
          ip_address: ip,
          user_agent: userAgent,
          severity: 'low',
          category: options.category || 'data_access',
          status: 'success'
        });

        return result;
      } catch (error) {
        // Log failed execution
        const userId = options.getUserId?.(req);
        const clinicId = options.getClinicId?.(req);
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        
        await auditLogger.log({
          user_id: userId,
          clinic_id: clinicId,
          action: options.action,
          resource_type: options.resourceType,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime,
            method: req.method,
            url: req.url
          },
          ip_address: ip,
          severity: 'medium',
          category: 'security',
          status: 'failure'
        });

        throw error;
      }
    };
  };
}

export default AuditLogger.getInstance();
