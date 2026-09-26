# 🍽️ Zumek

> Planea tu semana, aprovecha mejor tus ingredientes y mantén tus comidas dentro de tu presupuesto.

**Zumek** es una aplicación multiplataforma para planear comidas semanales tomando como punto de partida el **presupuesto disponible**.

A diferencia de un planificador tradicional que primero selecciona recetas y después calcula cuánto cuestan, Zumek busca construir un plan considerando desde el inicio el dinero disponible, los paquetes reales de los productos, los ingredientes que ya tiene el usuario y la posibilidad de reutilizarlos durante la semana.

El proyecto está diseñado para funcionar en **Web, Android e iOS** utilizando Expo y React Native.

---

## 💡 El problema

Planear las comidas de una semana puede parecer sencillo, pero normalmente implica resolver varias cosas al mismo tiempo:

- decidir qué cocinar;
- calcular cuánto costará;
- comparar productos;
- evitar comprar ingredientes que terminarán desperdiciándose;
- reutilizar lo que ya existe en la despensa;
- mantenerse dentro de un presupuesto.

La mayoría de las aplicaciones de recetas se enfocan primero en **qué cocinar**.

Zumek cambia el enfoque:

**primero el presupuesto, después el plan.**

---

## 🎯 Objetivo

Zumek busca generar un plan semanal de comidas que considere:

- presupuesto disponible;
- número de personas;
- preferencias de comida;
- recetas disponibles;
- ingredientes existentes en la despensa;
- precios reales de productos;
- tamaño de los paquetes disponibles;
- reutilización de ingredientes entre recetas.

El resultado debe incluir un plan de comidas y una lista de compras con el costo aproximado de realizarlo.

---

## ✨ Funciones principales

### 🥘 Planeador semanal

Genera una propuesta de comidas utilizando un motor determinista escrito en TypeScript.

El planner intenta encontrar una combinación de recetas que aproveche los ingredientes comprados y se acerque lo máximo posible al presupuesto establecido.

### 💰 Presupuesto primero

Todos los cálculos monetarios utilizan **MXN** y los valores se almacenan como enteros en centavos para evitar errores de precisión.

```ts
129.90 MXN → 12990
```

### 🛒 Lista de compras

El sistema calcula qué productos son necesarios para realizar las recetas seleccionadas y conserva el precio utilizado cuando se creó el plan.

Esto permite que un plan histórico continúe mostrando el costo con el que fue generado aunque posteriormente cambien los precios.

### 🧺 Despensa

Los ingredientes que el usuario ya posee pueden descontarse de las compras necesarias para el plan.

### 🤖 Asistente con IA

Zumek puede utilizar un modelo de lenguaje para ayudar al usuario a:

- explicar recetas;
- interpretar preferencias;
- responder preguntas sobre el plan;
- ayudar durante la preparación de alimentos;
- explicar decisiones realizadas por el sistema.

La IA **no realiza los cálculos del presupuesto ni modifica directamente la base de datos**.

---

# 🧠 Principio de arquitectura

Zumek separa claramente cuatro responsabilidades:

```text
PostgreSQL
    │
    ├── fuente de verdad de los datos
    │
    ▼
Planner determinista
    │
    ├── calcula recetas, cantidades y presupuesto
    │
    ▼
Aplicación
    │
    ├── presenta e interpreta los resultados
    │
    ▼
IA
    └── conversa, explica y ayuda al usuario
```

> **La IA interpreta. El planner calcula. PostgreSQL conserva la verdad.**

---

# 🏗️ Arquitectura

```text
                    ┌─────────────────────────────┐
                    │          Zumek App          │
                    │    Expo / React Native      │
                    │                             │
                    │  Web · Android · iOS        │
                    └──────────────┬──────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 │                                   │
                 ▼                                   ▼
       ┌───────────────────┐              ┌────────────────────┐
       │ packages/planner  │              │     Supabase       │
       │                   │              │                    │
       │ TypeScript puro   │              │ PostgreSQL         │
       │ Planner greedy    │              │ Anonymous Auth     │
       │ Heurísticas       │              │ RLS                │
       └───────────────────┘              └──────────┬─────────┘
                                                    │
                                                    ▼
                                          ┌───────────────────┐
                                          │   Edge Function   │
                                          │      `chat`       │
                                          │                   │
                                          │ Proxy hacia LLM   │
                                          └───────────────────┘


scripts/bootstrap-scraper
        │
        ▼
    Playwright
        │
        ▼
   JSON / CSV
        │
        ▼
  Revisión humana
        │
        ▼
     seed.sql
```

---

# 🧰 Stack tecnológico

| Área | Tecnología |
|---|---|
| Aplicación | React Native |
| Framework | Expo |
| Lenguaje | TypeScript |
| Web | Expo Web |
| Base de datos | PostgreSQL |
| Backend | Supabase |
| Autenticación | Supabase Anonymous Auth |
| Seguridad | Row Level Security |
| Planner | TypeScript puro |
| Estado | Context + `useReducer` |
| IA | LLM mediante Supabase Edge Function |
| Edge Functions | Deno |
| Scraping inicial | Playwright |
| Testing | Vitest |

---

# 📐 Planner

El núcleo de Zumek es independiente de la interfaz y de la IA.

El planner recibe información como:

```text
Presupuesto
Personas
Días
Preferencias
Recetas
Productos
Precios
Despensa
```

y genera:

```text
Plan semanal
Lista de compras
Costo estimado
Ingredientes reutilizados
Ingredientes sobrantes
Estado del presupuesto
```

Para el MVP se utiliza un algoritmo **greedy con múltiples heurísticas**.

Debido a que no se utiliza un solver matemático como ILP, Zumek no afirma matemáticamente que un plan sea imposible.

Los posibles resultados son:

```ts
"ok"
"over_budget_close"
"infeasible_likely"
```

---

# 💵 Manejo del dinero

Todos los valores monetarios se manejan como enteros en centavos.

```ts
type MoneyCents = number;
```

Ejemplo:

```ts
const price = 12990;
// $129.90 MXN
```

Esto evita errores de punto flotante durante los cálculos del planner.

La moneda del MVP es:

```text
MXN 🇲🇽
```

---

# ⚖️ Sistema de unidades

Zumek normaliza las cantidades de ingredientes utilizando tres unidades base:

```text
mass_g
volume_ml
unit
```

Ejemplos:

```text
1 kg  → 1000 mass_g
500 g → 500 mass_g
1 L   → 1000 volume_ml
2 latas → 2 unit
```

Las expresiones utilizadas normalmente en recetas se convierten a estas unidades antes de realizar cálculos.

---

# 🔐 Seguridad

Zumek utiliza Supabase Authentication y Row Level Security.

Para el MVP se utiliza **Anonymous Auth**, permitiendo que cada instalación tenga un usuario identificado sin obligarlo a crear una cuenta inmediatamente.

Las políticas RLS utilizan:

```sql
auth.uid()
```

para evitar que un usuario pueda acceder a información perteneciente a otro usuario.

Las claves privadas de servicios externos nunca se incluyen dentro del bundle de la aplicación.

---

# 🤖 IA

Las llamadas al modelo de lenguaje pasan por:

```text
App
 ↓
Supabase Edge Function
 ↓
LLM
```

La API key únicamente existe como secreto del servidor.

La IA tiene acceso a un conjunto limitado de herramientas y no puede ejecutar consultas arbitrarias contra PostgreSQL.

---

# 🧪 Testing

El planner se prueba independientemente de React Native.

```bash
npm test
```

Para el MVP se utilizan pruebas con **Vitest**, incluyendo como mínimo escenarios relacionados con:

```text
Plan dentro del presupuesto
Plan ligeramente superior al presupuesto
Presupuesto insuficiente
Reutilización de ingredientes
Ingredientes disponibles en despensa
```

---

# 📱 Compatibilidad

Zumek está diseñado para funcionar desde una misma base de código en:

```text
🌐 Web
🤖 Android
🍎 iOS
```

La interfaz contempla como mínimo:

- pantallas desde 360 px;
- objetivos táctiles de al menos 44 px;
- contraste mínimo de 4.5:1;
- diseño responsive.

---

# 🚧 Estado del proyecto

**Estado actual: en desarrollo / MVP de hackathon.**

El objetivo inmediato es construir una versión demostrable que valide el concepto central:

> Crear un plan de comidas útil partiendo de un presupuesto real.

---

# ✅ MVP

El MVP se concentra en:

- onboarding básico;
- presupuesto semanal;
- selección de preferencias;
- 30–50 recetas curadas;
- catálogo controlado de productos;
- precios iniciales de tiendas seleccionadas;
- despensa;
- planner determinista;
- lista de compras;
- almacenamiento de planes;
- chat asistido por IA;
- funcionamiento Web / Android / iOS.

---

# 🔮 Después del hackathon

La arquitectura está preparada para evolucionar posteriormente hacia funciones como:

- mayor catálogo de recetas;
- más supermercados;
- actualización automática de precios;
- workers programados;
- reintentos y tolerancia a fallos;
- historial avanzado;
- cuentas permanentes;
- sincronización entre dispositivos;
- observabilidad;
- Sentry;
- soporte offline;
- versionado de contratos;
- optimización matemática más avanzada.

---

# 🕷️ Precios y scraping

Durante el MVP no se depende de scraping en tiempo real.

El flujo inicial es:

```text
Playwright
   ↓
Extracción supervisada
   ↓
JSON / CSV
   ↓
Revisión humana
   ↓
seed.sql
   ↓
Supabase
```

Esto evita que un cambio en el HTML de una tienda pueda romper la demostración.

Un sistema de actualización automática de precios se considera una evolución posterior.

---

# 📂 Estructura del proyecto

La estructura definitiva se irá documentando conforme avance la implementación.

Una organización inicial prevista es:

```text
zumek/
│
├── apps/
│   └── mobile/
│
├── packages/
│   ├── domain/
│   └── planner/
│
├── supabase/
│   ├── functions/
│   │   └── chat/
│   └── migrations/
│
├── scripts/
│   └── bootstrap-scraper/
│
├── docs/
│
├── README.md
└── package.json
```

---

# 🧭 Roadmap

### Fase 1 — Fundamentos

```text
Arquitectura
Modelo de dominio
Schema de PostgreSQL
Fixtures
Configuración de Expo
```

### Fase 2 — Planner

```text
Normalización de ingredientes
Cálculo de paquetes
Despensa
Presupuesto
Heurísticas
Testing
```

### Fase 3 — Aplicación

```text
Onboarding
Preferencias
Generación de plan
Vista semanal
Lista de compras
Persistencia
```

### Fase 4 — IA

```text
Edge Function
Function calling
Chat
Asistente de cocina
Rate limiting
```

### Fase 5 — Demo

```text
Datos curados
Precios
Pruebas end-to-end
Responsive
Corrección de errores
Preparación de presentación
```

---

# 📚 Documentación

Las decisiones técnicas y de producto se documentan dentro de:

```text
/docs
```

La documentación detallada incluye:

```text
Arquitectura
Modelo de datos
Decisiones técnicas
Planner
Contratos
Seguridad
Roadmap
```

---

# 🌱 Filosofía del proyecto

Zumek intenta mantener una separación clara entre datos, cálculos e inteligencia artificial.

```text
PostgreSQL → recuerda
Planner    → calcula
IA         → interpreta
Usuario    → decide
```

El objetivo no es utilizar IA para todo.

El objetivo es utilizar cada herramienta para aquello que hace mejor.

---

<p align="center">
  <strong>Zumek</strong><br>
  Planea mejor. Compra mejor. Aprovecha mejor.
</p>
