import type { Rules } from "eslint-define-config";

export const typescript = {
  "@typescript-eslint/ban-ts-comment": [
    "error",
    { "ts-ignore": "allow-with-description" },
  ],
  "@typescript-eslint/consistent-type-exports": ["error"],
  "@typescript-eslint/consistent-type-imports": [
    "error",
    {
      prefer: "type-imports",
      disallowTypeAnnotations: false,
      fixStyle: "separate-type-imports",
    },
  ],
  "@typescript-eslint/naming-convention": [
    "warn",
    {
      selector: "typeParameter",
      format: ["PascalCase"],
      leadingUnderscore: "allow",
      custom: { regex: "^(T|\\$)[A-Z][a-zA-Z]+[0-9]*$", match: true },
    },
  ],
  "@typescript-eslint/no-empty-interface": [
    "error",
    { allowSingleExtends: true },
  ],
  "@typescript-eslint/no-explicit-any": ["warn"],
} satisfies Rules;
