---
name: sda-end
description: Cierra la HU recién implementada: valida tests unitarios e integración en verde y regresiones, sincroniza la spec de la HU en la spec viva, marca la HU en el checklist del Plan, agrega historial y ofrece archivar el sprint. Nunca commitea.
disable-model-invocation: true
---

# Cerrar historia (SDA)

Cierras la HU que se acaba de implementar con `/sda-build`. Primero verificas, después decides, y
solo si todo pasa marcas el backlog y sincronizas specs. **Nunca commitees.** Nunca ajustes un test
ni código para "hacer pasar": si algo falla, lo reportas y te detienes.

## 0. Identifica la HU

- Localiza `backlog/<sprint>/HU_NN/` y su `Plan.md`. Lee `spec.md`, `design.md`, `tasks.md` y el
  `Plan.md` completos.
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

## 4. Sincroniza la spec viva

- Usa `Capability:` del `spec.md` para ubicar `specs/<capability>/spec.md`.
- **Fusión inteligente (markdown, sin CLI):**
  - Por cada `### Requirement` de la HU:
    - No existe en la spec viva → agrégalo con sus escenarios.
    - Ya existe → actualízalo: agrega/modifica escenarios o descripción, preservando lo que la HU no
      menciona.
  - `## Requisitos eliminados` → quita esos bloques de la spec viva. Si al quitar no queda ningún
    requisito, no dejes una sección vacía: repórtalo y detente (no borres el archivo por tu cuenta).
  - `## Requisitos renombrados` → aplica FROM→TO.
- Mantén la estructura de la spec viva: `## Purpose`, `## Requirements`, `### Requirement` +
  `#### Scenario`. Nunca copies secciones delta (ADDED/MODIFIED) en la spec viva.
- La operación debe ser **idempotente**: correrla dos veces da el mismo resultado.

## 5. Marca el backlog

**En `tasks.md`:** marca `- [x]` todas las tareas.

**En `Plan.md`:**
- Marca `- [x]` únicamente la línea de esa HU en el Backlog.
- Actualiza `## Estado de implementación`:
  - Ninguna marcada → `**🔲 Planificado.** Ninguna historia implementada.`
  - Algunas → `**🟡 En curso.** Implementadas: HU1, HU3. Pendientes: HU2, HU4–HU14.` (rangos con
    guion).
  - Todas → `**✅ Implementado.** Todas las historias del plan están implementadas.`

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

**Pendiente manual:** lo que falta probar en entorno real.

**Otros:** detalles futuros (omitir si no hay).
```

Usa rutas relativas. No incluyas el diff completo; conserva nombres exactos de
archivos/funciones/tests. No reescribas el resto de la HU.

## 6. Pregunta si se archiva el sprint

Solo cuando **acabas de marcar la última HU pendiente** del Backlog:

- Detente y pregunta (herramienta de preguntas): ¿archivo el sprint en
  `backlog/archive/<sprint>/`? Opciones: archivar o dejarlo en `backlog/<sprint>/`. Nunca archives
  sin confirmación.
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

- ✅ `HU_NN` validada, spec sincronizada en `specs/<capability>/spec.md` y HU marcada.
- Dos o tres datos: qué quedó funcionando, verificaciones en verde, qué falta a mano.
- Si archivaste, di la ruta nueva. Si no, que el plan sigue en `backlog/<sprint>/`.
- Sugerencia de commit, sin commitear.

No cierres con pregunta (la única permitida es la del paso 6).
