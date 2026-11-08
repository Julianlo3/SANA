import { GENERAL_NOTICE, LEGAL_CONTACT, LEGAL_LINKS } from "./legal";

/**
 * Contenido del pie de página.
 * El horario de atención sigue pendiente de confirmar con la fundación.
 */

export const FOOTER_CONTENT = {
  brand: {
    logo: {
      src: "/brand/isotipo.png",
      alt: "",
    },
    name: "Fundación Dejando Huellas Felices",
    description:
      "Acompañamiento psicológico y prevención para niñas, niños y adolescentes.",
  },

  contact: {
    title: "Contacto",
    items: [
      { label: LEGAL_CONTACT.city },
      { label: LEGAL_CONTACT.email, href: `mailto:${LEGAL_CONTACT.email}` },
      {
        label: LEGAL_CONTACT.phone,
        href: `tel:+57${LEGAL_CONTACT.phone.replaceAll(" ", "")}`,
      },
    ],
  },

  links: {
    title: "Enlaces",
    items: [
      { label: "Quiénes somos", href: "/#about" },
      { label: "Programas", href: "/#programs" },
      { label: "Noticias", href: "/#news" },
    ],
  },

  schedule: {
    title: "Horario de atención",
    description: "Horario pendiente de confirmar con la fundación.",
  },

  legalLinks: [LEGAL_LINKS.privacyPolicy, LEGAL_LINKS.terms],

  notice: {
    ...GENERAL_NOTICE,
    email: LEGAL_CONTACT.email,
    policyLink: LEGAL_LINKS.privacyPolicy,
  },

  legal: "Todos los derechos reservados",
} as const;
