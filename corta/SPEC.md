# SPEC.md: Corta — Especificación de Comportamiento

## Qué es Corta

Acortador de URLs interno de la empresa. Recibe URLs largas, genera códigos cortos, redirige a destino, y registra estadísticas de acceso.

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
  "codigo": "abc123",
  "corta": "/abc123"
}
```

**Respuesta 400:** URL inválida (vacía, nula, sin protocolo http/https)

**Respuesta 409:** Código generado ya existe para otra URL → reintentar generador

**Comportamiento:**
- Valida que la URL sea válida (protocolo http o https)
- Genera un código único de 8 caracteres alfanuméricos
- Almacena: código, URL original, clicks=0, timestamp de creación
- Devuelve el código y la ruta corta

---

### GET /:codigo
Redirigir a la URL original y registrar click.

**Entrada:** parámetro de ruta `codigo`

**Respuesta 302:** Redirect a la URL original con header `Location`
- Incrementa el contador de clicks
- Persiste el cambio en la base de datos

**Respuesta 404:** Código no existe

**Comportamiento:**
- Busca el código en la base de datos
- Si existe: incrementa clicks, devuelve 302 redirect
- Si no existe: devuelve 404

---

### GET /api/links/:codigo/stats
Obtener estadísticas de un link acortado.

**Entrada:** parámetro de ruta `codigo`

**Respuesta 200:**
```json
{
  "codigo": "abc123",
  "url": "https://example.com/ruta/larga/muy/larga",
  "clicks": 42,
  "creado": "2026-08-13T22:17:14.361Z"
}
```

**Respuesta 404:** Código no existe

**Comportamiento:**
- Busca el código en la base de datos
- Devuelve: código, URL original, clicks totales, fecha de creación

---

## UI

### public/index.html
Página principal para acortar URLs.

**Elementos esperados:**
- Campo de entrada para URL
- Botón "Acortar"
- Muestra el código generado
- Muestra el link acortado (clickeable o opción copiar)
- Maneja errores: URL inválida, error del servidor

### public/stats.html
Página de estadísticas.

**Elementos esperados:**
- Campo para ingresar un código
- Botón "Ver estadísticas"
- Muestra: clicks, URL original, fecha de creación
- Maneja 404: mensaje "Código no existe"

---

## Almacenamiento

Los links se almacenan con:
- `codigo`: identificador único (8 caracteres)
- `url`: URL original completa
- `clicks`: número de accesos (inicia en 0)
- `creado`: timestamp ISO8601 de creación

Formato esperado en base de datos:
```json
{
  "codigo": "abc123xy",
  "url": "https://example.com",
  "clicks": 42,
  "creado": "2026-08-13T22:17:14.361Z"
}
```

**Futuro (Milestone 5):** Migrar de archivo JSON a PostgreSQL en Railway.

---

## Validaciones

- **URL vacía o nula:** rechazar con 400
- **URL sin protocolo:** rechazar con 400 (debe ser http o https)
- **Código duplicado:** devolver 409, cliente reintenta
- **Código no existe:** devolver 404

---

## Casos borde

### Mismo código para dos URLs distintas
El generador de códigos falla al crear un código que ya existe.
- El endpoint devuelve 409 Conflict
- El cliente reintenta `POST /api/links`
- El servidor genera un nuevo código

### Código muy corto
3 caracteres = ~46k combinaciones.
Solución: usar 8 caracteres = ~2.8 trillones de combinaciones.

### URL inválida
Sin protocolo, vacía, o formato inválido → 400 Bad Request.

### Link roto o eliminado
Si se intenta acceder a un código que no existe → 404 Not Found.

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
- Quiero asegurar que no hay duplicados

---

## Notas

- El generador debe criar códigos de 8 caracteres (no 3)
- Todos los cambios (clicks, nuevos links) deben persistirse en la base de datos
- Las URLs devueltas en redirects deben ser 302 Found (no 200)
- Las estadísticas deben ser precisas (reflects real clicks)
