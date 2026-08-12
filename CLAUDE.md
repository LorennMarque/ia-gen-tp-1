# CLAUDE.md: Corta — Cómo trabajamos

## La misión
Llevar Corta a producción con historia limpia en GitHub, documentación TDD-first, y código listo para equipo. Del caos del primer commit a una app que funciona en Railway.

## Antes de empezar: el agente espera instrucciones

El agente NO asume, NO propone features, NO refactoriza sin permiso explícito.

Si el usuario pide algo y falta SPEC.md:
- Responder: "Necesito que actualicemos SPEC.md con [lo que falta]"
- Esperar a que el usuario actualice SPEC.md
- Luego sí, proceder con test + implementación

Si la tarea es ambigua:
- Preguntar qué se espera
- No adivinar, no asumir

Si el agente ve un problema en el código pero no hay tarea explícita para arreglarlo:
- Reportarlo
- Esperar instrucción
- No arreglarlo sin permiso

---

## La regla de oro: SPEC.md → Tests → Código

**Primero va SPEC.md. Luego tests que verifiquen SPEC.md. Luego la implementación.**

SPEC.md es el contrato:
- Describe qué hace cada endpoint (entradas, salidas, errores)
- Describe casos borde (URLs duplicadas, códigos inválidos, links rotos)
- Es la fuente de verdad

Los tests se derivan de SPEC.md:
- Para cada comportamiento en SPEC.md, hay un test
- El test verifica que el código cumple lo que SPEC.md promete
- No se escriben tests al aire; cada test responde a una línea de SPEC.md

El código implementa lo que SPEC.md + tests piden:
- Los tests fallan primero (rojo)
- El código los hace pasar (verde)
- Cuando los tests pasan, el código cumple SPEC.md

Cuando se escriban tests:
- Empezar desde SPEC.md: "SPEC.md dice que GET /:codigo devuelve 302 → escribo un test para eso"
- Cada test es una frase clara: `GET /:codigo devuelve 302 y redirige`
- Los tests fallan primero, luego la implementación los hace pasar
- El histórico de git muestra tests antes que la implementación que los satisface
- Test e implementación son commits separados

Cuando se hagan commits:
- `test: [comportamiento de SPEC.md que se testea]` — primero
- `feat/fix: [lo que implementa]` — después, cuando los tests pasan
- Si un commit necesita más de una línea de descripción, es demasiado grande: dividir
- El histórico debería leer como: test (rojo), feat (verde), test (rojo), feat (verde)

---

## Cómo escribir SPEC.md

**SPEC.md es la fuente de verdad. De acá salen los tests.**

Estructura por endpoint:
```
## GET /api/shorten
**Entrada:** JSON { "url": "string" }
**Salida 200:** { "codigo": "abc123", "original": "..." }
**Salida 400:** URL vacía, nula o formato inválido
**Salida 409:** Código generado ya existe para otra URL → reintentar generador

## GET /:codigo
**Salida 302:** Redirect a la URL original, incrementar clicks
**Salida 404:** Código no existe
```

Cuando se descubra un caso borde (URL duplicada, código repetido, link roto):
- Agregar una línea a SPEC.md describiendo el comportamiento esperado
- Escribir un test que lo capture (derivado de esa línea)
- Implementar hasta que pase
- Commitear

Si el código encontrado contradice SPEC.md, la fuente es SPEC.md: actualizar SPEC.md, escribir un test que refleje lo correcto, y ajustar el código.

---

## Estructura del código (esperada)

La estructura esperada algo como:
```
src/
├── app.js             — Express, rutas, puntos de entrada
├── db.js              — Queries, transacciones, lógica de BD
└── [modulo].js        — Por feature si crece (ej: shortener.js)

test/
├── app.test.js        — Tests de endpoints y respuestas
├── db.test.js         — Tests de BD (si aplica)
└── [modulo].test.js   — Tests de cada módulo

public/
├── index.html         — UI
└── stats.html         — UI

docs/
├── [documentación relevante para el proyecto]
└── [decisiones, notas, investigaciones]
```

**La verdad sale del código actual.** Cuando se ordene (Milestone 2), la estructura se ajusta a lo que tenga más sentido. La regla fija: no duplicados, no versiones viejas, si no se usa → se borra.

## Documentación relevante en /docs

Antes de empezar cualquier tarea, consultar `/docs`. Ahí va:
- Decisiones de arquitectura o diseño
- Notas sobre el código heredado
- Investigaciones sobre comportamiento encontrado
- Cualquier contexto que futura sesiones necesiten

El agente debe leer y usar `/docs` como referencia de contexto. Si el contenido en `/docs` contradice lo que se observa en el código, el código es la verdad; actualizar `/docs` con lo encontrado.

---

## Cómo trabaja el agente

Cuando se implemente algo:
- Leer SPEC.md
- Escribir tests que verifiquen lo que SPEC.md promete (tests fallan primero)
- Luego implementar hasta que los tests pasen
- Si la tarea es muy grande para un commit, dividir: test → implementación → test → implementación
- Si algo no está en SPEC.md, agregar a SPEC.md antes de escribir tests

Cuando se haga un commit:
- Verificar que `npm test` pase antes de commitear
- Cada commit es una unidad lógica independiente (test O implementación, no ambos)
- Si el mensaje necesita más de una línea, el cambio es demasiado grande: dividir

Cuando se encuentre código viejo o ambiguo:
- Leerlo
- Escribir un test que capture el comportamiento actual
- Si no se usa o contradice SPEC.md, consultar antes de borrarlo

Cuando se proponga refactorizar o agregar features:
- Solo si está en SPEC.md o en una tarea explícita
- Si el código satisface SPEC.md, no asumir mejoras

Si algo no está claro:
- Consultar antes de avanzar, no asumir intenciones

---

## Convenciones de código

**Nombrado:** claro y sin ambigüedad. `codigo` para el short, `original` para la URL larga, `clicks` para el contador.

**Tests:** descripción que pueda leer alguien sin tocar el código.
```javascript
it('GET /:codigo redirige con 302 a la URL original', async () => { ... })
it('POST /api/shorten rechaza URLs sin protocolo con 400', async () => { ... })
```

**Commits:** imperative mood, lowercase, sin punto final.
```
test: acortador genera 8 caracteres alfanuméricos
feat: guardar URL y código en BD, devolver JSON
fix: incrementar clicks en cada redirect, no solo en stats
docs: agregar casos borde de URLs duplicadas a SPEC.md
```

**Errores:** responder con `{ error: "descripción clara" }` y el código HTTP correcto (400, 404, 409, 500).

---

## Secretos y config

Variables de entorno viven en `process.env`, nunca hardcodeadas. En Railway, env vars se agregan desde el dashboard sin tocar código.

`.gitignore` incluye: `node_modules/`, `.env`, `.env.local`, archivos de coverage de tests, archivos temporales.

---

## Cuándo algo está listo

Un milestone, feature o fix está listo cuando:
- Todo test en `/test` pasa: `npm test` verde
- SPEC.md documenta el comportamiento implementado
- Para cada línea de SPEC.md hay un test que lo verifica
- El histórico de git muestra tests antes que implementación
- No hay archivos muertos
- README explica cómo correr la app y qué hace

Si falta algo de esto, no está listo, aunque el código funcione localmente.

---

## Cambios a este archivo

Si las reglas necesitan cambiar (porque algo no funciona, o el equipo decide algo nuevo):
- Actualizar CLAUDE.md en un commit `docs: actualizar CLAUDE.md — [razón]`
- El agente debe leer CLAUDE.md en cada sesión
