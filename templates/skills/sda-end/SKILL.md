---
name: sda-end
description: Cierra la HU recién implementada en una sola corrida: valida tests unitarios e integración en verde y regresiones, exige tasks.md completo, pide confirmación, sincroniza la spec de la HU en TODAS las raíces de specs vivas (specs/ y espejos como openspec/specs/), marca la HU en el checklist del Plan, agrega historial, archiva la HU en backlog/<sprint>/archive/, marca la tarjeta de Trello como completada (dueComplete, nunca checklist) y ofrece archivar el sprint. Nunca commitea.
disable-model-invocation: true
---

# Cerrar historia (SDA)

Cierras la HU que se acaba de implementar con `/sda-build`. Este comando es **todo en uno**: valida,
confirma, sincroniza las specs vivas y **archiva la carpeta de la HU**. No existe un cierre a medias:
si no sincronizaste **y** archivaste, el cierre está incompleto y no debes escribir el mensaje final.

**Orden obligatorio:** `0. Identificar → 1. Recorrer → 2. Validar → 3. Decidir → 4. Confirmar →
5. Sincronizar specs → 6. Marcar backlog e historial → 7. Archivar la HU → 8. Trello (opcional) →
9. Preguntar por el sprint → 10. Cerrar.`

**Nunca commitees.** Nunca ajustes un test ni código para "hacer pasar": si algo falla, lo reportas y
te detienes.

## 0. Identifica la HU

- Localiza `backlog/<sprint>/HU_NN/` y su `Plan.md`. Lee `spec.md`, `design.md`, `tasks.md`, el
  `Plan.md` completos y, si existe, `revision.md` (barrido de huecos de `/sda-build`).
- Si el contexto no alcanza, deduce la candidata desde el diff de git y **confírmala conmigo antes
  de tocar nada**.
- Si la HU ya está en `backlog/<sprint>/archive/HU_NN/`, el cierre ya se hizo: no la archives de
  nuevo ni desarchives nada. Verifica que `Plan.md` y las specs estén sincronizados, repórtalo y
  pasa directo a la pregunta del sprint (paso 9) si corresponde.
- Si el plan vive en `backlog/archive/<sprint>/`, ya estaba completo: no lo desarchives; repórtalo y
  confirma.

## 1. Recorre lo implementado

- `git status --short` y el diff completo, incluidos archivos nuevos.
- Enumera qué se agregó/cambió y mapéalo contra cada escenario de `spec.md`.
- Distingue: escenarios cubiertos por tests unitarios, escenarios cubiertos por tests de
  integración, validaciones de formato/petición, y cualquier cosa fuera de alcance.

## 2. Valida las reglas

**a) Tests nuevos.** Los archivos de tests unitarios y de integración nuevos —colocados junto al
componente o en carpetas separadas, según la `estructura` del `Plan.md`— son lo esperado. Si un
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

**e) Gate de `tasks.md` (obligatorio antes de escribir nada).** El archivado exige la HU completa.
Recorre todos los checkboxes de `tasks.md`:

- Las fases del agente (tests, implementación, validaciones) **no bloquean**: las marca el paso 6.
- Cualquier checkbox sin `[x]` en una sección cuyo título contenga **manual**
  (`## Pasos manuales`, `## Revisión manual`, con cualquier numeración) **bloquea el cierre**.
- Si hay pendientes manuales: **no sincronices, no marques y no archives**. Listá cada uno con su
  fase y su texto exacto (`Pasos manuales → 4.1 Agregar <VARIABLE>…`), explicá que el usuario debe
  marcarlos y pedile que vuelva a correr `/sda-end`. Detente ahí.
- Si `tasks.md` usa el formato viejo (lista plana), distinguí las manuales por su descripción y
  aplicá la misma regla.

## 3. Decide

- **Todo en verde** (incluidos los tests unitarios y de integración de la HU con los comandos del
  `Plan.md`) y **sin pendientes manuales** → paso 4.
- **Regla rota** → no marques, no sincronices ni archives. Informe breve: regla, evidencia
  (`archivo:línea`, comando), impacto, opciones; pregunta cómo seguir.

## 4. Confirma antes de escribir

Con todo en verde y `tasks.md` sin pendientes manuales, detente y pregunta con la herramienta de
preguntas:

> **¿Estás seguro de que querés sincronizar las specs vivas y archivar `HU_NN` en
> `backlog/<sprint>/archive/`?**

- Antes de preguntar, descubre en **solo lectura** las raíces de specs vivas (paso 5a) y muéstralas:
  `specs/<capability>/spec.md` y cada espejo detectado (p. ej.
  `openspec/specs/<capability>/spec.md`).
- Opciones: **Sí, sincronizar y archivar** / **No, dejar todo como está**.
- **No** → no escribas, no muevas y no marques nada. Decí que el cierre quedó pendiente y termina.
- Solo con **Sí** pasas al paso 5. Esta confirmación no se salta ni se asume.

## 5. Sincroniza las specs vivas (todas las raíces)

Una spec sincronizada en una sola raíz es una sincronización incompleta. Antes de editar, descubre
**todas las raíces de specs vivas** del repo y sincroniza la HU en cada una; ninguna se omite.

**a) Descubre las raíces (obligatorio, antes de escribir):**

- Usa `Capability:` del `spec.md` como nombre de carpeta del destino.
- **Raíz principal SDA:** `specs/` en la raíz del repo. Es la fuente de verdad de este proyecto: la
  spec de la HU siempre debe terminar ahí. Si no existe, créala (`specs/<capability>/spec.md`) en el
  momento de escribir la spec; nunca antes ni en un cierre fallido.
- **Espejos:** cualquier otra carpeta con la misma forma `<raíz>/specs/<capability>/spec.md`, típica
  de un historial antiguo de otro sistema de specs (por ejemplo `openspec/specs/`). Búscalas por
  patrón (`**/specs/*/spec.md`) y excluye `node_modules/`, `.opencode/`, `backlog/` y
  `openspec/changes/` (los cambios activos o archivados son deltas, no specs vivas: no se editan).
- Deja constancia de las rutas encontradas antes de tocar nada, por ejemplo:
  `specs/<capability>/spec.md` + `openspec/specs/<capability>/spec.md`.

**b) Define los destinos:**

- `specs/<capability>/spec.md` **siempre**. Si la capability no existe ahí, créala con `## Purpose`
  (1–2 frases) y los requisitos de la HU.
- Crea solo lo que falta (`specs/`, `specs/<capability>/`): no borres, vacíes ni reemplaces carpetas
  ni archivos existentes.
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

## 6. Marca el backlog

**En `tasks.md`:**
- Marca `- [x]` las tareas de las fases de tests, implementación y validaciones que falten.
- **No marques ni desmarques** las de `## Pasos manuales` ni `## Revisión manual`: las marca el
  usuario. Si ya están `[x]`, respetalas (el gate del paso 2e las exigió).
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
- No agregues ninguna marca de archivado: la línea de la HU no registra la ruta nueva.

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
de `## Pasos manuales` y `## Revisión manual` sin `[x]`; si el gate las exigió, escribí `ninguno`.
Si existe `revision.md` en la HU, incluí en **Otros** los hallazgos que sigan abiertos; no los
arregles aquí. Si el historial ya tiene la entrada de cierre de esta HU (misma fecha y título), **no
la dupliques**: conservala tal cual.

## 7. Archiva la HU

Con las specs sincronizadas y el backlog marcado, mueve la carpeta de la HU. Este paso es
**obligatorio**, no opcional: es la segunda mitad del cierre.

- Destino: `backlog/<sprint>/archive/HU_NN/`. Crea `backlog/<sprint>/archive/` solo si no existe.
- Mueve la carpeta completa (`spec.md`, `design.md`, `tasks.md` y `revision.md` si existe) con el
  movimiento del sistema (`Move-Item` en Windows, `mv` en el resto): nunca `git mv`, nunca stagees
  ni commitees.
- Si `backlog/<sprint>/archive/HU_NN/` ya existe, detente y pregunta: no sobrescribas, no fusiones y
  no borres.
- Verifica que la ruta vieja ya no exista y que la nueva contenga los artefactos. Si algo falló,
  detente y repórtalo: el cierre queda incompleto.
- No toques `Plan.md` por el archivado. La HU sigue `[x]` y el plan no cambia.

## 8. Sincroniza Trello (opcional, solo si está configurado)

Si existe `.opencode/trello.json` en el proyecto **y** la HU quedó validada en el paso 3, ofrece una
sola vez marcar su tarjeta como completada.

Comportamiento obligatorio (las dos cosas, en este orden):

1. Mueve la tarjeta a la lista *Finalizado*.
2. Marca la tarjeta como completada con `dueComplete=true` — el check que Trello muestra como
   **“Marcar como completada”**. Moverla de lista no alcanza: sin `dueComplete=true` la tarjeta
   sigue apareciendo sin completar.
3. Opcional, solo si el usuario lo pide: agrega un comentario de cierre con la ruta real de
   `spec.md` archivada y el resultado de los tests.

Reglas duras:

- **Nunca** crees, sincronices, actualices ni marques checklists de la tarjeta: prohibido usar
  `--checklist` de `sda-sync-trello`, `PUT /1/cards/{id}/checklist*` o cualquier importación de
  `tasks.md` a Trello. El checklist vive solo en `tasks.md`; Trello refleja únicamente el estado de
  la tarjeta.
- **Nunca** importes pasos manuales ni ítems de `tasks.md` a Trello.
- Si el script `sda-sync-trello` no expone `dueComplete`, no lo modifiques ni improvises flags:
  hazlo con la API de Trello
  (`PUT https://api.trello.com/1/cards/{id}?dueComplete=true&key=<KEY>&token=<TOKEN>`) leyendo las
  credenciales de `~/.sda/credentials.json`. Nunca imprimas la key ni el token y verificá con
  `GET /1/cards/{id}?fields=name,idList,due` y `dueComplete` que quedó en `true`.
- Si no hay configuración de Trello, no lo menciones.
- Nunca lo hagas sin mi confirmación, y nunca antes de sincronizar las specs y archivar la HU.
- La HU ya vive en `backlog/<sprint>/archive/HU_NN/`: usá esa ruta en el comentario de cierre y no
  la muevas de vuelta.
- Este paso no cambia el plan, ni `tasks.md`, ni las specs: solo habla con Trello.

## 9. Pregunta si se archiva el sprint

Solo cuando **acabas de archivar la última HU pendiente** del Backlog:

- Detente y pregunta (herramienta de preguntas): ¿archivo el sprint en
  `backlog/archive/<sprint>/`? Opciones: archivar o dejarlo en `backlog/<sprint>/`. Nunca archives
  sin confirmación.
- **No** → no muevas nada; déjalo dicho.
- **Sí**:
  - Crea `backlog/archive/` si no existe.
  - Mueve la carpeta completa `backlog/<sprint>/` → `backlog/archive/<sprint>/` (movimiento del
    sistema, no `git mv`; no stagees ni commitees). Las HU ya archivadas viajan dentro
    (`backlog/archive/<sprint>/archive/HU_NN/`).
  - Si el destino existe, detente y pregunta (no sobrescribas ni fusiones).
  - Verifica rutas y deja constancia.
- Si queda alguna HU sin marcar, **no preguntes ni archives el sprint**: el plan sigue en
  `backlog/<sprint>/`.

## 10. Cierra

Mensaje breve y claro:

- ✅ `HU_NN` validada, HU marcada, spec sincronizada en **todas** las raíces detectadas
  (`specs/<capability>/spec.md` y cada espejo) y archivada en
  `backlog/<sprint>/archive/HU_NN/`. Enumera las rutas tocadas; no resumas "spec sincronizada" con
  una sola.
- Dos o tres datos: qué quedó funcionando y verificaciones en verde. Los pendientes manuales ya
  deben estar en `[x]` para llegar acá; si el usuario los marcó sin ejecutarlos, decí "validada en
  código, pendiente de puesta en marcha".
- Si archivaste el sprint, di la ruta nueva. Si no, que el plan sigue en `backlog/<sprint>/`.
- Si sincronizaste Trello, di el enlace de la tarjeta, en qué lista quedó y que está marcada como
  completada (`dueComplete=true`), sin checklist.
- Sugerencia de commit, sin commitear.

**Checklist obligatorio antes de responder** (si alguna casilla queda vacía, no cierres:
completala o reportá por qué no se pudo):

- [ ] specs vivas sincronizadas en `specs/<capability>/spec.md` y en cada espejo detectado.
- [ ] `tasks.md` sin ningún checkbox pendiente.
- [ ] línea de la HU en `[x]` en `Plan.md`, con estado y esfuerzo recalculados.
- [ ] historial agregado en `spec.md` sin duplicar.
- [ ] `HU_NN` movida a `backlog/<sprint>/archive/HU_NN/` y verificada.
- [ ] pregunta del sprint hecha (si correspondía) y, si Trello está configurado, tarjeta movida a
  *Finalizado* y marcada como completada (`dueComplete=true`), sin checklist.

No cierres con pregunta: las únicas permitidas son la confirmación del paso 4 y la del archivado
del sprint en el paso 9.
