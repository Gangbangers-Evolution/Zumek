# Zumek — Evaluación y arquitectura

Sep 25, 2026 · @Adrian robles

Este documento resume el análisis del Master Prompt original de Zumek y las decisiones tomadas durante la sesión de grilling. El Master Prompt optimizado (listo para un coding agent) está en la pestaña siguiente.

## Fortalezas y debilidades del documento original

**Fortalezas.** La vision de producto esta clara y es consistente consigo misma: el diferenciador (presupuesto primero, paquetes reales, reutilizacion de ingredientes) aparece en varias secciones sin contradecirse, y el rol de la IA (interpretacion, nunca fuente de verdad matematica) esta bien delimitado desde el inicio. La eleccion de stack (Expo + Supabase) es razonable para un hackathon multiplataforma.

**Debilidades.** El documento es 100% conceptual/producto. No define ni una tabla de base de datos, ni un contrato de API, ni la estructura de carpetas del monorepo, ni el algoritmo de optimizacion, ni como se autentica un usuario, ni donde corre el planner. Es una vision de producto solida pero no era ejecutable por un coding agent tal cual estaba.

**Redundancias.** Las secciones 1-4 y 9-11 repiten el mismo mensaje central (presupuesto primero, optimizar paquetes) desde angulos ligeramente distintos sin agregar informacion nueva; se consolidaron en un solo principio fundamental en el Master Prompt optimizado.

**Riesgo de alcance.** El documento original fija el MVP en 1-2 tiendas y 30-50 recetas (seccion 23), pero durante el grilling el alcance crecio (chat conversacional con IA, asistente de cocina, 3 tiendas en vez de 1-2). Esto se registro explicitamente en el roadmap final, separando MVP REQUIRED de POST-HACKATHON, para que el crecimiento de alcance no ponga en riesgo la entrega.

## Contradicciones detectadas y su resolucion

**IA sin secretos vs. planner sin backend.** El planner corre 100% en el cliente (sin servidor propio), pero el chat conversacional y el asistente de cocina necesitan llamar a un LLM con una API key que no puede vivir en el bundle de la app. Se resolvio con una Edge Function de Supabase que actua como proxy delgado solo para las llamadas al LLM; el planner determinista nunca pasa por ahi.

**Restriccion dura vs. motor heuristico.** La seccion 10 original exige detectar `status = infeasible` de forma tajante, pero eso solo es posible con un solver que prueba matematicamente la imposibilidad (ILP). Se eligio un planner greedy (mas rapido de construir y mas facil de explicar en demo), lo que obliga a suavizar la garantia: en vez de infeasible binario, el sistema usa niveles (`ok`, `over_budget_close`, `infeasible_likely`) sobre el mejor resultado de varios intentos con heuristicas distintas, dejando claro que nunca hay prueba formal de imposibilidad.

**Alcance de recetas vs. tiempo de hackathon.** Pedir 'bastantes recetas' entra en tension directa con la seccion 23 original (30-50 recetas como techo a proposito). Se mantuvo el techo de 30-50 recetas curadas a mano para el MVP, y cualquier expansion del catalogo se marco como POST-HACKATHON.

**Scraping en vivo vs. estabilidad de demo.** El documento asumia un worker de precios en vivo (secciones 15-16), pero correr Playwright contra sitios reales durante el MVP mete riesgo de bloqueo/cambio de HTML justo el dia de la demo. Se resolvio con un script de bootstrap desechable (una sola corrida supervisada, grabada en video para mostrar la funcionalidad) que llena un seed curado a mano; el worker de produccion real queda POST-HACKATHON.

## Riesgos y requisitos que faltaban

No estaban resueltos en el documento original y se cerraron durante el grilling:

| Area | Hueco original | Resolucion |
|---|---|---|
| Money | Sin definir tipo de dato ni moneda | Enteros en centavos, MXN fijo, en todas las capas |
| Unidades | Sin sistema de conversion | `mass_g` / `volume_ml` / `unit` + tabla coloquial-a-base |
| Persistencia | Sin schema | 10 tablas definidas (producto, plan, despensa, receta) |
| Snapshots | Mencionado pero sin mecanismo | `price_cents_snapshot` denormalizado en `plan_shopping_item` |
| Seguridad/RLS | Solo nombrada la tecnologia | Anonymous Auth + RLS real via `auth.uid()` |
| API boundaries | Sin definir donde corre el planner | Planner 100% cliente; Edge Function solo para IA |
| Concurrencia | No mencionada | Boton deshabilitado durante calculo; sin escritura parcial |
| Rate limiting / idempotencia | No mencionada | Rate limit por usuario en la Edge Function + UI deshabilitada |
| Testing | No mencionada | Vitest + 5 casos obligatorios sobre el planner |
| Datos demo | No mencionada | Fixtures en `packages/domain` con mismo shape que produccion |
| Accesibilidad/responsive | Solo en terminos vagos | Criterios verificables (360px, contraste 4.5:1, touch targets 44px) |
| Offline | No mencionada | Sin soporte offline en MVP, marcado explicitamente POST-HACKATHON |

Quedan documentados como POST-HACKATHON sin bloquear el MVP: versionado de contratos (`schema_version`), observabilidad/Sentry, y manejo fino de errores del LLM mas alla de un mensaje generico.

## Arquitectura final resumida

```
Cliente (Expo: web + iOS + Android)
  |-- fetch inicial completo a Supabase (recetas, productos, precios)
  |-- packages/planner (TypeScript puro, greedy con heuristicas)
  |-- packages/domain (tipos compartidos + fixtures)
  |-- Context+useReducer (estado de onboarding)
  |
  |-- llama --> Supabase (Postgres + Anonymous Auth + RLS)
  |                 fuente de verdad: productos, precios, planes, despensa
  |
  |-- llama --> Edge Function 'chat' (Supabase, Deno)
                    proxy delgado hacia el LLM (API key como secret)
                    5 tools cerradas de function calling
                    rate limiting por usuario

scripts/bootstrap-scraper (Playwright, desechable)
  corre 1 vez, supervisado --> JSON/CSV crudo --> revision humana --> seed.sql
  (el worker de produccion real, con scheduling y reintentos, es POST-HACKATHON)
```

**Principio que gobierna toda decision tecnica:** Postgres es la fuente de verdad de datos, el planner hace las matematicas de forma determinista, los workers alimentan precios, y la IA solo interpreta y explica, nunca calcula ni escribe directo a la base de datos.
