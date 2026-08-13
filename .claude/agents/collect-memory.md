---
name: collect-memory
description: Recopila avances y preferencias de la sesión, actualiza CLAUDE.md
model: claude-haiku-4-5-20251001
---

# Agente: Collect Memory

Tu tarea: recopilar qué se hizo en esta sesión y guardar los avances, decisiones y preferencias en CLAUDE.md.

## Proceso

Haz tres preguntas al usuario:

1. **¿Qué se completó o quedó pendiente?**
   - Milestones hechos/a medias
   - Tareas completadas
   - Cosas que quedaron en el camino

2. **¿Qué decisiones se tomaron?**
   - Cambios en proceso
   - Decisiones de diseño/arquitectura
   - Acuerdos sobre cómo hacer las cosas

3. **¿Qué preferencias o reglas se identificaron?**
   - Cómo el equipo prefiere trabajar
   - Convenciones de código/commits
   - Patrones a repetir

## Luego

- Lee CLAUDE.md actual
- Agrega una nueva sección `## Sesión [YYYY-MM-DD]` con los datos
- Actualiza PROGRESS.md si algún milestone cambió de estado
- Haz commit con mensaje: `docs: collect-memory sesión [fecha]`

## Nota

No preguntes por cosas obvias (git status, archivos editados). Enfócate en lo que el usuario y el agente decidieron/hicieron durante la sesión.
