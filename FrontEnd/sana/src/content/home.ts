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
    title:
      "Únete a quienes ayudan a transformar la vida de las niñas y los niños",
    description:
      "Texto pendiente: frase de presentación de la fundación, su propósito y a quiénes acompaña.",
    primaryAction: "Solicitar una cita",
    secondaryAction: "Conoce la fundación",
    image: {
      src: "/images/ninos-abrazo.jpg",
      alt: "Dos niños abrazados sonriendo",
    },
  },

  about: {
    title: "Quiénes somos",
    missionTitle: "Misión",
    visionTitle: "Visión",
    valuesTitle: "Nuestros valores",
    image: {
      src: "/images/manos-unidas.jpg",
      alt: "Manos de varias personas unidas en el centro",
    },
  },

  programs: {
    title: "Nuestros programas",
  },

  services: {
    title: "Nuestros servicios",
  },

  team: {
    title: "Nuestro equipo",
  },

  news: {
    title: "Últimas noticias",
    seeAll: "Ver todas las noticias",
    pageTitle: "Noticias",
    pageDescription:
      "Las actividades y los logros de la fundación, de la más reciente a la más antigua.",
    back: "Volver a noticias",
  },

  gallery: {
    title: "Galería",
  },

  donation: {
    title: "Tu aporte transforma vidas",
    description:
      "Texto pendiente: mensaje que invita a donar y explica en qué se usan los aportes.",
    action: "Quiero donar",
    image: {
      src: "/images/ninos-arbol.jpg",
      alt: "Niñas y niños jugando entre las ramas de un árbol",
    },
  },
} as const;