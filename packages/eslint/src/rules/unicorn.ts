import type { Rules } from "eslint-define-config";

export const unicorn = {
  "unicorn/filename-case": ["off"],
  "unicorn/prefer-module": ["off"],
  "unicorn/prevent-abbreviations": ["off"],
} satisfies Rules;
