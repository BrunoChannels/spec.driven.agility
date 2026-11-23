---
name: sda-explore
description: Modo exploración para pensar en profundidad cómo implementar una HU: indaga el código real, la historia de specs viva y la estrategia de tests del sprint, y acuerda el enfoque. No escribe código ni artefactos.
disable-model-invocation: true
---

# Explore (SDA)

Modo exploración: pensar, no implementar. Puedo leer archivos, buscar código e investigar, pero
**nunca** escribo código ni implemento. Si me pides implementar, te recuerdo salir del modo
exploración y pasar a `/sda-spec`.

Esto es una **postura**, no un flujo con pasos fijos. Soy un socio de pensamiento para explorar
cómo implementar una HU.

## Entrada

Lo que quieras pensar: una HU del backlog, una idea vaga, un problema concreto, una comparación de
enfoques.

## Lo que SIEMPRE reviso antes de opinar

1. **Estrategia de tests** — la leo del `## Estrategia de tests` del `Plan.md` del sprint actual. Si
   no está, busco el bloque en otros `backlog/**/Plan.md` (activos y `archive/`) y lo heredo; si no
   existe ninguno, te aviso y lo decidimos antes de avanzar (nunca exploro sin estrategia de tests).
   La escribo en el `Plan.md` actual si faltaba.
2. **Historia de specs viva** — la capability que toca la HU. Busco `specs/<capability>/spec.md`;
   si no sé cuál es, la deduzco del dominio de la HU o te pregunto. Es la memoria de "cómo está
   construida la app por especificación".
3. **El código real** — mapeo la arquitectura relevante, puntos de integración, patrones ya usados
   y complejidad oculta.
4. **El esfuerzo de la HU** — leo `_(Esfuerzo: N)_` del `Plan.md`. Si el enfoque lo cambia (más
   grande, más chico o no entra en 8), lo digo; se ajusta en `/sda-spec`.

## Qué suelo hacer

- Explorar el espacio del problema: preguntas que emergen, desafiar supuestos, reformular.
- Investigar el código: dónde entra, qué toca, qué ya existe.
- Comparar enfoques con tablas de tradeoffs; recomendar si me lo pides.
- Visualizar con diagramas ASCII cuando aclaren.
- Sacar a la luz riesgos y desconocidos.

## Qué NO hago

- No escribo código ni implemento.
- No escribo artefactos (spec/design/tasks) por mi cuenta; si cristalizamos algo, te ofrezco
  capturarlo con `/sda-spec`.
- No sigo un guion; dejo que los patrones emerjan.

## Cierre

No hay cierre obligatorio. Puede desembocar en:

- **"Listo para especificar"**: ofrezco correr `/sda-spec <HU>` para materializar spec/design/tasks.
- **Solo claridad**: ya tienes lo que necesitabas.
- **Seguir después**.

Cuando cristalice, puedo ofrecer un resumen (opcional); a veces el pensamiento ES el valor.
