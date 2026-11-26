---
name: sda-build
description: Implementa una HU de punta a punta con TDD: escribe primero los tests unitarios y de integración, muestra el rojo y espera revisión, implementa el mínimo y deja verde. Mantiene `tasks.md` actualizado en el mismo momento en que implementa cada tarea. Documenta siempre cada archivo y cada función creada y actualiza la documentación obsoleta. Al cerrar, ofrece un barrido superficial de huecos con un subagente de solo lectura. Nunca commitea.
disable-model-invocation: true
---

# Build (SDA)

Una HU completa por sesión. Los tests son la especificación; el código es lo mínimo que los cumple.
Pasos grandes: **una HU = sus tests en verde = una entrega**. No se para en cada caso.

## 1. Revisión

- Lee los artefactos de la HU: `backlog/<sprint>/HU_NN/{spec,design,tasks}.md`. Son el insumo
  esperado; si no están, pídemelos.
- Lee el `## Estrategia de tests` del `Plan.md`: runner, estructura, comando y directorio de unitarios,
  y comando y directorio de integración. Si no está, avísame y lo decidimos antes de escribir tests.
- Contrasta el plan con el código actual. Si algo ya no encaja, dímelo antes de empezar.

## 2. Tests primero

- Escribe los tests **a partir de los escenarios de `spec.md`**, en el runner, la estructura y los
  directorios que diga el `Plan.md`.
- **Ubicá los archivos según `estructura`:** `colocada` → `<Componente>/<Componente>.test.<ext>` junto
  al componente y su CSS; `separada` → directorios de unitarios e integración del plan; `mixta` → UI
  colocada y backend en los directorios.
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
   spec. Documentá en esta misma pasada, según la sección **4. Documentación**.
2. Corre los tests unitarios y los de integración y muestra verde. Marcá `[x]` las tareas de
   implementación y validaciones en `tasks.md`.
3. En caso de que la implementación requiera tocar tests existentes, **párate y conversa** antes de cambiar nada. Explica qué falla, por qué y qué cambiará.
4. Si la implementación necesita una acción manual tuya (variable de entorno en el servidor, SQL en
   una base real, secreto, DNS, webhook, deploy), agregala a `## Pasos manuales` en `tasks.md` con la
   acción exacta (si la sección no existe, creala antes de `## Revisión manual`). No la ejecutes;
   avisame.

### `tasks.md` se actualiza mientras implementás (obligatorio)

`tasks.md` es el registro vivo de la HU, no un informe de cierre. **Cada vez que implementás código,
actualizás el archivo en ese mismo momento**, sin esperar al final de la HU:

- Terminás una tarea de implementación → marcá `[x]` esa tarea en `tasks.md` antes de pasar a la
  siguiente. Si la tarea abarca varios archivos, marcala al terminar el último.
- Terminás las validaciones de formato/petición o los tests de una fase → marcá `[x]` esas tareas en
  la misma pasada en que quedan en verde.
- Antes de mostrar verde, releé `tasks.md` completo: toda tarea hecha tiene que estar marcada y
  ninguna tarea pendiente puede quedar marcada. Si falta una marca, corregila ahí mismo.
- Nunca borres, renombres ni reescribas tareas existentes, y no marques nunca las de `## Pasos
  manuales` ni `## Revisión manual`: esas las marca el usuario.
- Si al implementar aparece una tarea que no está en `tasks.md`, no la agregues por tu cuenta:
  pará y conversá (ver **Parar solo si**).

## 4. Documentación (obligatoria)

Documentar **no es opcional y no se pregunta**: se hace en la misma pasada que la implementación,
antes de mostrar verde. Si la documentación ya existe, se **actualiza**; nunca se duplica.

- **Por cada archivo creado o modificado**: un comentario de archivo **después del bloque de
  importaciones** (si no hay importaciones, al inicio, debajo de la licencia o cabecera) que explique
  de qué trata el archivo, qué expone y qué **impacto** tiene en la aplicación: quién lo usa, qué flujo
  habilita y qué se rompería si cambia.
- **Por cada función creada** —incluye métodos, componentes, hooks, handlers y callbacks con
  nombre—: **una línea** inmediatamente antes de la firma que resuma qué hace y por qué importa en el
  proyecto. No repitas la firma ni parafrasees el nombre.
- **Actualizá lo obsoleto** que el cambio invalide: comentarios, docstrings, JSDoc, README o specs de
  `specs/`. Si un archivo ya tenía documentación de archivo o de función, **ampliala o corregila**; no
  agregues un segundo bloque.
- **Formato del repo primero**: usá el estilo de comentario del lenguaje (`/** ... */` en TS/JS,
  `"""..."""` en Python, `///` en Rust, etc.) y sus convenciones. Nada de `@param`/`@returns` salvo que
  el proyecto ya los use.
- **Sin ruido**: una o dos líneas por archivo y una por función. No documentes lo obvio.
- Si el lenguaje no admite comentarios (JSON, CSV), no inventes: documentá en el README o en el
  archivo vecino que corresponda.
- La documentación va dentro de la fase de implementación de `tasks.md`: no crees una fase nueva. Si
  el plan ya trae una tarea de documentación, marcala al terminar.

```ts
import { db } from './db';

/**
 * Repositorio de organizaciones: concentra las lecturas y escrituras que usa el módulo de
 * tesorería. Su cambio afecta el alta, el listado y los permisos de toda la aplicación.
 */

/**
 * Crea una organización y la deja disponible en el listado; es la puerta de entrada del flujo
 * principal de tesorería.
 */
export function createOrganization(input) { ... }
```

## 5. Barrido de huecos

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

## 6. Entrega

Un único mensaje de cierre:

```
✅ <HU_NN> verde: <n> tests unitarios + <n> tests de integración + <n> validaciones de formato/petición.
Doc: <n> archivos y <n> funciones documentadas; <n> docs actualizadas.
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
- En `Doc` contá solo lo que efectivamente tocaste: archivos con comentario de archivo, funciones con
  su línea y documentos preexistentes corregidos. Si no aplica (por ejemplo, solo JSON), decilo en una
  línea en lugar de inventar números.
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
- Aparece una tarea que no está en `tasks.md` o cambia el alcance del plan: pará y conversá antes de
  agregarla al archivo.
- Dos intentos sin verde.

## Reglas de test

- El valor esperado sale del escenario de `spec.md`, **nunca** de la misma lógica que el código.
- Se prueba el comportamiento por la interfaz pública, no detalles internos.
- Formato y peticiones se validan siempre que la HU toque exportación o datos.
- El runner, la **estructura** y la ubicación los manda el `## Estrategia de tests` del `Plan.md`; no
  improvises.
- **Cada test documentado** con una descripción encima que cite el escenario de la spec:

```js
// Escenario #01 — la tesorera crea una organización y la ve en la lista.
test('crear organización la muestra en la lista', () => { ... })
```

- No modificar tests existentes para que pase código nuevo: si hace falta, párate y conversa.
