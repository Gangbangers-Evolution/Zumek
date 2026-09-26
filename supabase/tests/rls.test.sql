begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

-- Ninguna tabla de public sin RLS (se revisa como superusuario).
select is_empty(
  $$ select tablename from pg_tables where schemaname = 'public' and rowsecurity = false $$,
  'Todas las tablas de public tienen RLS'
);

-- Dos usuarios de prueba
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local');

-- Datos del usuario B (como superusuario, sin RLS). Las recetas y productos salen del seed.
insert into public.plan (id, user_id, budget_cents, total_cost_cents, status, people_count, days_count)
values ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 90000, 85000, 'ok', 2, 7);
insert into public.plan_meal (plan_id, day_index, meal_type, recipe_id)
values ('33333333-3333-3333-3333-333333333333', 0, 'comida', 'rec-tacos-de-pollo');
insert into public.pantry_inventory (user_id, canonical_product_id, remaining_quantity, unit)
values ('22222222-2222-2222-2222-222222222222', 'cp-pechuga-de-pollo', 500, 'mass_g');
insert into public.ai_call_log (user_id) values ('22222222-2222-2222-2222-222222222222');

-- A partir de aquí actuamos como el usuario A (invitado)
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","is_anonymous":true}';

-- plan
select is_empty(
  $$ select 1 from public.plan where id = '33333333-3333-3333-3333-333333333333' $$,
  'A no puede ver el plan de B'
);

select throws_ok(
  $$ insert into public.plan (user_id, budget_cents, total_cost_cents, status, people_count, days_count)
     values ('22222222-2222-2222-2222-222222222222', 90000, 0, 'ok', 1, 7) $$,
  '42501', null,
  'A no puede crear un plan con el user_id de B'
);

select lives_ok(
  $$ insert into public.plan (id, budget_cents, total_cost_cents, status, people_count, days_count)
     values ('44444444-4444-4444-4444-444444444444', 50000, 40000, 'ok', 1, 7) $$,
  'A puede crear su propio plan (user_id por default = auth.uid())'
);

-- plan_meal (a través del dueño del plan)
select is_empty(
  $$ select 1 from public.plan_meal where plan_id = '33333333-3333-3333-3333-333333333333' $$,
  'A no puede ver las comidas del plan de B'
);

select throws_ok(
  $$ insert into public.plan_meal (plan_id, day_index, meal_type, recipe_id)
     values ('33333333-3333-3333-3333-333333333333', 1, 'cena', 'rec-tacos-de-pollo') $$,
  '42501', null,
  'A no puede agregar comidas al plan de B'
);

-- despensa
select is_empty(
  $$ select 1 from public.pantry_inventory $$,
  'A no puede ver la despensa de B'
);

select throws_ok(
  $$ insert into public.pantry_inventory (user_id, canonical_product_id, remaining_quantity, unit)
     values ('22222222-2222-2222-2222-222222222222', 'cp-arroz', 100, 'mass_g') $$,
  '42501', null,
  'A no puede escribir en la despensa con el user_id de B'
);

-- ai_call_log
select lives_ok(
  $$ insert into public.ai_call_log default values $$,
  'A puede registrar su propia llamada'
);

select results_eq(
  $$ select count(*)::int from public.ai_call_log $$,
  $$ values (1) $$,
  'A solo ve sus propias llamadas'
);

select results_eq(
  $$ with d as (delete from public.ai_call_log returning 1) select count(*)::int from d $$,
  $$ values (0) $$,
  'A no puede borrar su historial de ai_call_log'
);

select results_eq(
  $$ with u as (update public.ai_call_log set created_at = now() - interval '1 hour' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$,
  'A no puede mover sus llamadas fuera de la ventana del límite'
);

-- catálogo
select isnt_empty(
  $$ select 1 from public.recipe $$,
  'El catálogo de recetas se puede leer'
);

select throws_ok(
  $$ insert into public.recipe (name, cuisine, meal_type, prep_time_minutes, servings_base)
     values ('Hackeada', 'X', '{comida}', 1, 1) $$,
  '42501', null,
  'A no puede escribir en el catálogo'
);

-- Sin sesión (rol anon) no se lee nada
set local role anon;
select is_empty(
  $$ select 1 from public.recipe $$,
  'anon no puede leer el catálogo'
);

select * from finish();
rollback;
