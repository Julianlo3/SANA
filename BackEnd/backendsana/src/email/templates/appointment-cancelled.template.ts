import { renderEmailLayout } from './email-layout.js';
import type { GeneratedEmail } from './account-created.template.js';

export interface AppointmentCancelledEmailParams {
  appId: number;
  recipientName?: string | null;
  patientName?: string | null;
  appDate: string;
  recipientType: 'patient' | 'psychologist';
  actionUrl?: string;
}

/**
 * Plantilla enviada cuando una cita es cancelada (para paciente o profesional).
 */
export function buildAppointmentCancelledEmail(
  params: AppointmentCancelledEmailParams,
): GeneratedEmail {
  const isPatient = params.recipientType === 'patient';
  const defaultUrl = 'https://fundacionhuellitas.vercel.app/iniciar-sesion';
  const actionUrl = params.actionUrl || defaultUrl;

  const recipientName =
    params.recipientName?.trim() ||
    params.patientName?.trim() ||
    (isPatient ? 'estimado(a) usuario(a)' : 'profesional');

  const patientName = params.patientName?.trim() || 'el paciente';

  const messageText = isPatient
    ? `La cita psicológica para <strong>${escapeHtml(patientName)}</strong> programada para el <strong>${escapeHtml(params.appDate)}</strong> ha sido cancelada. Para coordinar una nueva fecha o solicitar un nuevo turno, puedes comunicarte directamente con la fundación o acceder a la plataforma SANA.`
    : `Te informamos que la cita con <strong>${escapeHtml(patientName)}</strong> programada para el <strong>${escapeHtml(params.appDate)}</strong> ha sido cancelada. El espacio ha quedado liberado en tu agenda.`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0;">
      Hola <strong>${escapeHtml(recipientName)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">
      ${messageText}
    </p>

    <!-- Cancelled Appointment Details -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FDE9F0; border: 1px solid #F6B8CE; border-radius: 8px; margin: 0 0 20px 0;">
      <tr>
        <td style="padding: 16px 18px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #C93C68; width: 140px;">Número de Cita:</td>
              <td style="padding-bottom: 8px; font-size: 14px; font-weight: 700; color: #134176;">#${params.appId}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #C93C68;">Paciente:</td>
              <td style="padding-bottom: 8px; font-size: 14px; font-weight: 700; color: #134176;">${escapeHtml(patientName)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; font-weight: 600; color: #C93C68;">Fecha cancelada:</td>
              <td style="font-size: 14px; color: #134176; text-decoration: line-through;">${escapeHtml(params.appDate)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px 0; font-size: 14px; color: #4A6A8C; line-height: 1.5;">
      ${
        isPatient
          ? 'Si tienes inquietudes o requieres reprogramación prioritaria, nuestro equipo de atención se encuentra a tu disposición.'
          : 'Puedes verificar tus citas restantes desde tu agenda institucional.'
      }
    </p>
  `;

  const html = renderEmailLayout({
    title: `Cita cancelada #${params.appId}`,
    subtitle: isPatient ? 'Aviso sobre tu cita psicológica' : 'Actualización en tu agenda de atención',
    preheader: `La cita #${params.appId} para ${patientName} del ${params.appDate} fue cancelada.`,
    badge: { text: 'Cita Cancelada', variant: 'danger' },
    showHeroImage: false,
    contentHtml,
    cta: {
      label: isPatient ? 'Ir a la plataforma SANA' : 'Consultar mi Agenda',
      url: actionUrl,
    },
    securityNotice:
      'Si recibiste esta notificación por error o requieres asistencia inmediata, comunícate con la coordinación de la fundación.',
  });

  const text = isPatient
    ? `La cita para ${patientName} del ${params.appDate} fue cancelada. Para coordinar una nueva fecha, comunícate con la fundación.`
    : `La cita con ${patientName} del ${params.appDate} fue cancelada.`;

  return {
    subject: `Cita cancelada #${params.appId}`,
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
