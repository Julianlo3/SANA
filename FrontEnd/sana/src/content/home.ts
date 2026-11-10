/**
 * Home page content.
 *
 * Text and image paths are centralized here for updates without component
 * changes. Image paths are relative to `/public`.
 *
 * Current stock images are placeholders for foundation-owned photography.
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
    staffTitle: "Nuestro equipo de trabajo",
    professionalTitle: "Nuestro equipo profesional",
  },

  news: {
    title: "Noticias",
    seeAll: "Ver todas las noticias",
    featured: "Destacada",
    deck: "Noticias recientes",
    previous: "Noticia anterior",
    next: "Noticia siguiente",
    goTo: "Ir a la noticia",
    position: "Noticia",
    readFull: "Leer nota completa",
    readMore: "Leer más",
    otherNews: "Otras noticias",
    breadcrumbs: "Migas de pan",
    home: "Inicio",
    pagination: "Páginas de noticias",
    previousPage: "Anterior",
    nextPage: "Siguiente",
    pageTitle: "Noticias",
    back: "Volver a noticias",
    backHome: "Volver al inicio",
  },

  gallery: {
    title: "Galería",
    wall: "Fotos de la fundación en movimiento",
    dialog: "Foto de la galería",
    allPhotos: "Todas las fotos",
    showAll: "Ver todas las fotos",
    pause: "Pausar el movimiento de las fotos",
    resume: "Reanudar el movimiento de las fotos",
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