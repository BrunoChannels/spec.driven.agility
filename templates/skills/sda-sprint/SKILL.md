---
name: sda-sprint
description: Crea o actualiza el backlog de un sprint como historias de usuario verticales, asigna esfuerzo de un dígito (1, 2, 3, 5, 8) y total del sprint. Define o hereda la estrategia de tests (runner, estructura de los tests y directorios de unitarios e integración) y la guarda en el Plan.md. Sin criterios de aceptación ni implementación; eso es /sda-spec.
disable-model-invocation: true
---

# Sprint (SDA)

Armamos el backlog de un sprint a partir de lo que me cuentes. Yo traigo los requisitos; tú los
ordenas y partes en historias de usuario. Los objetivos son **modificables o descartables** durante
el desarrollo: este plan es la única fuente de verdad de estado, pero se toca sin ceremonia.

**Idioma:** responde siempre en el idioma en que te escribo. Refleja mi idioma en cada pregunta,
mensaje y en el backlog (la plantilla `Como…` → su equivalente en mi idioma). Si cambio de idioma,
cambia conmigo.

## 1. Estrategia de tests (obligatoria, con herencia)

Antes de armar el backlog, garantiza que la estrategia de tests esté definida: los tests son el
contrato de cada HU y no se trabaja sin ellos. Solo se usan tests unitarios y de integración. La
estrategia incluye el runner, la **estructura de los tests** (colocada, separada o mixta) y los
comandos y directorios de cada nivel. En caso de estar definida omite este paso; si no, pregúntame y
defínela para el `plan.md`. La estrategia de tests se hereda de sprints previos si existe, o se define
en este sprint si no.

1. **Busca una decisión previa** con un `grep` acotado de `## Estrategia de tests` en los
   `backlog/**/plan.md` (sprints activos y `backlog/archive/`). Lee solo ese bloque; no leas los
   planes enteros.
2. **Si existe**, hereda la más reciente: escribe ese mismo bloque en el nuevo `plan.md`. No
   preguntes nada, **salvo que al bloque le falte `estructura`** (plan viejo): pregunta solo ese dato,
   complétalo y guarda el bloque completo.
3. **Si no existe**, pregunta una cosa a la vez, con tu sugerencia:
   1. **Runner de tests** (node:test, Vitest, Jest, pytest…).
   2. **Estructura de los tests** — ¿`colocada` (atomic design: carpeta por componente) o `separada`?
      Si el proyecto mezcla UI y backend, ¿`mixta`?
      - `colocada` — carpeta por componente: `Componente/Componente.tsx` +
        `Componente/Componente.module.css` + `Componente/Componente.test.tsx` conviviendo.
      - `separada` — código en `src/…` y tests en `test/unit/…` + `test/integration/…`.
      - `mixta` — UI colocada junto al componente y backend/lógica en carpetas separadas.
   3. **Comando de unitarios** (ej. `npm run test:unit`).
   4. **Directorio de unitarios** (ej. `test/unit/`; si la estructura es `colocada`, la raíz donde
      viven los `*.test.*`, ej. `src/`).
   5. **Comando de integración** (ej. `npm run test:integration`).
   6. **Directorio de integración** (ej. `test/integration/`).
   Y escribe el bloque en el nuevo `plan.md`.
4. Si ya la definí en la conversación, úsala sin repetir la pregunta.

Bloque exacto en el `plan.md` (debajo de `## Contexto`):

```markdown
## Estrategia de tests
- **runner**: <nombre>
- **estructura**: <colocada|separada|mixta> — <detalle: dónde conviven los tests>
- **unitarios**: comando `<...>` — directorio `<...>`
- **integración**: comando `<...>` — directorio `<...>`
```

## 2. Conversación

1. Escucha la idea o el objetivo del sprint. Si algo no está claro, pregunta. Una pregunta a la vez,
   con tu respuesta sugerida.
2. Si es un proyecto nuevo, conversemos solo el stack (no arquitectura ni implementación).
3. Pregunta si aplica alguna de estas decisiones caras de cambiar (solo pregunta, no las diseñes):
   - Multi-tenant / multi-organización
   - Modelo de permisos o roles
   - Offline o sync
   - Multi-idioma o multi-moneda
4. Propón el backlog con un esfuerzo por historia y el total del sprint. Yo lo ajusto.

## 3. Reglas

- **No inventes requisitos.** Solo parte lo que te dije. Si ves un hueco, pregunta; no lo llenes por ningún motivo.
- **Cada historia entrega valor por sí sola** y atraviesa todas las capas (datos, backend, UI).
  Nunca partas por capa, esto es obligación.
- **Sin historias técnicas.** El actor nunca es el desarrollador ni el sistema. "Configurar la base
  de datos" no es historia; esa infraestructura se construye dentro de la primera historia que la
  necesita.
- **Pocas historias.** 10–15 como máximo. Prefiero agregar antes que recortar.
- **Una línea por historia.** Sin criterios de aceptación, sin detalles técnicos ni prioridades. El
  esfuerzo va como etiqueta numérica, no como prosa.
- **Esfuerzo de un dígito:** asigna a cada historia **1, 2, 3, 5 u 8**. Es tamaño relativo, no horas.
  Si una historia no entra en 8, partila.
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
1. Como <actor>, quiero <acción>, para <beneficio>. — **2**
2. Como <actor>, quiero <acción>, para <beneficio>. — **5** _(Requiere: #1)_

**Total del sprint: 7 pts.**
```

Agrega `Requiere: #N` solo cuando una historia no tiene sentido sin otra. El número en negrita es el
esfuerzo; el total es la suma de las historias activas.

## 5. Guardar el plan

Al terminar, ofrece guardar el plan acordado. No lo guardes sin mi OK.

- Carpeta: `backlog/<nombre-descriptivo>/plan.md` (kebab-case en español, 2–4 palabras, sin acentos).
- Crea `backlog/` **solo si no existe**, en el momento de guardar el `plan.md` (no antes). Si ya
  existe, no la borres, vacíes ni reemplaces: se usa tal cual y se aplica la regla de la carpeta del
  sprint.
- Si la carpeta ya existe, pregunta si actualizo su `plan.md` o uso otro nombre. Nunca sobrescribas
  sin preguntar.
- `/sda-sprint` es el único dueño de `backlog/`: `sda init` no la crea.
- Formato de `plan.md`:

```markdown
# <Título en una línea>

## Contexto

<2–4 líneas: qué es y para quién; stack; decisiones caras>

## Estrategia de tests

- **runner**: <nombre>
- **estructura**: <colocada|separada|mixta> — <detalle: dónde conviven los tests>
- **unitarios**: comando `<...>` — directorio `<...>`
- **integración**: comando `<...>` — directorio `<...>`

## Estado de implementación

**🔲 Planificado.** Ninguna historia implementada.

## Esfuerzo del sprint

**Total: 7 pts · Implementado: 0 · Pendiente: 7.**

## Backlog

- [ ] **HU1** — Como <actor>, quiero <acción>, para <beneficio>. _(Esfuerzo: 2)_

- [ ] **HU2** — Como <actor>, quiero <acción>, para <beneficio>. _(Esfuerzo: 5)_ _(Requiere: #1)_
```

- Checkbox siempre (`- [ ]` o `- [x]`); `_(Esfuerzo: N)_` es obligatorio y va antes de
  `_(Requiere: #N)_`, que solo aparece donde se acordó.
- **Cada checkbox es su propio párrafo:** una línea en blanco antes y otra después. Nunca pegues dos
  checkboxes seguidos.
- `## Esfuerzo del sprint` se recalcula siempre: **Total** = suma de las HU activas; **Implementado**
  = suma de las HU activas con `[x]`; **Pendiente** = Total − Implementado. Las HU descartadas
  (`~~...~~`) no suman.
- No toques `AGENTS.md` ni ningún otro archivo.

## 6. Actualizar un plan existente

- Al actualizar: marca `[x]` las HU terminadas, y permite reordenar, reformular o descartar
  (tachando con `~~...~~` y su motivo). Reescribe solo lo que cambió; nunca inventes HU. Si el
  `plan.md` no tiene `## Estrategia de tests`, aplícala (hereda o pregunta) antes de seguir. Si el
  bloque existe pero le falta `estructura` (plan viejo), pregunta solo ese dato y agrégalo.
- **Recalculá el esfuerzo** después de cualquier cambio: la suma de las HU activas es el `Total`;
  `Implementado` es la suma de las HU activas con `[x]`; `Pendiente` es la diferencia. Una HU
  descartada deja de sumar.
- Si el `plan.md` no tiene `## Esfuerzo del sprint`, agrégalo y propón un esfuerzo para cada HU
  (1, 2, 3, 5 u 8). Si alguna HU no tiene `_(Esfuerzo: N)_`, complétalo antes de guardar.
- Conservá el espaciado: cada checkbox en su párrafo, con línea en blanco antes y después.
