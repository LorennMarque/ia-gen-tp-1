# Bugs y Problemas Encontrados

Documentación de bugs identificados en el código heredado. Comparativa entre comportamiento actual vs esperado (SPEC.md).

---

## Bug 1: GET /:codigo no es redirect 302

**Ubicación:** `corta/server.js`, línea 47

**Actual:**
```javascript
res.send(link.url);  // Devuelve 200 OK + URL como texto plano
```

**Esperado (SPEC.md):**
- Respuesta 302 Found
- Header `Location: [URL]`
- Browser redirige automáticamente

**Impacto:** El usuario ve el URL como texto en lugar de ser redirigido.

**Fix:** Cambiar a `res.redirect(302, link.url)`

---

## Bug 2: Clicks no se guardan en la base de datos

**Ubicación:** `corta/server.js`, líneas 46-48

**Actual:**
```javascript
link.clicks = link.clicks + 1;  // Incrementa en memoria
res.send(link.url);             // Pero NO guarda
```

**Esperado (SPEC.md):**
- Cada click se incrementa Y se persiste
- Los clicks deben sobrevivir a reinicios del servidor

**Impacto:** Las estadísticas siempre muestran 0 clicks.

**Prueba:**
```bash
curl http://localhost:3000/:codigo  # clicks sigue siendo 0
```

**Fix:** Agregar `guardarLinks(links)` después de incrementar clicks.

---

## Bug 3: Endpoint GET /api/links/:codigo/stats falta completamente

**Ubicación:** No existe

**Esperado (SPEC.md):**
- `GET /api/links/:codigo/stats`
- Respuesta 200 con: `{codigo, url, clicks, creado}`
- Respuesta 404 si código no existe

**Impacto:** `public/stats.html` no puede consultar estadísticas.

**Fix:** Implementar el endpoint.

---

## Problema 4: Códigos muy cortos (3 caracteres)

**Ubicación:** `corta/utils.js`, línea 6

**Actual:**
```javascript
for (let i = 0; i < 3; i++)  // Solo 3 caracteres
```

**Esperado (SPEC.md):**
- 8 caracteres alfanuméricos
- ~2.8 trillones de combinaciones

**Impacto:** Con 3 caracteres solo hay ~46k posibles códigos. Con 100 links acortados, alta probabilidad de colisión.

**Fix:** Cambiar a 8 caracteres: `for (let i = 0; i < 8; i++)`

---

## Problema 5: Sin validación de URLs

**Ubicación:** `corta/server.js`, línea 23

**Actual:**
```javascript
if (!url) {
  return res.status(400).json({ error: 'Falta la url' });
}
// Acepta cualquier string, incluso sin protocolo
```

**Esperado (SPEC.md):**
- Validar protocolo (http o https)
- Rechazar URLs inválidas con 400

**Impacto:** Se pueden guardar URLs inválidas como `"mi-sitio"` o `"ftp://..."`.

**Fix:** Validar formato con regex o URL constructor.

---

## Problema 6: Dependencias no usadas

**Ubicación:** `corta/package.json`

**Actual:**
```json
{
  "axios": "^1.7.2",
  "express": "^4.19.2",
  "lodash": "^4.17.21",
  "moment": "^2.30.1"
}
```

**Análisis:**
- `axios` — solo en `test.js` (pruebas manuales, no en producción)
- `express` — usado en `server.js` ✓
- `lodash` — NO se usa
- `moment` — NO se usa

**Fix:** Remover `axios`, `lodash`, `moment` de dependencies.

---

## Problema 7: Archivos viejos / duplicados

**Ubicación:** `corta/`

**Archivos a eliminar:**
- `server_OLD.js` — versión vieja del servidor
- `index_v2_FINAL.js` — versión vieja del index
- `links_backup_marzo.json` — backup antiguo

**Fix:** Borrar en commits chore.

---

## Problema 8: Credenciales hardcodeadas en notas

**Ubicación:** `corta/notas.txt`

**Actual:**
```
postgres://corta:S3cr3taDeLaOficina2023@10.0.4.17:5432/corta
```

**Riesgo:** Credenciales visibles en el repo (aunque el servidor ya no existe).

**Fix:** Remover de `notas.txt` o archivar en `/docs` de forma segura.

---

## Prioridad de fixes

**Alta (Milestone 3):**
1. Bug 2: Guardar clicks
2. Bug 1: Redirect 302
3. Bug 3: Implementar /stats

**Media (Milestone 2):**
4. Problema 4: Aumentar a 8 caracteres
5. Problema 5: Validar URLs
6. Problema 6: Limpiar dependencias

**Baja (Milestone 2):**
7. Problema 7: Borrar archivos viejos
8. Problema 8: Limpiar credenciales
