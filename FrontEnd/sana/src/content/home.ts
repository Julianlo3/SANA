/**
 * Contenido de la página de inicio.
 *
 * Todo el texto y las rutas de imagen viven aquí para que se puedan cambiar
 * sin tocar los componentes. Las rutas apuntan a /public.
 *
 * Nota: las imágenes actuales son de archivo y están pendientes de reemplazo
 * por fotografías propias de la fundación.
 */

export const HOME_CONTENT = {
  hero: {
    eyebrow: "Fundación sin ánimo de lucro",
    title: "Únete a quienes ayudan a transformar la vida de las niñas y los niños",
    description:
      "Texto pendiente: frase de presentación de la fundación, su propósito y a quiénes acompaña.",
    primaryAction: "Solicitar una cita",
    secondaryAction: "Conoce la fundación",
    image: {
      src: "/images/ninos-abrazo.jpg",
      alt: "Dos niños abrazados sonriendo",
    },
  },

  programs: {
    title: "Nuestros programas",
    description: "Texto pendiente: introducción a los servicios de la fundación.",
    items: [
      {
        title: "Acompañamiento psicológico",
        description:
          "Texto pendiente: descripción del acompañamiento que ofrece la fundación.",
      },
      {
        title: "Prevención",
        description:
          "Texto pendiente: descripción de los talleres y actividades de prevención.",
      },
      {
        title: "Apoyo a familias",
        description:
          "Texto pendiente: descripción del acompañamiento a familias.",
      },
    ],
  },

  news: {
    title: "Últimas noticias",
    emptyLabel: "Imagen pendiente",
    dateLabel: "Fecha pendiente",
    itemTitle: "Título de noticia pendiente",
  },

  donation: {
    title: "Tu aporte transforma vidas",
    description:
      "Texto pendiente: mensaje que invita a donar y explica en qué se usan los aportes.",
    action: "Quiero donar",
    image: {
      src: "/images/ninos-arbol.jpg",
      alt: "Niñas y niños jugando en un árbol",
    },
  },
} as const;