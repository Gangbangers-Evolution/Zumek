import type {
  CanonicalProduct,
  ColloquialUnit,
  CommercialProduct,
  PriceObservation,
  Store,
  UnitType,
} from "../src/index";

const OBSERVED_AT = "2026-09-20T12:00:00Z";

export const storesFixture: Store[] = [
  { id: "store-alsuper", name: "Alsuper", slug: "alsuper", active: true },
  { id: "store-walmart", name: "Walmart", slug: "walmart", active: true },
  { id: "store-soriana", name: "Soriana", slug: "soriana", active: true },
];

export const canonicalProductsFixture: CanonicalProduct[] = [
  { id: "cp-pollo", name: "Pechuga de pollo", unit_type: "mass_g", category: "proteina" },
  { id: "cp-huevo", name: "Huevo", unit_type: "unit", category: "proteina" },
  { id: "cp-frijol", name: "Frijol pinto", unit_type: "mass_g", category: "grano" },
  { id: "cp-arroz", name: "Arroz", unit_type: "mass_g", category: "grano" },
  { id: "cp-pasta", name: "Pasta spaghetti", unit_type: "mass_g", category: "grano" },
  { id: "cp-avena", name: "Avena", unit_type: "mass_g", category: "grano" },
  { id: "cp-tortilla", name: "Tortilla de maiz", unit_type: "mass_g", category: "grano" },
  { id: "cp-jitomate", name: "Jitomate", unit_type: "mass_g", category: "verdura" },
  { id: "cp-cebolla", name: "Cebolla blanca", unit_type: "unit", category: "verdura" },
  { id: "cp-ajo", name: "Ajo (dientes)", unit_type: "unit", category: "verdura" },
  { id: "cp-serrano", name: "Chile serrano", unit_type: "unit", category: "verdura" },
  { id: "cp-cilantro", name: "Cilantro", unit_type: "mass_g", category: "verdura" },
  { id: "cp-platano", name: "Platano", unit_type: "unit", category: "fruta" },
  { id: "cp-leche", name: "Leche entera", unit_type: "volume_ml", category: "lacteo" },
  { id: "cp-queso", name: "Queso fresco", unit_type: "mass_g", category: "lacteo" },
  { id: "cp-crema", name: "Crema", unit_type: "volume_ml", category: "lacteo" },
  { id: "cp-aceite", name: "Aceite vegetal", unit_type: "volume_ml", category: "despensa" },
  { id: "cp-sal", name: "Sal", unit_type: "mass_g", category: "despensa" },
];

type Row = [
  id: string,
  canonical: string,
  store: string,
  brand: string | null,
  label: string,
  quantity: number,
  unit: UnitType,
  priceCents: number,
];

const rows: Row[] = [
  ["com-pollo-wal", "cp-pollo", "store-walmart", "Bachoco", "Pechuga Bachoco 1 kg", 1000, "mass_g", 13900],
  ["com-pollo-sor", "cp-pollo", "store-soriana", "Pilgrim's", "Pechuga Pilgrim's 900 g", 900, "mass_g", 12990],
  ["com-pollo-als", "cp-pollo", "store-alsuper", null, "Pechuga de pollo a granel 1 kg", 1000, "mass_g", 14500],
  ["com-huevo-sor", "cp-huevo", "store-soriana", "San Juan", "Huevo blanco San Juan 18 pzas", 18, "unit", 5490],
  ["com-huevo-wal", "cp-huevo", "store-walmart", "Great Value", "Huevo blanco Great Value 12 pzas", 12, "unit", 3990],
  ["com-frijol-wal", "cp-frijol", "store-walmart", "Verde Valle", "Frijol pinto Verde Valle 1 kg", 1000, "mass_g", 3990],
  ["com-arroz-wal", "cp-arroz", "store-walmart", "Verde Valle", "Arroz super extra Verde Valle 1 kg", 1000, "mass_g", 3290],
  ["com-arroz-sor", "cp-arroz", "store-soriana", "Schettino", "Arroz Schettino 900 g", 900, "mass_g", 3150],
  ["com-pasta-sor", "cp-pasta", "store-soriana", "La Moderna", "Spaghetti La Moderna 200 g", 200, "mass_g", 1290],
  ["com-avena-wal", "cp-avena", "store-walmart", "Quaker", "Avena Quaker 400 g", 400, "mass_g", 3490],
  ["com-tortilla-wal", "cp-tortilla", "store-walmart", null, "Tortilla de maiz 1 kg", 1000, "mass_g", 2400],
  ["com-jitomate-wal", "cp-jitomate", "store-walmart", null, "Jitomate saladet por kg", 1000, "mass_g", 3490],
  ["com-cebolla-wal", "cp-cebolla", "store-walmart", null, "Cebolla blanca pieza", 1, "unit", 900],
  ["com-ajo-als", "cp-ajo", "store-alsuper", null, "Ajo malla 3 cabezas (aprox. 30 dientes)", 30, "unit", 2990],
  ["com-serrano-als", "cp-serrano", "store-alsuper", null, "Chile serrano 10 pzas", 10, "unit", 1500],
  ["com-cilantro-als", "cp-cilantro", "store-alsuper", null, "Cilantro manojo 50 g", 50, "mass_g", 800],
  ["com-platano-wal", "cp-platano", "store-walmart", null, "Platano tabasco 6 pzas", 6, "unit", 2190],
  ["com-leche-wal", "cp-leche", "store-walmart", "Lala", "Leche entera Lala 1 L", 1000, "volume_ml", 2890],
  ["com-leche-als", "cp-leche", "store-alsuper", "Alpura", "Leche entera Alpura 1 L", 1000, "volume_ml", 2990],
  ["com-queso-sor", "cp-queso", "store-soriana", "Nochebuena", "Queso fresco Nochebuena 400 g", 400, "mass_g", 5990],
  ["com-crema-sor", "cp-crema", "store-soriana", "Lala", "Crema Lala 450 ml", 450, "volume_ml", 3290],
  ["com-aceite-als", "cp-aceite", "store-alsuper", "Nutrioli", "Aceite Nutrioli 1 L", 1000, "volume_ml", 4590],
  ["com-sal-als", "cp-sal", "store-alsuper", "La Fina", "Sal La Fina 1 kg", 1000, "mass_g", 1290],
];

export const commercialProductsFixture: CommercialProduct[] = rows.map(
  ([id, canonical, store, brand, label, quantity, unit]) => ({
    id,
    canonical_product_id: canonical,
    store_id: store,
    brand,
    package_label: label,
    package_quantity: quantity,
    package_unit: unit,
  }),
);

export const priceObservationsFixture: PriceObservation[] = rows.map(([id, , , , , , , price]) => ({
  id: `price-${id}`,
  commercial_product_id: id,
  price_cents: price,
  observed_at: OBSERVED_AT,
}));

export const colloquialUnitsFixture: ColloquialUnit[] = [
  { term: "pizca", base_quantity: 1, base_unit: "mass_g" },
  { term: "cucharadita", base_quantity: 5, base_unit: "volume_ml" },
  { term: "cucharada", base_quantity: 15, base_unit: "volume_ml" },
  { term: "taza", base_quantity: 240, base_unit: "volume_ml" },
];
