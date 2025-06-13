import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ["**/node_modules/", "**/out/", "**/.next/", "**/build/"],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    rules: {
      // Console logs allowed for development
      "no-console": "off",
      "no-debugger": "off",

      // React rules - very permissive
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-key": "off",
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "warn",

      // TypeScript rules - minimal
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/prefer-as-const": "off",

      // Import rules - minimal
      "import/no-unresolved": "off",
      "import/no-anonymous-default-export": "off",

      // Accessibility - warnings only
      "jsx-a11y/alt-text": "off",
      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",

      // General JavaScript rules - minimal
      "no-unused-vars": "off",
      "prefer-const": "off",
      "no-var": "warn",
      "no-empty": "off",
      "no-undef": "off",

      // Next.js specific - minimal
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];
