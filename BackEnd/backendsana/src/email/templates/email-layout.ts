/**
 * Layout base responsivo para correos electrónicos de SANA.
 * Basado en la paleta y tipografía oficial de la Fundación Dejando Huellas Felices.
 * Diseñado para ser extremadamente liviano (<30 KB con imágenes) y compatible con todos los clientes.
 */

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info';

export interface EmailBadge {
  text: string;
  variant?: BadgeVariant;
}

export interface EmailCta {
  label: string;
  url: string;
}

export interface EmailLayoutOptions {
  title: string;
  subtitle?: string;
  preheader?: string;
  badge?: EmailBadge;
  showHeroImage?: boolean;
  contentHtml: string;
  cta?: EmailCta;
  securityNotice?: string;
}

const BADGE_STYLES: Record<BadgeVariant, { bg: string; border: string; color: string }> = {
  success: { bg: '#E4F4F6', border: '#A0D6DF', color: '#2E8C96' },
  warning: { bg: '#FEEFC4', border: '#FAD980', color: '#134176' },
  danger: { bg: '#FDE9F0', border: '#F6B8CE', color: '#C93C68' },
  info: { bg: '#E4F4F6', border: '#A0D6DF', color: '#134176' },
};

/**
 * Renderiza el cascarón HTML completo del correo electrónico.
 */
export function renderEmailLayout(options: EmailLayoutOptions): string {
  const badgeHtml = options.badge
    ? (() => {
        const variant = options.badge.variant ?? 'info';
        const style = BADGE_STYLES[variant];
        return `
          <div style="margin: 0 0 16px 0;">
            <span style="display: inline-block; background-color: ${style.bg}; border: 1px solid ${style.border}; color: ${style.color}; padding: 4px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
              ${options.badge.text}
            </span>
          </div>`;
      })()
    : '';

  const heroHtml = options.showHeroImage
    ? `
      <div style="margin: 0 0 24px 0; text-align: center;">
        <img src="cid:sana-hero" alt="Fundación Dejando Huellas Felices" width="552" style="display: block; width: 100%; max-width: 552px; height: auto; border-radius: 8px; border: 0;" />
      </div>`
    : '';

  const ctaHtml = options.cta
    ? `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 10px 0;">
        <tr>
          <td align="center" style="border-radius: 8px; background-color: #43ACB6;">
            <a href="${options.cta.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 8px; border: 1px solid #2E8C96;">
              ${options.cta.label}
            </a>
          </td>
        </tr>
      </table>`
    : '';

  const securityNoticeHtml = options.securityNotice
    ? `
      <div style="margin-top: 24px; padding: 12px 16px; background-color: #F5FAFB; border-left: 3px solid #43ACB6; border-radius: 4px; font-size: 13px; color: #4A6A8C; line-height: 1.5;">
        ${options.securityNotice}
      </div>`
    : '';

  const preheaderHtml = options.preheader
    ? `<div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #FFFDF8;">${options.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${options.title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #FFFDF8; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-card { padding: 20px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFDF8; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${preheaderHtml}

  <!-- Backdrop -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFDF8; min-height: 100%;">
    <tr>
      <td align="center" style="padding: 24px 12px 36px 12px;">

        <!-- Main Container (max 600px) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto;">

          <!-- Top Brand Accent Bar -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="height: 4px; border-radius: 12px 12px 0 0; overflow: hidden;">
                <tr>
                  <td width="70%" style="background-color: #43ACB6; height: 4px; font-size: 1px; line-height: 1px;">&nbsp;</td>
                  <td width="30%" style="background-color: #EB5886; height: 4px; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="email-card" style="background-color: #FFFFFF; border: 1px solid #E3EDEF; border-top: none; border-radius: 0 0 12px 12px; padding: 32px 28px; box-shadow: 0 4px 12px rgba(19, 65, 118, 0.04);">

              <!-- Header with Logo -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <img src="cid:sana-logo" alt="SANA — Fundación Dejando Huellas Felices" width="190" style="display: block; max-width: 190px; width: 100%; height: auto; border: 0;" />
                  </td>
                </tr>
              </table>

              <!-- Hero Banner if requested -->
              ${heroHtml}

              <!-- Badge -->
              ${badgeHtml}

              <!-- Title -->
              <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #134176; line-height: 1.3;">
                ${options.title}
              </h1>

              ${
                options.subtitle
                  ? `<p style="margin: 0 0 20px 0; font-size: 15px; color: #4A6A8C; line-height: 1.5;">${options.subtitle}</p>`
                  : '<div style="margin-bottom: 16px;"></div>'
              }

              <!-- Main Content Body -->
              <div style="font-size: 15px; color: #134176; line-height: 1.6;">
                ${options.contentHtml}
              </div>

              <!-- CTA Button -->
              ${ctaHtml}

              <!-- Security / Privacy Notice inside card -->
              ${securityNoticeHtml}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 16px 0 16px; text-align: center; font-size: 12px; color: #8296AC; line-height: 1.5;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #4A6A8C;">
                Fundación Dejando Huellas Felices — Plataforma SANA
              </p>
              <p style="margin: 0 0 8px 0;">
                Popayán, Cauca, Colombia &bull; Salud Mental y Acompañamiento Psicológico
              </p>
              <p style="margin: 0 0 6px 0; font-size: 11px;">
                Este es un mensaje institucional automático. Por favor no respondas directamente a este correo.
              </p>
              <p style="margin: 0; font-size: 11px; color: #A0D6DF;">
                Protección de datos personales conforme a la Ley 1581 de 2012 (Habeas Data). Este correo no incluye historia clínica ni diagnósticos confidenciales.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

