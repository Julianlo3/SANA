# Identidad Visual y Lineamientos de Correo — SANA
Fundación Dejando Huellas Felices

---

## 1. Paleta de Colores

Los colores oficiales corresponden al manual de marca de la **Fundación Dejando Huellas Felices** y la plataforma **SANA**:

| Rol / Uso | Nombre | HEX | RGB | Muestra |
| :--- | :--- | :--- | :--- | :--- |
| **Primario** | Turquesa SANA | `#43ACB6` | `rgb(67, 172, 182)` | Acciones principales, botones, enlaces y acentos visuales |
| **Primario Oscuro** | Turquesa Intenso | `#2E8C96` | `rgb(46, 140, 150)` | Estados hover, bordes de botón y encabezados de tabla |
| **Primario Suave** | Turquesa Claro | `#E4F4F6` | `rgb(228, 244, 246)` | Fondos de tarjetas informativas, badges y estados |
| **Acento** | Rosa SANA | `#EB5886` | `rgb(235, 88, 134)` | Elementos destacados, alertas cálidas y detalles de marca |
| **Acento Fuerte** | Rosa Fuerte / Alerta | `#C93C68` | `rgb(201, 60, 104)` | Estados de cancelación, advertencia o badges de alta prioridad |
| **Acento Suave** | Rosa Suave | `#FDE9F0` | `rgb(253, 233, 240)` | Fondos de cancelación y avisos delicados |
| **Apoyo** | Celeste Apoyo | `#A0D6DF` | `rgb(160, 214, 223)` | Líneas decorativas, gradientes y divisores |
| **Resaltado** | Crema Dorado | `#FEEFC4` | `rgb(254, 239, 196)` | Etiquetas destacadas y estados pendientes |
| **Superficie** | Blanco Puro | `#FFFFFF` | `rgb(255, 255, 255)` | Contenedor principal de tarjetas y contenido |
| **Fondo Global** | Crema Cálido | `#FFFDF8` | `rgb(255, 253, 248)` | Fondo exterior del correo (backdrop) |
| **Bordes** | Borde Sutil | `#E3EDEF` | `rgb(227, 237, 239)` | Separadores y bordes de tarjetas |
| **Texto Principal** | Marino Profundo | `#134176` | `rgb(19, 65, 118)` | Títulos y texto de lectura principal (evitar negro puro) |
| **Texto Secundario** | Marino Muted | `#4A6A8C` | `rgb(74, 106, 140)` | Metadatos, etiquetas y descripciones |
| **Texto Sutil / Footer**| Marino Grisáceo | `#8296AC` | `rgb(130, 150, 172)` | Pie de página, avisos legales y notas al pie |

---

## 2. Tipografía

- **Familia principal**: `Montserrat`
- **Pila de fuentes para correo (fallback universal)**:
  `'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Jerarquía y Pesos**:
  - **Títulos y Encabezados (H1, H2)**: 700 (Bold) / 800 (ExtraBold), color `#134176`.
  - **Subtítulos y Etiquetas de Datos**: 600 (SemiBold), color `#4A6A8C`.
  - **Texto de Cuerpo**: 400 (Regular), tamaño 15px - 16px, altura de línea 1.6, color `#134176`.
  - **Pie de página y avisos legales**: 400 (Regular), tamaño 12px, altura de línea 1.5, color `#8296AC`.

---

## 3. Galería de Imágenes

Ubicadas en `src/email/gallery/`:

1. **Logotipo Institucional**:
   - Archivo fuente: `Logo Horizontal  (A color)-01.png` (4000x4000 px, 152 KB).
   - Versión optimizada para correo: `logo-email.png` (480x98 px recortado, ~9.2 KB).
   - Visualización recomendada: Ancho 180px - 220px, centrado o alineado a la izquierda.
   - Referencia CID: `cid:sana-logo`.

2. **Banner Hero Institucional**:
   - Archivo fuente: `ninos-abrazo.jpg` (5376x3584 px, 3.44 MB).
   - Versión optimizada para correo: `banner-email.jpg` (600x240 px, ~14.9 KB).
   - Visualización recomendada: Ancho completo de la tarjeta (600px), esquinas redondeadas superiores o dentro de la cabecera.
   - Referencia CID: `cid:sana-hero`.

---

## 4. Lineamientos de Optimización y Entrega Liviana

- **Límite de peso**: El correo completo (HTML + imágenes inline) no debe superar **100 KB** para evitar que Gmail recorte el mensaje (*"Message clipped"*).
- **Imágenes incrustadas**: Se emplean CIDs (`cid:sana-logo` y `cid:sana-hero`) mapeadas a versiones optimizadas en formato `multipart/related` o URL pública según configuración.
- **Doble formato**: Todo correo generado provee tanto su versión `html` como su versión `text` plana para accesibilidad y evitar filtros antispam.
- **Protección de datos (Habeas Data)**: Ningún correo incluye diagnósticos, notas clínicas ni detalles confidenciales de la sesión psicológica.

