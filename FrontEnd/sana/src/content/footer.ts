/**
 * Contenido del pie de página.
 * Datos de contacto y horario pendientes de confirmar con la fundación.
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
    items: ["correo@pendiente.org", "Teléfono pendiente", "Popayán, Cauca"],
  },

  links: {
    title: "Enlaces",
    items: [
      { label: "Quiénes somos", href: "#about" },
      { label: "Programas", href: "#programs" },
      { label: "Noticias", href: "#news" },
    ],
  },

  schedule: {
    title: "Horario de atención",
    description: "Horario pendiente de confirmar con la fundación.",
  },

  legal: "Todos los derechos reservados",
} as const;