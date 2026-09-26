import { normalizeText } from "./text";

/** "Tortilla de maíz" -> "tortilla-de-maiz": ids estables y legibles a partir de nombres. */
export function slugify(text: string): string {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const storeId = (slug: string) => `store-${slug}`;
export const canonicalId = (name: string) => `cp-${slugify(name)}`;
export const recipeId = (name: string) => `rec-${slugify(name)}`;
