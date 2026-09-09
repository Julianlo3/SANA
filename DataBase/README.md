# DB_SANA — Base de datos dockerizada

Base de datos PostgreSQL para el sistema DB_SANA, lista para levantar con
Docker. El esquema y los datos iniciales se cargan automáticamente al
crear el contenedor.

## Estructura del repositorio

```
.
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
└── init-scripts/
    ├── 01-schema.sql     # tablas, constraints y comentarios (pgModeler)
    └── 02-inserts.sql    # catálogos y datos iniciales
```

## Requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (incluido en Docker Desktop)

## Levantar la base de datos

1. Clona el repositorio y entra a la carpeta.
2. Crea tu archivo de variables de entorno a partir de la plantilla:
   ```bash
   cp .env.example .env
   ```
3. Abre `.env` y define una contraseña en `POSTGRES_PASSWORD` (los demás
   valores ya traen defaults razonables, incluyendo `POSTGRES_DB=DB_SANA`).
4. Levanta el contenedor:
   ```bash
   docker compose up -d
   ```
   La primera vez, Postgres crea la base `DB_SANA` y ejecuta automáticamente
   `01-schema.sql` y `02-inserts.sql`, en ese orden.
5. Verifica que arrancó sin errores:
   ```bash
   docker compose logs -f db_sana
   ```
6. Conéctate para confirmar que las tablas y los datos están cargados:
   ```bash
   docker exec -it db_sana psql -U postgres -d "DB_SANA" -c "\dt"
   ```

## Detener / reiniciar

```bash
docker compose down        # detiene el contenedor, conserva los datos
docker compose down -v     # detiene el contenedor y BORRA los datos
docker compose up -d       # vuelve a levantar
```

Los scripts de `init-scripts/` solo se ejecutan la **primera vez** que se
crea el volumen. Si los editas después de haber levantado el contenedor,
necesitas `docker compose down -v` para que se vuelvan a ejecutar.

## Notas importantes

- **Nombre de la base**: por defecto es `DB_SANA` (mayúsculas incluidas).
  Al conectarte manualmente, cítalo entre comillas dobles: `-d "DB_SANA"`.
- **Puerto ocupado**: si el `5432` ya está en uso en tu máquina, cambia
  `POSTGRES_PORT` en tu `.env`.
- **Nunca subas tu `.env` real** a git — ya está en `.gitignore`. Cada
  persona que clone el repo crea el suyo a partir de `.env.example`.
