export type Solicitud = {
  id: string;
  nombre: string;
  correo: string;
  fecha: string;
  correoVerificado: boolean;
};

export const solicitudesDemo: Solicitud[] = [
  {
    id: "REQ-00142",
    nombre: "Laura Martínez Gómez",
    correo: "laura.martinez@ejemplo.com",
    fecha: "24 oct 2026 · 10:45",
    correoVerificado: true,
  },
  {
    id: "REQ-00141",
    nombre: "Carlos Arturo Vega",
    correo: "carlos.vega@ejemplo.com",
    fecha: "23 oct 2026 · 14:15",
    correoVerificado: true,
  },
  {
    id: "REQ-00140",
    nombre: "Elena Ramírez Soto",
    correo: "elena.rs@ejemplo.com",
    fecha: "22 oct 2026 · 09:30",
    correoVerificado: false,
  },
];

export const ROLES = [
  "Administrador",
  "Asistente administrativa",
  "Psicólogo",
  "Marketing y diseño",
] as const;