-- GENERADO por packages/catalog-data (pnpm seed). No editar a mano:
-- corregir los JSON de packages/catalog-data/data, validar y volver a generar.
-- Incluye los precios DE EJEMPLO (sample-prices.json); los reales llegan con el seed del scraper.

insert into public.store (id, name, slug, active) values
  ('store-alsuper', 'Alsuper', 'alsuper', true),
  ('store-walmart', 'Walmart', 'walmart', true),
  ('store-soriana', 'Soriana', 'soriana', true)
on conflict do nothing;

insert into public.canonical_product (id, name, unit_type, category, allergens) values
  ('cp-pechuga-de-pollo', 'Pechuga de pollo', 'mass_g', 'proteina', '{}'),
  ('cp-huevo', 'Huevo', 'unit', 'proteina', '{"huevo"}'),
  ('cp-frijol-pinto', 'Frijol pinto', 'mass_g', 'grano', '{}'),
  ('cp-arroz', 'Arroz', 'mass_g', 'grano', '{}'),
  ('cp-pasta-spaghetti', 'Pasta spaghetti', 'mass_g', 'grano', '{"gluten"}'),
  ('cp-avena', 'Avena', 'mass_g', 'grano', '{"gluten"}'),
  ('cp-tortilla-de-maiz', 'Tortilla de maíz', 'mass_g', 'grano', '{}'),
  ('cp-jitomate', 'Jitomate', 'mass_g', 'verdura', '{}'),
  ('cp-cebolla-blanca', 'Cebolla blanca', 'unit', 'verdura', '{}'),
  ('cp-ajo-dientes', 'Ajo (dientes)', 'unit', 'verdura', '{}'),
  ('cp-chile-serrano', 'Chile serrano', 'unit', 'verdura', '{}'),
  ('cp-cilantro', 'Cilantro', 'mass_g', 'verdura', '{}'),
  ('cp-platano', 'Plátano', 'unit', 'fruta', '{}'),
  ('cp-leche-entera', 'Leche entera', 'volume_ml', 'lacteo', '{"lácteos"}'),
  ('cp-queso-fresco', 'Queso fresco', 'mass_g', 'lacteo', '{"lácteos"}'),
  ('cp-crema', 'Crema', 'volume_ml', 'lacteo', '{"lácteos"}'),
  ('cp-aceite-vegetal', 'Aceite vegetal', 'volume_ml', 'despensa', '{}'),
  ('cp-sal', 'Sal', 'mass_g', 'despensa', '{}')
on conflict do nothing;

insert into public.colloquial_unit (term, base_quantity, base_unit) values
  ('pizca', 1, 'mass_g'),
  ('cucharadita', 5, 'volume_ml'),
  ('cucharada', 15, 'volume_ml'),
  ('taza', 240, 'volume_ml')
on conflict do nothing;

insert into public.recipe (id, name, cuisine, meal_type, tags, prep_time_minutes, servings_base, allergens) values
  ('rec-tacos-de-pollo', 'Tacos de pollo', 'Mexicana', '{"comida","cena"}', '{"rápida","alta en proteína"}', 25, 4, '{}'),
  ('rec-arroz-con-pollo', 'Arroz con pollo', 'Mexicana', '{"comida"}', '{"alta en proteína"}', 45, 4, '{}'),
  ('rec-huevos-a-la-mexicana', 'Huevos a la mexicana', 'Mexicana', '{"desayuno","cena"}', '{"rápida","económica"}', 15, 2, '{"huevo"}'),
  ('rec-spaghetti-con-jitomate', 'Spaghetti con jitomate', 'Italiana', '{"comida","cena"}', '{"económica"}', 30, 4, '{"gluten","lácteos"}'),
  ('rec-enfrijoladas', 'Enfrijoladas', 'Mexicana', '{"comida","cena"}', '{"económica"}', 35, 4, '{"lácteos"}'),
  ('rec-avena-con-platano', 'Avena con plátano', 'Mexicana', '{"desayuno"}', '{"rápida","económica"}', 10, 2, '{"gluten","lácteos"}')
on conflict do nothing;

insert into public.recipe_step (id, recipe_id, step_order, title, content, timer_seconds) values
  ('rec-tacos-de-pollo-step-1', 'rec-tacos-de-pollo', 1, 'Cocer el pollo', 'Pon la pechuga en una olla con agua y sal. Deja hervir a fuego medio.', 900),
  ('rec-tacos-de-pollo-step-2', 'rec-tacos-de-pollo', 2, 'Deshebrar', 'Saca el pollo, deja que se enfríe un poco y deshébralo con dos tenedores.', null),
  ('rec-tacos-de-pollo-step-3', 'rec-tacos-de-pollo', 3, 'Picar', 'Pica la cebolla y el cilantro finamente.', null),
  ('rec-tacos-de-pollo-step-4', 'rec-tacos-de-pollo', 4, 'Calentar tortillas', 'Calienta las tortillas en un comal con un poco de aceite y arma los tacos.', 120),
  ('rec-arroz-con-pollo-step-1', 'rec-arroz-con-pollo', 1, 'Dorar el arroz', 'Calienta el aceite y dora el arroz hasta que se vea transparente.', 300),
  ('rec-arroz-con-pollo-step-2', 'rec-arroz-con-pollo', 2, 'Licuar', 'Licúa el jitomate con la cebolla, el ajo y una taza de agua.', null),
  ('rec-arroz-con-pollo-step-3', 'rec-arroz-con-pollo', 3, 'Cocer', 'Agrega el licuado, el pollo en trozos y sal. Tapa y cocina a fuego bajo.', 1500),
  ('rec-arroz-con-pollo-step-4', 'rec-arroz-con-pollo', 4, 'Reposar', 'Apaga el fuego y deja reposar tapado antes de servir.', 300),
  ('rec-huevos-a-la-mexicana-step-1', 'rec-huevos-a-la-mexicana', 1, 'Picar', 'Pica el jitomate, la cebolla y el chile serrano.', null),
  ('rec-huevos-a-la-mexicana-step-2', 'rec-huevos-a-la-mexicana', 2, 'Sofreír', 'Sofríe la verdura en aceite caliente.', 180),
  ('rec-huevos-a-la-mexicana-step-3', 'rec-huevos-a-la-mexicana', 3, 'Agregar huevo', 'Agrega los huevos batidos con sal y mueve hasta que cuajen.', 240),
  ('rec-spaghetti-con-jitomate-step-1', 'rec-spaghetti-con-jitomate', 1, 'Cocer la pasta', 'Hierve agua con sal y cuece la pasta.', 600),
  ('rec-spaghetti-con-jitomate-step-2', 'rec-spaghetti-con-jitomate', 2, 'Salsa', 'Sofríe el ajo en aceite, agrega el jitomate picado y cocina hasta que espese.', 600),
  ('rec-spaghetti-con-jitomate-step-3', 'rec-spaghetti-con-jitomate', 3, 'Servir', 'Mezcla la pasta con la salsa y sirve con queso desmoronado.', null),
  ('rec-enfrijoladas-step-1', 'rec-enfrijoladas', 1, 'Licuar frijoles', 'Licúa los frijoles cocidos con un poco de su caldo y cebolla.', null),
  ('rec-enfrijoladas-step-2', 'rec-enfrijoladas', 2, 'Calentar salsa', 'Calienta el licuado en una olla con sal hasta que hierva.', 300),
  ('rec-enfrijoladas-step-3', 'rec-enfrijoladas', 3, 'Pasar tortillas', 'Pasa las tortillas por aceite caliente y luego por la salsa de frijol.', null),
  ('rec-enfrijoladas-step-4', 'rec-enfrijoladas', 4, 'Servir', 'Dobla las tortillas y sirve con crema y queso.', null),
  ('rec-avena-con-platano-step-1', 'rec-avena-con-platano', 1, 'Hervir', 'Calienta la leche con la avena a fuego medio moviendo seguido.', 420),
  ('rec-avena-con-platano-step-2', 'rec-avena-con-platano', 2, 'Servir', 'Sirve y agrega el plátano en rodajas.', null)
on conflict do nothing;

insert into public.recipe_ingredient (id, recipe_id, canonical_product_id, quantity, unit) values
  ('rec-tacos-de-pollo-cp-pechuga-de-pollo', 'rec-tacos-de-pollo', 'cp-pechuga-de-pollo', 500, 'mass_g'),
  ('rec-tacos-de-pollo-cp-tortilla-de-maiz', 'rec-tacos-de-pollo', 'cp-tortilla-de-maiz', 400, 'mass_g'),
  ('rec-tacos-de-pollo-cp-cebolla-blanca', 'rec-tacos-de-pollo', 'cp-cebolla-blanca', 1, 'unit'),
  ('rec-tacos-de-pollo-cp-cilantro', 'rec-tacos-de-pollo', 'cp-cilantro', 20, 'mass_g'),
  ('rec-tacos-de-pollo-cp-aceite-vegetal', 'rec-tacos-de-pollo', 'cp-aceite-vegetal', 15, 'volume_ml'),
  ('rec-tacos-de-pollo-cp-sal', 'rec-tacos-de-pollo', 'cp-sal', 2, 'mass_g'),
  ('rec-arroz-con-pollo-cp-pechuga-de-pollo', 'rec-arroz-con-pollo', 'cp-pechuga-de-pollo', 400, 'mass_g'),
  ('rec-arroz-con-pollo-cp-arroz', 'rec-arroz-con-pollo', 'cp-arroz', 300, 'mass_g'),
  ('rec-arroz-con-pollo-cp-jitomate', 'rec-arroz-con-pollo', 'cp-jitomate', 250, 'mass_g'),
  ('rec-arroz-con-pollo-cp-cebolla-blanca', 'rec-arroz-con-pollo', 'cp-cebolla-blanca', 1, 'unit'),
  ('rec-arroz-con-pollo-cp-ajo-dientes', 'rec-arroz-con-pollo', 'cp-ajo-dientes', 2, 'unit'),
  ('rec-arroz-con-pollo-cp-aceite-vegetal', 'rec-arroz-con-pollo', 'cp-aceite-vegetal', 30, 'volume_ml'),
  ('rec-arroz-con-pollo-cp-sal', 'rec-arroz-con-pollo', 'cp-sal', 3, 'mass_g'),
  ('rec-huevos-a-la-mexicana-cp-huevo', 'rec-huevos-a-la-mexicana', 'cp-huevo', 4, 'unit'),
  ('rec-huevos-a-la-mexicana-cp-jitomate', 'rec-huevos-a-la-mexicana', 'cp-jitomate', 150, 'mass_g'),
  ('rec-huevos-a-la-mexicana-cp-cebolla-blanca', 'rec-huevos-a-la-mexicana', 'cp-cebolla-blanca', 0.5, 'unit'),
  ('rec-huevos-a-la-mexicana-cp-chile-serrano', 'rec-huevos-a-la-mexicana', 'cp-chile-serrano', 1, 'unit'),
  ('rec-huevos-a-la-mexicana-cp-aceite-vegetal', 'rec-huevos-a-la-mexicana', 'cp-aceite-vegetal', 10, 'volume_ml'),
  ('rec-huevos-a-la-mexicana-cp-sal', 'rec-huevos-a-la-mexicana', 'cp-sal', 1, 'mass_g'),
  ('rec-spaghetti-con-jitomate-cp-pasta-spaghetti', 'rec-spaghetti-con-jitomate', 'cp-pasta-spaghetti', 400, 'mass_g'),
  ('rec-spaghetti-con-jitomate-cp-jitomate', 'rec-spaghetti-con-jitomate', 'cp-jitomate', 500, 'mass_g'),
  ('rec-spaghetti-con-jitomate-cp-ajo-dientes', 'rec-spaghetti-con-jitomate', 'cp-ajo-dientes', 2, 'unit'),
  ('rec-spaghetti-con-jitomate-cp-aceite-vegetal', 'rec-spaghetti-con-jitomate', 'cp-aceite-vegetal', 30, 'volume_ml'),
  ('rec-spaghetti-con-jitomate-cp-sal', 'rec-spaghetti-con-jitomate', 'cp-sal', 3, 'mass_g'),
  ('rec-spaghetti-con-jitomate-cp-queso-fresco', 'rec-spaghetti-con-jitomate', 'cp-queso-fresco', 100, 'mass_g'),
  ('rec-enfrijoladas-cp-frijol-pinto', 'rec-enfrijoladas', 'cp-frijol-pinto', 300, 'mass_g'),
  ('rec-enfrijoladas-cp-tortilla-de-maiz', 'rec-enfrijoladas', 'cp-tortilla-de-maiz', 400, 'mass_g'),
  ('rec-enfrijoladas-cp-queso-fresco', 'rec-enfrijoladas', 'cp-queso-fresco', 150, 'mass_g'),
  ('rec-enfrijoladas-cp-crema', 'rec-enfrijoladas', 'cp-crema', 100, 'volume_ml'),
  ('rec-enfrijoladas-cp-cebolla-blanca', 'rec-enfrijoladas', 'cp-cebolla-blanca', 0.5, 'unit'),
  ('rec-enfrijoladas-cp-aceite-vegetal', 'rec-enfrijoladas', 'cp-aceite-vegetal', 20, 'volume_ml'),
  ('rec-enfrijoladas-cp-sal', 'rec-enfrijoladas', 'cp-sal', 3, 'mass_g'),
  ('rec-avena-con-platano-cp-avena', 'rec-avena-con-platano', 'cp-avena', 100, 'mass_g'),
  ('rec-avena-con-platano-cp-leche-entera', 'rec-avena-con-platano', 'cp-leche-entera', 500, 'volume_ml'),
  ('rec-avena-con-platano-cp-platano', 'rec-avena-con-platano', 'cp-platano', 2, 'unit')
on conflict do nothing;

insert into public.commercial_product (id, canonical_product_id, store_id, brand, package_label, package_quantity, package_unit) values
  ('com-walmart-pechuga-de-pollo-1000', 'cp-pechuga-de-pollo', 'store-walmart', 'Bachoco', 'Pechuga Bachoco 1 kg', 1000, 'mass_g'),
  ('com-soriana-pechuga-de-pollo-900', 'cp-pechuga-de-pollo', 'store-soriana', 'Pilgrim''s', 'Pechuga Pilgrim''s 900 g', 900, 'mass_g'),
  ('com-alsuper-pechuga-de-pollo-1000', 'cp-pechuga-de-pollo', 'store-alsuper', null, 'Pechuga de pollo a granel 1 kg', 1000, 'mass_g'),
  ('com-soriana-huevo-18', 'cp-huevo', 'store-soriana', 'San Juan', 'Huevo blanco San Juan 18 pzas', 18, 'unit'),
  ('com-walmart-huevo-12', 'cp-huevo', 'store-walmart', 'Great Value', 'Huevo blanco Great Value 12 pzas', 12, 'unit'),
  ('com-walmart-frijol-pinto-1000', 'cp-frijol-pinto', 'store-walmart', 'Verde Valle', 'Frijol pinto Verde Valle 1 kg', 1000, 'mass_g'),
  ('com-walmart-arroz-1000', 'cp-arroz', 'store-walmart', 'Verde Valle', 'Arroz super extra Verde Valle 1 kg', 1000, 'mass_g'),
  ('com-soriana-arroz-900', 'cp-arroz', 'store-soriana', 'Schettino', 'Arroz Schettino 900 g', 900, 'mass_g'),
  ('com-soriana-pasta-spaghetti-200', 'cp-pasta-spaghetti', 'store-soriana', 'La Moderna', 'Spaghetti La Moderna 200 g', 200, 'mass_g'),
  ('com-walmart-avena-400', 'cp-avena', 'store-walmart', 'Quaker', 'Avena Quaker 400 g', 400, 'mass_g'),
  ('com-walmart-tortilla-de-maiz-1000', 'cp-tortilla-de-maiz', 'store-walmart', null, 'Tortilla de maiz 1 kg', 1000, 'mass_g'),
  ('com-walmart-jitomate-1000', 'cp-jitomate', 'store-walmart', null, 'Jitomate saladet por kg', 1000, 'mass_g'),
  ('com-walmart-cebolla-blanca-1', 'cp-cebolla-blanca', 'store-walmart', null, 'Cebolla blanca pieza', 1, 'unit'),
  ('com-alsuper-ajo-dientes-30', 'cp-ajo-dientes', 'store-alsuper', null, 'Ajo malla 3 cabezas (aprox. 30 dientes)', 30, 'unit'),
  ('com-alsuper-chile-serrano-10', 'cp-chile-serrano', 'store-alsuper', null, 'Chile serrano 10 pzas', 10, 'unit'),
  ('com-alsuper-cilantro-50', 'cp-cilantro', 'store-alsuper', null, 'Cilantro manojo 50 g', 50, 'mass_g'),
  ('com-walmart-platano-6', 'cp-platano', 'store-walmart', null, 'Platano tabasco 6 pzas', 6, 'unit'),
  ('com-walmart-leche-entera-1000', 'cp-leche-entera', 'store-walmart', 'Lala', 'Leche entera Lala 1 L', 1000, 'volume_ml'),
  ('com-alsuper-leche-entera-1000', 'cp-leche-entera', 'store-alsuper', 'Alpura', 'Leche entera Alpura 1 L', 1000, 'volume_ml'),
  ('com-soriana-queso-fresco-400', 'cp-queso-fresco', 'store-soriana', 'Nochebuena', 'Queso fresco Nochebuena 400 g', 400, 'mass_g'),
  ('com-soriana-crema-450', 'cp-crema', 'store-soriana', 'Lala', 'Crema Lala 450 ml', 450, 'volume_ml'),
  ('com-alsuper-aceite-vegetal-1000', 'cp-aceite-vegetal', 'store-alsuper', 'Nutrioli', 'Aceite Nutrioli 1 L', 1000, 'volume_ml'),
  ('com-alsuper-sal-1000', 'cp-sal', 'store-alsuper', 'La Fina', 'Sal La Fina 1 kg', 1000, 'mass_g')
on conflict do nothing;

insert into public.price_observation (id, commercial_product_id, price_cents, observed_at) values
  ('price-com-walmart-pechuga-de-pollo-1000', 'com-walmart-pechuga-de-pollo-1000', 13900, '2026-09-20T12:00:00Z'),
  ('price-com-soriana-pechuga-de-pollo-900', 'com-soriana-pechuga-de-pollo-900', 12990, '2026-09-20T12:00:00Z'),
  ('price-com-alsuper-pechuga-de-pollo-1000', 'com-alsuper-pechuga-de-pollo-1000', 14500, '2026-09-20T12:00:00Z'),
  ('price-com-soriana-huevo-18', 'com-soriana-huevo-18', 5490, '2026-09-20T12:00:00Z'),
  ('price-com-walmart-huevo-12', 'com-walmart-huevo-12', 3990, '2026-09-20T12:00:00Z'),
  ('price-com-walmart-frijol-pinto-1000', 'com-walmart-frijol-pinto-1000', 3990, '2026-09-20T12:00:00Z'),
  ('price-com-walmart-arroz-1000', 'com-walmart-arroz-1000', 3290, '2026-09-20T12:00:00Z'),
  ('price-com-soriana-arroz-900', 'com-soriana-arroz-900', 3150, '2026-09-20T12:00:00Z'),
  ('price-com-soriana-pasta-spaghetti-200', 'com-soriana-pasta-spaghetti-200', 1290, '2026-09-20T12:00:00Z'),
  ('price-com-walmart-avena-400', 'com-walmart-avena-400', 3490, '2026-09-20T12:00:00Z'),
  ('price-com-walmart-tortilla-de-maiz-1000', 'com-walmart-tortilla-de-maiz-1000', 2400, '2026-09-20T12:00:00Z'),
  ('price-com-walmart-jitomate-1000', 'com-walmart-jitomate-1000', 3490, '2026-09-20T12:00:00Z'),
  ('price-com-walmart-cebolla-blanca-1', 'com-walmart-cebolla-blanca-1', 900, '2026-09-20T12:00:00Z'),
  ('price-com-alsuper-ajo-dientes-30', 'com-alsuper-ajo-dientes-30', 2990, '2026-09-20T12:00:00Z'),
  ('price-com-alsuper-chile-serrano-10', 'com-alsuper-chile-serrano-10', 1500, '2026-09-20T12:00:00Z'),
  ('price-com-alsuper-cilantro-50', 'com-alsuper-cilantro-50', 800, '2026-09-20T12:00:00Z'),
  ('price-com-walmart-platano-6', 'com-walmart-platano-6', 2190, '2026-09-20T12:00:00Z'),
  ('price-com-walmart-leche-entera-1000', 'com-walmart-leche-entera-1000', 2890, '2026-09-20T12:00:00Z'),
  ('price-com-alsuper-leche-entera-1000', 'com-alsuper-leche-entera-1000', 2990, '2026-09-20T12:00:00Z'),
  ('price-com-soriana-queso-fresco-400', 'com-soriana-queso-fresco-400', 5990, '2026-09-20T12:00:00Z'),
  ('price-com-soriana-crema-450', 'com-soriana-crema-450', 3290, '2026-09-20T12:00:00Z'),
  ('price-com-alsuper-aceite-vegetal-1000', 'com-alsuper-aceite-vegetal-1000', 4590, '2026-09-20T12:00:00Z'),
  ('price-com-alsuper-sal-1000', 'com-alsuper-sal-1000', 1290, '2026-09-20T12:00:00Z')
on conflict do nothing;

