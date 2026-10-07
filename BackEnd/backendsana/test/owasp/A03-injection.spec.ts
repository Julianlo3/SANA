/**
 * OWASP A03:2021 – Injection
 * ============================
 * Verifica que el sistema previene inyección SQL, NoSQL, OS, LDAP.
 * - Uso de DTOs con class-validator para sanitización
 * - ValidationPipe global con whitelist y forbidNonWhitelisted
 * - Consultas parametrizadas (TypeORM, prepared statements)
 * - No se construyen queries con concatenación de strings sin parametrizar
 *
 * Referencia: RNF-SEG-03
 */
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('OWASP A03 – Injection', () => {

  // ─── A03.1 – ValidationPipe global configurado ────────────────────────

  describe('A03.1 – ValidationPipe global con whitelist y forbidNonWhitelisted', () => {
    it('main.ts DEBE configurar ValidationPipe con whitelist: true', async () => {
      const fs = await import('fs');
      const mainPath = new URL('../../src/main.ts', import.meta.url);
      const content = fs.readFileSync(mainPath, 'utf-8');

      expect(content).toContain('whitelist: true');
    });

    it('main.ts DEBE configurar ValidationPipe con forbidNonWhitelisted: true', async () => {
      const fs = await import('fs');
      const mainPath = new URL('../../src/main.ts', import.meta.url);
      const content = fs.readFileSync(mainPath, 'utf-8');

      expect(content).toContain('forbidNonWhitelisted: true');
    });

    it('main.ts DEBE configurar ValidationPipe con transform: true', async () => {
      const fs = await import('fs');
      const mainPath = new URL('../../src/main.ts', import.meta.url);
      const content = fs.readFileSync(mainPath, 'utf-8');

      expect(content).toContain('transform: true');
    });
  });

  // ─── A03.2 – CreateUserDto rechaza SQL injection en campos ────────────

  describe('A03.2 – CreateUserDto valida y rechaza payloads maliciosos', () => {
    it('DEBE rechazar email con intento de inyección SQL', async () => {
      const { CreateUserDto } = await import('../../src/users/dto/create-user.dto.js');
      const dto = plainToInstance(CreateUserDto, {
        fullName: 'Test',
        identityDocument: '123456',
        email: "admin' OR 1=1--@gmail.com",
        phone: '3001234567',
        roleId: 1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('DEBE rechazar identityDocument con caracteres no numéricos (intento de inyección)', async () => {
      const { CreateUserDto } = await import('../../src/users/dto/create-user.dto.js');
      const dto = plainToInstance(CreateUserDto, {
        fullName: 'Test',
        identityDocument: "'; DROP TABLE users;--",
        email: 'test@gmail.com',
        phone: '3001234567',
        roleId: 1,
      });

      const errors = await validate(dto);
      const docError = errors.find((e) => e.property === 'identityDocument');
      expect(docError).toBeDefined();
    });

    it('DEBE rechazar phone con caracteres no numéricos', async () => {
      const { CreateUserDto } = await import('../../src/users/dto/create-user.dto.js');
      const dto = plainToInstance(CreateUserDto, {
        fullName: 'Test',
        identityDocument: '123456',
        email: 'test@gmail.com',
        phone: "3001234567'; DROP TABLE--",
        roleId: 1,
      });

      const errors = await validate(dto);
      const phoneError = errors.find((e) => e.property === 'phone');
      expect(phoneError).toBeDefined();
    });

    it('DEBE rechazar roleId no numérico (intento de inyección)', async () => {
      const { CreateUserDto } = await import('../../src/users/dto/create-user.dto.js');
      const dto = plainToInstance(CreateUserDto, {
        fullName: 'Test',
        identityDocument: '123456',
        email: 'test@gmail.com',
        phone: '3001234567',
        roleId: 'admin',
      });

      const errors = await validate(dto);
      const roleError = errors.find((e) => e.property === 'roleId');
      expect(roleError).toBeDefined();
    });
  });

  // ─── A03.3 – CreateConsultantDto rechaza inyección ────────────────────

  describe('A03.3 – CreateConsultantDto valida campos contra inyección', () => {
    it('DEBE rechazar identityDocument con SQL injection', async () => {
      const { CreateConsultantDto } = await import('../../src/consultants/dto/create-consultant.dto.js');
      const dto = plainToInstance(CreateConsultantDto, {
        fullName: 'Test',
        cardType: 'CC',
        identityDocument: "1' OR '1'='1",
        email: 'test@example.com',
        phone: '3001234567',
        birthdate: '2010-01-01',
        gender: 'M',
        termsAccepted: true,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('DEBE rechazar email inválido con secuencias de escape', async () => {
      const { CreateConsultantDto } = await import('../../src/consultants/dto/create-consultant.dto.js');
      const dto = plainToInstance(CreateConsultantDto, {
        fullName: 'Test',
        cardType: 'CC',
        identityDocument: '123456',
        email: '<script>alert("xss")</script>@test.com',
        phone: '3001234567',
        birthdate: '2010-01-01',
        gender: 'M',
        termsAccepted: true,
      });

      const errors = await validate(dto);
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
    });

    it('DEBE rechazar gender con valores fuera del enum permitido', async () => {
      const { CreateConsultantDto } = await import('../../src/consultants/dto/create-consultant.dto.js');
      const dto = plainToInstance(CreateConsultantDto, {
        fullName: 'Test',
        cardType: 'CC',
        identityDocument: '123456',
        email: 'test@example.com',
        phone: '3001234567',
        birthdate: '2010-01-01',
        gender: "'; DELETE FROM--",
        termsAccepted: true,
      });

      const errors = await validate(dto);
      const genderError = errors.find((e) => e.property === 'gender');
      expect(genderError).toBeDefined();
    });
  });

  // ─── A03.4 – Consultas parametrizadas (no concatenación) ──────────────

  describe('A03.4 – Consultas SQL usan parámetros, no concatenación', () => {
    it('security-log.service.ts DEBE usar parámetros posicionales ($1, $2) en queries', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/security-logs/security-log.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      // INSERT debe usar parámetros
      expect(content).toMatch(/VALUES\s*\(\$1,\s*\$2/);

      // findSecurityLogs debe usar parámetros posicionales dinámicos
      expect(content).toMatch(/\$\{params\.length\}/);
    });

    it('users.service.ts NO DEBE construir queries con template literals que inserten valores directamente', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/users/users.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      // Las queries de búsqueda deben usar QueryBuilder con parámetros, no interpolación
      expect(content).toContain(':email');
      expect(content).toContain(':search');
      expect(content).toContain(':pending');
    });

    it('consultants.service.ts DEBE usar parámetros en todas las queries SQL directas', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/consultants/consultants.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      // Verificar que las queries directas usan parámetros posicionales
      expect(content).toMatch(/\$1/);
    });
  });

  // ─── A03.5 – TypeORM QueryBuilder usa parámetros ──────────────────────

  describe('A03.5 – TypeORM QueryBuilder usa parámetros nombrados o posicionales', () => {
    it('users.service.ts findAll DEBE usar parámetros en la búsqueda de texto', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/users/users.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      // La búsqueda usa LIKE con parámetro, no concatenación
      expect(content).toMatch(/LIKE :search/);
      // El search value se construye con template literal controlado
      expect(content).toMatch(/search.*trim\(\).*toLowerCase\(\)/s);
    });
  });

  // ─── A03.6 – Máxima longitud en campos ────────────────────────────────

  describe('A03.6 – MaxLength en DTOs previene ataques de buffer/cadenas enormes', () => {
    it('CreateUserDto DEBE limitar fullName a 100 caracteres', async () => {
      const { CreateUserDto } = await import('../../src/users/dto/create-user.dto.js');
      const dto = plainToInstance(CreateUserDto, {
        fullName: 'A'.repeat(101),
        identityDocument: '123456',
        email: 'test@gmail.com',
        phone: '3001234567',
        roleId: 1,
      });

      const errors = await validate(dto);
      const nameError = errors.find((e) => e.property === 'fullName');
      expect(nameError).toBeDefined();
    });

    it('CreateUserDto DEBE limitar email a 100 caracteres', async () => {
      const { CreateUserDto } = await import('../../src/users/dto/create-user.dto.js');
      const longEmail = 'a'.repeat(90) + '@gmail.com';
      const dto = plainToInstance(CreateUserDto, {
        fullName: 'Test',
        identityDocument: '123456',
        email: longEmail,
        phone: '3001234567',
        roleId: 1,
      });

      const errors = await validate(dto);
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
    });
  });
});
