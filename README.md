# Spec-Driven Agility (SDA)

CLI que instala la metodología **Spec-Driven Agility** en cualquier proyecto con [opencode](https://opencode.ai):
backlog ágil de historias de usuario, artefactos por HU y **test e2e obligatorio**.

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
.opencode/commands/sda-*.md     ← 5 comandos: /sda-sprint, /sda-explore, /sda-spec, /sda-build, /sda-end
.opencode/skills/sda-*/SKILL.md ← 5 skills con las reglas y plantillas
Backlog/                        ← backlog de sprints (se llena con /sda-sprint)
specs/                          ← historia de specs viva (la mantiene /sda-end)
```

Después ejecuta `/sda-sprint` en opencode: ahí se define (o se hereda de un sprint anterior) el framework e2e y queda guardado en el `Plan.md`.

### Actualizar la metodología

```bash
sda update
```

Re-sincroniza comandos y skills. No toca `Backlog/` ni `specs/`.

## Comandos

| Comando | Qué hace |
|---|---|
| `/sda-sprint` | Crea/actualiza el backlog y define/hereda el framework e2e (guardado en `Plan.md`). |
| `/sda-explore` | Indaga código + specs vivas + framework e2e y acuerda el enfoque de una HU. |
| `/sda-spec` | Escribe `spec.md` (escenarios e2e), `design.md` y `tasks.md` de una HU. |
| `/sda-build` | Implementa con TDD e2e: test → rojo → verde. |
| `/sda-end` | Valida, sincroniza specs vivas, marca la HU y archiva el sprint. |

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
ENTER. En CI o scripts se omite sola; también puedes forzarlo con `sda init --no-animation`.

## Filosofía

- La fuente de verdad es un **Backlog de Sprint** con historias modificables y descartables.
- Cada HU recorre: **explorar → especificar → construir (e2e primero) → cerrar y sincronizar**.
- Queda una **historia de specs viva** (`specs/`) que el agente consulta en cada exploración.
- **Test e2e obligatorio** para proteger el flujo del usuario; exportación/datos exige validar
  **formato** y **peticiones**.
- Markdown puro, sin CLI de specs. El framework e2e se define o hereda en `/sda-sprint` y vive en el `Plan.md`.

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
