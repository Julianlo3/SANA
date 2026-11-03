import { renderEmailLayout } from './email-layout.js';
import type { GeneratedEmail } from './account-created.template.js';

export interface AppointmentRequestedEmailParams {
  appId: number;
  requesterName?: string | null;
  patientName?: string | null;
  appType: string;
  portalUrl?: string;
}

/**
 * Plantilla de confirmación de radicación de solicitud de cita para el solicitante.
 */
export function buildAppointmentRequestedEmail(
  params: AppointmentRequestedEmailParams,
): GeneratedEmail {
  const portalUrl =
    params.portalUrl || 'https://fundacionhuellitas.vercel.app/iniciar-sesion';

  const requesterName =
    params.requesterName?.trim() ||
    params.patientName?.trim() ||
    'estimado(a) usuario(a)';

  const patientName = params.patientName?.trim() || 'el paciente';

  const modalityBadge =
    (params.appType || '').toLowerCase() === 'virtual' ? 'Virtual' : 'Presencial';

  const contentHtml = `
    <p style="margin: 0 0 16px 0;">
      Hola <strong>${escapeHtml(requesterName)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0;">
      Hemos recibido tu solicitud de cita psicológica en la <strong>Fundación Dejando Huellas Felices</strong>. Nuestro equipo de coordinación revisará la disponibilidad para asignarte profesional y horario.
    </p>

    <!-- Appointment Summary Card -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5FAFB; border: 1px solid #E3EDEF; border-radius: 8px; margin: 0 0 20px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 10px; font-size: 13px; font-weight: 600; color: #4A6A8C; width: 140px;">Número de Radicado:</td>
              <td style="padding-bottom: 10px; font-size: 15px; font-weight: 800; color: #134176;">#${params.appId}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px; font-size: 13px; font-weight: 600; color: #4A6A8C;">Solicitante:</td>
              <td style="padding-bottom: 10px; font-size: 14px; color: #134176;">${escapeHtml(requesterName)}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px; font-size: 13px; font-weight: 600; color: #4A6A8C;">Paciente:</td>
              <td style="padding-bottom: 10px; font-size: 14px; font-weight: 700; color: #134176;">${escapeHtml(patientName)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; font-weight: 600; color: #4A6A8C;">Modalidad:</td>
              <td style="font-size: 14px; color: #134176;">
                <span style="display: inline-block; background-color: #E4F4F6; color: #2E8C96; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 700;">
                  ${escapeHtml(modalityBadge)}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4A6A8C; line-height: 1.5;">
      Podrás comprobar en todo momento el estado de tu solicitud ingresando a la plataforma SANA con el correo que registraste.
    </p>
  `;

  const html = renderEmailLayout({
    title: `Recibimos tu solicitud de cita #${params.appId}`,
    subtitle: 'Tu solicitud ha sido radicada correctamente',
    preheader: `Solicitud #${params.appId} para ${patientName} radicada en SANA.`,
    badge: { text: `Radicado #${params.appId}`, variant: 'warning' },
    showHeroImage: false,
    contentHtml,
    cta: {
      label: 'Consultar Estado en SANA',
      url: portalUrl,
    },
    securityNotice:
      'Te notificaremos por este mismo medio en cuanto tu cita sea confirmada con fecha, hora y profesional asignado.',
  });

  const text = [
    `Hola ${requesterName},`,
    'Recibimos tu solicitud de cita correctamente.',
    `Radicado: ${params.appId}`,
    `Paciente: ${patientName}`,
    `Modalidad: ${params.appType}`,
    'Podrá comprobar el estado de su cita desde la plataforma SANA iniciando sesión con el correo registrado',
    portalUrl,
  ].join('\n');

  return {
    subject: `Recibimos tu solicitud de cita #${params.appId}`,
    html,
    text,
  };
}

function escapeHtml(value?: string | null): string {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
