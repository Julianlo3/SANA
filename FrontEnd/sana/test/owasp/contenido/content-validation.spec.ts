import { describe, expect, it } from 'vitest';
import { validateMissionVision, buildCardValidator } from '../../../src/features/content/validation/content-validation';

/**
 * OWASP Tests: Pantallas de Administración de Contenido (Misión, Visión, Banners, Imágenes)
 * =========================================================================================
 * Los campos actualizados por los administradores a menudo se reflejan directamente
 * en el frontend para todos los usuarios. Es vital mitigar inyecciones cruzadas (XSS), 
 * o inyecciones SQL que pueden comprometer el sistema desde un actor con privilegios.
 */
describe('OWASP Frontend Security - Contenido Público (Form Validation)', () => {

  describe('Prevención de Inyección y Saneamiento (XSS / SQLi)', () => {
    it('validateMissionVision DEBE rechazar payloads XSS directos como <script>', () => {
      const payload = {
        mission: 'Misión <script>alert(1)</script>',
        vision: 'Visión estándar',
      };
      
      const errors = validateMissionVision(payload);
      
      // Si el validador no está sanitizando o bloqueando XSS, este test fallará
      // indicando que es un falso positivo de seguridad.
      expect(errors.mission).toBeDefined();
      expect(errors.mission).toMatch(/invalido|caracteres/i);
    });

    it('validateMissionVision DEBE rechazar intentos de inyección SQL (comillas, punto y coma)', () => {
      const payload = {
        mission: 'Misión corporativa',
        vision: "Visión'; DROP TABLE content;--",
      };
      
      const errors = validateMissionVision(payload);
      
      expect(errors.vision).toBeDefined();
    });

    it('CardValidator DEBE rechazar inyección en URLs de imágenes (Prevención de SSRF/XSS)', () => {
      const validator = buildCardValidator({
        fields: {},
        image: { required: true, label: 'Imagen', aspectRatio: '16:9' }
      } as any);

      const maliciousPayload = {
        imageUrl: 'javascript:alert("XSS")',
        imageAlt: 'Texto alternativo seguro',
        isActive: true,
      } as any;

      const errors = validator(maliciousPayload);

      // Una URL de imagen debería empezar estrictamente con http/https o rutas absolutas de origen
      expect(errors.imageUrl).toBeDefined();
    });
  });

  describe('Control de Buffer y Longitudes Excesivas (DoS)', () => {
    it('validateMissionVision DEBE rechazar textos ridículamente largos que puedan agotar recursos', () => {
      const hugeText = 'A'.repeat(50000); // 50,000 caracteres
      const payload = {
        mission: hugeText,
        vision: 'Normal',
      };

      const errors = validateMissionVision(payload);

      // Si la validación en frontend no limita el texto, pasará el payload enorme
      expect(errors.mission).toBeDefined();
    });
    
    it('CardValidator DEBE limitar la longitud de imageAlt', () => {
      const validator = buildCardValidator({
        fields: {},
        image: { required: true, label: 'Imagen', aspectRatio: '16:9' }
      } as any);

      const hugeAlt = 'B'.repeat(1000);
      const payload = {
        imageUrl: 'https://ejemplo.com/img.png',
        imageAlt: hugeAlt,
        isActive: true,
      } as any;

      const errors = validator(payload);

      expect(errors.imageAlt).toBeDefined();
    });
  });
});
