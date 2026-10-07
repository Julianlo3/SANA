import { describe, expect, it } from 'vitest';
import {
  validateFullName,
  validateIdentityDocument,
  validateEmail,
  validateContactNumber,
} from '../../../src/features/users/validation/user-validation';

/**
 * OWASP Tests: Panel de Usuarios (Pantalla de Administración)
 * ===========================================================
 * A pesar de estar en una zona restringida, todos los formularios deben validar
 * rígidamente su entrada (Defense in Depth).
 */
describe('OWASP Frontend Security - Crear/Editar Usuario (Form Validation)', () => {

  describe('Prevención de Inyección y Saneamiento', () => {
    it('validateFullName DEBE rechazar caracteres no alfabéticos (ej. script tags o SQL)', () => {
      expect(validateFullName('Admin <script>')).toBeDefined();
      expect(validateFullName("Ana'; SELECT *")).toBeDefined();
    });

    it('validateIdentityDocument DEBE permitir solo dígitos puros', () => {
      expect(validateIdentityDocument('1234567890;')).toBeDefined();
      expect(validateIdentityDocument("123'456")).toBeDefined();
    });

    it('validateContactNumber DEBE permitir solo dígitos puros sin espacios o guiones (previene inyección de comando si fuera el caso)', () => {
      expect(validateContactNumber('300 123 4567')).toBeDefined();
      expect(validateContactNumber('300-123-4567')).toBeDefined();
      expect(validateContactNumber('300123456a')).toBeDefined();
    });
  });

  describe('Limitación de Data Extrema', () => {
    it('validateFullName DEBE frenar payloads gigantes (100+ chars)', () => {
      const hugeName = 'b'.repeat(101);
      expect(validateFullName(hugeName)).toBeDefined();
    });

    it('validateIdentityDocument DEBE ser de longitud controlada (6 a 10 dígitos)', () => {
      expect(validateIdentityDocument('12345')).toBeDefined();
      expect(validateIdentityDocument('12345678901')).toBeDefined();
    });

    it('validateContactNumber DEBE requerir longitud exacta de 10 (seguridad de formato)', () => {
      expect(validateContactNumber('123456789')).toBeDefined();
      expect(validateContactNumber('12345678901')).toBeDefined();
      // Formato correcto:
      expect(validateContactNumber('3001234567')).toBeUndefined();
    });
  });

  describe('Restricción y control de negocio', () => {
    it('validateEmail DEBE denegar dominios inseguros o no corporativos explícitos', () => {
      // La regla de la fundación es bloquear proveedores que no se puedan auditar si deciden usar Google
      expect(validateEmail('test@hotmail.com')).toBeDefined();
      expect(validateEmail('test@outlook.com')).toBeDefined();
      expect(validateEmail('test@yahoo.es')).toBeDefined();
      // Gmail debe ser permitido
      expect(validateEmail('test@gmail.com')).toBeUndefined();
      // Dominios propios
      expect(validateEmail('test@sana.org.co')).toBeUndefined();
    });
  });
});
