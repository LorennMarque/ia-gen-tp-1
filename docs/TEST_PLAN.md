# Test Plan — Corta

Estrategia de testing para Milestone 3 y futuro. Los tests se derivan de `SPEC.md` y se escriben **antes** que la implementación (TDD).

## Framework

- **Mocha** — test runner
- **Chai** — assertions
- Ubicación: `corta/test/test.js`
- Ejecutar: `npm test` (en `/corta`)

## Tests existentes

✅ Están implementados:
- `POST /api/links crea un link corto` — valida status 200, codigo, corta
- `GET /:codigo redirige al destino` — valida que devuelve la URL

## Tests que faltan (Milestone 3)

Derivados de `SPEC.md`. Escribir en TDD: test primero (rojo), luego fix (verde).

### POST /api/links

- [ ] Rechaza URL vacía con 400
- [ ] Rechaza URL sin protocolo (http/https) con 400
- [ ] Genera código único (dos URLs distintas → códigos distintos)
- [ ] Maneja código duplicado: si dos POST generan el mismo código → 409, reintentar

### GET /:codigo

- [ ] **Status 302** (actualmente 200 — es bug) + header Location
- [ ] Incrementa clicks en cada acceso
- [ ] Persiste clicks en BD (actualmente no lo hace — es bug)
- [ ] Devuelve 404 si código no existe
- [ ] Redirect automático a URL original

### GET /api/links/:codigo/stats

- [ ] Endpoint no existe actualmente — implementar
- [ ] Devuelve `{codigo, url, clicks, creado}`
- [ ] Devuelve 404 si código no existe

## Estructura esperada de cada test

```javascript
describe('Concepto', () => {
  it('comportamiento esperado', async () => {
    // arrange: preparar datos
    // act: ejecutar acción
    // assert: validar resultado
    expect(resultado).to.equal(esperado);
  });
});
```

## Cómo correr

```bash
cd corta
npm test
```

## Notas

- Cada test debe ser **independiente** (no depender de otros)
- Usar `maxRedirects: 0` para capturar redirects sin seguirlos
- Los bugs en `BUGS_FOUND.md` tienen tests asociados — implementar test primero
- Los TODOs en `test.js` (`probar clicks`, `probar stats`) son tests futuros

## Próximos pasos (Milestone 3)

1. Agregar tests para URL vacía/inválida
2. Agregar tests para status 302
3. Agregar tests para clicks persistencia
4. Agregar tests para /stats endpoint
5. Implementar fixes hasta que todos pasen
