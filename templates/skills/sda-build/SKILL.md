---
name: sda-build
description: Implementa una HU de punta a punta con TDD a nivel e2e: escribe el test según la config del proyecto, muestra rojo, implementa el mínimo y deja verde. Nunca commitea.
disable-model-invocation: true
---

# Build (SDA)

Una HU completa por sesión. El test e2e es la especificación; el código es lo mínimo que lo cumple.
Pasos grandes: **una HU = sus escenarios e2e en verde = una entrega**. No se para en cada caso.

## 1. Revisión

- Lee los artefactos de la HU: `backlog/<sprint>/HU_NN/{spec,design,tasks}.md`. Son el insumo
  esperado; si no están, pídemelos.
- Lee el `## Framework e2e` del `Plan.md`: framework, comando y directorio de tests. Si no está,
  avísame y lo decidimos antes de escribir tests.
- Contrasta el plan con el código actual. Si algo ya no encaja, dímelo antes de empezar.

## 2. Test e2e primero

- Escribe el/los test e2e **a partir de los escenarios de `spec.md`**, en el framework y directorio
  que diga el `Plan.md`.
- Cada escenario `DADO/CUANDO/ENTONCES` de la spec es el contrato: el test recorre el flujo completo
  del usuario, no fragmentos internos.
- Si la HU tiene sección **Validaciones obligatorias**, agrega los tests de **formato** (contenido
  exportado: celdas, moneda, fechas, encoding) y de **petición** (contrato del sync/API: payload,
  ids, idempotencia).
- **Corre y muestra rojo** una sola vez, antes de tocar código.
- Si los tests no se pueden escribir en el framework del proyecto sin agregar dependencias,
  **párate y conversa** (no agregues librerías en silencio).

## 3. Implementación de golpe

1. Implementa toda la HU hasta verde, sin paradas intermedias y sin sumar casos no declarados en la
   spec.
2. Corre los e2e y muestra verde.

## 4. Entrega

Un único mensaje de cierre:

```
✅ <HU_NN> verde: <n> escenarios e2e + <n> validaciones de formato/petición.
Piezas creadas:
1. `<nombre>` — <para qué sirve>. (`archivo:línea`)
2. ...
Manual: <qué hay que probar a mano, si queda algo>
Decidí: <juicio propio, si hubo>
¿Reviso contigo, ajusto algo o cierro con /sda-end?
```

- Listado ordenado y solo lo nuevo: nombre, para qué sirve, dónde vive.
- Sugiere mensaje de commit si es buen punto (funcionalidad y refactor en commits distintos).
  **Nunca commitees.**

## Parar solo si

- Aparece una decisión de diseño que no está en `design.md`.
- Se cuela algo no pedido, aunque parezca razonable.
- **Hay que tocar un test** existente: párate antes, avisa cuál, por qué y qué cambiará.
- **Hay que tocar funcionalidad preexistente**: evidéncialo (qué hace hoy, quién depende, qué se
  rompería) y muéstralo para conversar antes de tocarlo.
- Dos intentos sin verde.

## Reglas de test

- El valor esperado sale del escenario de `spec.md`, **nunca** de la misma lógica que el código.
- Se prueba el flujo del usuario por la interfaz pública (e2e), no detalles internos.
- Formato y peticiones se validan siempre que la HU toque exportación o datos.
- El framework y la ubicación los manda el `## Framework e2e` del `Plan.md`; no improvisar.
- **Cada test documentado** con una descripción encima que cite el escenario de la spec:

```js
// Escenario #01 — la tesorera crea una organización y la ve en la lista.
test('crear organización la muestra en la lista', async ({ page }) => { ... })
```

- No modificar tests existentes para que pase código nuevo: si hace falta, párate y conversa.
