import { renderEmailLayout } from './email-layout.js';

export interface AccountCreatedEmailParams {
  fullName?: string | null;
  email: string;
  roleName?: string | null;
  loginUrl?: string;
}

export interface GeneratedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Plantilla de bienvenida cuando se crea o habilita una cuenta de usuario en SANA.
 */
export function buildAccountCreatedEmail(
  params: AccountCreatedEmailParams,
): GeneratedEmail {
  const loginUrl =
    params.loginUrl || 'https://fundacionhuellitas.vercel.app/iniciar-sesion';

  const fullName = params.fullName?.trim() || 'estimado(a) usuario(a)';
  const roleText = params.roleName ? ` con rol de <strong>${escapeHtml(params.roleName)}</strong>` : '';

  const contentHtml = `
    <p style="margin: 0 0 16px 0;">
      Hola <strong>${escapeHtml(fullName)}</strong>,
    </p>
    <p style="margin: 0 0 16px 0;">
      Te damos una cálida bienvenida a <strong>SANA</strong>, el sistema de gestión y atención psicológica de la <strong>Fundación Dejando Huellas Felices</strong>.
    </p>
    <p style="margin: 0 0 20px 0;">
      El administrador creó o habilitó tu cuenta institucional${roleText}. Ya puedes acceder a la plataforma utilizando tu cuenta de Google asociada a este correo.
    </p>

    <!-- Credentials Card -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5FAFB; border: 1px solid #E3EDEF; border-radius: 8px; margin: 0 0 20px 0;">
      <tr>
        <td style="padding: 16px 18px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #4A6A8C; width: 140px;">Correo de acceso:</td>
              <td style="padding-bottom: 8px; font-size: 14px; font-weight: 700; color: #134176;">${escapeHtml(params.email)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; font-weight: 600; color: #4A6A8C;">Método de ingreso:</td>
              <td style="font-size: 14px; color: #134176;">Botón "Continuar con Google"</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px 0; font-size: 14px; color: #4A6A8C;">
      Para comenzar, haz clic en el siguiente botón para iniciar sesión en tu cuenta:
    </p>
  `;

  const html = renderEmailLayout({
    title: '¡Tu cuenta en SANA está lista!',
    subtitle: 'Bienvenido(a) a la Fundación Dejando Huellas Felices',
    preheader: `Hola ${fullName}, tu cuenta en SANA ya está habilitada para ingresar con Google.`,
    badge: { text: 'Cuenta Activa', variant: 'success' },
    showHeroImage: true,
    contentHtml,
    cta: {
      label: 'Ingresar a SANA',
      url: loginUrl,
    },
    securityNotice:
      'Por seguridad, recuerda que solo debes ingresar mediante los enlaces oficiales de la fundación y nunca compartir tus credenciales de Google.',
  });

  const text = [
    `Hola ${fullName},`,
    'El administrador creó o habilitó tu cuenta en SANA.',
    'Ya puedes ingresar con la cuenta de Google asociada a este correo.',
    `Correo de acceso: ${params.email}`,
    '',
    `Enlace de ingreso: ${loginUrl}`,
  ].join('\n');

  return {
    subject: 'Tu cuenta de SANA está lista',
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
