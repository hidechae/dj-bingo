// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [{
  ignores: [
    ".next/**",
    "node_modules/**",
    "out/**",
    "dist/**",
    ".vercel/**",
    "next-env.d.ts",
  ],
}, ...compat.extends("next/core-web-vitals", "next/typescript"), {
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
  },
}, ...storybook.configs["flat/recommended"], {
  files: ["**/*.stories.tsx"],
  rules: {
    "storybook/no-renderer-packages": "off",
  },
}];

export default eslintConfig;
