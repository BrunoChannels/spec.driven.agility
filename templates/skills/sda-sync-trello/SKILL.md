---
name: sda-sync-trello
description: Sincroniza el backlog de Spec-Driven Agility con un tablero Kanban de Trello. Configura credenciales y tablero la primera vez (API key, token y URL), sube las HUs del sprint como tarjetas con etiquetas de sprint, esfuerzo y fase, y actualiza la tarjeta de la HU en curso o la cierra tras /sda-end. Nunca commitea y nunca escribe en Trello sin confirmación.
disable-model-invocation: true
---

# Sincronizar con Trello (SDA)

Conectas el backlog local (`backlog/<sprint>/plan.md`) con un tablero Kanban de Trello. El backlog
sigue siendo la fuente de verdad; Trello es su espejo operativo.

**Nunca commitees.** **Nunca escribas en Trello sin un dry-run previo y mi confirmación explícita.**
El script vive en `.opencode/skills/sda-sync-trello/scripts/trello.mjs` y se invoca con `node`.

Usa siempre esta forma, desde la raíz del proyecto (si no estás ahí, añade `--root <ruta>`):

```bash
node .opencode/skills/sda-sync-trello/scripts/trello.mjs <comando> [opciones]
```

Sin `--apply`, todo comando de escritura es un dry-run.

## 0. Idioma

Responde en mi idioma y refleja el mismo tono que el resto de SDA: breve, concreto, sin ceremonia.

## 1. Preflight

1. Comprueba que existe `.opencode/skills/sda-sync-trello/scripts/trello.mjs`. Si no, avísame:
   reinstala con `sda update`.
2. Ejecuta `doctor` y lee la salida completa.
3. Clasifica el estado:
   - **Sin credenciales** → paso 2.
   - **Con credenciales y sin `.opencode/trello.json`** → paso 2 (solo el tablero).
   - **Todo configurado** → paso 3.

## 2. Configuración (solo la primera vez por máquina y por proyecto)

### 2.1 Credenciales (una vez por máquina, en `~/.sda/credentials.json`)

Pregunta **una cosa a la vez**, con la herramienta de preguntas cuando haya opciones:

1. **API key.** "Pega tu API key de Trello (la del panel de Power-Ups → API key)."
2. **Token.** Arma el link y pídeme que lo abra:
   `https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=SDA-Sync-Trello&key=<KEY>`
   Trello muestra el token una sola vez; pídemelo cuando lo tengas.
3. Guarda y valida de una vez:

```bash
node .opencode/skills/sda-sync-trello/scripts/trello.mjs login --key "<KEY>" --token "<TOKEN>" --apply
```

Si `login` falla, no escribas nada más: muestra el error, explica que la key y el token deben ser del
mismo usuario, y vuelve a pedirlos. Nunca imprimas el token completo en tu respuesta; usa la máscara
que devuelve el script.

### 2.2 Tablero (una vez por proyecto, en `.opencode/trello.json`)

1. Pídeme la URL del tablero Kanban (formato `https://trello.com/b/XXXX/nombre`).
2. Ejecuta `setup` **sin** `--apply` para descubrir las listas:

```bash
node .opencode/skills/sda-sync-trello/scripts/trello.mjs setup --board "<URL>"
```

3. Compara las listas detectadas con `Por Hacer`, `En proceso`, `En revisión`, `Finalizado`.
   - Si no calzan, propón el mapeo (`--todo "…" --doing "…" --review "…" --done "…"`) y confírmalo.
   - Si falta alguna lista, pregunta si la creo (`--create-missing-lists`) o si mapeo una existente.
     Nunca crees listas sin permiso.
4. Aplica y verifica:

```bash
node .opencode/skills/sda-sync-trello/scripts/trello.mjs setup --board "<URL>" [--create-missing-lists] --apply
node .opencode/skills/sda-sync-trello/scripts/trello.mjs doctor
```

`doctor` debe terminar en "Todo listo." Si no, detente y repórtalo.

## 3. Detecta el contexto de la sesión

Antes de preguntar nada, reúne evidencia:

```bash
node .opencode/skills/sda-sync-trello/scripts/trello.mjs state --json
```

y contrasta con lo que sabes de esta sesión de chat:

| Señal | Modo |
|---|---|
| Ejecuté `/sda-end` en esta sesión, o `spec.md` (en `HU_NN/` o en `archive/HU_NN/`) tiene `## Historial de finalización` con la fecha de hoy, o la HU está `[x]` y su tarjeta no está en *Finalizado* | **C — Cerrar HU** |
| Se trabajó una HU en esta sesión (`HU_NN/` tocada hoy, `tasks.md` con checks parciales, `git status`/rama con esa HU) | **B — HU en curso** |
| Ninguna señal de HU y el backlog no está en el tablero, o acabo de crear el tablero | **A — Subir backlog** |
| Solo quiero ver el estado | **D — Diagnóstico** |

Si hay más de una lectura posible, haz **una sola** pregunta con la candidata preseleccionada y las
otras opciones. No encadenes preguntas.

## 4. Modo A — Subir el backlog al tablero

1. `plan` para mostrar HUs, esfuerzo y total; adviérteme si el formato detectado es `numbered`
   (plan sin `**HU1**`), porque el esfuerzo y los `Requiere` pueden faltar.
2. `seed` sin `--apply` y presenta la tabla: **crear / actualizar / sin cambios**, con conteo.
3. Espera mi confirmación y ejecuta `seed --apply`.
4. Cierra con el resumen y los enlaces de las tarjetas creadas.

## 5. Modo B — Tarjeta de la HU en curso

1. Confirma la HU (solo si no es obvia; si lo es, dilo y sigue).
2. Ejecuta `sync-hu --hu HU<n>` sin flags para ver el estado actual de su tarjeta.
3. Pregunta **una sola vez**, con opciones múltiples, qué hago con la tarjeta:
   - mover a **En proceso**
   - mover a **En revisión**
   - sincronizar descripción (`--desc`)
   - checklist desde `tasks.md` (`--checklist`; solo fases 1–3, nunca marca pasos ni revisión manual)
   - añadir comentario (`--comment`)
   - añadir enlace de commit/PR (`--link`)
4. Dry-run con las flags elegidas, muestra el resultado y aplica con `--apply` tras mi OK.
5. Ofrece los extras del paso 8.

Transiciones sugeridas por el estado real, nunca inventadas:

| Evidencia | Sugerencia |
|---|---|
| `tasks.md` con 0 tareas hechas | *En proceso* |
| `tasks.md` completo en fases 1–3 y HU sin `[x]` | *En revisión* |
| HU `[x]` en el plan | *Finalizado* |

## 6. Modo C — Cierre (tras `/sda-end`)

1. Resuelve la carpeta real de la HU: `backlog/<sprint>/HU_NN/` o, tras el cierre de `/sda-end`,
   `backlog/<sprint>/archive/HU_NN/` (o `backlog/archive/<sprint>/archive/HU_NN/` si el sprint ya se
   archivó). Usa esa ruta en el comentario; no asumas la ubicación.
2. Verifica que `/sda-end` cerró bien: `spec.md` con `## Historial de finalización` de hoy y HU `[x]`.
   Si la HU no está `[x]`, **no** muevas la tarjeta: avísame y para.
3. Prepara el comentario de cierre con lo que ya existe en los artefactos, sin inventar:
   ```md
   **Cierre HU<n>** — <fecha>
   Spec: `<ruta real de spec.md>`
   Tests: <n> unitarios + <n> integración (según el historial del spec)
   Pendiente manual: <pasos de tasks.md sin marcar, o "ninguno">
   ```
4. Ejecuta el dry-run **sin checklist**:
   ```bash
   node .opencode/skills/sda-sync-trello/scripts/trello.mjs sync-hu --hu HU<n> --move done --desc --comment "<texto>" [--link "<PR>"]
   ```
   En modo cierre **nunca** se pasa `--checklist`: la tarjeta se sincroniza sin checklist. El
   checklist de `tasks.md` es opt-in y solo se agrega si lo pido explícitamente (modo B).
5. Marca la tarjeta como completada con `dueComplete=true` — el check de “Marcar como completada”.
   Moverla a *Finalizado* no alcanza. El script no expone este campo: usa
   `PUT https://api.trello.com/1/cards/{id}?dueComplete=true&key=<KEY>&token=<TOKEN>` con las
   credenciales de `~/.sda/credentials.json`, sin imprimir key ni token, y verifica con
   `GET /1/cards/{id}?fields=name,idList,dueComplete`.
6. Con mi OK, añade `--apply` al `sync-hu` y confirma que `dueComplete` quedó en `true`.
7. Pregunta si quiero archivar las tarjetas finalizadas del sprint (`archive-sprint`). Nunca lo hagas
   sin permiso.

## 7. Modo D — Diagnóstico

`state` (o `state --json`) y nada más. Útil cuando algo no calza: tarjetas duplicadas, listas
renombradas, HUs huérfanas.

## 8. Extras (pregunta al final, nunca automáticos)

Tras la acción principal, ofrece en una sola pregunta múltiple:

- **Comentario libre** en la tarjeta (`--comment`).
- **Enlace de commit o PR** (`--link`).
- **Fecha de vencimiento** (avisa que requiere `PUT /cards/{id}` con `due`; si no está soportado en el
  script, dilo en vez de improvisar).
- **Archivar tarjetas finalizadas** del sprint (`archive-sprint`).
- **Snapshot markdown** del estado (`snapshot --out backlog/<sprint>-trello.md --apply`).
- **Re-sembrar descripciones** de todo el sprint (`seed --apply`).

## Reglas duras

- **Un dry-run primero, siempre.** Sin mi OK no hay `--apply`.
- **Nunca borres** tarjetas, etiquetas ni listas. Archivar requiere confirmación aparte.
- **Nunca toques** el `plan.md`, `tasks.md`, `spec.md` ni `design.md` desde este comando: aquí solo se
  lee. Las marcas del backlog las hacen `/sda-build` y `/sda-end`.
- **Checklist opt-in:** en modo cierre (C) nunca se crea, actualiza ni marca un checklist. Nunca
  marques los pasos manuales ni la revisión manual en Trello.
- **Nunca imprimas** la API key ni el token; usa la máscara del script.
- **Nunca commitees.** Si hace falta sugerir un commit, sugiérelo sin ejecutarlo.
- Si el script devuelve `0 HUs detectadas`, **no asumas un backlog vacío**: revisa `--sprint` y el
  formato de `plan.md`, y repórtalo.

## Cierre

Mensaje breve con: modo usado, tarjetas tocadas (con enlace), y qué quedó pendiente. Sin preguntas
finales salvo la de extras del paso 8.
