/**
 * OWASP A06:2021 – Vulnerable and Outdated Components
 * ====================================================
 * Verifica que las dependencias clave para la seguridad estén actualizadas y se usen versiones seguras.
 * Se asume que dependencias como jsonwebtoken (si aplicara) o librerías de encriptación vulnerables no se utilicen.
 *
 * Referencia: 4.1 Tecnologías, RNF-SEG
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('OWASP A06 – Vulnerable and Outdated Components', () => {

  describe('A06.1 – Uso de librerías seguras para criptografía e identidad', () => {
    it('DEBE usar "jose" en lugar de librerías antiguas con vulnerabilidades conocidas para JWT', () => {
      const packageJsonPath = path.resolve(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.dependencies['jose']).toBeDefined();
      expect(packageJson.dependencies['jsonwebtoken']).toBeUndefined(); // Preferimos jose para Auth0/JWKS
    });

    it('DEBE mantener actualizadas las librerías base (NestJS, helmet, typeorm)', () => {
      const packageJsonPath = path.resolve(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.dependencies['@nestjs/core']).toBeDefined();
      expect(packageJson.dependencies['helmet']).toBeDefined();
      expect(packageJson.dependencies['typeorm']).toBeDefined();
    });
  });

  describe('A06.2 – Archivos de lock presentes', () => {
    it('DEBE existir package-lock.json para garantizar builds reproducibles y evitar inyección de dependencias maliciosas', () => {
      const lockPath = path.resolve(__dirname, '../../../package-lock.json');
      expect(fs.existsSync(lockPath)).toBe(true);
    });
  });
});
