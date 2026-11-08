# Documentos legales de SANA

Esta carpeta guarda los textos legales que SANA muestra y registra en
`public.policy_documents`.

## Contenido

```
policies/
├── politica-tratamiento-datos.md   # documentos aprobados, tal como se descargaron de Google Docs
├── terminos-condiciones.md
├── avisos-casillas.md
├── compromisos-personal.md
└── v1/                             # un archivo por pd_type, con el texto exacto que se guarda en la base
    ├── privacy_policy.md
    ├── terms_of_use.md
    ├── data_treatment.md
    ├── dependent_consent.md
    ├── account_terms.md
    ├── donation_terms.md
    ├── schedule_terms.md
    └── clinical_note_terms.md
```

El nombre de cada archivo de `v1/` es el `pd_type`. El script
`DataBase/scripts/generate-policy-seed.js` lee esos archivos y genera
`DataBase/init-scripts/06-legal-v1-texts.sql`.

| pd_type | Versión v1 | Origen |
| :---- | :---- | :---- |
| `privacy_policy` | 1.0 | Política de Tratamiento de Datos Personales completa |
| `terms_of_use` | 1.0 | Términos y condiciones completos |
| `data_treatment` | 2.0 | Casilla de "Para mí" en la solicitud de cita |
| `dependent_consent` | 2.0 | Casilla 2 de "Para un menor a mi cargo" |
| `account_terms` | 1.0 | Casilla del primer inicio de sesión |
| `donation_terms` | 1.0 | Casilla del formulario de donación |
| `schedule_terms` | 2.0 | Compromiso de uso y disponibilidad del psicólogo |
| `clinical_note_terms` | 2.0 | Compromiso al registrar una nota de atención |

## Reglas

- Una fila de `policy_documents` nunca se modifica ni se borra: las
  aceptaciones ya registradas apuntan a ella como prueba de lo que la persona
  aceptó.
- Cada texto nuevo es una fila nueva con una versión nueva. La versión vigente
  de cada tipo es la de `pd_effective_from` más reciente.
- Los archivos de una carpeta ya publicada (`v1/`, `v2/`, ...) no se vuelven a
  editar. Un cambio va siempre en una carpeta nueva.

## Publicar una versión nueva

1. Actualiza el documento aprobado en esta carpeta, si cambió.
2. Crea la carpeta de la nueva publicación copiando la anterior, por ejemplo
   `v2/`, y edita solo los `.md` de los textos que cambian. Borra de `v2/`
   los que no cambian.
3. En `DataBase/scripts/generate-policy-seed.js`, agrega una entrada al final
   de `RELEASES` con la carpeta, el nombre del SQL de salida (el siguiente
   número libre de `init-scripts/`, por ejemplo `07-legal-v2-texts.sql`) y la
   versión nueva de cada tipo incluido:

   ```js
   {
     folder: 'v2',
     output: '07-legal-v2-texts.sql',
     versions: {
       privacy_policy: '1.1',
     },
   },
   ```

4. Regenera el SQL desde la raíz del repositorio:

   ```bash
   node DataBase/scripts/generate-policy-seed.js
   ```

   El script falla si falta o sobra un archivo, si alguno está vacío o si
   contiene `$md$`.

5. Revisa el SQL generado y ejecútalo primero en la base de desarrollo y
   después en producción. Puede pegarse tal cual en el editor SQL de Neon.
   Usa `ON CONFLICT (pd_type, pd_version) DO NOTHING`, así que correrlo dos
   veces no duplica filas.
6. Comprueba la carga:

   ```sql
   SELECT pd_type, pd_version, pd_effective_from, left(pd_content, 60)
   FROM public.policy_documents
   ORDER BY pd_type, pd_effective_from;
   ```

Si se edita un `.md` de una versión que ya se ejecutó, el `INSERT` no hace
nada porque la pareja tipo y versión ya existe. Para publicar ese cambio hay
que subir la versión.
