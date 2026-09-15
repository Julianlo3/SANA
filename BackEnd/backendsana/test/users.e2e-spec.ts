import {
  INestApplication,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';

/**
 * Pruebas de HU-1.2 (creacion directa) y HU-1.3 (editar/bloquear/desactivar/
 * eliminar/reactivar) contra el Postgres real de DataBase/docker-compose.yml.
 * No usan mocks: siembran datos, llaman a los endpoints reales via HTTP y
 * verifican el estado final en la base de datos.
 */
describe('UsersController (e2e, real Postgres)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwt: JwtService;
  let accessSecret: string;
  let origin: string;
  const createdPersonIds: number[] = [];
  let adminPersonId: number;
  let adminToken: string;

  const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const uniqueIdentityDocument = () => unique().slice(-9);
  const uniquePhone = () => `300${unique().slice(-7)}`;

  async function seedPerson(options: {
    email: string;
    roleDescription: string;
    withAccount?: boolean;
  }): Promise<number> {
    const [{ per_id: personId }] = await dataSource.query(
      `INSERT INTO person (per_name, per_identity_document, per_email, per_contact_number, per_state)
       VALUES ($1, $2, $3, $4, 'activo') RETURNING per_id`,
      ['Seed User', 900000000 + Number(unique().slice(-6)), options.email, '3000000000'],
    );
    await dataSource.query(
      `INSERT INTO person_rol (per_id, rol_id, pr_assigned_at, pr_active)
       SELECT $1, rol_id, now(), true FROM rol WHERE rol_description = $2`,
      [personId, options.roleDescription],
    );
    if (options.withAccount) {
      await dataSource.query(
        `INSERT INTO users (use_id, user_provider_id, user_provider_name) VALUES ($1, $2, 'google')`,
        [personId, `provider-${unique()}`],
      );
    }
    createdPersonIds.push(personId);
    return personId;
  }

  async function signAccessToken(personId: number): Promise<string> {
    const sessionId = randomUUID();
    await dataSource.query(
      `INSERT INTO auth_sessions (auth_session_id, use_id, auth_session_refresh_token_hash, auth_session_expires_at, auth_session_last_activity_at)
       VALUES ($1, $2, 'hash', now() + interval '1 day', now())`,
      [sessionId, personId],
    );
    return jwt.signAsync(
      {
        sub: personId,
        personId,
        email: `admin-${personId}@gmail.com`,
        roles: ['administrador'],
        sessionId,
        tokenType: 'access',
      },
      { secret: accessSecret, expiresIn: '15m' },
    );
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    // Replica el bootstrap real (main.ts) tal cual: sin esto el ValidationPipe
    // no corre y las pruebas de DTO invalido pasarian aunque el DTO estuviera roto.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => new UnprocessableEntityException(errors),
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    jwt = app.get(JwtService);
    const config = app.get(ConfigService);
    accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    origin = config.getOrThrow<string>('CORS_ORIGIN').split(',')[0];

    adminPersonId = await seedPerson({
      email: `admin-actor-${unique()}@gmail.com`,
      roleDescription: 'administrador',
      withAccount: true,
    });
    adminToken = await signAccessToken(adminPersonId);
  });

  afterAll(async () => {
    await dataSource.query(
      'DELETE FROM auth_sessions WHERE use_id = ANY($1)',
      [createdPersonIds],
    );
    await dataSource.query(
      'DELETE FROM appointments WHERE req_id = ANY($1) OR app_patient_person_id = ANY($1) OR psy_id = ANY($1) OR sec_id = ANY($1)',
      [createdPersonIds],
    );
    await dataSource.query('DELETE FROM psychologist WHERE psy_id = ANY($1)', [
      createdPersonIds,
    ]);
    await dataSource.query('DELETE FROM users WHERE use_id = ANY($1)', [
      createdPersonIds,
    ]);
    await dataSource.query('DELETE FROM person_rol WHERE per_id = ANY($1)', [
      createdPersonIds,
    ]);
    await dataSource.query('DELETE FROM person WHERE per_id = ANY($1)', [
      createdPersonIds,
    ]);
    await app.close();
  });

  function authed(req: request.Test) {
    return req.set('Origin', origin).set('Authorization', `Bearer ${adminToken}`);
  }

  describe('auth boundary', () => {
    it('rejects requests without an access token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Origin', origin)
        .expect(401);
    });

    it('rejects an authenticated actor without the administrator role', async () => {
      const secretaryId = await seedPerson({
        email: `secretary-${unique()}@gmail.com`,
        roleDescription: 'secretario',
        withAccount: true,
      });
      const token = await signAccessToken(secretaryId);
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Origin', origin)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('POST /users (HU-1.2)', () => {
    it('creates a person with a single assignable role', async () => {
      const email = `new-user-${unique()}@gmail.com`;
      const phone = uniquePhone();
      const response = await authed(
        request(app.getHttpServer()).post('/api/v1/users'),
      ).send({
        fullName: 'Elena Navarro',
        identityDocument: uniqueIdentityDocument(),
        email,
        phone,
        roleId: 5,
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        fullName: 'Elena Navarro',
        email,
        phone,
        status: 'active',
        roles: [{ id: 5, name: 'psicologo', active: true }],
      });
      createdPersonIds.push(response.body.id);

      const rows = await dataSource.query(
        'SELECT per_contact_number FROM person WHERE per_id = $1',
        [response.body.id],
      );
      expect(rows[0].per_contact_number).toBe(phone);
    });

    it('rejects a role that is not assignable to system accounts', async () => {
      await authed(request(app.getHttpServer()).post('/api/v1/users'))
        .send({
          fullName: 'Invalid Role',
          identityDocument: uniqueIdentityDocument(),
          email: `invalid-role-${unique()}@gmail.com`,
          phone: uniquePhone(),
          roleId: 3, // consultante
        })
        .expect(400);
    });

    it('rejects a non-Google email', async () => {
      await authed(request(app.getHttpServer()).post('/api/v1/users'))
        .send({
          fullName: 'Not Google',
          identityDocument: uniqueIdentityDocument(),
          email: `not-google-${unique()}@outlook.com`,
          phone: uniquePhone(),
          roleId: 4,
        })
        .expect(422);
    });

    it('rejects an email that already belongs to a claimed account', async () => {
      const existingEmail = `already-active-${unique()}@gmail.com`;
      await seedPerson({ email: existingEmail, roleDescription: 'marketing', withAccount: true });

      await authed(request(app.getHttpServer()).post('/api/v1/users'))
        .send({
          fullName: 'Duplicate',
          identityDocument: uniqueIdentityDocument(),
          email: existingEmail,
          phone: uniquePhone(),
          roleId: 4,
        })
        .expect(409);
    });

    it('promotes a pending person (one who tried to log in before being created) instead of failing', async () => {
      const pendingEmail = `pending-${unique()}@gmail.com`;
      const pendingId = await seedPerson({
        email: pendingEmail,
        roleDescription: 'pendiente',
      });
      await dataSource.query(
        "UPDATE person SET per_state = 'pendiente' WHERE per_id = $1",
        [pendingId],
      );

      const response = await authed(
        request(app.getHttpServer()).post('/api/v1/users'),
      )
        .send({
          fullName: 'Promoted User',
          identityDocument: uniqueIdentityDocument(),
          email: pendingEmail,
          phone: uniquePhone(),
          roleId: 1,
        })
        .expect(201);

      expect(response.body.id).toBe(pendingId);
      expect(response.body.status).toBe('active');
    });
  });

  describe('GET /users (HU-1.3)', () => {
    it('lists users and filters by status and search', async () => {
      const email = `list-user-${unique()}@gmail.com`;
      const id = await seedPerson({ email, roleDescription: 'secretario' });

      const all = await authed(request(app.getHttpServer()).get('/api/v1/users')).expect(200);
      expect(all.body.some((user: { id: number }) => user.id === id)).toBe(true);

      const filtered = await authed(
        request(app.getHttpServer()).get('/api/v1/users').query({ search: email }),
      ).expect(200);
      expect(filtered.body).toHaveLength(1);
      expect(filtered.body[0].id).toBe(id);
    });
  });

  describe('PATCH /users/:id (HU-1.3, editar + roles multiples)', () => {
    it('updates basic data and replaces the role set, keeping several active roles', async () => {
      const id = await seedPerson({
        email: `edit-user-${unique()}@gmail.com`,
        roleDescription: 'psicologo',
      });

      const response = await authed(
        request(app.getHttpServer()).patch(`/api/v1/users/${id}`),
      )
        .send({
          fullName: 'Updated Name',
          phone: '3009999999',
          roles: [
            { roleId: 5, active: true },
            { roleId: 2, active: false },
          ],
        })
        .expect(200);

      expect(response.body.fullName).toBe('Updated Name');
      expect(response.body.phone).toBe('3009999999');
      expect(response.body.roles).toEqual(
        expect.arrayContaining([
          { id: 5, name: 'psicologo', active: true },
          { id: 2, name: 'marketing', active: false },
        ]),
      );
    });
  });

  describe('PATCH /users/:id/status (HU-1.3, bloquear/desactivar/reactivar)', () => {
    it('blocks a user and revokes their active sessions', async () => {
      const id = await seedPerson({
        email: `block-user-${unique()}@gmail.com`,
        roleDescription: 'secretario',
        withAccount: true,
      });
      await signAccessToken(id); // crea una sesion activa de esta persona

      const response = await authed(
        request(app.getHttpServer()).patch(`/api/v1/users/${id}/status`),
      )
        .send({ status: 'blocked', reason: 'Licencia temporal' })
        .expect(200);

      expect(response.body.status).toBe('blocked');

      const sessions = await dataSource.query(
        'SELECT auth_session_revoked_at FROM auth_sessions WHERE use_id = $1',
        [id],
      );
      expect(sessions.every((s: { auth_session_revoked_at: Date | null }) => s.auth_session_revoked_at !== null)).toBe(true);
    });

    it('reactivates a user keeping its previous role', async () => {
      const id = await seedPerson({
        email: `reactivate-user-${unique()}@gmail.com`,
        roleDescription: 'marketing',
      });
      await dataSource.query("UPDATE person SET per_state = 'inactivo' WHERE per_id = $1", [id]);

      const response = await authed(
        request(app.getHttpServer()).patch(`/api/v1/users/${id}/status`),
      )
        .send({ status: 'active' })
        .expect(200);

      expect(response.body.status).toBe('active');
      expect(response.body.roles).toEqual([{ id: 2, name: 'marketing', active: true }]);
    });
  });

  describe('DELETE /users/:id (HU-1.3)', () => {
    it('deletes a person with no associated records', async () => {
      const id = await seedPerson({
        email: `delete-user-${unique()}@gmail.com`,
        roleDescription: 'marketing',
      });

      await authed(request(app.getHttpServer()).delete(`/api/v1/users/${id}`)).expect(204);

      const rows = await dataSource.query('SELECT 1 FROM person WHERE per_id = $1', [id]);
      expect(rows).toHaveLength(0);
      createdPersonIds.splice(createdPersonIds.indexOf(id), 1);
    });

    it('refuses to delete a person with an appointment on record', async () => {
      const id = await seedPerson({
        email: `has-appointments-${unique()}@gmail.com`,
        roleDescription: 'marketing',
      });
      const secretaryId = adminPersonId;
      const psychologistId = await seedPerson({
        email: `psy-for-appt-${unique()}@gmail.com`,
        roleDescription: 'psicologo',
        withAccount: true,
      });
      await dataSource.query(
        `INSERT INTO psychologist (psy_id, psy_license_number, psy_speciality)
         VALUES ($1, 12345, 'clinica') ON CONFLICT DO NOTHING`,
        [psychologistId],
      );
      await dataSource.query(
        `INSERT INTO appointments (psy_id, sec_id, req_id, app_patient_person_id, app_date, app_state, app_type)
         VALUES ($1, $2, $3, $3, now(), 'agendada', 'presencial')`,
        [psychologistId, secretaryId, id],
      );

      const response = await authed(
        request(app.getHttpServer()).delete(`/api/v1/users/${id}`),
      ).expect(409);

      expect(response.body.error).toBe('USER_HAS_RECORDS');
      expect(response.body.details.appointments).toBeGreaterThan(0);
    });
  });
});
