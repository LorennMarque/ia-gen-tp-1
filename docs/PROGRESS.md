# Corta — Progreso

## Milestones

- [x] **Milestone 1:** Trackear desde el principio — histórico completo desde el caos original
- [x] **Milestone 2:** Ordenar — estructura clara, sin duplicados, README y .gitignore
- [x] **Milestone 3:** Corregir errores — acortador funcional, redirects, clicks persistidos, validación, códigos 8 chars
- [x] **Milestone 4:** Completar — endpoint `/api/links/:codigo/stats` + stats.html / index.html integrados
- [x] **Milestone 5:** Producción — app pública en Railway, PostgreSQL y persistencia comprobada tras redeploy

## Auditoría y corrección (2026-08-14)

Corrección completa post-auditoría:
- SPEC: idempotencia POST (siempre link nuevo), retry de código, errores JSON, init BD
- Redirect 302, clicks persistidos, stats API + UI, validación URL, códigos 8
- Cola de mutaciones + write atómico; tests con supertest (34 passing)

Ver `BUGS_FOUND.md` (todos corregidos) y `TEST_PLAN.md`.

## Milestone 5 — completado (2026-08-15)

- [x] Railway CLI autenticada y MCP local configurado en Codex
- [x] PostgreSQL seleccionado mediante `DATABASE_URL`; JSON conservado para desarrollo
- [x] Contrato de almacenamiento cubierto sobre JSON y PostgreSQL en memoria
- [x] Proyecto, servicio PostgreSQL y servicio web creados en Railway mediante MCP
- [x] Dominio público generado y smoke test completo
- [x] Links, timestamp y clicks verificados después de un redeploy

URL pública: https://corta-production-3c57.up.railway.app

La evidencia operativa y la configuración se detallan en `DEPLOYMENT.md`.

## Extras (opcionales)

- [ ] **Trabajo en equipo** (en progreso)
  - [ ] Script base de monitoreo: `scripts/monitor-repo.sh`
  - [ ] Documentación: `docs/MONITORING.md`
  - [ ] Cada integrante configura su tarea programada en su máquina
- [x] **Memoria del agente** — skill `/collect-memory` creada, CLAUDE.md documentado
