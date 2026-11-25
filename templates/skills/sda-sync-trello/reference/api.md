# Trello — referencia de la API usada

Todo pasa por `https://api.trello.com/1` con `key` y `token` como query params.

## Credenciales

La API exige **API key + token**. La key sola no autentica.

Link de autorización (sustituir `{KEY}`):

```
https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=SDA-Sync-Trello&key={KEY}
```

Trello muestra el token una sola vez; hay que copiarlo al terminar.

## Endpoints

| Uso | Método y ruta |
|---|---|
| Validar credenciales | `GET /members/me?fields=username,fullName` |
| Tablero + listas | `GET /boards/{id}?fields=id,name,url,shortLink&lists=open&list_fields=id,name,pos` |
| Listar tarjetas | `GET /boards/{id}/cards?fields=name,desc,idList,idLabels,closed&limit=1000` |
| Crear tarjeta | `POST /cards` → `{ idList, name, desc, pos, idLabels }` |
| Actualizar tarjeta | `PUT /cards/{id}` → `{ desc, idList, idLabels, closed }` |
| Comentar | `POST /cards/{id}/actions/comments` → `{ text }` |
| Listar etiquetas | `GET /boards/{id}/labels?fields=name,color&limit=1000` |
| Crear etiqueta | `POST /labels` → `{ idBoard, name, color }` |
| Recolorear etiqueta | `PUT /labels/{id}` → `{ color }` |
| Crear lista | `POST /lists` → `{ idBoard, name, pos }` |
| Checklists de la tarjeta | `GET /cards/{id}/checklists?fields=id,name&checkItem_fields=id,name,state` |
| Crear checklist | `POST /checklists` → `{ idCard, name }` |
| Añadir ítem | `POST /checklists/{id}/checkItems` → `{ name, checked, pos }` |
| Marcar ítem | `PUT /checklists/{id}/checkItem/{idItem}` → `{ state: "complete" \| "incomplete" }` |

## Límites y restricciones

- **Colores de etiqueta:** solo los 10 nombrados — `green`, `yellow`, `orange`, `red`, `purple`, `blue`, `sky`, `lime`, `pink`, `black`. No se acepta hex.
- **Descripción:** máximo 16 384 caracteres.
- **Rate limit:** ~100 escrituras / 10 s por token. El script espera 130 ms entre escrituras y reintenta con backoff ante `429`.
- **Borrado:** no hay endpoint de borrado de etiquetas por color ni de listas usado aquí; el script nunca borra, solo crea, actualiza, mueve y (opcionalmente) archiva con `closed: true`.
- **Archivar ≠ borrar:** una tarjeta archivada se puede recuperar desde la UI.

## Convenciones del script

- Las tarjetas se identifican por número de HU al inicio del nombre: `HU1 — …`, `HU-01 · …` y `HU_1` resuelven al mismo `HU1`.
- Nunca se asume el nombre de las listas: el mapeo se guarda en `.opencode/trello.json` durante `setup`.
- Toda escritura va precedida de un dry-run sin `--apply`.
