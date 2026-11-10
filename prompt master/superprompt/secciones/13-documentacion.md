<!-- responsable: Dayana | estado: borrador -->
# 13. Documentación a generar

## 13.1 Idioma y documentación del código fuente

- La documentación de código fuente debe estar en inglés técnico, corto y consistente; no documentar símbolos nuevos en español.
- Documentar funciones, componentes, hooks, tipos/interfaces, constantes globales y otras declaraciones relevantes de ámbito de archivo.
- Usar JSDoc con descripción, `@param` para cada parámetro y `@returns` cuando aplique:

```ts
/**
 * <Short technical description of purpose and behavior.>
 * @param <parameterName> <Short parameter description.>
 * @returns <Result description.>
 */
```

- Para tipos, interfaces y constantes sin parámetros, usar una descripción breve en inglés. No inventar `@param` o `@returns` cuando no aplican.
- Los comentarios narrativos que expliquen un comportamiento puntual, y no documenten una API o declaración, pueden conservar el idioma del contexto.
- La documentación dirigida a usuarios, mensajes e interfaz permanece en español.

## 13.2 Entregables del proyecto

| Archivo | Contenido |
|---|---|
| `README.md` | Descripción, requisitos, instalación, ejecución local, variables de entorno |
| `docs/arquitectura.md` | Diagramas Mermaid (componentes, despliegue) y justificación de patrones |
| `docs/modelo-datos.md` | Diagrama ER y diccionario de datos |
| `docs/api.md` | Referencia de endpoints (o enlace a OpenAPI) |
| `docs/manual-usuario.md` | Procedimientos por rol |
| `docs/despliegue.md` | Procedimiento de despliegue y configuración de entornos |
| `docs/decisiones.md` | Registro de decisiones (formato en 0.5) |

[PENDIENTE: entregables académicos que deban generarse desde esta especificación.]
