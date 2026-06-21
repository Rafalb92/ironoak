import baseConfig from "./base.mjs";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...baseConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true
      }
    },
    rules: {
      // Nest na dekoratorach często ma "puste" klasy/konstruktory — luzujemy
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/no-empty-function": "off"
    }
  }
);