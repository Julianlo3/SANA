<!-- responsable: Julián; revisión legal: Stephanie Sandino | estado: borrador -->
# 8. Requisitos no funcionales

## 8.1 Seguridad

- RNF-SEG-01. Revisión contra OWASP Top 10 antes del despliegue a producción.
- RNF-SEG-02. JWT en cookie con atributos `HttpOnly`, `Secure` y `SameSite`. [PENDIENTE: tiempo de expiración y estrategia de renovación.]
- RNF-SEG-03. Validación y sanitización de toda entrada en el backend.
- RNF-SEG-04. Secretos exclusivamente en variables de entorno; no se versionan.
- RNF-SEG-05. CORS restringido a los dominios del frontend.

## 8.2 Protección de datos personales

- RNF-DAT-01. Cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013. Los datos de menores y los datos de salud son datos sensibles.
- RNF-DAT-02. Registro de la autorización de tratamiento de datos otorgada por el acudiente. [PENDIENTE: texto aprobado por la asesoría legal.]
- RNF-DAT-03. Política de tratamiento de datos y términos de uso publicados en el sitio. [PENDIENTE: textos legales.]

## 8.3 Rendimiento y disponibilidad

[PENDIENTE: tiempo máximo de respuesta de la API, concurrencia esperada, consideraciones del plan gratuito de Render (arranque en frío).]

## 8.4 Usabilidad y compatibilidad

[PENDIENTE: navegadores soportados, diseño responsive, nivel de accesibilidad (WCAG).]

## 8.5 Auditoría

- RNF-AUD-01. Se registran accesos denegados y operaciones de creación, modificación y eliminación sobre usuarios, consultantes y donaciones.
