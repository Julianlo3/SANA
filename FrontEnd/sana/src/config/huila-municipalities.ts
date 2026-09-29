/**
 * Municipios del departamento del Huila (fuente: DANE / Wikipedia,
 * verificado en https://es.wikipedia.org/wiki/Anexo:Municipios_de_Huila).
 *
 * Es el único departamento con catálogo real de municipios por ahora,
 * porque es donde opera la fundación. El resto de Colombia sigue con el
 * campo de municipio en texto libre hasta que se consiga un catálogo
 * nacional completo.
 */

export const HUILA_MUNICIPALITIES = [
  "Neiva",
  "Aipe",
  "Algeciras",
  "Baraya",
  "Campoalegre",
  "Colombia",
  "Hobo",
  "Íquira",
  "Palermo",
  "Rivera",
  "Santa María",
  "Tello",
  "Teruel",
  "Villavieja",
  "Yaguará",
  "Agrado",
  "Altamira",
  "Garzón",
  "Gigante",
  "Guadalupe",
  "Pital",
  "Suaza",
  "Tarqui",
  "La Argentina",
  "La Plata",
  "Nátaga",
  "Paicol",
  "Tesalia",
  "Acevedo",
  "Elías",
  "Isnos",
  "Oporapa",
  "Palestina",
  "Pitalito",
  "Saladoblanco",
  "San Agustín",
  "Timaná",
] as const;

export type HuilaMunicipality = (typeof HUILA_MUNICIPALITIES)[number];