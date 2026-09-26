-- RLS en todas las tablas de public.
-- Los invitados (Anonymous Sign-In) usan el rol authenticated, por eso todo va "to authenticated".
-- anon no tiene ninguna politica: sin sesion no se lee nada.

-- ---------- Catalogo: solo lectura ----------
-- Sin politicas de insert, update ni delete: el catalogo solo se carga con seed.sql o migraciones.

alter table public.store enable row level security;
create policy "catalogo: lectura" on public.store
  for select to authenticated using (true);

alter table public.canonical_product enable row level security;
create policy "catalogo: lectura" on public.canonical_product
  for select to authenticated using (true);

alter table public.commercial_product enable row level security;
create policy "catalogo: lectura" on public.commercial_product
  for select to authenticated using (true);

alter table public.price_observation enable row level security;
create policy "catalogo: lectura" on public.price_observation
  for select to authenticated using (true);

alter table public.colloquial_unit enable row level security;
create policy "catalogo: lectura" on public.colloquial_unit
  for select to authenticated using (true);

alter table public.recipe enable row level security;
create policy "catalogo: lectura" on public.recipe
  for select to authenticated using (true);

alter table public.recipe_step enable row level security;
create policy "catalogo: lectura" on public.recipe_step
  for select to authenticated using (true);

alter table public.recipe_ingredient enable row level security;
create policy "catalogo: lectura" on public.recipe_ingredient
  for select to authenticated using (true);

-- ---------- plan: solo los del usuario ----------

alter table public.plan enable row level security;

create policy "plan: ver los míos" on public.plan
  for select to authenticated using (user_id = (select auth.uid()));
create policy "plan: crear los míos" on public.plan
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "plan: editar los míos" on public.plan
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "plan: borrar los míos" on public.plan
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------- Hijas del plan: a traves del dueño del plan ----------

alter table public.plan_meal enable row level security;

create policy "plan_meal: del dueño del plan" on public.plan_meal
  for all to authenticated
  using (exists (
    select 1 from public.plan p
    where p.id = plan_meal.plan_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.plan p
    where p.id = plan_meal.plan_id and p.user_id = (select auth.uid())
  ));

alter table public.plan_shopping_item enable row level security;

create policy "plan_shopping_item: del dueño del plan" on public.plan_shopping_item
  for all to authenticated
  using (exists (
    select 1 from public.plan p
    where p.id = plan_shopping_item.plan_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.plan p
    where p.id = plan_shopping_item.plan_id and p.user_id = (select auth.uid())
  ));

-- ---------- Despensa: solo la del usuario ----------

alter table public.pantry_inventory enable row level security;

create policy "despensa: ver la mía" on public.pantry_inventory
  for select to authenticated using (user_id = (select auth.uid()));
create policy "despensa: crear en la mía" on public.pantry_inventory
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "despensa: editar la mía" on public.pantry_inventory
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "despensa: borrar de la mía" on public.pantry_inventory
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------- ai_call_log: solo select e insert ----------
-- Sin update ni delete a proposito: si el usuario pudiera borrar su historial,
-- se saltaria el limite de 10 mensajes por minuto.

alter table public.ai_call_log enable row level security;

create policy "ai_call_log: ver las mías" on public.ai_call_log
  for select to authenticated using (user_id = (select auth.uid()));
create policy "ai_call_log: registrar las mías" on public.ai_call_log
  for insert to authenticated with check (user_id = (select auth.uid()));
