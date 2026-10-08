# Amp-accountbrede MCP en persoonlijke plugins

Onderzocht op 7 oktober 2026 tegen de actuele officiële documentatie en read-only CLI-help van
`amp 0.0.1791360091-gfb32ce` (release 7 oktober 2026), de huidige checkout van `packages/tlo-mcp`
en de gepubliceerde npm-versie. De oorspronkelijke verkenning wijzigde geen accountconfiguratie of packagecode.

## Vervolg: persoonlijke plugin actief, echte login geblokkeerd

De [High + Fast-orb](https://ampcode.com/threads/T-01a11628-e4cf-7589-8ded-96ece2351193) heeft een
[zelfstandige plugin](../../packages/tlo-mcp/amp-plugin/README.md) gebouwd met expliciete PKCE-endpoints
en MCP-SDK-calls zonder `authProvider`. De eigenaar heeft publicatie naar zijn persoonlijke User Plugins
goedgekeurd; `reload_plugins` bevestigt ook hier `teamleader-orbit`, scope `user`, status `active`.
De broncode is naar deze checkout overgenomen; hier slagen opnieuw 32 gerichte tests en `vp run types`.

De native CLI-route met `--auth-url` en `--token-url` bleek in de disposable mockproef niet voldoende:
`oauth login` bewaart de endpoints zonder requests, maar `mcp doctor` doet opnieuw discovery en gebruikt
`/authorize` en `/token` wanneer discovery HTML teruggeeft. Daarom gebruikt de plugin eigen requests.

De plugin biedt automatische registratie en callback via loopback of een authenticated Amp-portal, maar
een door de eigenaar goedgekeurde echte registratiepoging met portalredirect gaf HTTP 400 HTML
`Bad Request`, vóór autorisatie. De oorzaak is niet bewezen; verdere echte registratiepogingen vereisen
toestemming. De werkende mockflow bewijst geen werkende Orbit-login. Tokens blijven executor-lokaal.
Dit vervolg vervangt het oorspronkelijke implementatieadvies hieronder; dat blijft als verkenning bewaard.

## Oorspronkelijk advies voor `packages/tlo-mcp`

**Voor deze stdio-proxy: publiceer een persoonlijke directoryplugin met een gebundelde MCP-skill.**
Een persoonlijke skill zonder plugin kan ook; een plugin is alleen nodig als we pluginfunctionaliteit
willen toevoegen. De accountbrede distributie lost de machinegebonden OAuth-sessie niet op.

- De huidige checkout biedt alleen een stdio-server, via `McpServer.layerStdio`; de CLI heeft
  `login`, `logout` en de standaard servercommand.
  Bronnen: [proxy](../../packages/tlo-mcp/src/mcp/proxy.ts),
  [CLI](../../packages/tlo-mcp/src/cli/command.ts).
- Login registreert een eigen OAuth-client, gebruikt PKCE en een callback op een willekeurige
  `127.0.0.1`-poort. macOS bewaart de sessie in Keychain; andere platforms in een private lokale file.
  Er is geen account-secretimport of remote loginflow. Een laptoplogin is daarom niet beschikbaar
  in een orb; een browser op de laptop kan niet rechtstreeks de loopbackcallback in een orb bereiken.
  Bronnen: [auth](../../packages/tlo-mcp/src/oauth/OrbitAuth.ts),
  [callback](../../packages/tlo-mcp/src/oauth/callback.ts),
  [store](../../packages/tlo-mcp/src/oauth/store.ts).
- **Releaseblokkade:** npm `latest` is `0.1.38`, maar bevat nog `TLO_SESSION_TOKEN`, `TLO_COOKIES`
  en `TLO_BASE_URL` in `dist/TloLive-DHG59kAi.mjs`. De gepubliceerde CLI-help biedt geen logincommand.
  De OAuth-code in deze checkout staat op de toegepaste branches `sol/orbit-oauth-proxy` en
  `sol/remove-cookie-adapter`, niet op `origin/main`. Gebruik dus niet blind `@latest` of `0.1.38`
  voor de nieuwe opzet; publiceer eerst de OAuth-versie of gebruik tijdelijk een build van deze checkout.
  Bronnen: `vp info @2digits/tlo-mcp --json`, `but status`,
  `vp dlx --silent -- @2digits/tlo-mcp@0.1.38 --help` en de
  [gepubliceerde tarball](https://registry.npmjs.org/@2digits/tlo-mcp/-/tlo-mcp-0.1.38.tgz).

Voorgestelde pluginstructuur in de persoonlijke User Plugins-repository:

```text
tlo/
  index.ts                 # registreert skills/orbit via amp.registerSkill
  skills/orbit/
    SKILL.md               # wanneer Orbit-tools gebruiken; geen tokens
    mcp.json               # start een vastgepinde OAuth-versie van tlo-mcp
```

Laat `mcp.json` bijvoorbeeld `command: "vp"` en
`args: ["dlx", "--silent", "--", "@2digits/tlo-mcp@<oauth-release>"]` gebruiken.
Dit vereist Vite+ op elke executor; download- en startgedrag moet in een schone omgeving worden getest.
Login vooraf op dezelfde machine met dezelfde packageversie en dezelfde OS-gebruiker.
Start login niet automatisch bij skillontdekking: Amp verbindt MCP-servers dan al, zonder dat de gebruiker
Orbit hoeft te willen gebruiken. Bronnen: [Skills](https://ampcode.com/docs/customize/skills),
[Vite+ binarycommands](https://viteplus.dev/guide/vpx).

Voor gebruik vanuit orbs heeft een directe persoonlijke remote MCP-koppeling de voorkeur als die OAuth-flow
werkend te krijgen is. Een eigen gehoste proxy is anders mogelijk, maar vraagt een HTTP-transport,
toegangsbeveiliging en centrale, duurzame OAuth-opslag; het huidige package heeft die voorzieningen niet.
Een statische kopie van refreshcredentials in account-environment is geen oplossing voor duurzame
rotatie: het package schrijft updates alleen naar zijn lokale store en locks gelden alleen op die machine.
Bronnen: [proxy](../../packages/tlo-mcp/src/mcp/proxy.ts),
[auth](../../packages/tlo-mcp/src/oauth/OrbitAuth.ts), [store](../../packages/tlo-mcp/src/oauth/store.ts).

## Bestaande accountkoppeling en actuele Orbit-responses

Read-only accountinspectie toont al een persoonlijke `TLO`-server op
`https://api.orbit.teamleader.eu/mcp`, uitgeschakeld en niet verbonden, met laatst opgeslagen
checkresultaat `needs-login`. Authdetectie via Amp gaf tijdens dit onderzoek een HTML-fout terug.
Directe requests vanaf deze laptop tonen:

- `GET /mcp`: HTTP 403 met HTML en `WWW-Authenticate: Bearer
  resource_metadata="https://api.orbit.teamleader.eu/.well-known/oauth-protected-resource"`.
- `GET /.well-known/oauth-protected-resource`: HTTP 200, correcte resource en authorization server.
- `GET /.well-known/oauth-protected-resource/mcp`: HTTP 404 met HTML.
- `GET /.well-known/oauth-authorization-server`: HTTP 200, registratie-endpoint, PKCE S256 en refresh grants.

Dit bewijst niet dat Amp-OAuth onmogelijk is of welke response Amp precies niet aankan. Het geeft wel een
concrete compatibiliteitsvraag om te onderzoeken voordat we een eigen gehoste proxy bouwen. Er is geen
OAuth-client geregistreerd, login gestart, bestaande koppeling aangezet of MCP-tool aangeroepen.
Bronnen: `manage_amp(remote_mcp_servers, list-servers/detect-authentication)` en directe GET-requests naar
de bovenstaande publieke Orbit-endpoints op 7 oktober 2026.

## Conclusie / keuzemogelijkheden

| Behoefte                                                       | Ondersteunde route                                                                                                                                 | Belangrijk verschil                                                                                                                                                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Eén MCP-integratie op het persoonlijke Amp-account             | Remote MCP-definitie in [persoonlijke MCP-instellingen](https://ampcode.com/settings/mcp-servers), of `amp mcp remote --personal add <naam> <url>` | Amp bewaart een endpoint en authenticatie, geen lokaal uitvoerbaar package. Beschikbaar over clients heen, inclusief orbthreads.                                                                       |
| Eigen extensie overal waar je Amp gebruikt                     | Persoonlijke **User Plugins**-repository; beheer via [persoonlijke plugininstellingen](https://ampcode.com/settings/plugins)                       | Globaal betekent accountbreed, niet alleen deze computer. Publicatie gebeurt door pushen naar de hosted Git-repository.                                                                                |
| Stdio-MCP accountbreed beschikbaar maken zonder externe server | Persoonlijke skill met `mcp.json`, of directoryplugin die zo'n skill bundelt en `await amp.registerSkill({ path: 'skills/tlo' })` aanroept         | MCP wordt via skillconfiguratie gestart; geen directe publieke `registerMCPServer`-API gevonden. Tools van een uitsluitend door een skill geleverde server blijven verborgen tot die skill geladen is. |
| Alleen gebruik op deze computer                                | `amp.mcpServers` in gebruikersinstellingen of `~/.config/amp/plugins/`                                                                             | Niet accountbreed; een orb leest de configuratie van je computer niet.                                                                                                                                 |

Bronnen: [MCP](https://ampcode.com/docs/customize/mcp),
[Global Plugins & Skills](https://ampcode.com/docs/customize/global-plugins-and-skills),
[Plugins](https://ampcode.com/docs/customize/plugins), [Skills](https://ampcode.com/docs/customize/skills).

## Remote MCP: transport en authenticatie

- De actuele account-CLI heeft exact `amp mcp remote add [options] <name> <url>` en scope `--personal`.
  De accountdefinitie heeft geen gedocumenteerde `command`/`args`/`env`-variant: **stdio is geen
  rechtstreeks account-MCP-endpoint**. Voor stdio is een executor nodig. Remote definities worden
  via `tool_search` en `code_exec` gebruikt. [MCP](https://ampcode.com/docs/customize/mcp)
- **HTTP-MCP is de gedocumenteerde remote route**; gebruik bij een nieuw endpoint bij voorkeur
  Streamable HTTP. Amp kondigde op 8 juli 2025 Streamable HTTP als standaard met SSE-fallback aan.
  De huidige MCP-pagina geeft nog een `/sse`-voorbeeld, maar dat voorbeeld betreft lokale URL-configuratie.
  De huidige sectie over accountdefinities specificeert de transportonderhandeling niet.
  Daarom is **SSE-fallback specifiek voor accountopgeslagen remote servers niet afdoende bevestigd**;
  het oude algemene bericht is geen bewijs van de huidige accountimplementatie. Geen actuele
  ondersteuning voor WebSocket of andere transports gevonden.
  [Actuele MCP-docs](https://ampcode.com/docs/customize/mcp),
  [historische transportaankondiging](https://ampcode.com/news/streamable-mcp)
- Gedocumenteerde authenticatie: autodetectie, `--auth none`, `--auth bearer`, `--auth oauth` en
  `--auth workload-identity` (toegang door Amp-medewerkers vereist). Geheimen gaan via
  `--bearer-token-file <path>` of `--oauth-client-secret-file <path>`; `-` leest stdin. Geheimwaarden
  worden niet als commandlineargument geaccepteerd. OAuth-client-ID: `--oauth-client-id <id>`.
  `amp mcp remote --personal login <naam>` geeft een ampcode.com-OAuth-URL, ook bruikbaar voor orbs.
  Dit staat los van `amp mcp oauth`, dat lokale CLI-OAuth beheert. [MCP](https://ampcode.com/docs/customize/mcp)
- `headers` en `${VAR_NAME}` zijn gedocumenteerd voor executorconfiguratie met `url`, niet als
  algemene account-secretinterpolatie voor remote definities. De account-CLI biedt geen `--headers`
  of `--env` bij `remote add`. Veronderstel die ondersteuning dus niet.
  [MCP](https://ampcode.com/docs/customize/mcp); gecontroleerd met `amp mcp remote add --help`.

## Persoonlijke globale plugin: exacte API en stdio-route

- Direct repositorybeheer: `amp plugins repositories` en `amp clone user-plugins`. Een plugin is
  een `.ts`/`.js`-bestand of een directory met `index.ts`/`index.js`, met een defaultfunctie die
  `PluginAPI` ontvangt (`import type { PluginAPI } from '@ampcode/plugin'`). Nieuwe threads laden
  gepubliceerde plugins automatisch; bestaande threads vragen om herladen (`plugins: reload`).
  **`amp plugins add <url>` is juist machine-local**; `--target workspace` betekent de huidige
  projectdirectory `.amp/plugins/`, niet de hosted Workspace Plugins-repository.
  [Plugins](https://ampcode.com/docs/customize/plugins),
  [Global Plugins & Skills](https://ampcode.com/docs/customize/global-plugins-and-skills)
- De huidige publieke `PluginAPI` en `ExperimentalPluginAPI` hebben **geen**
  `amp.registerMCPServer(...)`, `amp.mcp.registerServer(...)` of vergelijkbare MCP-spawnregistratie.
  Ook geen gedocumenteerde `amp.secrets`-API of installhook gevonden. Dit is gecontroleerd in de
  volledige [API-reference](https://ampcode.com/docs/plugin-api), inclusief de
  [machineleesbare versie](https://ampcode.com/docs/markdown/plugin-api), en `amp plugins show-docs`.
  `AgentConfig.mcpServers?: readonly string[]` noemt bestaande remote server-ID's in agentinstructies;
  het registreert of start geen server.
- De wél gedocumenteerde brug is exact
  `registerSkill(definition: PluginSkillDefinition): Promise<Subscription>`, met
  `PluginSkillDefinition.path: string` relatief aan de directoryplugin. Bundel een skilldirectory
  met `SKILL.md` en naast dat bestand `mcp.json`. Voor stdio zijn de velden `command: string`,
  `args?: string[]`, `env?: object`; `includeTools?: string[]` selecteert tools. Amp verbindt bij
  skillontdekking, niet pas bij skillinvocatie; zichtbaarheid wordt wel door skillladen gestuurd.
  [Plugin API](https://ampcode.com/docs/plugin-api), [Skills](https://ampcode.com/docs/customize/skills)
- Alternatief: echte plugintools via `registerTool(definition: PluginToolDefinition): Subscription`
  die zelf code uitvoeren of een MCP-client gebruiken. Dat is eigen integratiecode, **geen**
  automatisch door Amp beheerde MCP-serverregistratie. Resourcecleanup kan via
  `onDispose(callback: () => void | Promise<void>): Subscription`; callbacks krijgen samen circa
  drie seconden en draaien niet bij crash/SIGKILL. [Plugin API](https://ampcode.com/docs/plugin-api)

## Executors, dependencies en levenscyclus

- Hosted persoonlijke plugins/skills gelden overal, dus zowel bij lokaal Amp-gebruik als in orbs.
  Code draait in de uitvoeringsomgeving, niet als permanent accountdaemon. De API-reference zegt
  dat plugins met Bun worden uitgevoerd en langlevende processen kunnen zijn voor meerdere threads.
  `amp.system.executor.kind` heeft exact type `'local' | 'remote' | 'unknown'` — **niet** `'orb'`.
  [Plugins](https://ampcode.com/docs/customize/plugins),
  [Global Plugins & Skills](https://ampcode.com/docs/customize/global-plugins-and-skills),
  [Plugin API](https://ampcode.com/docs/plugin-api)
- Ondersteunende bestanden kunnen relatief worden geïmporteerd. De geraadpleegde actuele docs
  garanderen **geen automatische package.json-installatie, postinstallhook of installatie van
  systeemdependencies** voor globale plugins. Een geconfigureerd stdio-`command` moet in de
  uitvoeringsomgeving kunnen draaien; een repo-lokaal pad of op je laptop geïnstalleerde binary is
  niet vanzelf beschikbaar in een orb. De docs tonen bijvoorbeeld een expliciet package-runnercommand
  in skill-MCP-configuratie. De precieze dependency-/cache-/installstrategie moet apart worden
  vastgesteld of getest; accountbrede distributie van pluginbroncode bewijst geen dependency-installatie.
  [Plugins](https://ampcode.com/docs/customize/plugins), [Skills](https://ampcode.com/docs/customize/skills)
- Initialisatie hoort in de defaultfunctie bij pluginladen; `amp.on('session.start', ...)` is
  threadsessiewerk, geen eenmalige installatie. `amp.$`/`ctx.$` zijn shellhelpers, geen stdio-MCP-API.
  [Plugins](https://ampcode.com/docs/customize/plugins), [Plugin API](https://ampcode.com/docs/plugin-api)

## Secrets en environment

- Accountwaarden voor orbs staan onder [persoonlijke Secrets & Env Vars](https://ampcode.com/settings/environment-variables).
  Voorrang: persoonlijk > project > workspace. Nieuwe orbs krijgen de actuele waarden;
  `amp orb restart-processes` ververst een bestaande orb. Geheimen horen niet in pluginbroncode,
  Git of prompts; de API-voorbeelden lezen environment via `process.env`.
  [Handling Secrets](https://ampcode.com/docs/orbs/handling-secrets),
  [Plugin API](https://ampcode.com/docs/plugin-api)
- Lokale runners krijgen standaard alleen hun procesenvironment. Account-environment wordt opt-in
  met `amp --no-tui --amp-env` of `amp.runner.env.enabled: true`; dit geldt ook voor MCP en plugins.
  Waarden zijn per directory; de laatst gestarte thread bepaalt de directory-environment.
  Bij verandering herstart de runner de MCP-servers en plugins van die directory.
  **Shared runners krijgen geen persoonlijke accountwaarden**, ook niet voor je eigen threads.
  [Runners](https://ampcode.com/docs/cli/runners)
- Voor een gewone interactieve lokale CLI is automatische injectie van accountsecrets hiermee niet
  aangetoond: de opt-in is gedocumenteerd voor `--no-tui`-runners. Gebruik daar expliciet lokaal
  aangeleverde environment, of verifieer de gewenste uitvoeringsvariant afzonderlijk.
  `amp.configuration.update(..., 'global')` betekent **user settings**, niet publicatie naar de
  User Plugins-repository of account-secretopslag. [Plugin API](https://ampcode.com/docs/plugin-api),
  [Runners](https://ampcode.com/docs/cli/runners)

## Nog te verifiëren voordat je implementeert

1. Een gepubliceerde OAuth-release en stdio-start daarvan vanuit de globale skill/plugin.
2. De OAuth-compatibiliteit van de bestaande directe Amp-accountkoppeling.
3. Dependency-installatie en uitvoerbare paden in een schone orb én lokale executor; een werkende
   authenticatievoorziening voor orbs als we daar de stdio-proxy willen gebruiken.

Documentatie, packagecode, publieke metadata en de gepubliceerde CLI-help zijn gecontroleerd;
geen accountmutaties, authenticated toolcalls of uitvoerende plugins getest.
