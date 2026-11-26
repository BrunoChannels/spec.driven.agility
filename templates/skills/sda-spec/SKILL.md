---
name: sda-spec
description: Escribe los tres artefactos de una HU (spec con escenarios de test como contrato, design y tasks por fase con pasos y revisión manual) a partir del enfoque acordado y ajusta su esfuerzo en el Plan.md. No escribe código; la implementación es /sda-build.
disable-model-invocation: true
---

# Spec (SDA)

Materializamos una HU en tres artefactos ligeros. Tú propones y yo decido. El corazón: los
escenarios de `spec.md` son el **contrato de test** que `/sda-build` está obligado a cumplir; se
cubren con tests unitarios y de integración.

## Entrada

- La HU del `backlog/<sprint>/Plan.md` (ruta o bloque pegado).
- El enfoque acordado en `/sda-explore`.
- La `## Estrategia de tests` del `Plan.md` —runner, estructura, comandos y directorios— y la spec
  viva `specs/<capability>/spec.md` de la capability que toca.

## Pasos

1. **Leer contexto.** Lee la HU, su `Plan.md`, su estrategia de tests, la spec viva de la capability
   (si existe) y el código actual. Si algo no encaja con lo acordado en explore, dímelo antes de
   escribir.
2. **Determinar la capability.** Deduce `specs/<capability>/` a la que pertenece (por el dominio).
   Si dudas, pregunta.
3. **Redactar `spec.md`** (ver plantilla): requisitos en lenguaje de comportamiento + escenarios
   `DADO/CUANDO/ENTONCES`. Los escenarios describen **qué ve o logra el usuario**, nunca cómo se
   implementa.
4. **Validaciones obligatorias.** Si la HU toca **exportación** o **manejo de datos**, agrega en
   `spec.md` una sección con validaciones de **formato** (contenido PDF/Excel, moneda, fechas,
   encoding) y **petición** (contrato del sync/API: payload, ids, idempotencia). Son "sí o sí": no
   se cierra sin tests unitarios o de integración que las cubran.
5. **Redactar `design.md`** (ver plantilla): cómo entra al código, archivos a tocar, piezas nuevas,
   decisiones, out of scope. En `## Archivos a tocar` incluí las rutas de test con el nombre exacto
   que exige la `estructura` del `Plan.md`.
6. **Redactar `tasks.md`** (ver plantilla): tareas agrupadas por fase, con los **tests primero**
   (rojo), una pausa de revisión, el código después (verde), los **pasos manuales** que debe ejecutar
   el usuario (env vars, SQL, secretos, infra) y la **revisión manual** final.
7. **Ajustar esfuerzo.** Lee `_(Esfuerzo: N)_` de la HU en el `Plan.md`; si falta, pedímelo. Si el
   diseño revela que la historia es más grande, más chica o no entra en 8, propón el nuevo valor,
   actualiza la línea y recalcula `## Esfuerzo del sprint`. No toques el esfuerzo de otras HU.
8. **Esperar mi aprobación.** Ajustamos hasta que diga que sí. Luego me ofreces `/sda-build`.

## Reglas

- **No inventes requisitos.** Si falta información, pregunta.
- **Lo más simple que cumpla los escenarios.** Sin abstracciones ni configuración "para el futuro".
- **Los escenarios son el contrato.** Cada requisito lleva al menos un escenario; cada escenario se
  cubre con al menos un test unitario o de integración.
- **Unitarios para lógica pura; integración para lo que cruza módulos**, CLI, base de datos, API o
  filesystem. Elige el nivel según lo que recorra el escenario.
- **Ubicación de tests.** La `estructura` del `Plan.md` manda: `colocada` = test junto al componente y
  su CSS; `separada` = directorios de unitarios e integración del plan; `mixta` = UI colocada y
  backend separado. Reflejá las rutas exactas en `design.md`.
- **No escribas código.** Solo los tres artefactos.
- **Esfuerzo en el plan.** No repitas el esfuerzo en `spec.md`/`design.md`/`tasks.md`: la fuente es
  la línea de la HU en `Plan.md`.
- **Tasks por fase.** Agrupá con `## N. <fase>` y numeración `N.M`; el orden es tests (rojo),
  implementación (verde), validaciones obligatorias (si aplica), pasos manuales (si aplica) y
  revisión manual.
- **Pasos manuales.** Si el diseño requiere acciones que el agente no puede hacer (variables de
  entorno en el servidor, SQL en una base real, secretos, DNS, webhooks, permisos, deploy), agregalas
  con la acción exacta y el entorno. No las ejecutes.
- **Revisión manual.** La última fase es del usuario: acciones concretas con resultado esperado,
  derivadas de los escenarios de `spec.md`. No las marques; las marca el usuario.
- **Ligero.** Nada de sobre-refinar: spec con pocos requisitos claros, design de una página, tasks
  chicas agrupadas en 3–5 fases.

## Ubicación

`backlog/<sprint>/HU_NN/` con `spec.md`, `design.md` y `tasks.md`. Numeración según el `## Backlog`
del plan: `HU1` → `HU_01`. Si no se puede saber, usa el siguiente número libre. Si la carpeta ya
existe, pregunta antes de sobrescribir.

## Plantilla `spec.md`

```markdown
# HU_NN — <título corto>

**Plan:** `backlog/<sprint>/Plan.md` · HU_NN
**Estado:** 🔲 Planificado
**Capability:** <ruta de specs, ej. `exports`>

## Requisitos

### Requirement: <nombre>
El sistema DEBE <qué hace, desde el punto de vista del usuario>.

#### Scenario: <flujo del usuario>
- **DADO** <estado inicial>
- **CUANDO** <la tesorera hace X>
- **ENTONCES** <se ve/obtiene Y>

## Requisitos eliminados
<!-- solo si esta HU elimina algo que ya existía en la spec viva -->

### Requirement: <nombre>

## Requisitos renombrados
<!-- solo si aplica -->
- FROM: `### Requirement: <viejo>`
- TO: `### Requirement: <nuevo>`

## Validaciones obligatorias
<!-- solo si toca exportación o manejo de datos -->

- **Formato:** <qué formato se valida y cómo>.
- **Petición:** <qué petición/contrato se valida>.
```

## Plantilla `design.md`

```markdown
# HU_NN — Diseño

## Enfoque
<2–3 frases: cómo se resuelve>

## Archivos a tocar
- `ruta/relativa` — qué se crea o modifica y por qué.
- `ruta/del/test` — test que cubre los escenarios, ubicado según la `estructura` del `Plan.md`.

## Piezas nuevas
- `nombre` — para qué sirve.

## Decisiones
- <decisión y por qué>

## Out of scope
- <qué queda fuera para que no se cuele>
```

## Plantilla `tasks.md`

```markdown
# HU_NN — Tareas

## 1. Tests (rojo)

- [ ] 1.1 Escribir los tests unitarios e integración a partir de los escenarios de `spec.md` en las rutas que fija la `estructura` del `Plan.md` (incluye formato y petición si la HU lo exige).

- [ ] 1.2 Mostrar el rojo y detenerse para revisión.

## 2. Implementación (verde)

- [ ] 2.1 <implementar la pieza mínima que pasa el escenario 1>

- [ ] 2.2 <implementar la pieza mínima que pasa el escenario 2>

- [ ] 2.3 Correr unitarios e integración y dejarlos en verde.

## 3. Validaciones obligatorias
<!-- solo si toca exportación o datos -->

- [ ] 3.1 Validar formato: <qué se comprueba>.

- [ ] 3.2 Validar peticiones: <qué contrato se comprueba>.

## 4. Pasos manuales
<!-- solo si el diseño requiere acciones del usuario -->

- [ ] 4.1 Agregar `<VARIABLE>` en el entorno del servidor y reiniciar el servicio.

- [ ] 4.2 Ejecutar `<ruta/migracion.sql>` en la base correspondiente.

## 5. Revisión manual

- [ ] 5.1 <paso concreto en el entorno real> → <resultado esperado>.

- [ ] 5.2 <otro flujo visible> → <resultado esperado>.
```

Cada checkbox va en su propio párrafo: una línea en blanco antes y otra después. Nunca pegues dos
checkboxes seguidos. Las tareas de `## Pasos manuales` y `## Revisión manual` las marca el usuario:
escribí acciones concretas, con el entorno o el resultado esperado. La revisión manual lleva entre 2
y 5 ítems. Si una fase no aplica, omitila y renumerá las siguientes.
