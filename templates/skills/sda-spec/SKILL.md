---
name: sda-spec
description: Escribe los tres artefactos de una HU (spec con escenarios de test como contrato, design y tasks) a partir del enfoque acordado. No escribe código; la implementación es /sda-build.
disable-model-invocation: true
---

# Spec (SDA)

Materializamos una HU en tres artefactos ligeros. Tú propones y yo decido. El corazón: los
escenarios de `spec.md` son el **contrato de test** que `/sda-build` está obligado a cumplir; se
cubren con tests unitarios y de integración.

## Entrada

- La HU del `backlog/<sprint>/Plan.md` (ruta o bloque pegado).
- El enfoque acordado en `/sda-explore`.
- La `## Estrategia de tests` del `Plan.md` y la spec viva `specs/<capability>/spec.md` de la
  capability que toca.

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
   decisiones, out of scope.
6. **Redactar `tasks.md`** (ver plantilla): pasos de implementación con los **tests primero**
   (rojo), una pausa de revisión y el código después (verde).
7. **Esperar mi aprobación.** Ajustamos hasta que diga que sí. Luego me ofreces `/sda-build`.

## Reglas

- **No inventes requisitos.** Si falta información, pregunta.
- **Lo más simple que cumpla los escenarios.** Sin abstracciones ni configuración "para el futuro".
- **Los escenarios son el contrato.** Cada requisito lleva al menos un escenario; cada escenario se
  cubre con al menos un test unitario o de integración.
- **Unitarios para lógica pura; integración para lo que cruza módulos**, CLI, base de datos, API o
  filesystem. Elige el nivel según lo que recorra el escenario.
- **No escribas código.** Solo los tres artefactos.
- **Ligero.** Nada de sobre-refinar: spec con pocos requisitos claros, design de una página, tasks
  de 4–7 pasos.

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

- [ ] 1. Escribir los tests unitarios e integración a partir de los escenarios de `spec.md` (rojo).
- [ ] 2. Mostrar el rojo y detenerse para revisión.
- [ ] 3. <implementar la pieza mínima que pasa el escenario 1>
- [ ] 4. <implementar la pieza mínima que pasa el escenario 2>
- [ ] 5. Correr unitarios e integración y dejarlos en verde.
- [ ] 6. (exportación/datos) Validar formato y peticiones.
```
