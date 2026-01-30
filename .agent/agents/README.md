# Catálogo de Agentes

Este directorio contiene las definiciones de los 20 agentes especialistas disponibles.

## Índice de Agentes

| Agente | Archivo | Especialidad |
|--------|---------|--------------|
| **Orchestrator** | `orchestrator.md` | Coordinación multi-agente |
| **Project Planner** | `project-planner.md` | Discovery, planificación de tareas |
| **Frontend Specialist** | `frontend-specialist.md` | Web UI/UX |
| **Backend Specialist** | `backend-specialist.md` | API, lógica de negocio |
| **Database Architect** | `database-architect.md` | Schema, SQL, modelado |
| **Mobile Developer** | `mobile-developer.md` | iOS, Android, React Native |
| **Game Developer** | `game-developer.md` | Lógica de juegos, mecánicas |
| **DevOps Engineer** | `devops-engineer.md` | CI/CD, Docker, infraestructura |
| **Security Auditor** | `security-auditor.md` | Compliance, código seguro |
| **Penetration Tester** | `penetration-tester.md` | Seguridad ofensiva |
| **Test Engineer** | `test-engineer.md` | Estrategias de testing |
| **Debugger** | `debugger.md` | Análisis de causa raíz |
| **Performance Optimizer** | `performance-optimizer.md` | Velocidad, Web Vitals |
| **SEO Specialist** | `seo-specialist.md` | Ranking, visibilidad |
| **Documentation Writer** | `documentation-writer.md` | Manuales, docs técnicas |
| **Product Manager** | `product-manager.md` | Requerimientos, user stories |
| **Product Owner** | `product-owner.md` | Estrategia, backlog, MVP |
| **QA Automation Engineer** | `qa-automation-engineer.md` | E2E testing, CI pipelines |
| **Code Archaeologist** | `code-archaeologist.md` | Legacy code, refactoring |
| **Explorer Agent** | `explorer-agent.md` | Análisis de codebase |

---

## Cómo Usar los Agentes

### Activación Automática (Intelligent Routing)

El sistema detecta automáticamente qué agente usar según tu request:

```
"Add JWT authentication"
→ 🤖 @security-auditor + @backend-specialist

"Fix the dark mode button"
→ 🤖 @frontend-specialist

"Login returns 500 error"
→ 🤖 @debugger
```

### Activación Manual

Menciona el agente explícitamente:

```
"Usa el security-auditor para revisar la autenticación"
"Responde como frontend-specialist"
"Actúa como debugger para este problema"
```

### Coordinación Multi-Agente

Para tareas complejas, usa el orchestrator:

```
"Orchestrator: necesito implementar un sistema de pagos completo"
→ Coordina: backend, database, security, frontend, test
```

---

## Estructura de Cada Agente

Cada archivo `.md` contiene:

```yaml
---
name: nombre-del-agente
description: Descripción breve
tools: Herramientas que puede usar
skills: Skills/conocimientos asociados
---

# Nombre del Agente

## Rol
Qué hace y cómo actúa

## Stack Principal
Tecnologías y herramientas

## Cuándo Activar
Situaciones donde es útil

## Mejores Prácticas
Guías y ejemplos

## Anti-patrones a Evitar
Qué NO hacer

## Checklist Pre-Entrega
Verificaciones antes de entregar
```

---

## Combinaciones Comunes

| Tarea | Agentes |
|-------|---------|
| Nueva feature full-stack | frontend + backend + database |
| Autenticación | security-auditor + backend |
| Bug crítico | debugger + test-engineer |
| Nuevo proyecto | project-planner + product-owner |
| Refactoring grande | code-archaeologist + test-engineer |
| Deploy a producción | devops + security-auditor |
| Landing page | frontend + seo-specialist |
| API pública | backend + documentation-writer |
