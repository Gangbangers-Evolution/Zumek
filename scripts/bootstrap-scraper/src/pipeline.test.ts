import { describe, expect, it } from "vitest";
import type { CanonicalProductSpec } from "@zumek/catalog-data";
import { parseCsv, toCsv } from "./csv";
import { extractProducts } from "./extract";
import { matchCanonical } from "./match";
import { parsePackageSize, priceToCents } from "./parse";
import { REVIEW_COLUMNS, reviewRecord } from "./review";
import { buildSeedSql } from "./seed";

describe("parsePackageSize", () => {
  it.each([
    ["Pechuga Bachoco 900 g", { quantity: 900, unit: "mass_g" }],
    ["Arroz Verde Valle 1 kg", { quantity: 1000, unit: "mass_g" }],
    ["Frijol 1.5kg", { quantity: 1500, unit: "mass_g" }],
    ["Queso fresco 400 Grs", { quantity: 400, unit: "mass_g" }],
    ["Leche Lala 1 L", { quantity: 1000, unit: "volume_ml" }],
    ["Aceite 946 ml", { quantity: 946, unit: "volume_ml" }],
    ["Refresco 6 x 355 ml", { quantity: 2130, unit: "volume_ml" }],
    ["Huevo blanco 18 pzas", { quantity: 18, unit: "unit" }],
    ["Crema ácida 0,45 lt", { quantity: 450, unit: "volume_ml" }],
  ])("%s", (label, expected) => {
    expect(parsePackageSize(label)).toEqual(expected);
  });

  it("regresa null si no hay tamano reconocible", () => {
    expect(parsePackageSize("Cebolla blanca")).toBeNull();
  });

  it("no confunde 'lala' con litros ni 'gratis' con gramos", () => {
    expect(parsePackageSize("Crema Lala gratis")).toBeNull();
  });
});

describe("priceToCents", () => {
  it("siempre regresa enteros en centavos", () => {
    expect(priceToCents(139)).toBe(13900);
    expect(priceToCents(12.9)).toBe(1290);
    expect(priceToCents("$1,234.50")).toBe(123450);
    expect(priceToCents("45,90")).toBe(4590);
    expect(priceToCents("$ 32.90 MXN")).toBe(3290);
  });

  it("rechaza lo que no es precio", () => {
    expect(priceToCents("agotado")).toBeNull();
    expect(priceToCents(0)).toBeNull();
    expect(priceToCents(null)).toBeNull();
  });
});

describe("extractProducts", () => {
  it("lee respuestas tipo VTEX con precio anidado", () => {
    const json = {
      data: [
        {
          productName: "Pechuga de Pollo Bachoco 1 kg",
          brand: "Bachoco",
          linkText: "/pechuga-bachoco/p",
          items: [{ sellers: [{ commertialOffer: { Price: 139 } }] }],
        },
      ],
    };
    expect(extractProducts(json, "xhr")).toEqual([
      { name: "Pechuga de Pollo Bachoco 1 kg", brand: "Bachoco", price: 139, url: "/pechuga-bachoco/p", source: "xhr" },
    ]);
  });

  it("lee JSON-LD de schema.org (ItemList con Product y offers)", () => {
    const json = {
      "@type": "ItemList",
      itemListElement: [
        { "@type": "Product", name: "Arroz 1 kg", brand: { name: "Schettino" }, offers: { price: "31.50" } },
      ],
    };
    const [product] = extractProducts(json, "json-ld");
    expect(product).toMatchObject({ name: "Arroz 1 kg", brand: "Schettino", price: "31.50" });
  });

  it("ignora objetos sin precio y no duplica", () => {
    const json = { menu: [{ name: "Frutas y verduras" }], a: { name: "X 1 kg", price: 10 }, b: { name: "X 1 kg", price: 10 } };
    expect(extractProducts(json, "xhr")).toHaveLength(1);
  });
});

const pollo: CanonicalProductSpec = {
  name: "Pechuga de pollo",
  unit_type: "mass_g",
  category: "proteina",
  allergens: [],
  search: "pechuga de pollo",
  require: ["pechuga", "pollo"],
  exclude: ["empaniz", "nugget"],
};

describe("matchCanonical", () => {
  it("acepta el producto correcto sin importar acentos ni mayusculas", () => {
    expect(matchCanonical("PECHUGA DE POLLO Bachoco 900 g", { quantity: 900, unit: "mass_g" }, pollo)).toEqual({ ok: true });
  });

  it("descarta palabras excluidas, faltantes o unidad distinta", () => {
    expect(matchCanonical("Pechuga de pollo empanizada 500 g", null, pollo).ok).toBe(false);
    expect(matchCanonical("Muslo de pollo 1 kg", null, pollo).ok).toBe(false);
    expect(matchCanonical("Pechuga de pollo 6 pzas", { quantity: 6, unit: "unit" }, pollo).ok).toBe(false);
  });
});

describe("review y seed", () => {
  const record = {
    store: "walmart",
    canonical: "Pechuga de pollo",
    term: "pechuga de pollo",
    page_url: "https://example.com",
    captured_at: "2026-09-27T10:00:00.000Z",
    products: [
      { name: "Pechuga de pollo Bachoco 1 kg", brand: "Bachoco", price: 139, url: null, source: "xhr" as const },
      { name: "Pechuga de pollo al natural", brand: null, price: 99, url: null, source: "xhr" as const },
      { name: "Nuggets de pechuga de pollo 500 g", brand: null, price: 89, url: null, source: "xhr" as const },
    ],
  };

  it("clasifica en ok / revisar / descartado", () => {
    const rows = reviewRecord(record, pollo);
    expect(rows.map((r) => [r.estado, r.incluir])).toEqual([
      ["ok", "si"],
      ["revisar", "no"],
      ["descartado", "no"],
    ]);
    expect(rows[0]).toMatchObject({ cantidad_paquete: 1000, unidad: "mass_g", precio_centavos: 13900 });
  });

  it("el CSV sobrevive ida y vuelta con comas, comillas y acentos", () => {
    const rows = reviewRecord(record, pollo);
    const parsed = parseCsv(toCsv(rows, REVIEW_COLUMNS));
    expect(parsed).toHaveLength(3);
    expect(parsed[2]!.motivo).toBe(rows[2]!.motivo);
    expect(parsed[0]!.precio_centavos).toBe("13900");
  });

  it("genera SQL solo con lo incluido y escapa comillas", () => {
    const rows = parseCsv(toCsv(reviewRecord(record, pollo), REVIEW_COLUMNS));
    rows[0]!.nombre_en_tienda = "Pechuga O'Brien 1 kg";
    const { sql, errors } = buildSeedSql(rows);
    expect(errors).toEqual([]);
    expect(sql).toContain("'Pechuga O''Brien 1 kg'");
    expect(sql).toContain("13900");
    expect(sql).not.toContain("Nuggets");
    expect(sql.match(/insert into price_observation/g)).toHaveLength(1);
  });

  it("se niega a generar SQL si un precio no es entero", () => {
    const rows = parseCsv(toCsv(reviewRecord(record, pollo), REVIEW_COLUMNS));
    rows[0]!.precio_centavos = "139.50";
    const { sql, errors } = buildSeedSql(rows);
    expect(sql).toBe("");
    expect(errors[0]).toMatch(/entero/);
  });
});
