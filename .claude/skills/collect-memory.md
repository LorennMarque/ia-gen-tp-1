---
name: collect-memory
description: Recopila avances y preferencias de la sesión, actualiza CLAUDE.md
category: project
---

# Skill: collect-memory

Recopila los avances y preferencias de esta sesión, y los guarda en CLAUDE.md para futuras sesiones.

## Cómo se invoca

```
/collect-memory
```

El agente:
1. Abre un diálogo con el usuario
2. Pregunta qué se completó, qué decisiones se tomaron, qué preferencias/reglas se identificaron
3. Actualiza `CLAUDE.md` con esos datos
4. Hace commit automático

## Qué registra

**Avances:**
- Milestones completados (ej: "Milestone 3: tests para validación de URLs")
- Decisiones tomadas (ej: "Reports va en .gitignore, no en el repo")
- Cosas que quedaron pendientes (ej: "Script base de monitoreo aún no codificado")

**Preferencias/Reglas:**
- Convenciones identificadas (ej: "Commits TDD-first: test → feat")
- Gustos del equipo (ej: "Sin nombres específicos en checklists genéricas")
- Patrones a repetir (ej: "Actualizar PROGRESS.md al cerrar cada sesión")

## Formato en CLAUDE.md

Se agrega una nueva sección:

```markdown
## Sesión [fecha]

### Avances
- [item]
- [item]

### Decisiones
- [decisión]
- [decisión]

### Preferencias/Reglas
- [regla]
- [regla]
```

Cada sesión queda registrada cronológicamente, así futuras sesiones tienen contexto.
