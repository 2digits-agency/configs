---
'@2digits/eslint-config': patch
---

Update eslint-plugin-storybook and restructure dependencies

- Updated `eslint-plugin-storybook` to 10.2.15
- Moved `eslint-plugin-react-hooks` from devDependencies to dependencies (no longer bundled)
- Added `eslint` as a peerDependency
- Removed `noExternal` and `inlineOnly` bundling workarounds from tsdown config
