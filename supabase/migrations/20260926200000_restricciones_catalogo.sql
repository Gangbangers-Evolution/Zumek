-- Restricciones que el seed y la app dan por hechas (el validador de recetas ya las exige,
-- aqui quedan garantizadas en la base tambien).

-- El nombre de receta es su llave natural: el seed y el chat la buscan por nombre.
alter table public.recipe add constraint recipe_name_key unique (name);

-- Un ingrediente aparece una sola vez por receta (las cantidades se suman en una fila).
alter table public.recipe_ingredient
  add constraint recipe_ingredient_recipe_product_key unique (recipe_id, canonical_product_id);
