declare module 'prettier-plugin-toml' {
  import type { Parser, Printer } from 'prettier';
  export const parsers: Record<string, Parser>;
  export const printers: Record<string, Printer>;
}
