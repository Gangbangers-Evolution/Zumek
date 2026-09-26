-- Alergenos que aporta cada producto conceptual. El validador de recetas ya los usaba;
-- aqui se guardan para que el cambio de ingrediente del chat (swap_ingredient) nunca
-- meta un alergeno que el usuario marco (restriccion DURA).
alter table public.canonical_product add column allergens text[] not null default '{}';
