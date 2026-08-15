# Deploy de Corta en Railway

## Producción

- URL pública: https://corta-production-3c57.up.railway.app
- Proyecto Railway: `corta`
- Ambiente: `production`
- Servicio web: `corta`
- Base de datos: `Postgres`
- Deploy: Railway MCP desde el directorio `corta/`

## Configuración

El servicio web define:

- `NODE_ENV=production`
- `DATABASE_URL=${{ Postgres.DATABASE_URL }}`

`DATABASE_URL` es una referencia entre servicios administrada por Railway. Su valor y las credenciales de PostgreSQL no se guardan en el código ni en la documentación.

La aplicación crea la tabla `links` al iniciar. En desarrollo, cuando no existe `DATABASE_URL`, conserva el almacenamiento local en `data/links.json`; en producción rechaza el arranque si falta la base de datos.

## Verificación del 2026-08-15

La suite local pasó antes del deploy: **34 tests passing**.

Smoke test sobre el dominio público:

| Caso | Resultado |
| --- | --- |
| `GET /` | 200 |
| `POST /api/links` con URL válida | 200, código de 8 caracteres |
| `GET /:codigo` | 302 y `Location` correcto |
| `GET /api/links/:codigo/stats` | 200 con URL, clicks y timestamp |
| `POST /api/links` con URL inválida | 400 JSON |
| `GET /:codigo` inexistente | 404 JSON |

## Prueba de persistencia

1. El primer deploy creó el código `9owbgvi9` para una URL de prueba.
2. Una redirección dejó `clicks: 1` y se registró el timestamp `2026-08-15T21:42:02.263Z`.
3. Se desplegó nuevamente el servicio web; Railway reemplazó el deployment anterior.
4. El mismo código siguió devolviendo la misma URL, el mismo timestamp y `clicks: 1`.
5. Una nueva redirección actualizó el contador a `clicks: 2`.

Esto prueba que los links y clicks viven en PostgreSQL y sobreviven al reemplazo del contenedor web.
