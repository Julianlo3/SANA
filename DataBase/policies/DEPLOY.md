# Despliegue a producción: documentos legales v1

Pasos en orden para publicar la política de datos, los términos y el registro
de aceptaciones (rama `feature-Sandino`). Marca cada casilla al terminarla.

**El orden importa:** la base va primero. El backend nuevo falla sin las
columnas de `05` (solicitudes de cita, fichas y webhook de donaciones), y el
consultante no puede entrar a su cuenta sin los textos de `06`. El código
anterior funciona sin problema con la base ya actualizada.

## 0. Antes de empezar

- [ ] El PR está aprobado y **todavía no se ha hecho merge** a `main`.
- [ ] Revisa cómo despliegan Render y Vercel. Si los dos despliegan solos al
      hacer merge, el frontend nuevo puede quedar listo antes que el backend
      nuevo. Durante esos minutos, donar falla (404 en
      `/donations/checkout`). Para evitarlo, pausa el despliegue automático de
      Vercel hasta terminar el paso 4.
- [ ] Variables de entorno listas (todavía sin redesplegar):

  | Dónde | Variable | Valor |
  | :---- | :---- | :---- |
  | Render (backend) | `WOMPI_INTEGRITY_SECRET` | Secreto de integridad de **producción** de Wompi. Sin él, donar responde 503 |
  | Render (backend) | `TRUST_PROXY_HOPS` | Empieza con `2` y confírmalo en el paso 6 |
  | Vercel (frontend) | `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | Llave pública de producción (ya debería existir) |
  | Vercel (frontend) | `WOMPI_INTEGRITY_SECRET` | Ya no se usa en el frontend. Bórrala después del paso 5 |

## 1. Respaldo de la base en Neon

1. En la consola de Neon, abre el proyecto de producción.
2. **Branches → Create branch**, desde la rama de producción en su estado
   actual (*Head*). Nómbrala `backup-pre-legal-v1-AAAA-MM-DD`.
3. Confirma que la rama nueva aparece en la lista. Es una copia instantánea; no
   la borres hasta que pase al menos una semana sin problemas.

Anota la hora exacta del respaldo; también sirve para una restauración a un
punto en el tiempo (*Restore*) si hiciera falta.

## 2. Comprobaciones previas en producción

En el **SQL Editor** de Neon, con la rama de producción seleccionada:

```sql
SELECT
  to_regclass('public.policy_documents')  AS policy_documents,
  to_regclass('public.policy_acceptance') AS policy_acceptance,
  to_regclass('public.donation')          AS donation,
  to_regclass('public.users')             AS users;
```

Las cuatro columnas deben traer el nombre de la tabla, no `NULL`. Si
`donation` sale `NULL`, falta aplicar `04-donation.sql`: detente y avísale al
equipo.

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'person'
  AND column_name = 'per_vulnerabilities';
```

Debe devolver una fila. Esta columna no está en los scripts de `DataBase/`; si
no existe, la solicitud de cita con población vulnerable falla. Detente y
avísale al equipo.

```sql
SELECT pd_type, pd_version FROM public.policy_documents ORDER BY pd_type, pd_version;
SELECT count(*) AS documentos FROM public.policy_documents;
```

Anota el conteo. No debe existir ya ninguna de las versiones que va a
insertar `06` (`2.0` de `data_treatment`, `dependent_consent`,
`schedule_terms`, `clinical_note_terms`, y `1.0` de `privacy_policy`,
`terms_of_use`, `account_terms`, `donation_terms`). Si alguna existe con otro
texto, detente: `06` no la reemplaza.

## 3. Scripts en producción

En el SQL Editor de Neon, sobre la rama de producción:

1. Pega todo el contenido de `DataBase/init-scripts/05-legal-v1-schema.sql`
   y ejecútalo. Solo agrega columnas y restricciones; no borra ni modifica
   datos. Las aceptaciones existentes quedan con `pa_channel = 'web'`.
2. Pega todo el contenido de `DataBase/init-scripts/06-legal-v1-texts.sql`
   y ejecútalo. Inserta 8 filas nuevas en `policy_documents`.

Desde este momento los textos nuevos son los vigentes. Pasa al paso 4 sin
demora: mientras siga el frontend anterior, el psicólogo verá
«Cargando términos…» en el compromiso de agenda (puede aceptarlo igual).

Ambos scripts se pueden ejecutar otra vez sin error y sin duplicar filas.

### Verificación

```sql
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'policy_acceptance' AND column_name IN ('pa_channel', 'pa_registered_by'))
    OR (table_name = 'donation' AND column_name IN ('don_terms_pd_id', 'don_terms_accepted_at', 'don_ip_address')))
ORDER BY table_name, column_name;
```

Deben salir 5 filas.

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname IN ('Policy_Acceptance_channel_ck',
                  'Policy_Acceptance_Registered_By_fk',
                  'Donation_Terms_Document_fk');
```

Deben salir 3 filas.

```sql
SELECT pd_type, pd_version, pd_effective_from, left(pd_content, 60)
FROM public.policy_documents
ORDER BY pd_type, pd_effective_from;

SELECT count(*) AS documentos FROM public.policy_documents;
```

El conteo debe ser el del paso 2 más 8, y para cada tipo la fila más reciente
debe ser la versión nueva.

```sql
SELECT pa_channel, count(*) FROM public.policy_acceptance GROUP BY pa_channel;
```

Solo debe aparecer `web`, con el mismo total de aceptaciones que antes.

## 4. Backend en Render

1. Haz merge del PR a `main` (o despliega `main` manualmente si el despliegue
   automático está apagado).
2. Confirma que Render tiene `WOMPI_INTEGRITY_SECRET` y `TRUST_PROXY_HOPS`.
3. Espera a que el despliegue quede **Live** y revisa los logs: no deben
   aparecer errores de columnas inexistentes (`column ... does not exist`).
4. Comprueba que responde (sin sesión):

   ```bash
   curl https://<backend>/api/v1/policy/privacy_policy
   ```

   Debe devolver JSON con `"version":"1.0"`.

## 5. Frontend en Vercel

1. Despliega (o reactiva el despliegue automático) cuando el backend ya esté
   Live.
2. Espera el estado **Ready**.

## 6. Pruebas rápidas en producción

- [ ] `/politica-de-datos` y `/terminos` muestran el documento completo, con
      tablas. Con JavaScript desactivado se ven igual (es lo que revisa
      Google).
- [ ] El pie de página muestra el aviso general, el contacto y los dos enlaces.
- [ ] `/solicitar-cita/adulto` muestra el aviso de no emergencias y la casilla
      con el texto «Soy mayor de edad y autorizo…».
- [ ] Envía una solicitud de prueba con tus datos y revisa:

  ```sql
  SELECT pa.pa_id, pd.pd_type, pd.pd_version, pa.pa_channel, pa.pa_ip_address
  FROM public.policy_acceptance pa
  JOIN public.policy_documents pd USING (pd_id)
  ORDER BY pa.pa_id DESC
  LIMIT 3;
  ```

  Deben aparecer `data_treatment` 2.0 y `privacy_policy` 1.0 con canal `web`.
  **`pa_ip_address` debe ser tu IP pública** (compárala con una página tipo
  «¿cuál es mi IP?»). Si sale una IP de Vercel o de Render, ajusta
  `TRUST_PROXY_HOPS` en Render (sube o baja de uno en uno) y repite. Luego
  retira o descarta la cita de prueba desde la cuenta de secretaría.
- [ ] Entra a `/mi-cuenta` con una cuenta de consultante: debe aparecer
      «Antes de continuar». Al aceptar, entra al panel.
- [ ] Como secretaria, `/consultantes/nuevo` registra una ficha con canal.
- [ ] En `/donaciones`, la casilla es obligatoria y el botón abre el widget de
      Wompi. No hace falta pagar: basta con que el widget abra.
- [ ] Como psicólogo, `/mi-disponibilidad` pide aceptar el compromiso de agenda
      2.0 y lo muestra con párrafos y lista.

## 7. Si algo falla

**El código es la primera opción.** La base nueva es compatible con el código
anterior, así que basta con volver a la versión previa:

1. **Vercel:** en *Deployments*, el despliegue anterior → *Instant Rollback*.
2. **Render:** en *Events*, el despliegue anterior → *Rollback*.

No hace falta tocar la base para esto. Las columnas nuevas no afectan al
código anterior, y las filas nuevas de `policy_documents` deben quedarse:
**nunca se borran ni se modifican** filas de esa tabla, porque las aceptaciones
registradas apuntan a ellas.

**Restaurar la base solo si se dañaron datos** (no es lo esperado, porque los
scripts solo agregan):

1. Avisa al equipo y detén escrituras si es posible.
2. En Neon, usa *Restore* de la rama de producción a la hora anotada en el
   paso 1, o compara contra la rama `backup-pre-legal-v1-…`.
3. Ten en cuenta que restaurar descarta todo lo escrito después del respaldo
   (citas, aceptaciones, donaciones). Antes de restaurar, exporta lo que se
   haya registrado en ese intervalo.

## 8. Después

- Borra `WOMPI_INTEGRITY_SECRET` de Vercel.
- Borra la rama de respaldo de Neon cuando pase una semana sin problemas.
- Para publicar una versión nueva de los textos, sigue `DataBase/policies/README.md`.
