<!-- responsable: Product Owner del sprint | estado: borrador -->
# 7. Épicas, historias de usuario y criterios de aceptación

Fuente única de las historias de usuario. Cualquier cambio en una HU o en sus criterios se hace en este archivo.

Convenciones:

- Identificadores: `HE-NN` (épica), `HU-N.M` (historia). Los identificadores no se reutilizan.
- Criterios de aceptación en Gherkin (`# language: es`). Cada `Escenario` se implementa como al menos una prueba automatizada cuyo nombre incluye `HU-N.M` y el número de escenario.
- Una HU se considera terminada cuando todos sus escenarios pasan (ver sección 15, definición de terminado).

## HE-01. Gestión de usuarios y acceso

El sistema debe permitir el ingreso a la plataforma mediante autenticación con cuenta de Google (OAuth 2.0), mostrando a cada usuario una interfaz y unos permisos acordes a su rol. El administrador aprueba las cuentas verificadas, les asigna uno de los roles establecidos (Administrador, Asistente, Psicólogo, Marketing/Diseño) y puede editar, bloquear, desactivar o eliminar usuarios sin depender del desarrollador.

### HU-1.1

- Rol: usuario autorizado (Administrador, Asistente, Psicólogo o Marketing/Diseño)
- Funcionalidad: iniciar sesión en la plataforma con mi cuenta de Google (OAuth 2.0)
- Propósito: acceder únicamente a las funcionalidades que corresponden a mi rol

[CONFIRMAR: el escenario 2 remite a la bandeja de solicitudes de acceso, eliminada con el cambio de flujo de HU-1.2. Definir el comportamiento para una cuenta de Google no registrada por el Administrador.]

```gherkin
# language: es
Característica: HU-1.1

  Escenario: 1. Acceso exitoso
    Dado el usuario cuenta con una cuenta aprobada por la administrador, en estado activo y con un rol asignado.
    Cuando selecciona "Iniciar sesión con Google" y autoriza el acceso a su cuenta.
    Entonces el sistema valida la identidad, confirma que la cuenta está aprobada y activa, y redirige al panel correspondiente a su rol, mostrando únicamente las opciones habilitadas para ese rol.

  Escenario: 2. Cuenta aún no aprobada
    Dado una persona se autentica con una cuenta de Google que no ha sido aprobada por la administrador.
    Cuando completa la autenticación con Google.
    Entonces el sistema no crea la sesión, muestra el mensaje "Su cuenta aún no ha sido autorizada" y deja la solicitud registrada en la bandeja de solicitudes de acceso de la administrador.

  Escenario: 3. Cuenta bloqueada o desactivada
    Dado el usuario tiene una cuenta cuyo estado es bloqueado o desactivado.
    Cuando intenta iniciar sesión con su cuenta de Google.
    Entonces el sistema impide el acceso y muestra un mensaje indicando que la cuenta no se encuentra habilitada, sin revelar detalles adicionales del estado.

  Escenario: 4. Expiración de la sesión por inactividad
    Dado el usuario mantiene una sesión abierta que supera el tiempo máximo de inactividad definido por el sistema.
    Cuando intenta ejecutar cualquier acción dentro de la plataforma.
    Entonces el sistema cierra la sesión, descarta el token y redirige al usuario a la pantalla de inicio de sesión.

  Escenario: 5. Intento de acceso a un módulo ajeno al rol
    Dado un usuario autenticado conoce la dirección de un módulo que no corresponde a su rol.
    Cuando ingresa la dirección directamente en el navegador.
    Entonces el sistema deniega el acceso, muestra un mensaje de permisos insuficientes y registra el intento en la bitácora de seguridad.
```

### HU-1.2

- Rol: Administrador
- Funcionalidad: aprobar las solicitudes de acceso de los correos verificados y asignarles un rol
- Propósito: controlar quién ingresa al sistema y con qué permisos

[CONFIRMAR: los escenarios de HU-1.2 describen el flujo de aprobación de solicitudes, descartado el 2026-09-11. El flujo vigente es la creación directa de usuarios por el Administrador. Reescribir los escenarios antes de implementar.]

```gherkin
# language: es
Característica: HU-1.2

  Escenario: 1. Aprobación y asignación de rol
    Dado existe una solicitud de acceso pendiente, proveniente de un correo verificado por el proveedor de identidad.
    Cuando la administrador selecciona la solicitud, elige uno de los roles establecidos y confirma la aprobación.
    Entonces el sistema activa la cuenta con el rol seleccionado, la muestra en el listado de usuarios y notifica al usuario por correo que ya puede ingresar.

  Escenario: 2. Rechazo de una solicitud
    Dado existe una solicitud de acceso pendiente que no corresponde a personal autorizado de la fundación.
    Cuando la administrador selecciona la opción "Rechazar".
    Entonces el sistema descarta la solicitud, impide el ingreso de esa cuenta y conserva el registro del rechazo para consulta posterior.

  Escenario: 3. Aprobación sin rol seleccionado
    Dado la administrador se encuentra aprobando una solicitud de acceso.
    Cuando confirma la aprobación sin haber seleccionado un rol.
    Entonces el sistema impide la operación y muestra un mensaje indicando que debe asignar un rol antes de aprobar la cuenta.

  Escenario: 4. Un único rol activo por usuario
    Dado un usuario ya cuenta con un rol activo asignado.
    Cuando la administrador intenta asignarle un segundo rol de forma simultánea.
    Entonces el sistema permite un único rol activo por usuario y solicita confirmar el reemplazo del rol actual antes de continuar.

  Escenario: 5. Cambio de rol de un usuario existente
    Dado un usuario con rol activo cambia de función dentro de la fundación.
    Cuando la administrador selecciona un rol distinto para ese usuario y guarda el cambio.
    Entonces el sistema actualiza el rol y aplica los nuevos permisos a partir del siguiente inicio de sesión del usuario.

  Escenario: 6. Correo ya registrado
    Dado existe un usuario activo registrado con un determinado correo electrónico.
    Cuando la administrador intenta aprobar una segunda solicitud con ese mismo correo.
    Entonces el sistema impide la operación y muestra un mensaje indicando que el correo ya se encuentra registrado en la plataforma.
```

### HU-1.3

- Rol: Administrador
- Funcionalidad: editar, bloquear, desactivar o eliminar las cuentas de usuario existentes
- Propósito: mantener actualizado el control de acceso sin depender del desarrollador

```gherkin
# language: es
Característica: HU-1.3

  Escenario: 1. Edición exitosa de un usuario
    Dado existe un usuario registrado en el sistema.
    Cuando la administrador modifica sus datos y selecciona "Guardar".
    Entonces el sistema actualiza la información del usuario y muestra los datos modificados en el listado.

  Escenario: 2. Bloqueo de un usuario
    Dado existe un usuario activo en el sistema.
    Cuando la administrador selecciona la opción "Bloquear".
    Entonces el sistema cambia el estado del usuario a bloqueado, cierra sus sesiones activas y le impide volver a ingresar.

  Escenario: 3. Desactivación de un usuario
    Dado existe un usuario activo que ya no hace parte de la operación diaria de la fundación.
    Cuando la administrador selecciona la opción "Desactivar".
    Entonces el sistema cambia el estado del usuario a desactivado, conserva su historial y le impide el acceso.

  Escenario: 4. Eliminación de un usuario con información asociada
    Dado existe un usuario que tiene citas, fichas o registros asociados en el sistema.
    Cuando la administrador selecciona la opción "Eliminar".
    Entonces el sistema impide la eliminación para preservar la trazabilidad de la información y ofrece la opción de desactivar la cuenta en su lugar.

  Escenario: 5. Reactivación de un usuario
    Dado existe un usuario en estado bloqueado o desactivado.
    Cuando la administrador selecciona la opción "Reactivar".
    Entonces el sistema restablece el estado activo del usuario conservando el rol que tenía asignado y le permite ingresar nuevamente.
```

## HE-02. Gestión de consultantes

El sistema debe permitir el registro y la consulta de las fichas de los consultantes (pacientes) con sus datos personales, motivo de consulta y profesional asignado. Incluye la recepción de solicitudes de consultoría enviadas y su gestión por parte de la asistente administrativa hasta la asignación a un psicólogo.

### HU-2.1

- Rol: Asistente administrativa
- Funcionalidad: registrar y consultar las fichas de los consultantes
- Propósito: gestionar su información básica sin acceder al seguimiento clínico detallado

```gherkin
# language: es
Característica: HU-2.1

  Escenario: 1. Registro exitoso de una ficha
    Dado la asistente tiene acceso al módulo de consultantes.
    Cuando ingresa los datos básicos y administrativos requeridos y selecciona "Guardar".
    Entonces el sistema registra la ficha del consultante y la muestra en el listado de consultantes.

  Escenario: 2. Consulta de una ficha existente
    Dado existe una ficha de consultante registrada en el sistema.
    Cuando la asistente busca y selecciona al consultante.
    Entonces el sistema muestra su información básica, junto con el profesional asignado y el historial de citas.

  Escenario: 3. Actualización de una ficha
    Dado existe una ficha de consultante registrada.
    Cuando la asistente modifica la información que tiene autorizada y guarda los cambios.
    Entonces el sistema actualiza la ficha del consultante y conserva el registro de la modificación.

  Escenario: 4. Restricción al seguimiento clínico
    Dado la asistente consulta la ficha de un consultante que tiene seguimiento registrado por su psicólogo.
    Cuando intenta acceder al seguimiento clínico detallado.
    Entonces el sistema restringe el acceso y no muestra dicha información, dejando visible únicamente la parte administrativa de la ficha.

  Escenario: 5. Registro con campos obligatorios vacíos
    Dado la asistente está registrando una ficha de consultante.
    Cuando intenta guardarla sin completar los campos obligatorios.
    Entonces el sistema impide el registro y muestra un mensaje indicando cuáles campos debe completar.

  Escenario: 6. Registro de la zona de residencia
    Dado la asistente está registrando o actualizando la ficha de un consultante.
    Cuando selecciona el municipio y la zona de residencia del consultante a partir de la lista definida por la fundación.
    Entonces el sistema almacena la zona asociada al consultante y la deja disponible como criterio para los reportes de cobertura territorial.

  Escenario: 7. Consultante ya registrado
    Dado ya existe una ficha registrada con el documento de identificación del consultante.
    Cuando la asistente intenta registrar nuevamente a la misma persona.
    Entonces el sistema impide el registro duplicado y notifica que la ficha ya existe, ofreciendo abrirla.
```

### HU-2.2

- Rol: persona externa (sin cuenta en la plataforma)
- Funcionalidad: diligenciar el formulario de solicitud de consultoría desde el sitio web
- Propósito: pedir una cita sin necesidad de registrarme ni llamar a la fundación

```gherkin
# language: es
Característica: HU-2.2

  Escenario: 1. Envío exitoso de la solicitud
    Dado una persona externa ingresa al sitio web de la fundación, sin haber iniciado sesión.
    Cuando diligencia los campos obligatorios del formulario (nombre, datos de contacto y motivo de consulta) y presiona "Enviar".
    Entonces el sistema registra la solicitud con estado "pendiente", muestra un mensaje de confirmación y la envía a la bandeja de la asistente administrativa.

  Escenario: 2. Campos obligatorios sin diligenciar
    Dado la persona está diligenciando el formulario de solicitud.
    Cuando presiona "Enviar" dejando campos obligatorios vacíos.
    Entonces el sistema impide el envío y señala los campos que debe completar antes de continuar.

  Escenario: 3. Datos de contacto con formato inválido
    Dado la persona ingresa un correo electrónico o un número de teléfono con un formato incorrecto.
    Cuando presiona "Enviar".
    Entonces el sistema impide el envío y muestra un mensaje indicando cuál dato de contacto debe corregir.

  Escenario: 4. Indicación de la zona de residencia
    Dado la persona está diligenciando el formulario de solicitud de consultoría.
    Cuando selecciona su municipio y zona de residencia de la lista disponible, o deja la opción "No reporta".
    Entonces el sistema guarda el dato junto con la solicitud y lo traslada a la ficha del consultante cuando la asistente la registre, sin impedir el envío si la persona no lo diligencia.

  Escenario: 5. Autorización de tratamiento de datos personales
    Dado la persona ha diligenciado todos los campos del formulario pero no ha aceptado la política de tratamiento de datos personales.
    Cuando presiona "Enviar".
    Entonces el sistema impide el envío hasta que se acepte la autorización, y al enviarla guarda la fecha y hora en que fue otorgada.
```

### HU-2.3

- Rol: Asistente administrativa
- Funcionalidad: revisar las solicitudes de consultoría recibidas y asignarlas al psicólogo correspondiente
- Propósito: gestionar oportunamente las solicitudes y mantener organizada la bandeja

```gherkin
# language: es
Característica: HU-2.3

  Escenario: 1. Visualización de la bandeja de solicitudes
    Dado existen solicitudes de consultoría recibidas a través del sitio web.
    Cuando la asistente ingresa a la bandeja de solicitudes.
    Entonces el sistema muestra las solicitudes con nombre, motivo de consulta, fecha de recepción y estado, ordenadas de la más reciente a la más antigua.

  Escenario: 2. Consulta del detalle de una solicitud
    Dado la asistente se encuentra en la bandeja de solicitudes.
    Cuando selecciona una solicitud del listado.
    Entonces el sistema muestra el detalle completo de la solicitud y los datos de contacto necesarios para gestionarla.

  Escenario: 3. Asignación a un psicólogo
    Dado existe una solicitud en estado "pendiente" y hay psicólogos con disponibilidad registrada.
    Cuando la asistente selecciona un psicólogo disponible y confirma la asignación.
    Entonces el sistema cambia el estado de la solicitud a "asignada", la vincula al psicólogo seleccionado y abre el formulario de creación de cita con los datos del solicitante precargados.

  Escenario: 4. Psicólogo sin disponibilidad
    Dado la asistente desea asignar una solicitud a un psicólogo que no tiene horarios disponibles.
    Cuando selecciona a ese psicólogo y confirma la asignación.
    Entonces el sistema informa que el profesional no tiene disponibilidad y no permite completar la asignación.

  Escenario: 5. Intento de doble asignación
    Dado una solicitud ya fue asignada a un psicólogo.
    Cuando la asistente intenta asignarla nuevamente.
    Entonces el sistema impide una segunda asignación y ofrece la opción de reasignar, registrando el cambio.

  Escenario: 6. Descarte de una solicitud
    Dado existe una solicitud que no corresponde a un servicio de la fundación o está duplicada.
    Cuando la asistente selecciona la opción "Descartar" e indica el motivo.
    Entonces el sistema cambia el estado a "descartada", la retira del listado de pendientes y conserva el motivo para consulta posterior.
```

## HE-03. Gestión de agenda

El sistema debe reemplazar el uso de calendarios externos como herramienta principal de agendamiento. Permite crear, reprogramar y cancelar citas, consultar la disponibilidad por profesional, visualizar la agenda por día, semana y mes, registrar observaciones administrativas y que cada psicólogo defina su disponibilidad bloqueando los horarios en los que no atenderá.

### HU-3.1

- Rol: Asistente administrativa
- Funcionalidad: crear, reprogramar y cancelar las citas de los consultantes
- Propósito: mantener actualizada la agenda de atención de la fundación

```gherkin
# language: es
Característica: HU-3.1

  Escenario: 1. Creación de una cita
    Dado la asistente tiene acceso a la gestión de citas y el consultante cuenta con una ficha registrada.
    Cuando selecciona el consultante, un psicólogo y un horario disponible, y confirma la creación.
    Entonces el sistema registra la cita en la agenda del profesional, marca el horario como ocupado y la muestra en el listado de citas programadas.

  Escenario: 2. Reprogramación de una cita
    Dado existe una cita programada en el sistema.
    Cuando la asistente selecciona la cita y le asigna una nueva fecha y un horario disponible.
    Entonces el sistema actualiza la cita, libera el horario anterior, ocupa el nuevo y conserva el registro de la reprogramación.

  Escenario: 3. Cancelación de una cita
    Dado existe una cita programada en el sistema.
    Cuando la asistente selecciona la opción "Cancelar" e indica el motivo.
    Entonces el sistema cambia el estado de la cita a cancelada, libera el horario correspondiente y conserva la cita en el historial del consultante.

  Escenario: 4. Cruce de horario
    Dado existe una cita programada para un psicólogo en una fecha y hora determinadas.
    Cuando la asistente intenta crear o reprogramar otra cita en ese mismo horario y profesional.
    Entonces el sistema impide la operación y muestra un mensaje indicando que el horario no está disponible.

  Escenario: 5. Registro de observaciones administrativas
    Dado existe una cita programada que requiere una anotación de tipo administrativo (por ejemplo, si es gratuita o particular, o quién acompaña al consultante).
    Cuando la asistente abre la cita, escribe la observación y guarda.
    Entonces el sistema almacena la observación asociada a esa cita y la muestra al consultarla, sin afectar el seguimiento clínico del psicólogo.
```

### HU-3.2

- Rol: Asistente administrativa
- Funcionalidad: consultar la disponibilidad y los horarios de atención de los profesionales
- Propósito: asignar las consultas según los espacios realmente disponibles

```gherkin
# language: es
Característica: HU-3.2

  Escenario: 1. Consulta general de disponibilidad
    Dado la asistente tiene acceso al módulo de disponibilidad.
    Cuando ingresa a consultar la disponibilidad de los profesionales.
    Entonces el sistema muestra los profesionales registrados junto con sus horarios disponibles.

  Escenario: 2. Consulta por profesional
    Dado el sistema muestra la lista de profesionales registrados.
    Cuando la asistente selecciona un profesional específico.
    Entonces el sistema muestra su disponibilidad y sus horarios de atención definidos.

  Escenario: 3. Consulta por fecha
    Dado la asistente está consultando la disponibilidad de los profesionales.
    Cuando selecciona una fecha determinada.
    Entonces el sistema muestra los horarios disponibles de los profesionales para esa fecha.

  Escenario: 4. Diferenciación de horarios ocupados
    Dado un profesional tiene citas programadas dentro de su horario de atención.
    Cuando la asistente consulta su disponibilidad.
    Entonces el sistema diferencia visualmente los horarios disponibles, los ocupados y los bloqueados por el profesional.

  Escenario: 5. Actualización tras un cambio en la agenda
    Dado un profesional tiene una cita asignada, cancelada o reprogramada.
    Cuando la asistente consulta nuevamente su disponibilidad.
    Entonces el sistema muestra los horarios actualizados en tiempo real, sin necesidad de recargar manualmente la información.
```

### HU-3.3

- Rol: Administrador
- Funcionalidad: consultar la agenda de todos los psicólogos registrados en la plataforma
- Propósito: conocer su disponibilidad y las citas programadas sin modificar su información

```gherkin
# language: es
Característica: HU-3.3

  Escenario: 1. Visualización de todas las agendas
    Dado el administrador tiene acceso al módulo de agendas.
    Cuando ingresa a la opción de agenda de psicólogos.
    Entonces el sistema muestra las agendas de todos los psicólogos registrados en la plataforma.

  Escenario: 2. Consulta por profesional
    Dado existen varios psicólogos registrados en el sistema.
    Cuando el administradora selecciona un psicólogo específico.
    Entonces el sistema muestra únicamente la agenda y las citas correspondientes a ese profesional.

  Escenario: 3. Consulta por fecha
    Dado el administradora se encuentra en la agenda de psicólogos.
    Cuando selecciona una fecha determinada.
    Entonces el sistema muestra la disponibilidad y las citas programadas para esa fecha, diferenciando horarios libres y ocupados.

  Escenario: 4. Visualización por día, semana y mes
    Dado el administradora está consultando la agenda de la fundación.
    Cuando cambia entre las vistas de día, semana y mes.
    Entonces el sistema presenta la agenda en la vista seleccionada, conservando el profesional y la fecha consultados.

  Escenario: 5. Detalle de las citas programadas
    Dado un psicólogo tiene citas programadas.
    Cuando el administradora consulta su agenda y selecciona una cita.
    Entonces el sistema muestra la información de la cita: consultante, fecha, hora, estado y observaciones administrativas.

  Escenario: 6. Acceso restringido a solo lectura
    Dado el administradora está visualizando la agenda de un psicólogo.
    Cuando intenta crear, modificar, eliminar o cambiar la disponibilidad y las citas de ese profesional.
    Entonces el sistema no habilita esas opciones y permite únicamente la consulta de la información.
```

### HU-3.4

- Rol: Psicólogo
- Funcionalidad: gestionar mi propia agenda
- Propósito: consultar y organizar las citas de los consultantes que tengo asignados

```gherkin
# language: es
Característica: HU-3.4

  Escenario: 1. Visualización de la agenda propia
    Dado el psicólogo ha iniciado sesión en la plataforma.
    Cuando ingresa al módulo de agenda.
    Entonces el sistema muestra únicamente su propia agenda, con las citas programadas a su nombre.

  Escenario: 2. Consulta de las citas asignadas
    Dado el psicólogo tiene citas programadas con sus consultantes.
    Cuando consulta su agenda y selecciona una cita.
    Entonces el sistema muestra los datos del consultante asignado, la fecha, la hora y el estado de la cita.

  Escenario: 3. Restricción a la agenda de otros profesionales
    Dado el psicólogo se encuentra consultando su agenda.
    Cuando intenta acceder a la agenda de otro profesional.
    Entonces el sistema restringe el acceso y muestra un mensaje de permisos insuficientes.

  Escenario: 4. Consulta del historial de citas
    Dado el psicólogo necesita revisar la atención previa de un consultante asignado.
    Cuando abre la ficha del consultante desde su agenda y consulta el historial.
    Entonces el sistema muestra las citas anteriores con su fecha, estado y el seguimiento registrado por el propio profesional.
```

### HU-3.5

- Rol: Psicólogo
- Funcionalidad: definir mi disponibilidad y bloquear los horarios en los que no atenderé
- Propósito: que únicamente puedan asignarme citas en los espacios en los que estoy disponible

```gherkin
# language: es
Característica: HU-3.5

  Escenario: 1. Definición del horario de atención
    Dado el psicólogo tiene acceso a su agenda.
    Cuando establece los días y las franjas horarias en los que está disponible y guarda los cambios.
    Entonces el sistema almacena su disponibilidad y la muestra como espacios asignables en la agenda.

  Escenario: 2. Bloqueo de un día o una franja horaria
    Dado el psicólogo no podrá atender en una fecha o en una franja específica.
    Cuando selecciona el día u horario y lo marca como no disponible.
    Entonces el sistema bloquea ese espacio e impide que se asignen citas en él.

  Escenario: 3. Bloqueo de un horario con cita ya agendada
    Dado existe una cita ya programada dentro del horario que el psicólogo desea bloquear.
    Cuando intenta marcar ese espacio como no disponible.
    Entonces el sistema advierte que existe una cita programada e impide el bloqueo hasta que la cita sea reprogramada o cancelada por quien tenga permiso para hacerlo.

  Escenario: 4. Visualización en tiempo real por la asistente
    Dado el psicólogo modifica su disponibilidad o bloquea un horario.
    Cuando la asistente administrativa consulta la disponibilidad de ese profesional.
    Entonces el sistema refleja el cambio en tiempo real, mostrando el espacio como no disponible para asignación.

  Escenario: 5. Eliminación de un bloqueo
    Dado existe un horario previamente bloqueado por el psicólogo.
    Cuando el profesional elimina el bloqueo.
    Entonces el sistema libera el espacio y lo muestra nuevamente como disponible para la asignación de citas.
```

## HE-04. Gestión de contenido institucional

El sistema debe permitir que el administrador y el diseñador actualicen la información institucional del sitio (misión, visión, valores, equipo, servicios, programas, noticias, galería y banners) desde un panel administrativo, sin realizar modificaciones en el código.

### HU-4.1

- Rol: Administrador o Diseñadora (Marketing y Comunicaciones)
- Funcionalidad: editar el contenido institucional de la plataforma desde el panel administrativo
- Propósito: mantener actualizada la información, las imágenes y las piezas gráficas sin depender del desarrollador

```gherkin
# language: es
Característica: HU-4.1

  Escenario: 1. Actualización exitosa del contenido
    Dado la usuaria tiene el rol de Administrador o de Diseñadora y accede al módulo de contenido institucional.
    Cuando modifica la información institucional (textos, imágenes, banners o documentos) y selecciona "Guardar".
    Entonces el sistema actualiza y almacena el contenido ingresado, registrando quién realizó el cambio y en qué fecha.

  Escenario: 2. Publicación visible para los visitantes
    Dado la usuaria ha guardado correctamente los cambios en el contenido institucional.
    Cuando un visitante consulta el sitio web de la fundación.
    Entonces el sistema muestra la información actualizada en la sección correspondiente.

  Escenario: 3. Campos obligatorios vacíos
    Dado la usuaria se encuentra editando el contenido institucional.
    Cuando intenta guardar dejando campos obligatorios sin diligenciar.
    Entonces el sistema impide el guardado y muestra un mensaje indicando los campos que debe completar.

  Escenario: 4. Cancelación de los cambios
    Dado la usuaria ha realizado cambios en el contenido institucional sin guardarlos.
    Cuando selecciona la opción "Cancelar".
    Entonces el sistema descarta los cambios realizados y conserva la información publicada anteriormente.

  Escenario: 5. Restricción por rol
    Dado un usuario con rol de Asistente o de Psicólogo navega por la plataforma.
    Cuando intenta acceder al módulo de contenido institucional.
    Entonces el sistema no habilita el módulo para ese rol y deniega el acceso.
```

## HE-05. Gestión de donaciones

El sistema debe permitir al administrador configurar y habilitar el medio de donación mediante la pasarela Wompi, y a cualquier persona u organización realizar un aporte sin necesidad de registrarse. El sistema debe registrar las donaciones recibidas para su consulta y control.

### HU-5.1

- Rol: Administrador
- Funcionalidad: configurar la información de donación que se publica en el sitio web
- Propósito: que los donantes cuenten con datos correctos y actualizados para realizar su aporte

```gherkin
# language: es
Característica: HU-5.1

  Escenario: 1. Configuración exitosa
    Dado el administrador tiene acceso al módulo de donaciones.
    Cuando ingresa o modifica la información necesaria para recibir donaciones (entidad financiera, número de cuenta, enlace de Wompi y contacto de apoyo) y selecciona "Guardar".
    Entonces el sistema guarda la configuración y la publica en la sección de donaciones del sitio web.

  Escenario: 2. Información obligatoria incompleta o inválida
    Dado el administrador está configurando los medios de donación.
    Cuando intenta guardar con información obligatoria incompleta o con un formato inválido.
    Entonces el sistema impide el guardado y muestra un mensaje indicando los datos que debe corregir.

  Escenario: 3. Visualización por parte del donante
    Dado el administrador ha guardado correctamente la configuración de donaciones.
    Cuando un visitante ingresa a la sección de donaciones del sitio web.
    Entonces el sistema muestra la información y las opciones de donación habilitadas por el administrador.
```

### HU-5.2

- Rol: Administrador
- Funcionalidad: activar o desactivar la recepción de donaciones por Wompi
- Propósito: controlar en qué momentos la fundación puede recibir aportes por este canal

```gherkin
# language: es
Característica: HU-5.2

  Escenario: 1. Activación del medio de donación
    Dado el medio de donación por Wompi se encuentra configurado pero desactivado.
    Cuando el administrador selecciona la opción de activarlo.
    Entonces el sistema habilita el medio de donación por Wompi y lo muestra como opción disponible en la sección de donaciones.

  Escenario: 2. Desactivación del medio de donación
    Dado el medio de donación por Wompi se encuentra activo y visible en el sitio web.
    Cuando el administrador selecciona la opción de desactivarlo.
    Entonces el sistema oculta la opción de donación por Wompi de la sección de donaciones y deja de aceptar aportes por ese canal.

  Escenario: 3. Activación sin configuración completa
    Dado el medio de donación por Wompi no cuenta con toda la información obligatoria diligenciada.
    Cuando el administrador intenta activarlo.
    Entonces el sistema impide la activación e indica qué información debe completar previamente.
```

### HU-5.3

- Rol: donante (persona natural o empresa/organización, sin cuenta en la plataforma)
- Funcionalidad: realizar mi donación a través de la pasarela Wompi
- Propósito: aportar mediante un medio de pago electrónico que deje soporte de la transacción

```gherkin
# language: es
Característica: HU-5.3

  Escenario: 1. Donación exitosa mediante Wompi
    Dado el medio de donación por Wompi se encuentra activo y el donante ingresa a la sección de donaciones.
    Cuando diligencia sus datos y el monto a donar, es redirigido al portal de Wompi y confirma la transacción.
    Entonces el sistema recibe la confirmación de la transacción y registra la donación con su identificador, monto y fecha, mostrando al donante un mensaje de agradecimiento.

  Escenario: 2. Transacción rechazada o cancelada
    Dado el donante ha sido redirigido al portal de la pasarela de pagos.
    Cuando la transacción es rechazada por la entidad financiera o el donante la cancela.
    Entonces el sistema no registra la donación, informa que la transacción no pudo completarse y ofrece intentarlo nuevamente.

  Escenario: 3. Datos del donante incompletos o inválidos
    Dado el donante se encuentra diligenciando el formulario previo a ser redirigido a Wompi.
    Cuando intenta continuar con campos obligatorios vacíos o con un formato inválido.
    Entonces el sistema impide continuar y muestra un mensaje indicando los datos que debe corregir.
```

### HU-5.4

- Rol: Administrador
- Funcionalidad: consultar las donaciones recibidas por Wompi y registrar los aportes en especie
- Propósito: llevar el control de los aportes y generar los reportes de ingresos de la fundación

```gherkin
# language: es
Característica: HU-5.4

  Escenario: 1. Registro automático de una donación confirmada
    Dado wompi confirma una transacción de donación.
    Cuando el sistema recibe la confirmación de la pasarela.
    Entonces el sistema registra la donación con estado "confirmada", su identificador, monto y fecha, y la incluye en los reportes.

  Escenario: 2. Consulta de las donaciones recibidas
    Dado existen donaciones registradas por Wompi y aportes en especie registrados.
    Cuando la administradora consulta el listado de donaciones y aplica filtros por tipo, estado o rango de fechas.
    Entonces el sistema muestra las donaciones que cumplen los filtros, con su identificador de transacción, monto, fecha y estado.

  Escenario: 3. Registro de una donación en especie
    Dado la fundación recibe un aporte en especie (refrigerios, material pedagógico, juguetes, ropa u otros).
    Cuando la administradora registra el aporte indicando el tipo, la descripción, el donante y la fecha.
    Entonces el sistema guarda el aporte diferenciándolo de las donaciones económicas y lo incluye en los reportes de apoyos recibidos.
```

## HE-06. Gestión de reportes

El sistema debe generar los indicadores de gestión que la fundación necesita para sus informes de impacto social: cómo evolucionó el recaudo de donaciones respecto al mes anterior y cuántas personas fueron atendidas en cada zona. Los indicadores se presentan siempre en datos agregados y pueden exportarse a PDF y Excel.

### HU-6.1

- Rol: Administrador
- Funcionalidad: comparar las donaciones recibidas en el mes en curso frente al mes anterior
- Propósito: conocer la evolución del recaudo de la fundación y sustentar los informes de gestión

```gherkin
# language: es
Característica: HU-6.1

  Escenario: 1. Comparación mensual del recaudo
    Dado existen donaciones confirmadas registradas en el mes en curso y en el mes inmediatamente anterior.
    Cuando el administrador ingresa al reporte de donaciones.
    Entonces el sistema muestra el total recaudado en cada uno de los dos meses, la diferencia entre ambos y la variación porcentual, discriminando el aporte de cada canal.

  Escenario: 2. Mes anterior sin donaciones registradas
    Dado no existen donaciones confirmadas en el mes inmediatamente anterior.
    Cuando el administrador consulta el reporte de donaciones.
    Entonces el sistema muestra el total del mes en curso e indica que no hay datos del mes anterior para comparar, sin presentar una variación porcentual.

  Escenario: 3. Exclusión de las donaciones sin confirmar
    Dado existen donaciones registradas con estado "por verificar" que aún no han sido confirmadas por la administradora.
    Cuando el administrador consulta el reporte de donaciones.
    Entonces el sistema calcula los totales únicamente con las donaciones confirmadas e indica por separado cuántas están pendientes de verificación.

  Escenario: 4. Consulta de un periodo anterior
    Dado la administradora necesita revisar el comportamiento del recaudo en meses pasados.
    Cuando selecciona un mes distinto al actual como periodo de consulta.
    Entonces el sistema muestra el total de ese mes comparado con el mes inmediatamente anterior al seleccionado.
```

### HU-6.2

- Rol: Administrador
- Funcionalidad: consultar el número de personas atendidas por zona
- Propósito: conocer la cobertura territorial de la fundación y elaborar los informes de impacto social

```gherkin
# language: es
Característica: HU-6.2

  Escenario: 1. Consulta de personas atendidas por zona
    Dado existen consultantes con zona de residencia registrada y con al menos una cita realizada en el periodo consultado.
    Cuando el administrador ingresa al reporte de cobertura y selecciona un periodo.
    Entonces el sistema muestra el número de consultantes únicos atendidos en cada zona, junto con el total del periodo.

  Escenario: 2. Diferenciación entre personas y citas
    Dado un mismo consultante tiene varias citas realizadas dentro del periodo consultado.
    Cuando el administrador consulta el reporte de cobertura.
    Entonces el sistema cuenta a esa persona una sola vez en el total de personas atendidas y presenta el número de citas realizadas como un dato separado.

  Escenario: 3. Consultantes sin zona registrada
    Dado existen consultantes atendidos cuya zona de residencia no fue diligenciada.
    Cuando el administrador consulta el reporte de cobertura.
    Entonces el sistema los agrupa bajo la categoría "No reporta" y los incluye en el total, de modo que la suma por zonas coincida con el total de personas atendidas.

  Escenario: 4. Periodo sin atenciones registradas
    Dado no existen citas realizadas dentro del periodo seleccionado.
    Cuando el administrador consulta el reporte de cobertura.
    Entonces el sistema informa que no hay atenciones registradas en ese periodo y no presenta un reporte vacío sin explicación.

  Escenario: 5. Reporte en datos agregados
    Dado la administradora está consultando el reporte de personas atendidas por zona.
    Cuando intenta obtener el listado de las personas que componen una de las zonas.
    Entonces el sistema presenta únicamente totales y porcentajes por zona, sin permitir descender al detalle individual de los consultantes desde el módulo de reportes.
```

### HU-6.3

- Rol: Administrador
- Funcionalidad: exportar los reportes consultados a PDF y Excel
- Propósito: presentar los informes de gestión e impacto ante la junta y las entidades aliadas

```gherkin
# language: es
Característica: HU-6.3

  Escenario: 1. Exportación exitosa a PDF
    Dado la administradora tiene un reporte consultado en pantalla con datos del periodo seleccionado.
    Cuando selecciona la opción de exportar a PDF.
    Entonces el sistema genera el archivo con los mismos datos y el periodo consultados, incluyendo el nombre de la fundación y la fecha de generación, y lo descarga.

  Escenario: 2. Exportación exitosa a Excel
    Dado la administradora tiene un reporte consultado en pantalla.
    Cuando selecciona la opción de exportar a Excel.
    Entonces el sistema genera un archivo con los datos del reporte organizados en filas y columnas, de modo que puedan reutilizarse para otros análisis.

  Escenario: 3. Exportación de un reporte sin datos
    Dado el periodo consultado no arroja resultados.
    Cuando el administrador intenta exportar el reporte.
    Entonces el sistema informa que no hay datos para exportar y no genera un archivo vacío.
```
