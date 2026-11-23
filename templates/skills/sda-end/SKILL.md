---
name: sda-end
description: Cierra la HU recién implementada: valida tests unitarios e integración en verde y regresiones, sincroniza la spec de la HU en TODAS las raíces de specs vivas (specs/ y espejos como openspec/specs/), marca la HU en el checklist del Plan sin tocar los pasos ni las pruebas manuales, agrega historial y ofrece archivar el sprint. Nunca commitea.
disable-model-invocation: true
---

# Cerrar historia (SDA)

Cierras la HU que se acaba de implementar con `/sda-build`. Primero verificas, después decides, y
solo si todo pasa marcas el backlog y sincronizas las specs vivas **en todas sus raíces** (`specs/` y
los espejos que existan). **Nunca commitees.** Nunca ajustes un test ni código para "hacer pasar": si
algo falla, lo reportas y te detienes.

## 0. Identifica la HU

- Localiza `backlog/<sprint>/HU_NN/` y su `Plan.md`. Lee `spec.md`, `design.md`, `tasks.md`, el
  `Plan.md` completos y, si existe, `revision.md` (barrido de huecos de `/sda-build`).
- Si el contexto no alcanza, deduce la candidata desde el diff de git y **confírmala conmigo antes
  de tocar nada**.
- Si el plan vive en `backlog/archive/<sprint>/`, ya estaba completo: no lo desarchives; repórtalo y
  confirma.

## 1. Recorre lo implementado

- `git status --short` y el diff completo, incluidos archivos nuevos.
- Enumera qué se agregó/cambió y mapéalo contra cada escenario de `spec.md`.
- Distingue: escenarios cubiertos por tests unitarios, escenarios cubiertos por tests de
  integración, validaciones de formato/petición, y cualquier cosa fuera de alcance.

## 2. Valida las reglas

**a) Tests nuevos.** Los archivos de tests unitarios y de integración nuevos son lo esperado. Si un
test preexistente aparece modificado/eliminado sin aprobación explícita, detente. Comprueba que el
test nuevo no se haya retocado después del verde.

**b) Lógica adyacente y tests.** Identifica módulos tocados y sus consumidores; revisa que los flujos
vecinos sigan coherentes. **Corre los comandos de unitarios e integración del `## Estrategia de
tests` del `Plan.md`**: los escenarios de la HU deben pasar en verde. Si el `Plan.md` no tiene
estrategia de tests, detente y avísame antes de cerrar. Además, corre la suite completa y el linter
(revisa `package.json`/`AGENTS.md`); si se tocó arranque/rutas/bundle, también el build. Muestra
evidencia.

**c) Sin bugs sueltos.** Revisa el diff: condiciones de borde, estados de carga, textos sin
traducir, errores silenciados, suscripciones sin limpiar. Anota hallazgos; no arregles por tu cuenta
aquí.

**d) Alcance.** Confirma que no se coló nada del "Out of scope" de `design.md`.

## 3. Decide

- **Todo en verde** (incluidos los tests unitarios y de integración de la HU con los comandos del
  `Plan.md`) → paso 4.
- **Regla rota** → no marques ni sincronices. Informe breve: regla, evidencia (`archivo:línea`,
  comando), impacto, opciones; pregunta cómo seguir.

## 4. Sincroniza las specs vivas (todas las raíces)

Una spec sincronizada en una sola raíz es una sincronización incompleta. Antes de editar, descubre
**todas las raíces de specs vivas** del repo y sincroniza la HU en cada una; ninguna se omite.

**a) Descubre las raíces (obligatorio, antes de escribir):**

- Usa `Capability:` del `spec.md` como nombre de carpeta del destino.
- **Raíz principal SDA:** `specs/` en la raíz del repo. Es la fuente de verdad de este proyecto: la
  spec de la HU siempre debe terminar ahí. Si no existe, créala (`specs/<capability>/spec.md`).
- **Espejos:** cualquier otra carpeta con la misma forma `<raíz>/specs/<capability>/spec.md`, típica
  de un historial antiguo de otro sistema de specs (por ejemplo `openspec/specs/`). Búscalas por
  patrón (`**/specs/*/spec.md`) y excluye `node_modules/`, `.opencode/`, `backlog/` y
  `openspec/changes/` (los cambios activos o archivados son deltas, no specs vivas: no se editan).
- Deja constancia de las rutas encontradas antes de tocar nada, por ejemplo:
  `specs/<capability>/spec.md` + `openspec/specs/<capability>/spec.md`.

**b) Define los destinos:**

- `specs/<capability>/spec.md` **siempre**. Si la capability no existe ahí, créala con `## Purpose`
  (1–2 frases) y los requisitos de la HU.
- **Cada espejo que ya tenga** `<capability>/spec.md` en su propia raíz de specs. Si un espejo no
  tiene esa capability, no inventes estructura nueva en él: repórtalo como
  "no existe en `<espejo>`".
- Nunca elijas un solo destino. Cerrar con la spec escrita únicamente en `specs/` o únicamente en un
  espejo (p. ej. `openspec/specs/`) es un cierre incompleto: corrígelo antes de marcar el backlog.
- La spec viva no se escribe en `.opencode/` (ahí viven skills y comandos) ni dentro de `backlog/`:
  esos archivos son artefactos de la HU, no la historia de specs.

**c) Aplica la misma fusión inteligente (markdown, sin CLI) a CADA destino:**

- Por cada `### Requirement` de la HU:
  - No existe en esa spec viva → agrégalo con sus escenarios.
  - Ya existe → actualízalo: agrega/modifica escenarios o descripción, preservando lo que la HU no
    menciona.
- `## Requisitos eliminados` → quita esos bloques de esa spec viva. Si al quitar no queda ningún
  requisito, no dejes una sección vacía: repórtalo y detente (no borres el archivo por tu cuenta).
- `## Requisitos renombrados` → aplica FROM→TO.
- Mantén la estructura de la spec viva: `## Purpose`, `## Requirements`, `### Requirement` +
  `#### Scenario`. Nunca copies secciones delta (ADDED/MODIFIED) en la spec viva.
- La fusión es la misma en todos los destinos, pero **no copies un archivo completo sobre otro**:
  cada uno conserva su `## Purpose` y los requisitos que la HU no menciona. Al terminar, todos los
  destinos contienen los requisitos y escenarios de la HU.
- La operación debe ser **idempotente en el conjunto**: correrla dos veces deja los mismos archivos.

**d) Verifica y deja constancia:** lista cada archivo tocado con su ruta relativa completa (raíz
principal y espejos) y confirma que la HU quedó en todos. Si un destino queda fuera, no marques el
backlog: detente y repórtalo.

## 5. Marca el backlog

**En `tasks.md`:**
- Marca `- [x]` las tareas de las fases de tests, implementación y validaciones que falten.
- **No marques ni desmarques** las de `## Pasos manuales` ni `## Revisión manual`: las marca el
  usuario. Si ya están `[x]`, respetalas.
- Conserva el espaciado: cada checkbox en su párrafo (línea en blanco antes y después). Si
  `tasks.md` usa el formato viejo (lista plana), distinguí las manuales por su descripción y no las
  marques.

**En `Plan.md`:**
- Marca `- [x]` únicamente la línea de esa HU en el Backlog, sin juntar checkboxes: cada uno
  conserva su párrafo (línea en blanco antes y después).
- Actualiza `## Estado de implementación`:
  - Ninguna marcada → `**🔲 Planificado.** Ninguna historia implementada.`
  - Algunas → `**🟡 En curso.** Implementadas: HU1, HU3. Pendientes: HU2, HU4–HU14.` (rangos con
    guion).
  - Todas → `**✅ Implementado.** Todas las historias del plan están implementadas.`
- Actualiza `## Esfuerzo del sprint`:
  - `Implementado` = suma de `_(Esfuerzo: N)_` de las HU activas con `[x]`.
  - `Total` = suma de las HU activas (las descartadas con `~~...~~` no cuentan).
  - `Pendiente` = Total − Implementado.
  - Formato exacto: `**Total: N pts · Implementado: N · Pendiente: N.**`
  - Si el plan no tiene el bloque, avisá y ofrecé agregarlo con `/sda-sprint`. Si a la HU le falta
    `_(Esfuerzo: N)_`, pedí el valor antes de cerrar. No inventes.

**Historial en `spec.md`:** agrega al final `## Historial de finalización` (solo si no existe) con
una entrada:

```md
### YYYY-MM-DD — cerrada

**Qué se implementó:** resumen funcional.

**Cambios por archivo:**
- `ruta/relativa` — qué hace o cambió.

**Piezas nuevas:**
- `nombre` — para qué sirve. (`ruta:línea`)

**Pruebas:** archivos, cantidad de tests unitarios e integración y validaciones, comandos con resultado.

**Decisiones:** las que convenga recordar.

**Pendiente manual:** pasos y pruebas de `tasks.md` que el usuario debe ejecutar o marcar.

**Otros:** detalles futuros (omitir si no hay).
```

Usa rutas relativas. No incluyas el diff completo; conserva nombres exactos de
archivos/funciones/tests. No reescribas el resto de la HU. En **Pendiente manual**, copiá las tareas
de `## Pasos manuales` y `## Revisión manual` que sigan sin `[x]`; no las marques. Si existe
`revision.md` en la HU, incluí en **Otros** los hallazgos que sigan abiertos; no los arregles aquí.

## 6. Pregunta si se archiva el sprint

Solo cuando **acabas de marcar la última HU pendiente** del Backlog:

- Detente y pregunta (herramienta de preguntas): ¿archivo el sprint en
  `backlog/archive/<sprint>/`? Opciones: archivar o dejarlo en `backlog/<sprint>/`. Nunca archives
  sin confirmación. Si quedan tareas de `## Pasos manuales` o `## Revisión manual` sin `[x]`,
  mencionalo en la pregunta ("quedan N pendientes manuales"); no las marques.
- **No** → no muevas nada; déjalo dicho.
- **Sí**:
  - Crea `backlog/archive/` si no existe.
  - Mueve la carpeta completa `backlog/<sprint>/` → `backlog/archive/<sprint>/` (movimiento del
    sistema, no `git mv`; no stagees ni commitees).
  - Si el destino existe, detente y pregunta (no sobrescribas ni fusiones).
  - Verifica rutas y deja constancia.
- Si queda alguna HU sin marcar, **no preguntes ni archives**: el plan sigue en
  `backlog/<sprint>/`.

## 7. Cierra

Mensaje breve y claro:

- ✅ `HU_NN` validada, HU marcada y spec sincronizada en **todas** las raíces detectadas:
  `specs/<capability>/spec.md` y cada espejo (p. ej. `openspec/specs/<capability>/spec.md`). Enumera
  las rutas tocadas; no resumas "spec sincronizada" con una sola.
- Dos o tres datos: qué quedó funcionando, verificaciones en verde y qué pasos y pruebas manuales
  quedan sin marcar. Si hay pasos manuales pendientes, decí "validada en código, pendiente de
  puesta en marcha".
- Si archivaste, di la ruta nueva. Si no, que el plan sigue en `backlog/<sprint>/`.
- Sugerencia de commit, sin commitear.

No cierres con pregunta (la única permitida es la del paso 6).
