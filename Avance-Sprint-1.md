# Avance del Sprint 1

## Historias de Usuario Implementadas

| HU-ID | Descripción | Estado | Esfuerzo (SP) |
|---|---|---|---|
| HU-1.1 | Como usuario autorizado (Administrador, Asistente, Psicólogo o Marketing/Diseño), quiero iniciar sesión en la plataforma con mi cuenta de Google (OAuth 2.0), para acceder únicamente a las funcionalidades que corresponden a mi rol. | Completada | 3 (estimado) |
| HU-1.2 | Como Administrador, quiero crear cuentas de usuario asignándoles un rol, para que el personal autorizado pueda ingresar a la plataforma. | Completada | 5 (estimado) |
| HU-2.1 | Como Asistente administrativa, quiero registrar y consultar las fichas de los consultantes, para gestionar su información básica sin acceder a las observaciones registradas por el psicólogo. | Completada | 5 (estimado) |
| HU-2.2 | Como persona externa sin cuenta en la plataforma (mayor de edad que solicita para sí misma, o tutor o acudiente de un menor), quiero diligenciar el formulario de solicitud de cita desde el sitio web, para pedir una cita con el psicólogo sin tener que desplazarme ni llamar a la fundación. | Completada | 8 (estimado) |
| HU-2.3 | Como Asistente administrativa, quiero revisar las solicitudes de consultoría recibidas y asignarlas al psicólogo correspondiente, para gestionar oportunamente las solicitudes y mantener organizada la bandeja. | Completada | 5 (estimado) |
| HU-2.4 | Como Psicólogo, quiero que el motivo de consulta y las observaciones de la atención sean visibles únicamente para el profesional tratante, para proteger la información sensible de las personas atendidas. | Completada | 5 (estimado) |
| HU-2.5 | Como Psicólogo, quiero registrar la atención realizada y una observación general opcional de la consulta, para dejar constancia de la atención sin exponer información sensible del consultante. | Completada | 5 (estimado) |
| HU-3.2 | Como Asistente administrativa, quiero consultar la disponibilidad y los horarios de atención de los profesionales, para asignar las consultas según los espacios realmente disponibles. | Completada | 5 (estimado) |
| HU-3.3 | Como Administrador, quiero consultar la agenda de todos los psicólogos registrados en la plataforma, para conocer su disponibilidad y las citas programadas sin modificar su información. | Completada | 3 (estimado) |
| HU-3.4 | Como Psicólogo, quiero gestionar mi propia agenda, para consultar y organizar las citas de los consultantes que tengo asignados. | Completada | 3 (estimado) |
| HU-3.5 | Como Psicólogo, quiero definir mi disponibilidad y bloquear los horarios en los que no atenderé, para que únicamente puedan asignarme citas en los espacios en los que estoy disponible. | Completada | 8 (estimado) |
| HU-3.6 | Como consultante o tutor, quiero recibir por correo la notificación de la cita asignada o cancelada, para saber cuándo y dónde presentarme. | Completada en el alcance acordado | 3 (estimado) |
| HU-3.7 | Como Psicólogo, quiero recibir por correo la notificación de las citas asignadas o canceladas, para conocer los cambios de mi agenda. | Completada en el alcance acordado | 3 (estimado) |
| HU-4.1 | Como Administrador o Diseñador (Marketing y Comunicaciones), quiero editar el contenido institucional del sitio (misión, visión, valores, equipo, servicios y programas) desde el panel administrativo, para mantener actualizada la información, las imágenes y las piezas gráficas sin depender del desarrollador. | Completada | 8 (estimado) |
| HU-4.2 | Como Administrador o Diseñador (Marketing y Comunicaciones), quiero publicar, editar y retirar las noticias y las imágenes de la galería, para mostrar a los visitantes las actividades y los logros recientes de la fundación. | Completada | 5 (estimado) |
| HU-4.3 | Como Administrador o Diseñador (Marketing y Comunicaciones), quiero gestionar los banners y las piezas gráficas de la página de inicio, para destacar las campañas y las convocatorias vigentes de la fundación. | Completada | 3 (estimado) |

### Evidencia y alcance de la verificación

- El Excel contiene 24 HU en total: HE-01 (3), HE-02 (5), HE-03 (7), HE-04 (3), HE-05 Donaciones (4) y HE-06 Reportes (2). Las 16 HU completadas corresponden a HE-01 a HE-04; las seis HU de HE-05 y HE-06 no se han incluido como completadas.
- Las HU de la tabla tienen implementación visible y pruebas unitarias relacionadas. La autenticación usa Google y valida el estado y los roles; el flujo de solicitudes, asignación, privacidad, atención clínica, disponibilidad y agenda personal está cubierto por los módulos correspondientes.
- Pasaron las suites completas disponibles: backend, 290 pruebas en 34 archivos; frontend, 44 pruebas en 6 archivos. El build y lint del backend, así como el lint y la verificación de tipos del frontend, también finalizaron correctamente.
- Las pruebas E2E de usuarios no se ejecutaron; requieren una base de datos de integración. HU-1.2 se acepta como completada según la decisión del usuario sobre la implementación existente.
- Se agregaron pruebas enfocadas para HU-2.1 y HU-4.1 a HU-4.3 en `BackEnd/backendsana/test/` y `FrontEnd/sana/test/`. Cubren el registro, consulta y actualización administrativa de consultantes; la persistencia y validación del contenido institucional; la cancelación de cambios sin guardar; el acceso por rol; la publicación, edición y retiro de noticias e imágenes; la validación de imágenes; y los límites y la activación manual de banners. La cobertura frontend incluye validaciones de formularios y de archivos, además de las llamadas a los endpoints correspondientes.
- HU-2.1 y HU-4.1 a HU-4.3 se contabilizan como completadas con base en la implementación visible y las pruebas unitarias/de servicios que pasan. Para HU-4.3, la expiración automática al terminar el periodo de vigencia se considera fuera del alcance vigente, según la decisión del usuario; no se encontraron otras brechas funcionales dentro de ese alcance. Las pruebas E2E no se ejecutaron y se mantienen como limitación de la evidencia, no como requisito para contar estas HU.
- HU-1.3 y HU-3.1 permanecen pendientes y no se cuentan como completadas: el usuario decidió no implementarlas por ahora. HU-3.1 requiere el flujo de reprogramación de una cita ya confirmada.
- HU-3.3 se acepta como completada según la decisión del usuario sobre la implementación existente.
- Para HU-3.6 y HU-3.7, el usuario considera suficiente el correo disponible y descarta WhatsApp por los problemas del canal. En HU-3.7 también se difiere el aviso persistente en el panel del psicólogo; para este avance se acepta el alcance de correo sin agregar esa funcionalidad. La reprogramación y sus avisos quedan fuera del trabajo actual mientras HU-3.1 siga pendiente.
- El Excel no incluye story points: su columna numérica está titulada «Número (#) de escenario». Los puntos de la tabla son estimaciones provisionales con escala Fibonacci, no valores extraídos del Excel. Se asignan 8 SP a HU-2.2 y HU-3.5 por su complejidad y por ser parte del flujo central de solicitud, disponibilidad y asignación de citas; HU-2.3 conecta ese flujo.

## Métricas de Avance

| Métrica | Valor |
|---|---|
| HU Completas | 16 de 24 |
| Velocidad sprint | 1.75 story points/día (77 SP estimados completados ÷ 44 días calendario transcurridos) |
| Porcentaje Completado | 66.7% (16 ÷ 24) |

La duración usada es el tiempo calendario transcurrido del 8 de septiembre de 2026 al 22 de octubre de 2026. La velocidad y el porcentaje son estimaciones del avance verificable hasta la fecha; los story points deben validarse con el equipo. El denominador de 24 representa todas las HU del Excel, no solo las consideradas inicialmente para el Sprint 1. No se reporta 100%: HU-1.3 y HU-3.1 siguen pendientes de implementación y las seis HU de HE-05 y HE-06 no están incluidas como completadas.
