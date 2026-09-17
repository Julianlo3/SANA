import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface SecurityAccessLogEntry {
  userId: number;
  section: string;
  message: string;
}

/**
 * Service dedicated to recording security access and account-management audit logs.
 */
@Injectable()
export class SecurityLogService {
  private readonly logger = new Logger(SecurityLogService.name);

  constructor(private readonly dataSource: DataSource) {}

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
        `Security incident recorded [User ID: ${userId}, Section: '${cleanSection}']: ${cleanMessage}`,
      );
    } catch (error) {
      this.logger.error(`Failed to record security access log for user ${userId}:`, error);
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
}

