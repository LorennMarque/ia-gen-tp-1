# Test Plan — Corta

Estrategia de testing. Los tests se derivan de `SPEC.md` (TDD).

## Framework

- **Mocha** — test runner
- **Chai** — assertions
- **Supertest** — HTTP contra `createApp()` (sin servidor manual)
- Ubicación: `corta/test/test.js`
- Ejecutar: `npm test` (en `/corta`)

## Infra

- `src/server.js` exporta `createApp` y `app`; `listen` solo si es entrypoint
- Cada test usa un `dbFile` temporal aislado
- Cada test es independiente

## Cobertura (SPEC.md) — estado

### Persistencia / init

- [x] Si falta `data/` o `links.json`, se inicializa con `[]`
- [x] Fallos de I/O responden 500 JSON (handlers con try/catch)

### POST /api/links

- [x] Crea un link: 200 con `codigo` (8 chars) y `corta`
- [x] Rechaza URL vacía / nula / solo espacios con 400 JSON
- [x] Rechaza URL sin protocolo http/https con 400 JSON
- [x] Misma URL dos veces → dos códigos distintos (no dedup)
- [x] Colisión de código: reintentos internos; si agota → 409 JSON

### GET /:codigo

- [x] Status **302** + header `Location` a la URL original
- [x] Incrementa clicks y **persiste**
- [x] Devuelve 404 JSON si código no existe

### GET /api/links/:codigo/stats

- [x] Devuelve `{codigo, url, clicks, creado}`
- [x] Devuelve 404 JSON si código no existe
- [x] No modifica clicks

## Cómo correr

```bash
cd corta
npm test
```
