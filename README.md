# Corta — Proyecto

Llevar a producción **Corta**, el acortador de URLs interno heredado, con historia limpia en GitHub y prácticas TDD.

## Estructura

```
.
├── corta/              El proyecto en sí (app Express)
│   ├── src/            Código del servidor
│   ├── test/           Tests
│   ├── public/         UI (HTML, CSS)
│   ├── data/           Datos (links.json)
│   ├── SPEC.md         Especificación de comportamiento
│   └── README.md       Instrucciones para correr Corta
│
├── docs/               Documentación del proyecto
│   ├── PROGRESS.md     Estado de milestones
│   ├── DEPLOYMENT.md   Deploy y verificación de producción
│   └── BUGS_FOUND.md   Bugs identificados y prioridad
│
├── CLAUDE.md           Instrucciones para agentes/dev
└── mission.md          La consigna original
```

## Separación

**`corta/`** es el proyecto en sí — su código, config, env vars, dependencias, .gitignore.

**Root** es el contenedor — documentación, historia, specs, decisiones del proyecto.

Por eso:
- `.gitignore` solo en `/corta/` (qué ignorar de la app)
- Dos README: uno acá (meta), uno en `/corta/` (práctico)
- `.env` iría en `/corta/` (config de la app)
- Docs en root (contexto compartido)

## Rápido

- **Código:** `corta/`
- **Documentación:** `docs/`
- **Especificación:** `corta/SPEC.md`
- **Producción:** https://corta-production-3c57.up.railway.app
