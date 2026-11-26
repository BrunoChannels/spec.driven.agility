# Spec-Driven Agility (SDA)

> Versión actual: **0.14.0**

CLI que instala la metodología **Spec-Driven Agility** en cualquier proyecto con [opencode](https://opencode.ai):
backlog ágil de historias de usuario, artefactos por HU y **tests unitarios y de integración**.

Fusiona lo mejor de ODD (backlog + TDD) y de SDD/OpenSpec (exploración + artefactos + specs vivas),
sin waterfall.

## Instalación

```bash
npm install -g spec-driven-agility
```

Luego, dentro de cualquier proyecto:

```bash
sda init
```

Esto crea:

```
.opencode/commands/sda-*.md      ← 6 comandos: /sda-sprint, /sda-explore, /sda-spec, /sda-build, /sda-end, /sda-sync-trello
.opencode/skills/sda-*/SKILL.md  ← 6 skills con las reglas y plantillas
.opencode/agents/sda-gap-scan.md ← subagente de barrido de huecos (solo lectura)
```

`sda init` **no crea** las carpetas de datos: `backlog/` la crea `/sda-sprint` al guardar el primer
plan y `specs/` la crea `/sda-end` al sincronizar la primera HU. Así el proyecto no queda con carpetas
vacías y ninguna existente se reemplaza.

Después ejecuta `/sda-sprint` en opencode: ahí se define (o se hereda de un sprint anterior) la estrategia de tests y queda guardada en el `Plan.md`.

> **Otras raíces de specs vivas.** Si el repo ya trae otra raíz de specs de una metodología anterior
> (por ejemplo `openspec/specs/`), `/sda-end` sincroniza la HU en **todas** las raíces: `specs/`
> (principal) y cada espejo que ya tenga la capability. Ninguna se omite ni se sobrescribe con una
> copia del archivo completo. Los deltas archivados (`openspec/changes/`) no se tocan.

### Actualizar la metodología

```bash
sda update
```

Re-sincroniza comandos, skills y subagente. No toca `backlog/` ni `specs/`.

> Si vienes de la 0.5.x o anterior, renombra tu carpeta `Backlog/` a `backlog/` una vez:
> `git mv Backlog backlog` (en Windows/macOS, si git no lo detecta, usa `git mv Backlog tmp && git mv tmp backlog`).

## Comandos

| Comando | Qué hace |
|---|---|
| `/sda-sprint` | Crea/actualiza el backlog, asigna el esfuerzo por HU y define/hereda la estrategia de tests (runner, estructura, comandos y directorios; guardada en `Plan.md`). |
| `/sda-explore` | Indaga código + specs vivas + estrategia de tests y acuerda el enfoque de una HU. |
| `/sda-spec` | Escribe `spec.md` (escenarios de test), `design.md` y `tasks.md` por fases con pasos y pruebas manuales; ajusta el esfuerzo si el diseño lo cambia. |
| `/sda-build` | Implementa con TDD: tests unitarios e integración → rojo → revisión → verde. Actualiza `tasks.md` en el mismo momento en que implementa cada tarea. Documenta siempre cada archivo tocado (tras las importaciones) y cada función creada, y actualiza la documentación obsoleta. Al cerrar, ofrece un barrido superficial de huecos con un subagente de solo lectura. |
| `/sda-end` | Cierra la HU en una sola corrida: valida, pide confirmación, sincroniza specs vivas, marca la HU sin tocar los pasos ni las pruebas manuales, archiva la HU y ofrece archivar el sprint. |
| `/sda-sync-trello` | Espeja el backlog en un tablero Kanban de Trello: configura credenciales y tablero, sube las HUs como tarjetas y actualiza o cierra la tarjeta de la HU en curso. |

### Estrategia y estructura de tests

`/sda-sprint` define —o hereda del sprint más reciente— la estrategia en el `## Estrategia de tests`
del `Plan.md`:

```markdown
## Estrategia de tests
- **runner**: Vitest
- **estructura**: colocada — tests junto al componente, conviviendo con su CSS
- **unitarios**: comando `npm run test:unit` — directorio `src/`
- **integración**: comando `npm run test:integration` — directorio `test/integration/`
```

La **estructura** decide dónde vive cada archivo de test:

| Valor | Ubicación |
|---|---|
| `colocada` | Atomic design, carpeta por componente: `Componente/Componente.tsx`, `Componente/Componente.module.css` y `Componente/Componente.test.tsx` conviven. |
| `separada` | Código en `src/…` y tests en `test/unit/…` y `test/integration/…`. |
| `mixta` | UI colocada junto al componente y backend/lógica en carpetas separadas. |

`/sda-explore`, `/sda-spec`, `/sda-build` y `/sda-end` leen la estructura del `Plan.md`. Si un plan
viejo ya tiene la estrategia pero le falta `estructura`, se pregunta solo ese dato y se completa el
bloque.

### Documentación del código

`/sda-build` documenta siempre, sin preguntar y en la misma pasada del código:

- **Por archivo creado o modificado**: un comentario de archivo **después de las importaciones** que
  explica de qué trata, qué expone y qué impacto tiene en la aplicación (quién lo usa, qué flujo
  habilita, qué se rompería si cambia).
- **Por función creada** (métodos, componentes, hooks, handlers y callbacks con nombre incluidos):
  **una línea** antes de la firma con qué hace y por qué importa en el proyecto.
- **Actualización**: si el cambio invalida un comentario, docstring, README o spec de `specs/`, se
  corrige en la misma pasada. Nunca se agrega un segundo bloque si ya existe documentación: se amplía
  o se corrige.

Se respeta el estilo de comentarios del repo (`/** ... */`, `"""..."""`, `///`, etc.) y no se inventa
documentación en formatos que no admiten comentarios (JSON, CSV).

### Barrido de huecos

Al terminar una HU en verde, `/sda-build` ofrece lanzar `sda-gap-scan`, un subagente de solo lectura
que revisa lo justo: contrato de la spec, coherencia con el código existente, decisiones caras y
deuda silenciosa. Devuelve hasta 5 hallazgos con severidad y evidencia; no corrige nada. Si aceptás,
el informe queda en `backlog/<sprint>/HU_NN/revision.md` y `/sda-end` lo refleja en el historial.

### Esfuerzo

Cada HU lleva un esfuerzo de un dígito (**1, 2, 3, 5 u 8**, Fibonacci) en su línea del `Plan.md`:

```markdown
- [ ] **HU1** — Como tesorera, quiero ... _(Esfuerzo: 2)_
```

`/sda-sprint` lo estima al proponer el backlog y `/sda-spec` puede ajustarlo si el diseño revela otra
cosa. El plan mantiene la suma del sprint:

```
## Esfuerzo del sprint

**Total: 13 pts · Implementado: 5 · Pendiente: 8.**
```

Las HU descartadas no suman. Si una historia no entra en 8, se parte.

### Tareas, pasos y revisión manual

`tasks.md` agrupa las tareas por fase, al estilo OpenSpec: `## 1. Tests (rojo)`,
`## 2. Implementación (verde)`, `## 3. Validaciones obligatorias` (si aplica),
`## 4. Pasos manuales` (si aplica) y `## 5. Revisión manual`. Cada tarea usa numeración `N.M` y su
propio párrafo.

Durante el build es un **registro vivo**: `/sda-build` marca cada tarea de tests, implementación y
validaciones en el mismo momento en que la termina, sin esperar al cierre de la HU, y relee el
archivo antes de mostrar verde para corregir marcas faltantes o sobrantes.

Las dos últimas fases son del usuario: los **pasos manuales** son acciones que el agente no puede
hacer (agregar variables de entorno en un servidor, ejecutar SQL en una base real, configurar
secretos, DNS o webhooks); la **revisión manual** son pruebas concretas de aceptación (acción +
resultado esperado). Ni `/sda-build` ni `/sda-end` marcan esas tareas: las marca el usuario. Si
quedan pendientes, `/sda-end` las lista y no sincroniza ni archiva hasta que las marques.

### Archivado

`/sda-end` es un cierre todo en uno: además de validar y sincronizar las specs, archiva la HU. Antes
de escribir nada exige `tasks.md` sin pendientes manuales y pide una confirmación explícita:
**¿Estás seguro de que querés sincronizar las specs vivas y archivar `HU_NN`?**. Si decís que no, no
toca nada.

Al confirmar, la carpeta se mueve a `backlog/<sprint>/archive/HU_NN/` con el movimiento del sistema
(nunca `git mv`, nunca commit) y el `Plan.md` no cambia. Hay dos niveles de archivo:

| Nivel | Ruta | Cuándo |
|---|---|---|
| HU | `backlog/<sprint>/archive/HU_NN/` | En cada `/sda-end` confirmado. |
| Sprint | `backlog/archive/<sprint>/` | Se pregunta al cerrar la última HU del plan; la HU ya archivada viaja dentro (`backlog/archive/<sprint>/archive/HU_NN/`). |

Si el destino ya existe, `/sda-end` se detiene: nunca sobrescribe ni fusiona.

## Trello

`/sda-sync-trello` espeja el backlog en un tablero Kanban (`Por Hacer → En proceso → En revisión →
Finalizado`). El `plan.md` sigue siendo la fuente de verdad; Trello es la vista operativa.

**Credenciales (una vez por máquina).** La API de Trello exige API key **y** token:

```
https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=SDA-Sync-Trello&key=<API_KEY>
```

El comando las pide la primera vez y las guarda en `~/.sda/credentials.json` (fuera del repo). Las
variables `TRELLO_KEY` y `TRELLO_TOKEN` tienen precedencia, útil en CI.

**Tablero (una vez por proyecto).** La URL se guarda en `.opencode/trello.json` junto con el mapeo de
las cuatro listas, las etiquetas y el id de cada tarjeta. No se versiona ningún secreto.

**Qué hace según el contexto:**

| Situación | Acción |
|---|---|
| Sin HUs trabajadas en la sesión | Sube el sprint: crea las tarjetas faltantes con etiquetas de sprint, esfuerzo (1/2/3/5/8) y fase si el plan la declara. |
| HU en curso | Mueve su tarjeta, sincroniza la descripción, crea la checklist desde `tasks.md` y añade comentarios o enlaces de PR. |
| Tras `/sda-end` | Marca la tarjeta como finalizada, la mueve a *Finalizado* y comenta el cierre. |

Comandos del CLI interno (sin `--apply` son dry-run):

```bash
node .opencode/skills/sda-sync-trello/scripts/trello.mjs doctor
node .opencode/skills/sda-sync-trello/scripts/trello.mjs state
node .opencode/skills/sda-sync-trello/scripts/trello.mjs seed --apply
node .opencode/skills/sda-sync-trello/scripts/trello.mjs sync-hu --hu HU3 --move review --apply
```

Garantías: nunca borra tarjetas, etiquetas ni listas; nunca crea listas sin permiso; es idempotente
(re-ejecutar no duplica ni reescribe descripciones idénticas); identifica las tarjetas por número de
HU (`HU1`, `HU-01` y `HU_1` son la misma); y respeta el límite de ~100 escrituras / 10 s.

## CLI

```
sda <comando> [ruta]

init [ruta]     Instala comandos, skills y subagente en el proyecto (por defecto,
                el directorio actual). No crea backlog/ ni specs/.
                Muestra la intro animada; usa --no-animation para omitirla.
update [ruta]   Re-sincroniza comandos y skills.
version         Muestra la versión.
help            Muestra la ayuda.
```

`sda init` muestra una **planta pixel-art en verdes oscuros** hecha con bloques de mosaico
(`█▓▒░`); el patrón de sombra se desplaza suavemente en bucle, **sin apagarse**, hasta que presionas
ENTER. La intro es responsiva: si la terminal no alcanza el ancho para la planta, muestra solo el
texto de bienvenida y los comandos; si es demasiado pequeña, se omite y la instalación continúa
directamente. En CI o scripts se omite sola; también puedes forzarlo con `sda init --no-animation`.

## Filosofía

- La fuente de verdad es un **Backlog de Sprint** con historias modificables y descartables.
- Cada HU recorre: **explorar → especificar → construir (tests primero) → cerrar y sincronizar**.
- Al cerrar, la HU se **archiva** en `backlog/<sprint>/archive/HU_NN/` y el plan conserva el estado
  del sprint; la carpeta del sprint sigue siendo el índice de sus HU.
- Queda una **historia de specs viva** (`specs/`) que el agente consulta en cada exploración; al
  cerrar una HU, `/sda-end` la sincroniza también en los espejos de specs existentes (p. ej.
  `openspec/specs/`).
- **Tests unitarios y de integración obligatorios** para proteger la lógica y los flujos entre
  módulos; exportación/datos exige validar **formato** y **peticiones**. Su ubicación la fija la
  **estructura** del `Plan.md` (colocada, separada o mixta).
- Cada HU lleva un **esfuerzo Fibonacci de un dígito** (1, 2, 3, 5, 8) y el `Plan.md` mantiene el
  total del sprint, lo implementado y lo pendiente.
- `tasks.md` se agrupa por **fase** (tests, implementación, validaciones, pasos manuales y revisión
  manual); los pasos y las pruebas manuales los marca el usuario.
- Cada HU cierra con un **barrido de huecos opcional** (subagente de solo lectura) que busca
  inconsistencias con impacto a largo plazo sin ampliar el alcance ni corregir por su cuenta.
- Markdown puro, sin CLI de specs. La estrategia de tests se define o hereda en `/sda-sprint`
  (runner, estructura, comandos y directorios) y vive en el `Plan.md`.

## Desarrollo

El paquete no tiene dependencias: solo Node.js 18+.

```bash
git clone https://github.com/BrunoChannels/spec.driven.agility.git
cd spec-driven-agility
npm link          # deja `sda` apuntando a este repo
sda init /tmp/prueba
```

## Publicar

```bash
npm login
npm publish
```

## Licencia

MIT
