# SPEC.md: Corta — Especificación de Comportamiento

## Qué es Corta

Acortador de URLs interno de la empresa. Recibe URLs largas, genera códigos cortos, redirige a destino, y registra estadísticas de acceso.

---

## Errores (contrato unificado)

Todas las respuestas de error de la API usan JSON:

```json
{ "error": "mensaje claro" }
```

Con el código HTTP correcto: `400`, `404`, `409` o `500`.

---

## Endpoints

### POST /api/links
Acortar una nueva URL.

**Entrada:**
```json
{
  "url": "https://example.com/ruta/larga/muy/larga"
}
```

**Respuesta 200:**
```json
{
  "codigo": "abc123xy",
  "corta": "/abc123xy"
}
```

**Respuesta 400:** URL inválida (vacía, nula, solo espacios, sin protocolo http/https, o formato inválido)

**Respuesta 409:** Tras reintentar el generador N veces (N=5), no se obtuvo un código único

**Respuesta 500:** Error de lectura/escritura de la base de datos

**Comportamiento:**
- Valida que la URL sea válida (protocolo http o https)
- Genera un código único de 8 caracteres alfanuméricos (`a-z`, `0-9`)
- Si el código ya existe, el servidor reintenta el generador hasta 5 veces
- Si agota los reintentos, responde 409; el cliente puede reintentar el POST
- Almacena: código, URL original, clicks=0, timestamp de creación
- Devuelve el código y la ruta corta

**Idempotencia:**
- La misma URL en dos POST distintos genera **siempre un link nuevo** (no se deduplica por URL)
- Cada acortado es un recurso independiente (tracking / campañas separadas)
- La UI debe deshabilitar el botón mientras el request está en vuelo (anti doble-submit)

---

### GET /:codigo
Redirigir a la URL original y registrar click.

**Entrada:** parámetro de ruta `codigo`

**Respuesta 302:** Redirect a la URL original con header `Location`
- Incrementa el contador de clicks
- Persiste el cambio en la base de datos

**Respuesta 404:** Código no existe → `{ "error": "..." }`

**Respuesta 500:** Error de lectura/escritura de la base de datos

**Comportamiento:**
- Busca el código en la base de datos
- Si existe: incrementa clicks, persiste, devuelve 302 redirect
- Si no existe: devuelve 404 JSON
- El side-effect de incrementar clicks está documentado (correcto para un shortener)

---

### GET /api/links/:codigo/stats
Obtener estadísticas de un link acortado.

**Entrada:** parámetro de ruta `codigo`

**Respuesta 200:**
```json
{
  "codigo": "abc123xy",
  "url": "https://example.com/ruta/larga/muy/larga",
  "clicks": 42,
  "creado": "2026-08-13T22:17:14.361Z"
}
```

**Respuesta 404:** Código no existe → `{ "error": "..." }`

**Respuesta 500:** Error de lectura de la base de datos

**Comportamiento:**
- Busca el código en la base de datos
- Devuelve: código, URL original, clicks totales, fecha de creación
- No modifica clicks (lectura pura)

---

## UI

### public/index.html
Página principal para acortar URLs.

**Elementos esperados:**
- Campo de entrada para URL
- Botón "Acortar" (deshabilitado mientras el request está en vuelo)
- Muestra el código generado
- Muestra el link acortado (clickeable o opción copiar)
- Maneja errores: URL inválida (400), conflicto (409 con un reintento), error del servidor / red
- En 409: reintenta el POST una vez; si vuelve a fallar, muestra el error

### public/stats.html
Página de estadísticas.

**Elementos esperados:**
- Campo para ingresar un código
- Botón "Ver estadísticas"
- Muestra: clicks, URL original, fecha de creación
- Maneja 404: mensaje "Código no existe"
- Maneja otros errores de forma visible

---

## Almacenamiento

### Selección por entorno

- Si existe `DATABASE_URL`, la aplicación usa PostgreSQL
- Si no existe `DATABASE_URL` y `NODE_ENV` no es `production`, usa el archivo JSON local
- Si `NODE_ENV=production` y falta `DATABASE_URL`, la aplicación no inicia; producción nunca cae silenciosamente al archivo efímero

Los links se almacenan con:
- `codigo`: identificador único (8 caracteres)
- `url`: URL original completa
- `clicks`: número de accesos (inicia en 0)
- `creado`: timestamp ISO8601 de creación

Formato lógico esperado en cualquier almacenamiento:
```json
{
  "codigo": "abc123xy",
  "url": "https://example.com",
  "clicks": 42,
  "creado": "2026-08-13T22:17:14.361Z"
}
```

**JSON local:**
- Si el directorio `data/` o el archivo `data/links.json` no existen, el servidor los crea con `[]`
- Fallos de disco se responden con 500 JSON, sin tumbar el proceso

**PostgreSQL:**
- Al iniciar, crea la tabla `links` si todavía no existe
- `codigo` es clave primaria y evita códigos duplicados aun con requests concurrentes
- Los campos persistidos son `codigo`, `url`, `clicks` y `creado`
- El incremento de clicks es una actualización atómica
- Fallos de conexión o queries se responden con 500 JSON, sin exponer credenciales

**Concurrencia:**
- Las mutaciones (crear link, incrementar clicks) se serializan para evitar pérdida por read-modify-write concurrente
- En PostgreSQL, la clave primaria y las actualizaciones atómicas mantienen esta garantía entre procesos

**Producción (Milestone 5):**
- Railway provee `DATABASE_URL` mediante una variable de referencia al servicio PostgreSQL
- Los links y sus clicks sobreviven al reinicio o redeploy del servicio web
- Las credenciales viven únicamente en variables de entorno y nunca se escriben en el repositorio

---

## Validaciones

- **URL vacía, nula o solo espacios:** rechazar con 400
- **URL sin protocolo http/https o formato inválido:** rechazar con 400
- **Código duplicado tras N reintentos del generador:** devolver 409
- **Código no existe:** devolver 404 JSON

---

## Casos borde

### Mismo código para dos URLs distintas
El generador produce un código que ya existe.
- El servidor reintenta el generador hasta 5 veces
- Si agota: 409 Conflict `{ "error": "..." }`
- El cliente (UI) reintenta el POST una vez

### Misma URL dos veces
Dos POST con la misma URL → dos códigos distintos, dos links independientes.

### Código muy corto
3 caracteres = ~46k combinaciones.
Solución: usar 8 caracteres = ~2.8 trillones de combinaciones.

### URL inválida
Sin protocolo, vacía, solo espacios, o formato inválido → 400 Bad Request.

### Link roto o eliminado
Si se intenta acceder a un código que no existe → 404 Not Found JSON.

---

## Historias de usuario

**Como usuario de la empresa:**
- Puedo acortar cualquier URL válida con un POST
- Recibo un código corto y un link clickeable
- Al hacer click en el link, soy redirigido automáticamente al original
- Puedo ver cuántos clicks tuvo cada link (estadísticas)

**Como administrador:**
- Quiero saber qué links son más populares (ordenar por clicks)
- Quiero ver cuándo se creó cada link
- Quiero asegurar que no hay códigos duplicados

---

## Notas

- El generador debe crear códigos de 8 caracteres (no 3)
- Todos los cambios (clicks, nuevos links) deben persistirse en la base de datos
- Las URLs en redirects deben ser 302 Found (no 200)
- Las estadísticas deben reflejar clicks reales persistidos
