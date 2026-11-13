import { GENERAL_NOTICE, LEGAL_CONTACT, LEGAL_LINKS } from "./legal";

/**
 * Public footer content.
 * The foundation's business hours still require confirmation.
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
      { icon: "location", label: LEGAL_CONTACT.city },
      {
        icon: "email",
        label: LEGAL_CONTACT.email,
        href: `mailto:${LEGAL_CONTACT.email}`,
      },
      {
        icon: "phone",
        label: `+57 ${LEGAL_CONTACT.phone}`,
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
