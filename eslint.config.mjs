// Lint de los paquetes TypeScript puros y scripts. La app (apps/mobile) tiene su propia
// configuracion de Expo y se revisa con `expo lint`.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["apps/**", "**/node_modules/**", "**/out/**", "**/dist/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {
      // Los parametros que empiezan con _ son intencionalmente no usados
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Obliga a importar tipos con `import type` (no dejan codigo en el bundle)
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
);
