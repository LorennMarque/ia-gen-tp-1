# Corta — Acortador de URLs Interno

Acortador de URLs para uso interno de la empresa.

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
├── src/              # Código servidor
├── test/             # Tests
├── public/           # UI (HTML, CSS, assets)
├── SPEC.md           # Especificación de comportamiento
└── README.md         # Este archivo
```

## Stack

- **Framework:** Express.js
- **Base de datos:** JSON local (futuro: PostgreSQL en Railway)
- **Node.js:** `^18.18.0`, `^20.9.0` o `>=21.1.0` (requisito de Mocha 11)

## Desarrollo

Leer `SPEC.md` para entender qué debe hacer cada endpoint.

Bugs conocidos: ver `/docs/BUGS_FOUND.md`.
