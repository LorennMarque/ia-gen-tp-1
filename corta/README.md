# Corta — Acortador de URLs Interno

Acortador de URLs para uso interno de la empresa.

Producción: https://corta-production-3c57.up.railway.app

## Qué hace

- Recibe URLs largas
- Genera códigos cortos
- Redirige desde el código corto a la URL original
- Registra estadísticas (clicks por link)

## Cómo correr

```bash
npm install
npm start
```

El servidor escucha en `http://localhost:3000`.

Sin `DATABASE_URL`, desarrollo usa `data/links.json`. Para usar PostgreSQL:

```bash
DATABASE_URL="postgres://usuario:clave@host:5432/corta" npm start
```

En producción también se debe definir `NODE_ENV=production`. Si falta `DATABASE_URL`, la aplicación no inicia para evitar guardar datos en un filesystem efímero.

El despliegue actual usa un servicio web y PostgreSQL dentro del mismo proyecto de Railway. `DATABASE_URL` es una referencia interna de Railway y ninguna credencial se guarda en el repositorio. Ver `../docs/DEPLOYMENT.md` para la configuración y la verificación operativa.

### UI

- **Acortar:** `http://localhost:3000/` — formulario para crear links cortos
- **Estadísticas:** `http://localhost:3000/stats.html` — ver clicks por link

## API

Ver `SPEC.md` para especificación completa de endpoints.

### Endpoints principales

- `POST /api/links` — acortar una URL
- `GET /:codigo` — redirigir al destino
- `GET /api/links/:codigo/stats` — obtener estadísticas

## Estructura

```
corta/
├── src/              # Servidor y adaptadores de almacenamiento
├── test/             # Tests
├── public/           # UI (HTML, CSS, assets)
├── SPEC.md           # Especificación de comportamiento
└── README.md         # Este archivo
```

## Stack

- **Framework:** Express.js
- **Base de datos:** JSON local; PostgreSQL cuando existe `DATABASE_URL`
- **Node.js:** `^18.18.0`, `^20.9.0` o `>=21.1.0` (requisito de Mocha 11)

## Desarrollo

Leer `SPEC.md` para entender qué debe hacer cada endpoint.

Ejecutar los tests:

```bash
npm test
```

La suite usa bases temporales para JSON y `pg-mem` para PostgreSQL; no requiere servicios externos.

Bugs conocidos: ver `/docs/BUGS_FOUND.md`.
