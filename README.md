# Spec-Driven Agility (SDA)

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
.opencode/commands/sda-*.md      ← 5 comandos: /sda-sprint, /sda-explore, /sda-spec, /sda-build, /sda-end
.opencode/skills/sda-*/SKILL.md  ← 5 skills con las reglas y plantillas
.opencode/agents/sda-gap-scan.md ← subagente de barrido de huecos (solo lectura)
backlog/                         ← backlog de sprints (se llena con /sda-sprint)
specs/                           ← historia de specs viva (la mantiene /sda-end)
```

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
| `/sda-sprint` | Crea/actualiza el backlog, asigna el esfuerzo por HU y define/hereda la estrategia de tests (guardada en `Plan.md`). |
| `/sda-explore` | Indaga código + specs vivas + estrategia de tests y acuerda el enfoque de una HU. |
| `/sda-spec` | Escribe `spec.md` (escenarios de test), `design.md` y `tasks.md` por fases con pasos y pruebas manuales; ajusta el esfuerzo si el diseño lo cambia. |
| `/sda-build` | Implementa con TDD: tests unitarios e integración → rojo → revisión → verde. Al cerrar, ofrece un barrido superficial de huecos con un subagente de solo lectura. |
| `/sda-end` | Valida, sincroniza specs vivas, marca la HU sin tocar los pasos ni las pruebas manuales y archiva el sprint. |

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

Las dos últimas fases son del usuario: los **pasos manuales** son acciones que el agente no puede
hacer (agregar variables de entorno en un servidor, ejecutar SQL en una base real, configurar
secretos, DNS o webhooks); la **revisión manual** son pruebas concretas de aceptación (acción +
resultado esperado). Ni `/sda-build` ni `/sda-end` marcan esas tareas: las marca el usuario. Si
quedan pendientes, `/sda-end` las copia al historial.

## CLI

```
sda <comando> [ruta]

init [ruta]     Instala todo en el proyecto (por defecto, el directorio actual).
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
- Queda una **historia de specs viva** (`specs/`) que el agente consulta en cada exploración; al
  cerrar una HU, `/sda-end` la sincroniza también en los espejos de specs existentes (p. ej.
  `openspec/specs/`).
- **Tests unitarios y de integración obligatorios** para proteger la lógica y los flujos entre
  módulos; exportación/datos exige validar **formato** y **peticiones**.
- Cada HU lleva un **esfuerzo Fibonacci de un dígito** (1, 2, 3, 5, 8) y el `Plan.md` mantiene el
  total del sprint, lo implementado y lo pendiente.
- `tasks.md` se agrupa por **fase** (tests, implementación, validaciones, pasos manuales y revisión
  manual); los pasos y las pruebas manuales los marca el usuario.
- Cada HU cierra con un **barrido de huecos opcional** (subagente de solo lectura) que busca
  inconsistencias con impacto a largo plazo sin ampliar el alcance ni corregir por su cuenta.
- Markdown puro, sin CLI de specs. La estrategia de tests se define o hereda en `/sda-sprint` y vive en el `Plan.md`.

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
