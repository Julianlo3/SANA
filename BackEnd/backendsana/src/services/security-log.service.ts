import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface SecurityAccessLogEntry {
  userId: number;
  sessionId?: string | null;
  section: string;
  message: string;
}

/**
 * Service dedicated to recording security access and unauthorized attempt logs.
 */
@Injectable()
export class SecurityLogService {
  private readonly logger = new Logger(SecurityLogService.name);

  constructor(private readonly dataSource: DataSource) { }

  /**
   * Records an unauthorized access attempt in the security_access_log table.
   * Performs an asynchronous, non-blocking insert to guarantee that logging
   * failures never disrupt standard HTTP error responses.
   * @param entry The security log entry containing user, session, section, and message.
   */
  async logUnauthorizedAccess(entry: SecurityAccessLogEntry): Promise<void> {
    const { userId, sessionId = null, section, message } = entry;
    const cleanSection = (section || 'Unknown Section').substring(0, 100);
    const cleanMessage = (message || 'Unauthorized access attempt').substring(0, 255);

    try {
      await this.dataSource.query(
        `INSERT INTO security_access_log
           (use_id, auth_session_id, security_access_log_section, security_access_log_message)
         VALUES ($1, $2, $3, $4)`,
        [userId, sessionId, cleanSection, cleanMessage],
      );
      this.logger.warn(
        `Security incident recorded [User ID: ${userId}, Session: ${sessionId ?? 'N/A'}, Section: '${cleanSection}']: ${cleanMessage}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record security access log for user ${userId}:`,
        error,
      );
    }
  }

  /**
   * Helper method to log role mismatch attempts when a logged-in user tries to access a restricted section.
   * Applies email masking for privacy and data minimization.
   * @param params The role mismatch details.
   */
  async logRoleMismatch(params: {
    userId: number;
    sessionId?: string | null;
    email: string;
    userRoles: string[];
    requiredRoles: string[];
    section: string;
  }): Promise<void> {
    const { userId, sessionId, email, userRoles, requiredRoles, section } = params;
    const maskedEmail = this.maskEmail(email);
    const message = `User ${maskedEmail} [Roles: ${userRoles.join(', ') || 'None'}] denied access to section requiring [${requiredRoles.join(', ')}].`;

    await this.logUnauthorizedAccess({
      userId,
      sessionId,
      section,
      message,
    });
  }

  /**
   * Masks an email address for privacy / GDPR data minimization (e.g. j***@example.com).
   * @param email The plain email address.
   * @returns The masked email.
   */
  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return 'anonymous';
    const [name, domain] = email.split('@');
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    return `${maskedName}@${domain}`;
  }
}
