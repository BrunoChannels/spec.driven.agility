---
name: sda-sprint
description: Crea o actualiza el Backlog de un sprint como historias de usuario verticales, con bootstrap de config SDA (framework e2e del proyecto). Sin criterios de aceptación ni implementación; eso es /sda-spec.
disable-model-invocation: true
---

# Sprint (SDA)

Armamos el backlog de un sprint a partir de lo que me cuentes. Yo traigo los requisitos; tú los
ordenas y partes en historias de usuario. Los objetivos son **modificables o descartables** durante
el desarrollo: este plan es la única fuente de verdad de estado, pero se toca sin ceremonia.

**Idioma:** responde siempre en el idioma en que te escribo. Refleja mi idioma en cada pregunta,
mensaje y en el backlog (la plantilla `Como…` → su equivalente en mi idioma). Si cambio de idioma,
cambia conmigo.

## 1. Bootstrap de configuración (solo la primera vez)

- Busca `sda.config.md` en la raíz del repo (sin distinguir mayúsculas).
- Si NO existe, créala antes de armar el backlog. Pregunta una cosa a la vez, con tu sugerencia:
  1. **Framework e2e** del proyecto (Playwright, Maestro, Cypress, Detox…). El test es obligatorio,
     así que hay que decidirlo al empezar a usar la herramienta.
  2. **Comando** para correr los tests e2e (ej. `npm run test:e2e`).
  3. **Directorio** donde viven (ej. `e2e/`).
- Escríbela con este formato:

```markdown
# Configuración SDA

## Tests e2e
- **framework**: <nombre>
- **comando**: <cómo se corren>
- **directorio**: <ruta>

## Specs
- **directorio**: specs
```

- Si ya existe, léela y usa esos valores; no la reescribas salvo que te pida cambiarlos.

## 2. Conversación

1. Escucha la idea o el objetivo del sprint. Si algo no está claro, pregunta. Una pregunta a la vez,
   con tu respuesta sugerida.
2. Si es un proyecto nuevo, conversemos solo el stack (no arquitectura ni implementación).
3. Pregunta si aplica alguna de estas decisiones caras de cambiar (solo pregunta, no las diseñes):
   - Multi-tenant / multi-organización
   - Modelo de permisos o roles
   - Offline o sync
   - Multi-idioma o multi-moneda
4. Propón el backlog. Yo lo ajusto.

## 3. Reglas

- **No inventes requisitos.** Solo parte lo que te dije. Si ves un hueco, pregunta; no lo llenes.
- **Cada historia entrega valor por sí sola** y atraviesa todas las capas (datos, backend, UI).
  Nunca partas por capa.
- **Sin historias técnicas.** El actor nunca es el desarrollador ni el sistema. "Configurar la base
  de datos" no es historia; esa infraestructura se construye dentro de la primera historia que la
  necesita.
- **Pocas historias.** 10–15 como máximo. Prefiero agregar antes que recortar.
- **Una línea por historia.** Sin criterios de aceptación, sin detalles técnicos, sin estimaciones
  ni prioridades.
- La primera historia es la más chica usable de punta a punta (esqueleto caminante).
- **Modificable/descartable:** puedo pedir reordenar, reformular o descartar cualquier historia; se
  hace sin trámite.

## 4. Formato de salida

```markdown
## Contexto
<una o dos líneas: qué es y para quién>
Stack: <lo acordado>
Decisiones caras: <las que aplican, o "ninguna">

## Backlog
1. Como <actor>, quiero <acción>, para <beneficio>.
2. Como <actor>, quiero <acción>, para <beneficio>. Requiere: #1
```

Agrega `Requiere: #N` solo cuando una historia no tiene sentido sin otra.

## 5. Guardar el plan

Al terminar, ofrece guardar el plan acordado. No lo guardes sin mi OK.

- Carpeta: `Backlog/<nombre-descriptivo>/Plan.md` (kebab-case en español, 2–4 palabras, sin acentos).
- Si `Backlog/` no existe, créala con esa grafía.
- Si la carpeta ya existe, pregunta si actualizo su `Plan.md` o uso otro nombre. Nunca sobrescribas
  sin preguntar.
- Formato de `Plan.md`:

```markdown
# <Título en una línea>

## Contexto

<2–4 líneas: qué es y para quién; stack; decisiones caras>

## Estado de implementación

**🔲 Planificado.** Ninguna historia implementada.

## Backlog

- [ ] **HU1** — Como <actor>, quiero <acción>, para <beneficio>.

- [ ] **HU2** — Como <actor>, quiero <acción>, para <beneficio>. _(Requiere: #1)_
```

- Checkbox siempre (`- [ ]` o `- [x]`); `_(Requiere: #N)_` solo donde se acordó. Cada checkbox
  separado del siguiente por una línea en blanco.
- No toques `sda.config.md`, `AGENTS.md` ni ningún otro archivo.

## 6. Actualizar un plan existente

- Al actualizar: marca `[x]` las HU terminadas, y permite reordenar, reformular o descartar
  (tachando con `~~...~~` y su motivo). Reescribe solo lo que cambió; nunca inventes HU.
