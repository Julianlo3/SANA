import { describe, expect, it } from 'vitest';
import {
  validateFullName,
  validateIdentityDocument,
  validatePhone,
  validateConsultationReason,
  validateEmail
} from '../../../src/features/consultation-requests/validation/consultation-request-validation';

/**
 * OWASP Tests: Solicitud de Citas (Pantalla Pública)
 * ===================================================
 * Esta pantalla es el punto de entrada público más expuesto del sistema.
 * Las pruebas de seguridad aseguran que se rechazan intentos de inyección y
 * se aplican restricciones estrictas sobre los datos ingresados.
 */
describe('OWASP Frontend Security - Solicitar Cita (Form Validation)', () => {

  describe('Prevención de Inyección (SQLi / XSS)', () => {
    it('validateFullName DEBE rechazar payloads XSS (<script>, HTML tags)', () => {
      // El validador de nombres solo debe aceptar letras, acentos y espacios
      expect(validateFullName('<script>alert(1)</script>')).toBeDefined();
      expect(validateFullName('Ana <b>Perez</b>')).toBeDefined();
    });

    it('validateFullName DEBE rechazar intentos de inyección SQL (comillas, punto y coma)', () => {
      expect(validateFullName("Ana'; DROP TABLE users;--")).toBeDefined();
      expect(validateFullName('Juan" OR "1"="1')).toBeDefined();
    });

    it('validateIdentityDocument DEBE rechazar inyecciones (letras y caracteres especiales)', () => {
      expect(validateIdentityDocument("12345';--")).toBeDefined();
      expect(validateIdentityDocument('10293847A')).toBeDefined();
      expect(validateIdentityDocument('<img src=x>')).toBeDefined();
    });

    it('validatePhone DEBE rechazar inyecciones (letras y caracteres especiales)', () => {
      expect(validatePhone("3001234567';")).toBeDefined();
      expect(validatePhone('3001234abc')).toBeDefined();
    });
  });

  describe('Control de Buffer y Longitudes Excesivas (DoS)', () => {
    it('validateFullName DEBE rechazar nombres que superen los 100 caracteres', () => {
      const longName = 'A'.repeat(101);
      expect(validateFullName(longName)).toBe('El nombre no puede pasar de 100 caracteres.');
    });

    it('validateIdentityDocument DEBE rechazar documentos menores de 6 y mayores de 12 dígitos', () => {
      expect(validateIdentityDocument('12345')).toBe('El documento debe tener entre 6 y 12 dígitos.');
      expect(validateIdentityDocument('1234567890123')).toBe('El documento debe tener entre 6 y 12 dígitos.');
    });

    it('validatePhone DEBE rechazar teléfonos extremadamente largos (para prevenir consumo de BD)', () => {
      expect(validatePhone('1234567890123')).toBe('El número debe tener entre 7 y 12 dígitos.');
    });

    it('validateConsultationReason DEBE limitar la longitud para prevenir DoS o agotamiento de DB', () => {
      const hugeReason = 'A'.repeat(1001);
      expect(validateConsultationReason(hugeReason)).toBe('El motivo no puede pasar de 1000 caracteres.');
    });
  });

  describe('Verificación de Formatos Esperados (Type safety & Validation)', () => {
    it('validateEmail DEBE exigir un formato de correo y no solo texto libre', () => {
      expect(validateEmail('no_es_un_correo')).toBeDefined();
      expect(validateEmail('test@')).toBeDefined();
      expect(validateEmail('test@dominio')).toBeDefined(); // No tiene punto
    });
  });

});
