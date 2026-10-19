---
packages:
  'npm:@2digits/oxlint-config': patch
---

### Behavior change: consumer config now wins in `withTwoDigits`

`withTwoDigits` now merges consumer configs the way its documentation describes: consumer configuration takes precedence over the 2digits defaults, and later configs take precedence over earlier ones. Lint results change for consumers who rely on either of these:

- **`extends`**: configs listed in a consumer `extends` now override the 2digits presets. They used to be placed before the presets, so a rule set there (for example `curly: 'off'`) was silently overridden by the defaults.
- **Rules with options set in more than one config**: the later entry now replaces the earlier one. The entries used to be concatenated into one invalid entry such as `['warn', { … }, 'error', { … }]`.

Configs that pass neither resolve exactly as before.
