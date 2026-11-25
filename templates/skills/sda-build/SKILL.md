---
name: sda-build
description: Implementa una HU de punta a punta con TDD: escribe primero los tests unitarios y de integración, muestra el rojo y espera revisión, implementa el mínimo y deja verde. Al cerrar, ofrece un barrido superficial de huecos con un subagente de solo lectura. Nunca commitea.
disable-model-invocation: true
---

# Build (SDA)

Una HU completa por sesión. Los tests son la especificación; el código es lo mínimo que los cumple.
Pasos grandes: **una HU = sus tests en verde = una entrega**. No se para en cada caso.

## 1. Revisión

- Lee los artefactos de la HU: `backlog/<sprint>/HU_NN/{spec,design,tasks}.md`. Son el insumo
  esperado; si no están, pídemelos.
- Lee el `## Estrategia de tests` del `Plan.md`: runner, comando y directorio de unitarios, y
  comando y directorio de integración. Si no está, avísame y lo decidimos antes de escribir tests.
- Contrasta el plan con el código actual. Si algo ya no encaja, dímelo antes de empezar.

## 2. Tests primero

- Escribe los tests **a partir de los escenarios de `spec.md`**, en el runner y directorios que diga
  el `Plan.md`.
- Cada escenario `DADO/CUANDO/ENTONCES` de la spec es el contrato: el test verifica el
  comportamiento observable, no detalles internos.
- Elige el nivel: **unitario** para lógica pura y **de integración** para lo que cruza módulos, CLI,
  base de datos, API o filesystem.
- Si la HU tiene sección **Validaciones obligatorias**, agrega los tests de **formato** (contenido
  exportado: celdas, moneda, fechas, encoding) y de **petición** (contrato del sync/API: payload,
  ids, idempotencia).
- **Corre y muestra rojo** una sola vez, antes de tocar código.
- **Detente para revisión.** Después de mostrar el rojo, espera mi confirmación explícita. No
  implementes nada hasta que te lo diga, esto es una obligación.
- Si los tests no se pueden escribir con la estrategia del proyecto sin agregar dependencias,
  **párate y conversa** (no agregues librerías en silencio).

## 3. Implementación de golpe

1. Al recibir mi confirmación, marcá `[x]` las tareas de la fase de tests en `tasks.md` y después
   implementá toda la HU hasta verde, sin paradas intermedias y sin sumar casos no declarados en la
   spec.
2. Corre los tests unitarios y los de integración y muestra verde. Marcá `[x]` las tareas de
   implementación y validaciones en `tasks.md`.
3. En caso de que la implementación requiera tocar tests existentes, **párate y conversa** antes de cambiar nada. Explica qué falla, por qué y qué cambiará.
4. Si la implementación necesita una acción manual tuya (variable de entorno en el servidor, SQL en
   una base real, secreto, DNS, webhook, deploy), agregala a `## Pasos manuales` en `tasks.md` con la
   acción exacta (si la sección no existe, creala antes de `## Revisión manual`). No la ejecutes;
   avisame.

## 4. Barrido de huecos (opcional)

Con la HU en verde, antes del cierre, ofrecé un barrido superficial de solo lectura.

1. Preguntá una sola vez, con la herramienta de preguntas:
   **"¿Lanzo el barrido superficial de huecos e inconsistencias? (solo lectura, ~10 lecturas)"**.
   Opciones: **Sí** (recomendado) / **No**.
2. Si digo que no, pasá a la entrega sin mencionarlo.
3. Si digo que sí, lanzá el subagente `sda-gap-scan` con la herramienta de subagentes. Si el agente no
   está disponible, usá `explore` con el mismo brief. Si tampoco podés, avisá y cerrá normal.
4. Brief compacto (no pegues el diff completo):
   - rutas de `backlog/<sprint>/HU_NN/`, su `Plan.md` y `specs/<capability>/spec.md`;
   - archivos tocados (`git status --short` y `git diff --stat`);
   - una o dos líneas de qué entrega la HU;
   - comandos de unitarios e integración y que están en verde;
   - mi idioma y **"no modifiques nada"**.
5. Esperá el informe antes de cerrar.
6. **No arregles nada** de lo que reporte: ni código, ni tests, ni artefactos. Tampoco lo conviertas en
   tarea por tu cuenta.
7. Si hay un hallazgo **alto** que contradice `spec.md`/`design.md` o deja un contrato ambiguo,
   mostralo antes de cerrar y preguntame cómo seguir.
8. Si hay al menos un hallazgo, ofrecé guardarlo con la herramienta de preguntas:
   **"¿Guardo el informe en `backlog/<sprint>/HU_NN/revision.md`?"** (Sí / No). Si acepto, escribí
   vos el archivo (el subagente no puede): título `# HU_NN — Barrido de huecos`, fecha, veredicto,
   tabla y alcance. Nada más.

## 5. Entrega

Un único mensaje de cierre:

```
✅ <HU_NN> verde: <n> tests unitarios + <n> tests de integración + <n> validaciones de formato/petición.
Piezas creadas:
1. `<nombre>` — <para qué sirve>. (`archivo:línea`)
2. ...
Manual: <pasos de `## Pasos manuales` y pruebas de `## Revisión manual` que quedan para vos>
Decidí: <juicio propio, si hubo>
🔍 Barrido: <n> hallazgos — <guardado en `revision.md` | solo en chat>
1. [alta] <tipo> — `archivo:línea` — <impacto> → <sugerencia>
¿Reviso contigo, ajusto algo o cierro con /sda-end?
```

- Incluí el bloque `🔍 Barrido` solo si corriste el barrido. Si no hubo hallazgos, escribí
  `🔍 Barrido: sin hallazgos relevantes.`
- No marques las tareas de `## Pasos manuales` ni de `## Revisión manual`: las marca el usuario.
  Marca solo las fases de tests, implementación y validaciones. Si `tasks.md` usa el formato viejo
  (lista plana), distinguilas por su descripción.
- Listado ordenado y solo lo nuevo: nombre, para qué sirve, dónde vive.
- Si existe `.opencode/trello.json`, ofrece una sola vez mover la tarjeta de esta HU a **En revisión**
  con la skill `sda-sync-trello` (opcional, nunca automático). Si no hay configuración de Trello, no
  lo menciones.
- Sugiere mensaje de commit si es buen punto (funcionalidad y refactor en commits distintos).
  **Nunca commitees.**

## Parar solo si

- Aparece una decisión de diseño que no está en `design.md`.
- Se cuela algo no pedido, aunque parezca razonable.
- **Hay que tocar un test** existente: párate antes, avisa cuál, por qué y qué cambiará.
- **Hay que tocar funcionalidad preexistente**: evidéncialo (qué hace hoy, quién depende, qué se
  rompería) y muéstralo para conversar antes de tocarlo.
- **El barrido reporta un hallazgo alto** que contradice `spec.md`/`design.md`: mostralo y preguntá;
  no lo corrijas por tu cuenta.
- Dos intentos sin verde.

## Reglas de test

- El valor esperado sale del escenario de `spec.md`, **nunca** de la misma lógica que el código.
- Se prueba el comportamiento por la interfaz pública, no detalles internos.
- Formato y peticiones se validan siempre que la HU toque exportación o datos.
- El runner y la ubicación los manda el `## Estrategia de tests` del `Plan.md`; no improvisar.
- **Cada test documentado** con una descripción encima que cite el escenario de la spec:

```js
// Escenario #01 — la tesorera crea una organización y la ve en la lista.
test('crear organización la muestra en la lista', () => { ... })
```

- No modificar tests existentes para que pase código nuevo: si hace falta, párate y conversa.
