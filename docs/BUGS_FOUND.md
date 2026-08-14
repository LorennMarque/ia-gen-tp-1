# Bugs y Problemas Encontrados

Documentación de bugs identificados en el código heredado y su estado tras la corrección post-auditoría.

Paths reales: `corta/src/server.js`, `corta/src/utils.js`.

---

## Bug 1: GET /:codigo no es redirect 302 — CORREGIDO

**Fix:** `res.redirect(302, link.url)`

---

## Bug 2: Clicks no se guardan — CORREGIDO

**Fix:** `guardarLinks(links)` tras incrementar clicks

---

## Bug 3: Endpoint stats faltante — CORREGIDO

**Fix:** `GET /api/links/:codigo/stats` implementado; `stats.html` conectado

---

## Bug 4: data/links.json no existe — CORREGIDO

**Fix:** `asegurarDb()` crea `data/` y `links.json` con `[]`

---

## Bug 5: Sin detección de colisión (nunca 409) — CORREGIDO

**Fix:** Reintentos del generador (hasta 5); 409 JSON si agota

---

## Bug 6: Tests afirmaban el bug de redirect — CORREGIDO

**Fix:** Suite con supertest exige 302 + `Location`

---

## Problema 7: Códigos de 3 caracteres — CORREGIDO

**Fix:** `generarCodigo` produce 8 caracteres

---

## Problema 8: Sin validación de URLs — CORREGIDO

**Fix:** Validación con `URL` + protocolo http/https; 400 JSON

---

## Problema 9: Errores inconsistentes — CORREGIDO

**Fix:** Contrato `{ error }` en 400/404/409/500; try/catch en handlers

---

## Problema 10: UI index sin errores / doble-submit — CORREGIDO

**Fix:** Mensajes de error, muestra código, botón disabled, retry en 409

---

## Problema 11: stats.html maqueta — CORREGIDO

**Fix:** Fetch a stats API; botón "Ver estadísticas"; 404 "Código no existe"

---

## Problema 12: Race read-modify-write — CORREGIDO

**Fix:** Cola de mutaciones en proceso + write atómico (temp + rename)

---

## Problema 13: Dependencias (histórico)

`lodash`/`moment` ya no estaban. `axios` removido; tests usan `supertest`.
