import { renderEmailLayout } from './email-layout.js';
import type { GeneratedEmail } from './account-created.template.js';

export interface AppointmentConfirmedPatientEmailParams {
  appId: number;
  requesterName?: string | null;
  patientName?: string | null;
  appDate: string;
  appType: string;
  psychologistName?: string | null;
  portalUrl?: string;
}

/**
 * Plantilla de confirmación de cita psicológica enviada al paciente / solicitante.
 */
export function buildAppointmentConfirmedPatientEmail(
  params: AppointmentConfirmedPatientEmailParams,
): GeneratedEmail {
  const portalUrl =
    params.portalUrl || 'https://fundacionhuellitas.vercel.app/iniciar-sesion';

  const requesterName =
    params.requesterName?.trim() ||
    params.patientName?.trim() ||
    'estimado(a) usuario(a)';

  const patientName = params.patientName?.trim() || 'el paciente';

  const psychologistText =
    params.psychologistName?.trim() || 'Por confirmar';

  const modalityBadge =
    (params.appType || '').toLowerCase() === 'virtual' ? 'Virtual' : 'Presencial';

  const contentHtml = `
    <p style="margin: 0 0 16px 0;">
      Hola <strong>${escapeHtml(requesterName)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0;">
      Nos alegra informarte que la cita para <strong>${escapeHtml(patientName)}</strong> quedó <strong>confirmada</strong> en la Fundación Dejando Huellas Felices.
    </p>

    <!-- Appointment Details Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5FAFB; border: 1px solid #E3EDEF; border-radius: 8px; margin: 0 0 20px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 10px; font-size: 13px; font-weight: 600; color: #4A6A8C; width: 140px;">Cita / Radicado:</td>
              <td style="padding-bottom: 10px; font-size: 14px; font-weight: 800; color: #134176;">#${params.appId}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px; font-size: 13px; font-weight: 600; color: #4A6A8C;">Paciente:</td>
              <td style="padding-bottom: 10px; font-size: 14px; font-weight: 700; color: #134176;">${escapeHtml(patientName)}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px; font-size: 13px; font-weight: 600; color: #4A6A8C;">Fecha y Hora:</td>
              <td style="padding-bottom: 10px; font-size: 15px; font-weight: 700; color: #2E8C96;">${escapeHtml(params.appDate)}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px; font-size: 13px; font-weight: 600; color: #4A6A8C;">Modalidad:</td>
              <td style="padding-bottom: 10px; font-size: 14px; color: #134176;">
                <span style="display: inline-block; background-color: #E4F4F6; color: #2E8C96; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 700;">
                  ${escapeHtml(modalityBadge)}
                </span>
              </td>
            </tr>
            <tr>
              <td style="font-size: 13px; font-weight: 600; color: #4A6A8C;">Profesional:</td>
              <td style="font-size: 14px; color: #134176; font-weight: 600;">${escapeHtml(psychologistText)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="background-color: #FFFDF8; border: 1px solid #FEEFC4; border-radius: 6px; padding: 12px 16px; margin: 0 0 16px 0;">
      <p style="margin: 0; font-size: 13px; color: #134176; line-height: 1.5;">
        <strong>Recomendaciones para tu consulta:</strong>
        <br>&bull; Por favor preséntate o conéctate con 5 minutos de anticipación.
        <br>&bull; Si la modalidad es virtual, asegúrate de estar en un espacio privado y tranquilo.
        <br>&bull; Si necesitas reprogramar, comunícate con nosotros con al menos 24 horas de antelación.
      </p>
    </div>
  `;

  const html = renderEmailLayout({
    title: 'Confirmación de tu cita psicológica',
    subtitle: 'Tu espacio de atención ha sido programado con éxito',
    preheader: `Cita #${params.appId} confirmada para el ${params.appDate} con ${psychologistText}.`,
    badge: { text: 'Cita Confirmada', variant: 'success' },
    showHeroImage: true,
    contentHtml,
    cta: {
      label: 'Ver Cita en SANA',
      url: portalUrl,
    },
    securityNotice:
      'Compromiso de privacidad: Este mensaje no incluye diagnósticos ni información clínica.',
  });

  const text = [
    `Hola ${requesterName},`,
    `La cita para ${patientName} quedó confirmada.`,
    `Fecha y hora: ${params.appDate}`,
    `Modalidad: ${params.appType}`,
    `Profesional: ${psychologistText}`,
    'Este mensaje no incluye información clínica.',
  ].join('\n');

  return {
    subject: 'Confirmación de tu cita psicológica - Fundación Dejando Huellas Felices',
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
