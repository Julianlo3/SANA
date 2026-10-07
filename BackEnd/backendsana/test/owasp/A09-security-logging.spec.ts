/**
 * OWASP A09:2021 – Security Logging and Monitoring Failures
 * ========================================================
 * Verifica que los eventos críticos de seguridad (logins fallidos, escalamiento, 
 * bloqueos de cuenta, errores severos) queden registrados apropiadamente.
 *
 * Referencia: RNF-AUD-01
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('OWASP A09 – Security Logging and Monitoring Failures', () => {

  describe('A09.1 – Auditoría de accesos denegados (RNF-AUD-01)', () => {
    it('RolesGuard DEBE registrar intentos de acceso no autorizados (logRoleMismatch)', () => {
      const guardPath = path.resolve(__dirname, '../../src/guards/roles.guard.ts');
      const content = fs.readFileSync(guardPath, 'utf-8');

      expect(content).toContain('logRoleMismatch');
      expect(content).toContain('securityLogService');
    });

    it('AuthService DEBE registrar cuentas no autorizadas o bloqueadas intentando login', () => {
      const servicePath = path.resolve(__dirname, '../../src/auth/auth.service.ts');
      const content = fs.readFileSync(servicePath, 'utf-8');

      expect(content).toContain('logDenied');
      expect(content).toContain('logUnauthorizedAccess');
    });
  });

  describe('A09.2 – Auditoría de cambios de cuenta', () => {
    it('UsersService DEBE registrar cambios de estado de cuentas (bloqueo/desactivación)', () => {
      const servicePath = path.resolve(__dirname, '../../src/users/users.service.ts');
      const content = fs.readFileSync(servicePath, 'utf-8');

      expect(content).toContain('logAccountStatusChange');
      expect(content).toContain('securityLogService');
    });
  });

  describe('A09.3 – Los logs de seguridad previenen inyecciones', () => {
    it('SecurityLogService DEBE limpiar/truncar mensajes y secciones antes de guardarlos', () => {
      const servicePath = path.resolve(__dirname, '../../src/security-logs/security-log.service.ts');
      const content = fs.readFileSync(servicePath, 'utf-8');

      // Debe truncar para evitar ataques de agotamiento de espacio en logs (log forging/injection)
      expect(content).toMatch(/\.substring\(0,\s*100\)/);
      expect(content).toMatch(/\.substring\(0,\s*255\)/);
    });
  });
});
