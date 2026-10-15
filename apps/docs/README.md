# 2digits documentation

Fumadocs UI and MDX on Next.js. Authored pages live in `content/docs`; rule references are generated from the workspace plugins.

From the repository root:

```sh
vp install
vp run docs:dev
vp run build --filter=@2digits/docs
vp run types --filter=@2digits/docs
```

For production, run `vp run start` from this directory after building. Use a Next.js-compatible host with the repository root as the install context and `apps/docs` as the app directory. The site uses a server search endpoint; this setup is not a static export.

See `/docs/contributing` for authoring conventions. Do not edit `content/docs/rules`: it is generated and ignored by Git. Restart the docs after changing plugin code to rebuild the rule references.
