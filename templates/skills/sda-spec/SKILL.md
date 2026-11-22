---
name: sda-spec
description: Escribe los tres artefactos de una HU (spec con escenarios e2e como contrato de test, design y tasks) a partir del enfoque acordado. No escribe código; la implementación es /sda-build.
disable-model-invocation: true
---

# Spec (SDA)

Materializamos una HU en tres artefactos ligeros. Tú propones y yo decido. El corazón: los
escenarios e2e de `spec.md` son el **contrato de test** que `/sda-build` está obligado a cumplir.

## Entrada

- La HU del `Backlog/<sprint>/Plan.md` (ruta o bloque pegado).
- El enfoque acordado en `/sda-explore`.
- El `## Framework e2e` del `Plan.md` y la spec viva `specs/<capability>/spec.md` de la capability
  que toca.

## Pasos

1. **Leer contexto.** Lee la HU, su `Plan.md`, su framework e2e, la spec viva de la capability (si
   existe) y el código actual. Si algo no encaja con lo acordado en explore, dímelo antes de
   escribir.
2. **Determinar la capability.** Deduce `specs/<capability>/` a la que pertenece (por el dominio).
   Si dudas, pregunta.
3. **Redactar `spec.md`** (ver plantilla): requisitos en lenguaje de comportamiento + escenarios
   e2e `DADO/CUANDO/ENTONCES`. Los escenarios describen **qué ve o logra el usuario**, nunca cómo se
   implementa.
4. **Validaciones obligatorias.** Si la HU toca **exportación** o **manejo de datos**, agrega en
   `spec.md` una sección con validaciones de **formato** (contenido PDF/Excel, moneda, fechas,
   encoding) y **petición** (contrato del sync/API: payload, ids, idempotencia). Son "sí o sí": no
   se cierra sin test que las cubra.
5. **Redactar `design.md`** (ver plantilla): cómo entra al código, archivos a tocar, piezas nuevas,
   decisiones, out of scope.
6. **Redactar `tasks.md`** (ver plantilla): pasos de implementación con el **test e2e primero**
   (rojo) y el código después (verde).
7. **Esperar mi aprobación.** Ajustamos hasta que diga que sí. Luego me ofreces `/sda-build`.

## Reglas

- **No inventes requisitos.** Si falta información, pregunta.
- **Lo más simple que cumpla los escenarios.** Sin abstracciones ni configuración "para el futuro".
- **Los escenarios e2e son el contrato.** Cada requisito lleva al menos un escenario que recorre el
  flujo del usuario de punta a punta.
- **No escribas código.** Solo los tres artefactos.
- **Ligero.** Nada de sobre-refinar: spec con pocos requisitos claros, design de una página, tasks
  de 4–7 pasos.

## Ubicación

`Backlog/<sprint>/HU_NN/` con `spec.md`, `design.md` y `tasks.md`. Numeración según el `## Backlog`
del plan: `HU1` → `HU_01`. Si no se puede saber, usa el siguiente número libre. Si la carpeta ya
existe, pregunta antes de sobrescribir.

## Plantilla `spec.md`

```markdown
# HU_NN — <título corto>

**Plan:** `Backlog/<sprint>/Plan.md` · HU_NN
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

- [ ] 1. Escribir el/los test e2e a partir de los escenarios de `spec.md` (rojo).
- [ ] 2. <implementar la pieza mínima que pasa el escenario 1>
- [ ] 3. <implementar la pieza mínima que pasa el escenario 2>
- [ ] 4. Correr los e2e y dejarlos en verde.
- [ ] 5. (exportación/datos) Validar formato y peticiones.
```
