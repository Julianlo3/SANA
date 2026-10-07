/** Textos y enlaces de la navegación pública. */

export const PUBLIC_NAV = {
  logo: {
    src: "/brand/logo-horizontal.png",
    alt: "Fundación Dejando Huellas Felices",
  },
  links: [
    { label: "Quiénes somos", href: "/#about" },
    { label: "Programas", href: "/#programs" },
    { label: "Noticias", href: "/#news" },
    { label: "Contacto", href: "/#contact" },
  ],
  staffAccess: "Personal autorizado",
  staffHref: "/iniciar-sesion",
  requesterAccess: "Consultantes",
  requesterHref: "/iniciar-sesion?tipo=consultante",
  donate: "Dona aquí",
} as const;