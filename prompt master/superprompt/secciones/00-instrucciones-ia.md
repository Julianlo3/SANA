<!-- responsable: Andrés | estado: borrador -->
# 0. Instrucciones de ejecución

## 0.1 Objetivo

Construir el sistema SANA (plataforma web de la Fundación Dejando Huellas Felices, Popayán) a partir de esta especificación: código fuente de frontend y backend, esquema y migraciones de base de datos, pruebas automatizadas, configuración de despliegue y documentación técnica y de usuario.

## 0.2 Terminología normativa

- DEBE / NO DEBE: requisito obligatorio.
- DEBERÍA: requisito recomendado; toda desviación se justifica en `docs/decisiones.md`.
- PUEDE: opcional.

## 0.3 Reglas generales

- R-01. Esta especificación es la única fuente de requisitos. Lo que no esté especificado NO DEBE implementarse sin confirmación.
- R-02. El alcance se limita a lo definido en la sección 2. Las funcionalidades excluidas NO DEBEN implementarse aunque aparezcan en otros documentos del proyecto.
- R-03. El stack, las versiones y las convenciones de la sección 4 son obligatorios. No se DEBE sustituir ni agregar tecnologías sin confirmación.
- R-04. Una HU se considera implementada solo cuando todos sus escenarios Gherkin (sección 7) pasan como pruebas automatizadas.
- R-05. La ejecución sigue el orden de fases de la sección 15. No se DEBE iniciar una fase sin cerrar la anterior.
- R-06. El sistema trata datos personales sensibles de menores de edad (Ley 1581 de 2012). Los requisitos de la sección 8 aplican a todas las fases.
- R-07. Idioma: código (identificadores, nombres de archivos y tablas) en inglés; interfaz, mensajes de error, documentación y mensajes de commit en español.
- R-08. NO DEBEN usarse datos reales de consultantes en desarrollo, pruebas ni datos semilla.

## 0.4 Marcadores de la especificación

| Marcador | Significado | Acción requerida |
|---|---|---|
| `[CONFIRMAR: ...]` | Decisión abierta que requiere al usuario | Detener la tarea dependiente, formular la pregunta y esperar respuesta |
| `[PENDIENTE: ...]` | Dato aún no definido por el equipo | Solicitar el dato al usuario antes de usarlo; no asumir valores |

## 0.5 Protocolo de confirmación

Al encontrar un marcador `[CONFIRMAR]` o `[PENDIENTE]`, o antes de ejecutar una operación listada en 0.6:

1. Suspender únicamente las tareas que dependen de la respuesta. Las tareas independientes PUEDEN continuar.
2. Formular la pregunta indicando: sección de origen, contexto mínimo y, cuando existan, opciones numeradas con su impacto técnico y la opción recomendada.
3. Las preguntas de una misma fase DEBERÍAN agruparse en un solo bloque.
4. Si el usuario delega la decisión, aplicar la opción recomendada.
5. Registrar cada decisión en `docs/decisiones.md`:

```
| Fecha (AAAA-MM-DD) | Sección | Pregunta | Decisión | Decidido por |
```

## 0.6 Operaciones que requieren confirmación previa

- Crear, modificar o ejecutar migraciones de base de datos.
- Eliminar archivos, tablas o registros.
- Instalar dependencias no listadas en la sección 4.
- Configurar credenciales, secretos o servicios externos (Google OAuth, correo, WhatsApp, pasarela de pago).
- Desplegar a cualquier entorno.
- Cerrar una fase.

## 0.7 Repositorio existente

Si el repositorio de destino contiene código:

1. Analizar el código existente contra esta especificación.
2. Reportar una tabla con tres columnas: implementado y conforme; implementado y no conforme (con la diferencia); no implementado.
3. [CONFIRMAR: conservar el código existente y completar lo faltante, o regenerar desde cero.]

## 0.8 Informe de cierre de fase

Al finalizar cada fase se DEBE entregar:

```
FASE <n> - <nombre>
Implementado: <componentes y HU>
Pruebas: <aprobadas>/<totales>; HU cubiertas: <lista>
Documentación modificada: <archivos>
Riesgos y pendientes: <lista>
Decisiones requeridas: <lista>
```

La fase siguiente se inicia solo con aprobación explícita del usuario.
