import { renderEmailLayout } from './email-layout.js';
import type { GeneratedEmail } from './account-created.template.js';

export interface AppointmentAssignedPsychologistEmailParams {
  appId: number;
  psychologistName?: string | null;
  patientName?: string | null;
  appDate: string;
  appType: string;
  agendaUrl?: string;
}

/**
 * Plantilla enviada al psicólogo/profesional cuando se le asigna una cita en su agenda.
 */
export function buildAppointmentAssignedPsychologistEmail(
  params: AppointmentAssignedPsychologistEmailParams,
): GeneratedEmail {
  const agendaUrl =
    params.agendaUrl || 'https://fundacionhuellitas.vercel.app/iniciar-sesion';

  const psychologistName = params.psychologistName?.trim() || 'profesional';
  const patientName = params.patientName?.trim() || 'el paciente';

  const modalityBadge =
    (params.appType || '').toLowerCase() === 'virtual' ? 'Virtual' : 'Presencial';

  const contentHtml = `
    <p style="margin: 0 0 16px 0;">
      Hola <strong>${escapeHtml(psychologistName)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0;">
      Se ha programado una nueva sesión psicológica en tu agenda institucional de SANA. A continuación encontrarás el resumen de la cita:
    </p>

    <!-- Appointment Details Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5FAFB; border: 1px solid #E3EDEF; border-radius: 8px; margin: 0 0 20px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 10px; font-size: 13px; font-weight: 600; color: #4A6A8C; width: 140px;">Número de Cita:</td>
              <td style="padding-bottom: 10px; font-size: 15px; font-weight: 800; color: #134176;">#${params.appId}</td>
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

    <p style="margin: 0 0 12px 0; font-size: 14px; color: #4A6A8C; line-height: 1.5;">
      Recuerda revisar la ficha del paciente y acceder a la sesión puntualmente desde tu panel de profesional.
    </p>
  `;

  const html = renderEmailLayout({
    title: `Nueva cita asignada #${params.appId}`,
    subtitle: 'Tienes una consulta programada en tu agenda',
    preheader: `Cita #${params.appId} con ${patientName} el ${params.appDate}.`,
    badge: { text: 'Cita Asignada', variant: 'info' },
    showHeroImage: false,
    contentHtml,
    cta: {
      label: 'Ver en mi Agenda',
      url: agendaUrl,
    },
    securityNotice:
      'Recordatorio deontológico: La información del paciente es confidencial y solo debe ser consultada a través del sistema SANA con fines de atención clínica.',
  });

  const text = [
    `Nueva cita asignada #${params.appId}`,
    '',
    `Hola ${psychologistName},`,
    `Tienes una cita confirmada con ${patientName}.`,
    `Fecha y hora: ${params.appDate}`,
    `Modalidad: ${params.appType}`,
    '',
    `Gestiona tu agenda en: ${agendaUrl}`,
  ].join('\n');

  return {
    subject: `Nueva cita asignada #${params.appId}`,
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
