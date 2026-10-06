import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Represents the local person and roles used to authorize an identity.
 */
export interface AuthorizationRecord {
  personId: number;
  name: string;
  email: string;
  state: string;
  userId: number | null;
  providerId: string | null;
  providerName: string | null;
  roles: string[];
  termsAccepted: boolean;
  psyTermsAccepted: boolean | null;
}

const AUTHORIZATION_SELECT = `SELECT
    p.per_id AS "personId",
    p.per_name AS name,
    p.per_email AS email,
    p.per_state AS state,
    EXISTS (
      SELECT 1
      FROM policy_acceptance pa
      JOIN policy_documents pd ON pd.pd_id = pa.pd_id
      WHERE pa.per_id = p.per_id
        AND pd.pd_type = 'data_treatment'
        AND pd.pd_id = (
          SELECT current_pd.pd_id
          FROM policy_documents current_pd
          WHERE current_pd.pd_type = 'data_treatment'
          ORDER BY current_pd.pd_effective_from DESC, current_pd.pd_id DESC
          LIMIT 1
        )
        AND pa.dep_id IS NULL
        AND pa.cn_id IS NULL
        AND pa.app_id IS NULL
    ) AS "termsAccepted",
    CASE WHEN psy.psy_id IS NULL THEN NULL ELSE EXISTS (
      SELECT 1
      FROM policy_acceptance pa
      JOIN policy_documents pd ON pd.pd_id = pa.pd_id
      WHERE pa.per_id = p.per_id
        AND pd.pd_type = 'schedule_terms'
        AND pd.pd_id = (
          SELECT current_pd.pd_id
          FROM policy_documents current_pd
          WHERE current_pd.pd_type = 'schedule_terms'
          ORDER BY current_pd.pd_effective_from DESC, current_pd.pd_id DESC
          LIMIT 1
        )
        AND pa.dep_id IS NULL
        AND pa.cn_id IS NULL
        AND pa.app_id IS NULL
    ) END AS "psyTermsAccepted",
    u.use_id AS "userId",
    u.user_provider_id AS "providerId",
    u.user_provider_name AS "providerName",
    COALESCE(array_agg(r.rol_description) FILTER (WHERE r.rol_description IS NOT NULL), '{}') AS roles
  FROM person p
  LEFT JOIN users u ON u.use_id=p.per_id
  LEFT JOIN person_rol pr ON pr.per_id=p.per_id AND pr.pr_active=true
  LEFT JOIN rol r ON r.rol_id=pr.rol_id
  LEFT JOIN psychologist psy ON psy.psy_id=p.per_id`;

/**
 * Repository for handling authentication-related database operations.
 */
@Injectable()
export class AuthRepository {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Finds an authorization record by the user's email.
   * @param email The email to search for.
   * @returns A promise resolving to the authorization record or null if not found.
   */
  async findByEmail(email: string): Promise<AuthorizationRecord | null> {
    const rows = await this.dataSource.query(
      `${AUTHORIZATION_SELECT}
        WHERE lower(p.per_email)=lower($1)
        GROUP BY p.per_id, u.use_id, psy.psy_id`,
      [email],
    );
    return rows[0] ?? null;
  }

  /**
   * Finds an authorization record by the user's ID.
   * @param userId The user ID to search for.
   * @returns A promise resolving to the authorization record or null if not found.
   */
  async findByUserId(userId: number): Promise<AuthorizationRecord | null> {
    const rows = await this.dataSource.query(
      `${AUTHORIZATION_SELECT}
        WHERE u.use_id=$1
        GROUP BY p.per_id, u.use_id, psy.psy_id`,
      [userId],
    );
    return rows[0] ?? null;
  }

  /**
   * Finds an authorization record by the user's provider ID.
   * @param providerId The provider ID to search for.
   * @param providerName The provider name (default: 'auth0').
   * @returns A promise resolving to the authorization record or null if not found.
   */
  async findByProviderId(providerId: string): Promise<AuthorizationRecord | null> {
    const rows = await this.dataSource.query(
      `${AUTHORIZATION_SELECT}
        WHERE u.user_provider_id=$1
        GROUP BY p.per_id, u.use_id, psy.psy_id`,
      [providerId],
    );
    return rows[0] ?? null;
  }

  /**
   * Updates a person's email address.
   * @param personId The ID of the person to update.
   * @param email The new email address.
   */
  async updateEmail(personId: number, email: string): Promise<void> {
    await this.dataSource.query(
      'UPDATE person SET per_email=$1, per_update_date=now() WHERE per_id=$2',
      [email, personId],
    );
  }

  /**
   * Claims a user account for a person.
   * @param personId The ID of the person to claim.
   * @param providerId The provider ID to associate with the user.
   * @param providerName The provider name.
   * @param emailVerified Whether the user's email is verified.
   */
  async claim(personId: number,  providerId: string,providerName: string,emailVerified: boolean,): Promise<void> {
    await this.dataSource.query(
      'INSERT INTO users (use_id,user_provider_id,user_provider_name,user_email_verified) VALUES ($1,$2,$3,$4)',
      [personId, providerId, providerName, emailVerified],
    );
  }

  /**
   * Links a provider to an existing user account.
   * @param userId The ID of the user to link the provider to.
   * @param providerId The provider ID to link.
   * @param providerName The provider name.
   * @param emailVerified Whether the user's email is verified.
   */
  async linkProvider(userId: number,providerId: string,providerName: string,emailVerified: boolean,): Promise<void> {
    await this.dataSource.query(
      'UPDATE users SET user_provider_id=$1, user_provider_name=$2, user_email_verified=$3 WHERE use_id=$4',
      [providerId, providerName, emailVerified, userId],
    );
  }
  
  /**
   * Creates a pending user account.
   * @param email The email of the user.
   * @param name The name of the user.
   * @returns A promise resolving to void.
   */
  async createPending(email: string, name: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const persons = await manager.query(
        'INSERT INTO person (per_name,per_email,per_state) VALUES ($1,$2,$3) RETURNING per_id',
        [name, email, 'pendiente'],
      );
      const personId = persons[0].per_id;
      await manager.query(
        `INSERT INTO person_rol (per_id,rol_id,pr_assigned_at,pr_active) SELECT $1,rol_id,now(),true FROM rol WHERE rol_description='pendiente'`,
        [personId],
      );
    });
  }

  /**
   * Updates the last login timestamp for a user.
   * @param userId The ID of the user.
   */
  async updateLastLogin(userId: number): Promise<void> {
    await this.dataSource.query(
      'UPDATE users SET user_last_login_at=now() WHERE use_id=$1',
      [userId],
    );
  }

  /**
   * Records acceptance of platform terms and conditions by a person.
   * @param personId The ID of the person.
   * @param ipAddress Optional IP address of the acceptor.
   */
  async acceptTerms(personId: number, ipAddress?: string): Promise<void> {
    const pdId = await this.getCurrentPolicyDocumentId('data_treatment');
    if (!pdId) {
      throw new Error('No policy document found for type: data_treatment');
    }

    await this.dataSource.query(
      `INSERT INTO policy_acceptance (per_id, pd_id, pa_ip_address)
       VALUES ($1, $2, $3)
       ON CONFLICT (per_id, pd_id) WHERE dep_id IS NULL AND cn_id IS NULL AND app_id IS NULL DO NOTHING`,
      [personId, pdId, ipAddress ?? null],
    );
  }

  /**
   * Records acceptance of psychologist terms and conditions.
   * @param psychologistId The ID of the psychologist.
   * @param ipAddress Optional IP address of the acceptor.
   */
  async acceptPsychologistTerms(psychologistId: number, ipAddress?: string): Promise<void> {
    const pdId = await this.getCurrentPolicyDocumentId('schedule_terms');
    if (!pdId) {
      throw new Error('No policy document found for type: schedule_terms');
    }

    await this.dataSource.query(
      `INSERT INTO policy_acceptance (per_id, pd_id, pa_ip_address)
       VALUES ($1, $2, $3)
       ON CONFLICT (per_id, pd_id) WHERE dep_id IS NULL AND cn_id IS NULL AND app_id IS NULL DO NOTHING`,
      [psychologistId, pdId, ipAddress ?? null],
    );
  }

  /**
   * Gets the current policy document ID for a given policy type.
   * @param policyType The type of policy.
   * @returns A promise that resolves to the policy document ID or null if not found.
   */
  private async getCurrentPolicyDocumentId(policyType: string): Promise<number | null> {
    const rows = await this.dataSource.query<{ pd_id: number }[]>(
      `SELECT pd_id
       FROM policy_documents
       WHERE pd_type = $1
       ORDER BY pd_effective_from DESC
       LIMIT 1`,
      [policyType],
    );
    return rows[0]?.pd_id ?? null;
  }
}
