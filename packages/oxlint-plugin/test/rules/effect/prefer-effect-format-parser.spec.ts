import { preferEffectFormatParser } from '../../../src/rules/effect/prefer-effect-format-parser';
import { createRuleTester } from '../../rule-tester';

const tester = createRuleTester();

const effect = "import * as Effect from 'effect/Effect'\n";

function invalid(code: string, module: string, api: string) {
  return { code: `${effect}${code}`, errors: [{ messageId: 'effectFormat', data: { module, api } }] };
}

tester.run('prefer-effect-format-parser', preferEffectFormatParser, {
  valid: [
    // Not an Effect file.
    "import { parse } from 'yaml'",
    `${effect}import { Toml, Yaml } from 'effect/encoding'`,
    // Effect's Yaml, Toml, Ini, Json5 and Jsonc only parse, so serializers stay allowed.
    `${effect}import { stringify } from 'yaml'`,
    `${effect}import YAML from 'yaml'\nconst text = YAML.stringify(config)`,
    `${effect}import * as toml from 'smol-toml'\nconst text = toml.stringify(config)`,
    `${effect}import { dump } from 'js-yaml'`,
    `${effect}import { XMLBuilder } from 'fast-xml-parser'`,
    `${effect}import { modify, applyEdits } from 'jsonc-parser'`,
    `${effect}import type { ParseOptions } from 'jsonc-parser'`,
    `${effect}import { type ParseError, format } from 'jsonc-parser'`,
    `${effect}import { parse } from 'csv-parse-like'`,
  ],
  invalid: [
    invalid("import { parse } from 'yaml'", 'Yaml', 'yaml parse'),
    invalid("import YAML from 'yaml'\nconst config = YAML.parse(text)", 'Yaml', 'yaml parse'),
    invalid("import * as yaml from 'js-yaml'\nconst config = yaml.load(text)", 'Yaml', 'js-yaml load'),
    invalid("import { parse as parseToml } from 'smol-toml'", 'Toml', 'smol-toml parse'),
    invalid("import TOML from '@iarna/toml'\nconst config = TOML.parse(text)", 'Toml', '@iarna/toml parse'),
    invalid("import ini from 'ini'\nconst config = ini.parse(text)", 'Ini', 'ini parse'),
    invalid("import JSON5 from 'json5'\nconst config = JSON5.parse(text)", 'Json5', 'json5 parse'),
    invalid("import { parse } from 'jsonc-parser'", 'Jsonc', 'jsonc-parser parse'),
    invalid("import stripJsonComments from 'strip-json-comments'", 'Jsonc', 'strip-json-comments'),
    invalid("import Papa from 'papaparse'", 'Csv', 'papaparse'),
    invalid("import { stringify } from 'csv-stringify/sync'", 'Csv', 'csv-stringify/sync stringify'),
    invalid("import { XMLParser } from 'fast-xml-parser'", 'Xml', 'fast-xml-parser XMLParser'),
    invalid("import { parseStringPromise } from 'xml2js'", 'Xml', 'xml2js parseStringPromise'),
    invalid("import ndjson from 'ndjson'", 'Ndjson', 'ndjson'),
    invalid("import { JSONParser } from '@streamparser/json'", 'JsonArray', '@streamparser/json JSONParser'),
  ],
});
