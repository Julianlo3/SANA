<!-- responsable: Liseth | estado: borrador -->
# 11. Interfaz de usuario

## 11.1 Identidad visual

[PENDIENTE: paleta de colores, tipografías, logotipo, lineamientos de tono.]

## 11.2 Mapa de vistas

- Sitio público: [PENDIENTE: inicio, nosotros, servicios, donaciones, contacto].
- Panel autenticado por rol: [PENDIENTE].

## 11.3 Requisitos

- UI-01. Diseño responsive con enfoque mobile-first.
- UI-02. Los mensajes de error y confirmación usan los textos definidos en los criterios de aceptación (sección 7).
- UI-03. [PENDIENTE: librería de componentes.]

## 11.4 Guía de mejoras frontend y registro de sesión

### 2026-11-04 — Rol: frontend

Esta guía define los resultados y criterios necesarios para implementar o recrear las mejoras de esta sesión. Antes de cambiar código, inspeccionar los componentes y patrones existentes; conservar la arquitectura del frontend, la autorización vigente y el comportamiento responsive. No modificar el backend para resolver estos casos.

#### FE-01. Fallo del backend durante la validación de sesión

- Si el backend no responde o devuelve un error inesperado al validar la sesión, navegar a una pantalla amigable de servicio no disponible; no mostrar al usuario logs, errores sin procesar ni una página rota.
- Conservar los destinos existentes para los casos conocidos: `401` lleva a sesión expirada y `403` a acceso restringido.
- La pantalla debe explicar que la validación no está disponible temporalmente y ofrecer «Intentar de nuevo» (volver al panel para repetir la validación) y «Volver al inicio».
- Criterios de aceptación: rechazo de red y respuesta HTTP no exitosa distinta de `401`/`403` muestran la pantalla amigable; `401` y `403` mantienen su destino; los errores técnicos se registran solo en el servidor.

#### FE-02. Digitación independiente en campos de confirmación

- En el formulario público de citas, impedir pegar en los campos de confirmación de correo y documento de identidad del solicitante, acudiente y dependiente. Mantener habilitado pegar en los campos originales.
- Reutilizar la capacidad del campo compartido de formularios, en vez de añadir manejadores distintos a cada pantalla. Mostrar una indicación visible y accesible de que el valor debe escribirse manualmente.
- Criterios de aceptación: pegar no cambia el valor confirmado; escribirlo manualmente sigue funcionando; los campos originales conservan el pegado; cubrir al menos el campo de correo y el documento del dependiente con pruebas.

#### FE-03. Transparencia y límites de donaciones

- Presentar el monto del aporte, la comisión variable, la comisión fija, el IVA calculado sobre la comisión, el total que paga la persona y el neto estimado recibido por la fundación. La opción de cubrir la comisión es voluntaria y debe reflejarse de forma coherente en esos valores.
- Para el estimado del Plan Avanzado Agregador de Wompi Colombia usar 2,65% del pago + $700 COP y 19% de IVA sobre la tarifa por transacción exitosa. Aclarar que es un estimado: la tarifa puede diferir por condiciones negociadas o medio de pago; enlazar la fuente oficial y no presentarlo como tarifa universal.
- Cuando la persona cubre la tarifa, calcular el menor total entero en COP cuyo neto después de la tarifa estimada alcance el aporte deseado. El cálculo debe ser directo y acotado; no usar ciclos que incrementen o decrementen el valor peso a peso.
- Limitar la donación en línea a $50.000.000 COP como decisión operativa de este producto, no como máximo impuesto por ley ni como límite universal de Wompi. Validar montos finitos, enteros y dentro del rango en la interfaz y nuevamente en el Server Action, antes de calcular o firmar el checkout.
- Limitar el tamaño de entrada antes de convertir números; para un valor excesivo mostrar un error visible, evitar desbordamiento o congelamiento y deshabilitar el checkout. Ocultar el desglose mientras el monto está fuera del rango.
- Criterios de aceptación: montos válidos muestran importes coherentes; el neto con comisión cubierta alcanza el aporte; un peso menos no debe bastar; el máximo funciona; entradas enormes se rechazan con prontitud tanto en UI como en servidor; el checkout no acepta valores inválidos.

#### FE-04. Navegación desde la pantalla de indisponibilidad

- Ofrecer una acción «Volver al inicio» que navegue a `/`, además de «Intentar de nuevo». Mantener ambos destinos distinguibles y utilizables con teclado y en pantallas pequeñas.
- Criterio de aceptación: cada acción navega a su destino y la pantalla conserva el mensaje de indisponibilidad.

#### FE-05. Menú lateral durante el desplazamiento

- En escritorio, mantener el menú lateral visible mientras se desplaza el contenido de listas largas, usando el patrón sticky compatible con el contenedor existente.
- Preservar el menú móvil como panel fijo/off-canvas y sus controles de abrir, cerrar y overlay. Aplicar el ajuste de escritorio solo desde el breakpoint correspondiente (`lg`).
- Criterios de aceptación: el menú sigue disponible al recorrer listas largas en escritorio; no cubre ni bloquea contenido y el comportamiento móvil/tablet existente permanece funcional.

#### FE-06. Verificación y alcance

- Añadir o actualizar pruebas para el comportamiento modificado, incluidas las validaciones del cálculo y del Server Action de donaciones, los casos de error de autenticación y la prevención de pegado.
- Ejecutar pruebas focalizadas, ESLint y build del frontend. No modificar servicios, contratos ni archivos del backend para estos cambios.

### 2026-11-09 — Rol de la IA: Frontend

Este registro contextualiza la IA como agente especializado en frontend. El trabajo se limita a la aplicación frontend; respeta contratos de API existentes y no implementa ni modifica backend.

#### Prompt de trabajo registrado

> Rol de la IA: agente Frontend de SANA. Implementa y mantén el dashboard de reportes dentro del panel del rol Administrador, limitando todos los cambios a la aplicación frontend. Antes de agregar filtros o visualizaciones, inspecciona el contrato vigente de la API; consúmelo sin modificar el backend. Integra `GET /api/v1/reports/summary` mediante `ENDPOINTS` y `httpClient`, organiza la solución por feature (`types`, `services`, `hooks`, `pages`) y agrega la ruta `/reportes` al menú del administrador. Presenta las métricas agregadas de psicología, sistema y donaciones en tarjetas responsive; convierte `totalAmountInCents` de centavos a COP sin perder precisión. Incluye actualización manual y estados de carga/error/reintento. No inventes filtros ni series temporales si la API solo devuelve agregados acumulados. Conserva la arquitectura y estilos existentes, documenta las declaraciones nuevas con JSDoc técnico breve en inglés según la sección 13 y prueba servicio, hook, presentación, ruta y acceso del menú.

#### FE-07. Dashboard de reportes administrativos

- Mostrar los ocho campos entregados por el resumen actual en tres grupos extensibles: Psicología (`totalCompletedAppointments`, `averageCompletedAppointmentsPerPsychologist`, `activePsychologists`); Sistema (`totalConsultants`, `averageAppointmentsPerConsultant`); Donaciones (`totalAmountInCents`, `approvedDonations`, `peopleWhoDonated`).
- Obtener los datos desde el endpoint existente, con tipos alineados exactamente a su respuesta y el cliente HTTP común. No añadir consultas directas desde componentes ni modificar el backend como parte de esta capacidad frontend.
- Exponer `/reportes` en la navegación del Administrador, mantenerla dentro de la autorización/layout de panel vigente y no mostrarla para otros roles.
- Usar diseño responsive y consistente con el panel. Ofrecer actualización manual y estados claros de carga, error y reintento; mantener los datos previamente cargados si falla una actualización.
- Formatear números para `es-CO` y donaciones como COP desde centavos sin convertir la suma a un `number` que pueda perder precisión.
- El resumen vigente es acumulado y no recibe período/filtros ni entrega datos agrupados por fecha. No presentar filtros inoperantes ni gráficas temporales con datos inventados; para estas últimas se requiere primero un contrato API con series temporales.
- Criterios de aceptación: cada métrica del contrato se muestra bajo su grupo; el enlace aparece solo para Administrador; el monto se visualiza en COP; carga/error/actualización son operables y accesibles; servicio, hook, pantalla, ruta y navegación cuentan con pruebas; lint y TypeScript pasan.
- Registro de cierre: la implementación frontend quedó integrada con el contrato vigente; se eliminó el aviso visual de que no había filtros a petición del usuario. La suite focalizada final pasó 16 pruebas; la feature de reportes obtuvo 100% de statements, branches, funciones y líneas en medición focalizada. Las pruebas de navegación cubren el acceso por rol, sin atribuir esa cifra a todo el sidebar existente.
