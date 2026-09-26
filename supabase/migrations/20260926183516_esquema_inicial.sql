-- Esquema inicial de Zumek (seccion 3 del Master Prompt, tal como la refleja packages/domain).
-- Columnas en snake_case igual que los tipos de @zumek/domain.
-- Dinero: siempre integer en centavos MXN. Cantidades: en unidad base (mass_g, volume_ml, unit).
-- Ids: text con default uuid, para aceptar tanto los ids de los fixtures ('cp-pollo')
-- como los que genera la base cuando el insert no trae id (bootstrap-scraper).

create type public.unit_type as enum ('mass_g', 'volume_ml', 'unit');
create type public.meal_type as enum ('desayuno', 'comida', 'cena', 'snack');
create type public.plan_status as enum ('ok', 'over_budget_close', 'infeasible_likely');

-- ---------- Catalogo (publico, solo lectura para la app) ----------

create table public.store (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  slug text not null unique,
  active boolean not null default true
);

-- Producto conceptual: el que usan las recetas. El nombre es la llave natural del scraper.
create table public.canonical_product (
  id text primary key default gen_random_uuid()::text,
  name text not null unique,
  unit_type public.unit_type not null,
  category text not null
);

-- Producto comercial: un paquete real de una tienda.
create table public.commercial_product (
  id text primary key default gen_random_uuid()::text,
  canonical_product_id text not null references public.canonical_product(id) on delete cascade,
  store_id text not null references public.store(id) on delete cascade,
  brand text,
  package_label text not null,
  package_quantity numeric not null check (package_quantity > 0),
  package_unit public.unit_type not null,
  unique (store_id, package_label)
);
create index commercial_product_canonical_idx on public.commercial_product (canonical_product_id);

-- INSERT-only: cada precio nuevo es una fila nueva, nunca se actualiza.
create table public.price_observation (
  id text primary key default gen_random_uuid()::text,
  commercial_product_id text not null references public.commercial_product(id) on delete cascade,
  price_cents integer not null check (price_cents >= 0),
  observed_at timestamptz not null default now()
);
create index price_observation_product_time_idx
  on public.price_observation (commercial_product_id, observed_at desc);

-- Tabla coloquial -> unidad base ('taza' = 240 volume_ml).
create table public.colloquial_unit (
  term text primary key,
  base_quantity numeric not null check (base_quantity > 0),
  base_unit public.unit_type not null check (base_unit <> 'unit')
);

create table public.recipe (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  cuisine text not null,
  meal_type public.meal_type[] not null check (cardinality(meal_type) > 0),
  tags text[] not null default '{}',
  prep_time_minutes integer not null check (prep_time_minutes >= 0),
  servings_base integer not null check (servings_base > 0),
  -- Restriccion DURA para el planner.
  allergens text[] not null default '{}'
);

create table public.recipe_step (
  id text primary key default gen_random_uuid()::text,
  recipe_id text not null references public.recipe(id) on delete cascade,
  step_order integer not null check (step_order >= 1),
  title text not null,
  content text not null,
  timer_seconds integer check (timer_seconds > 0),
  unique (recipe_id, step_order)
);

-- Siempre a canonical_product, nunca a commercial_product.
create table public.recipe_ingredient (
  id text primary key default gen_random_uuid()::text,
  recipe_id text not null references public.recipe(id) on delete cascade,
  canonical_product_id text not null references public.canonical_product(id),
  quantity numeric not null check (quantity > 0),
  unit public.unit_type not null
);
create index recipe_ingredient_recipe_idx on public.recipe_ingredient (recipe_id);
create index recipe_ingredient_canonical_idx on public.recipe_ingredient (canonical_product_id);

-- Precio mas reciente por producto comercial (Catalog.latest_prices).
-- security_invoker: la vista respeta el RLS de quien consulta.
create view public.latest_price
with (security_invoker = true) as
select distinct on (commercial_product_id) id, commercial_product_id, price_cents, observed_at
from public.price_observation
order by commercial_product_id, observed_at desc;

-- ---------- Datos del usuario ----------

create table public.plan (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  budget_cents integer not null check (budget_cents > 0),
  total_cost_cents integer not null check (total_cost_cents >= 0),
  status public.plan_status not null,
  people_count integer not null check (people_count > 0),
  days_count integer not null check (days_count between 1 and 7),
  -- Ids de store; sin FK porque es un arreglo.
  stores_selected text[] not null default '{}',
  -- Slider ahorro <-> conveniencia, no es dinero.
  savings_weight numeric not null default 0.5 check (savings_weight between 0 and 1),
  created_at timestamptz not null default now()
);
create index plan_user_idx on public.plan (user_id, created_at desc);

create table public.plan_meal (
  id text primary key default gen_random_uuid()::text,
  plan_id text not null references public.plan(id) on delete cascade,
  day_index integer not null check (day_index between 0 and 6),
  meal_type public.meal_type not null,
  recipe_id text not null references public.recipe(id),
  unique (plan_id, day_index, meal_type)
);
create index plan_meal_recipe_idx on public.plan_meal (recipe_id);

create table public.plan_shopping_item (
  id text primary key default gen_random_uuid()::text,
  plan_id text not null references public.plan(id) on delete cascade,
  commercial_product_id text not null references public.commercial_product(id),
  quantity_packages integer not null check (quantity_packages > 0),
  -- Copia del precio al crear el plan, nunca FK a price_observation.
  price_cents_snapshot integer not null check (price_cents_snapshot >= 0),
  -- Copiado tambien, redundante a proposito.
  store_id text not null references public.store(id)
);
create index plan_shopping_item_plan_idx on public.plan_shopping_item (plan_id);
create index plan_shopping_item_product_idx on public.plan_shopping_item (commercial_product_id);
create index plan_shopping_item_store_idx on public.plan_shopping_item (store_id);

-- Una fila por usuario e ingrediente; al cerrar un plan se suma sobre ella.
create table public.pantry_inventory (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  canonical_product_id text not null references public.canonical_product(id),
  remaining_quantity numeric not null check (remaining_quantity >= 0),
  unit public.unit_type not null,
  source_plan_id text references public.plan(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (user_id, canonical_product_id)
);
create index pantry_inventory_canonical_idx on public.pantry_inventory (canonical_product_id);
create index pantry_inventory_source_plan_idx on public.pantry_inventory (source_plan_id);

-- Rate limiting del chat: 10 llamadas por minuto por usuario.
create table public.ai_call_log (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index ai_call_log_user_time on public.ai_call_log (user_id, created_at);
