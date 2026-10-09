import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface SecurityAccessLogEntry {
  userId: number;
  section: string;
  message: string;
}

export interface SecurityAccessLogRow {
  securityAccessLogId: number;
  userId: number;
  userEmail: string;
  section: string;
  message: string;
  createdAt: string;
}

/**
 * Records shared security access and account-management audit logs.
 */
@Injectable()
export class SecurityLogService {
  private readonly logger = new Logger(SecurityLogService.name);

  constructor(private readonly dataSource: DataSource) { }

  /**
   * Records a security-relevant event in `security_access_log`.
   * Failures are swallowed so logging never breaks the HTTP response.
   */
  async logSecurityEvent(entry: SecurityAccessLogEntry): Promise<void> {
    const { userId, section, message } = entry;
    const cleanSection = (section || 'Unknown Section').substring(0, 100);
    const cleanMessage = (message || 'Security event').substring(0, 255);

    try {
      await this.dataSource.query(
        `INSERT INTO security_access_log (use_id, security_access_log_section, security_access_log_message)
         VALUES ($1, $2, $3)`,
        [userId, cleanSection, cleanMessage],
      );
      this.logger.warn(
        `Module:security-log, Function:logSecurityEvent, result-success: userId-${userId}, section-${cleanSection}, message-${cleanMessage}`,
      );
    } catch (error) {
      this.logger.error(
        `Module:security-log, Function:logSecurityEvent, result-error: reason-log_failed, userId-${userId}, error-${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** @deprecated Prefer {@link logSecurityEvent}; kept for call-site clarity. */
  async logUnauthorizedAccess(entry: SecurityAccessLogEntry): Promise<void> {
    await this.logSecurityEvent(entry);
  }

  /**
   * Helper method to log role mismatch attempts when a logged-in user tries to access a restricted section.
   * Applies email masking for privacy and data minimization.
   */
  async logRoleMismatch(params: {
    userId: number;
    email: string;
    userRoles: string[];
    requiredRoles: string[];
    section: string;
  }): Promise<void> {
    const { userId, email, userRoles, requiredRoles, section } = params;
    const maskedEmail = this.maskEmail(email);
    const message = `User ${maskedEmail} [Roles: ${userRoles.join(', ') || 'None'}] denied access to section requiring [${requiredRoles.join(', ')}].`;

    await this.logSecurityEvent({ userId, section, message });
  }

  /**
   * Persists an admin-driven account status change (block / deactivate / reactivate)
   * for security auditing. Auth0 owns browser sessions; local `auth_sessions` no longer exist.
   */
  async logAccountStatusChange(params: {
    actorUserId: number;
    targetPersonId: number;
    status: string;
    reason?: string;
  }): Promise<void> {
    const { actorUserId, targetPersonId, status, reason } = params;
    const reasonSuffix = reason?.trim() ? `: ${reason.trim()}` : '';
    await this.logSecurityEvent({
      userId: actorUserId,
      section: 'User Management',
      message: `Admin changed person ${targetPersonId} status to '${status}'${reasonSuffix}`,
    });
  }

  /**
   * Masks an email address for privacy / GDPR data minimization (e.g. j***@example.com).
   */
  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return 'anonymous';
    const [name, domain] = email.split('@');
    const maskedName =
      name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    return `${maskedName}@${domain}`;
  }

  /**
   * Finds security access logs with optional filters.
   * @param userId Optional filter by user ID
   * @param startDate Optional filter by start date
   * @param endDate Optional filter by end date
   * @returns Array of security access log entries
   */
  async findSecurityLogs(
    userId?: number,
    startDate?: string,
    endDate?: string,
  ): Promise<SecurityAccessLogRow[]> {
    const params: unknown[] = [];
    let whereClause = 'WHERE 1=1';

    if (userId) {
      params.push(userId);
      whereClause += ` AND sal.use_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      whereClause += ` AND sal.security_access_log_created_at >= $${params.length}::timestamptz`;
    }

    if (endDate) {
      params.push(endDate);
      whereClause += ` AND sal.security_access_log_created_at <= $${params.length}::timestamptz`;
    }

    return this.dataSource.query<SecurityAccessLogRow[]>(
      `SELECT
          sal.security_access_log_id AS "securityAccessLogId",
          sal.use_id AS "userId",
          u.user_provider_id AS "userEmail",
          sal.security_access_log_section AS "section",
          sal.security_access_log_message AS "message",
          sal.security_access_log_created_at AS "createdAt"
       FROM security_access_log sal
       JOIN users u ON u.use_id = sal.use_id
       ${whereClause}
       ORDER BY sal.security_access_log_created_at DESC
       LIMIT 1000`,
      params,
    );
  }
}
