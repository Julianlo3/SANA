import { describe, expect, it } from 'vitest';
import {
  buildAccountCreatedEmail,
  buildAppointmentRequestedEmail,
  buildAppointmentConfirmedPatientEmail,
  buildAppointmentAssignedPsychologistEmail,
  buildAppointmentCancelledEmail,
  renderEmailLayout,
} from '../../src/email/templates/index.js';
import { buildRawMessage } from '../../src/email/email.module.js';

describe('Email Templates & Visual Identity', () => {
  it('renders base layout with SANA brand palette and typography', () => {
    const html = renderEmailLayout({
      title: 'Título de Prueba',
      subtitle: 'Subtítulo informativo',
      preheader: 'Preheader de prueba',
      badge: { text: 'Confirmado', variant: 'success' },
      showHeroImage: true,
      contentHtml: '<p>Contenido de prueba</p>',
      cta: { label: 'Acción Principal', url: 'https://example.com' },
      securityNotice: 'Aviso de seguridad de prueba',
    });

    // Colores oficiales
    expect(html).toContain('#43ACB6'); // Turquesa primario
    expect(html).toContain('#EB5886'); // Rosa acento
    expect(html).toContain('#134176'); // Marino texto
    expect(html).toContain('#FFFDF8'); // Fondo crema cálido
    expect(html).toContain('#FFFFFF'); // Superficie tarjeta
    expect(html).toContain('#E3EDEF'); // Borde sutil

    // Tipografía
    expect(html).toContain('Montserrat');

    // Identidad y Fundación
    expect(html).toContain('Fundación Dejando Huellas Felices');
    expect(html).toContain('SANA');
    expect(html).toContain('Popayán, Cauca');

    // Imágenes CID
    expect(html).toContain('cid:sana-logo');
    expect(html).toContain('cid:sana-hero');

    // Botón CTA
    expect(html).toContain('https://example.com');
    expect(html).toContain('Acción Principal');
  });

  describe('buildAccountCreatedEmail', () => {
    it('generates welcome email with hero banner and google login instructions', () => {
      const email = buildAccountCreatedEmail({
        fullName: 'Laura Gómez',
        email: 'laura@example.com',
        roleName: 'Psicóloga',
        loginUrl: 'https://fundacionhuellitas.vercel.app/',
      });

      expect(email.subject).toContain('Tu cuenta de SANA está lista');
      expect(email.html).toContain('Laura Gómez');
      expect(email.html).toContain('laura@example.com');
      expect(email.html).toContain('Psicóloga');
      expect(email.html).toContain('cid:sana-hero');
      expect(email.html).toContain('cid:sana-logo');
      expect(email.text).toContain('Laura Gómez');
      expect(email.text).toContain('laura@example.com');
    });
  });

  describe('buildAppointmentRequestedEmail', () => {
    it('generates appointment request confirmation with tracking id and patient info', () => {
      const email = buildAppointmentRequestedEmail({
        appId: 105,
        requesterName: 'Carlos Pérez',
        patientName: 'Sofía Pérez',
        appType: 'presencial',
      });

      expect(email.subject).toBe('Recibimos tu solicitud de cita #105');
      expect(email.html).toContain('#105');
      expect(email.html).toContain('Carlos Pérez');
      expect(email.html).toContain('Sofía Pérez');
      expect(email.html).toContain('Presencial');
      expect(email.text).toContain('Radicado: 105');
      expect(email.text).toContain('Paciente: Sofía Pérez');
    });
  });

  describe('buildAppointmentConfirmedPatientEmail', () => {
    it('generates official appointment confirmation with recommendations', () => {
      const email = buildAppointmentConfirmedPatientEmail({
        appId: 201,
        requesterName: 'María Rodríguez',
        patientName: 'Mateo Rodríguez',
        appDate: '25 de noviembre de 2026, 3:00 p. m.',
        appType: 'virtual',
        psychologistName: 'Dra. Andrea Morales',
      });

      expect(email.subject).toContain('Confirmación de tu cita psicológica');
      expect(email.html).toContain('#201');
      expect(email.html).toContain('Mateo Rodríguez');
      expect(email.html).toContain('25 de noviembre de 2026, 3:00 p. m.');
      expect(email.html).toContain('Dra. Andrea Morales');
      expect(email.html).toContain('Virtual');
      expect(email.html).toContain('cid:sana-hero');
      expect(email.text).toContain('Dra. Andrea Morales');
      expect(email.text).toContain('no incluye información clínica');
    });
  });

  describe('buildAppointmentAssignedPsychologistEmail', () => {
    it('generates psychologist agenda notification with confidentiality reminder', () => {
      const email = buildAppointmentAssignedPsychologistEmail({
        appId: 201,
        psychologistName: 'Dr. Andrea Morales',
        patientName: 'Mateo Rodríguez',
        appDate: '25 de noviembre de 2026, 3:00 p. m.',
        appType: 'virtual',
      });

      expect(email.subject).toBe('Nueva cita asignada #201');
      expect(email.html).toContain('#201');
      expect(email.html).toContain('Mateo Rodríguez');
      expect(email.html).toContain('Dr. Andrea Morales');
      expect(email.html).toContain('Recordatorio deontológico');
      expect(email.text).toContain('Nueva cita asignada #201');
    });
  });

  describe('buildAppointmentCancelledEmail', () => {
    it('generates cancellation notice for patient with contact guidance', () => {
      const email = buildAppointmentCancelledEmail({
        appId: 304,
        recipientName: 'Carlos Gómez',
        patientName: 'Carlos Gómez Jr.',
        appDate: '15 de diciembre de 2026, 10:00 a. m.',
        recipientType: 'patient',
      });

      expect(email.subject).toBe('Cita cancelada #304');
      expect(email.html).toContain('#304');
      expect(email.html).toContain('Carlos Gómez Jr.');
      expect(email.html).toContain('15 de diciembre de 2026, 10:00 a. m.');
      expect(email.html).toContain('#FDE9F0'); // Color de acento suave para cancelación
      expect(email.text).toContain('fue cancelada');
    });

    it('generates cancellation notice for psychologist', () => {
      const email = buildAppointmentCancelledEmail({
        appId: 304,
        recipientName: 'Dra. Andrea Morales',
        patientName: 'Carlos Gómez Jr.',
        appDate: '15 de diciembre de 2026, 10:00 a. m.',
        recipientType: 'psychologist',
      });

      expect(email.subject).toBe('Cita cancelada #304');
      expect(email.html).toContain('El espacio ha quedado liberado en tu agenda');
      expect(email.text).toContain('fue cancelada');
    });
  });

  describe('buildRawMessage MIME generation with CID inline assets', () => {
    it('creates multipart/related with inline CID images when html contains cid:sana-logo and cid:sana-hero', () => {
      const raw = buildRawMessage({
        from: 'notificaciones@example.com',
        to: 'user@example.com',
        subject: 'Mensaje con imágenes',
        text: 'Texto plano',
        html: '<p><img src="cid:sana-logo" /><img src="cid:sana-hero" /></p>',
      });

      const decoded = Buffer.from(raw, 'base64url').toString('utf8');

      expect(decoded).toContain('Content-Type: multipart/related');
      expect(decoded).toContain('Content-Type: multipart/alternative');
      expect(decoded).toContain('Content-ID: <sana-logo>');
      expect(decoded).toContain('Content-ID: <sana-hero>');
      expect(decoded).toContain('image/png; name="logo.png"');
      expect(decoded).toContain('image/jpeg; name="hero.jpg"');
    });

    it('creates standard multipart/alternative when html has no inline CID images', () => {
      const raw = buildRawMessage({
        from: 'notificaciones@example.com',
        to: 'user@example.com',
        subject: 'Mensaje simple',
        text: 'Texto plano',
        html: '<p>HTML simple sin imágenes CID</p>',
      });

      const decoded = Buffer.from(raw, 'base64url').toString('utf8');

      expect(decoded).toContain('Content-Type: multipart/alternative');
      expect(decoded).not.toContain('Content-Type: multipart/related');
      expect(decoded).not.toContain('Content-ID: <sana-logo>');
    });
  });
});

