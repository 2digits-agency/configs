# @2digits/tlo-tui

TLO is een OpenTUI-terminalapp voor Teamleader Orbit: weekstaat, taken zoeken, uren boeken en support bekijken.
De app hergebruikt de lokale [tlo-mcp-gateway](../tlo-mcp/README.md); geen tweede OAuth-login,
eigen tokenopslag of token-refresh in de TUI.

## Starten

Vereist **Bun >= 1.3.14** en een interactieve terminal. De Node 24-runtime van de repo kan de huidige
OpenTUI-FFI niet draaien; de gateway blijft wel onder Node draaien.

Installeer vanuit de reporoot:

```bash
vp install
```

Start daarna vanuit `packages/tlo-tui`:

```bash
vp run demo
```

Dit is **expliciet fictieve demo-data**: klanten, taken en tickets zijn verzonnen. Reads en directe writes
blijven in het geheugen van dit proces; er gaat niets naar Orbit. Opnieuw starten reset die gegevens.
Opgeslagen conceptbestanden blijven wel op schijf. Een demoportal toont deze demo, geen live klantdata.

Voor live gebruik: laat de bestaande gateway draaien en start vanuit dezelfde directory:

```bash
vp run start
```

De lokale MCP-route is standaard `http://127.0.0.1:4790/mcp`. Start geen tweede gateway op dezelfde poort.
Bij ontbrekende login of gateway: volg eerst de gateway-README. De TUI leest de bestaande private sleutel uit
`~/.config/2digits/tlo-mcp/gateway.key`; hij maakt of roteert die niet.

## Opties

Geef opties mee aan `vp run start`, bijvoorbeeld:

```bash
vp run start --demo --date 2026-10-13 --demo-fault timeout
vp run start --read-only --url http://127.0.0.1:4790/mcp
```

| Optie                       | Betekenis                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--demo`                    | Fictieve in-memory bron, zonder gateway of sleutel.                                                             |
| `--read-only`               | Alleen lezen en reviewen; geen directe Orbit-writes. Lokale concepten opslaan blijft mogelijk.                  |
| `--direct-writes`           | Eigen uren en eenvoudige interne notities toestaan, pas na expliciete payloadreview.                            |
| `--date YYYY-MM-DD`         | Kalenderdatum voor de startcontext.                                                                             |
| `--url <endpoint>`          | Lokale loopback-MCP-route van de gateway, niet de publieke tunnel-URL.                                          |
| `--key-file <pad>`          | Alternatief privaat gateway-sleutelbestand.                                                                     |
| `--request-directory <pad>` | Directory voor niet-uitgevoerde JSON-concepten.                                                                 |
| `--demo-fault timeout`      | Demo: boeking wordt in geheugen opgeslagen, maar het antwoord gaat verloren; readback moet de uitkomst bepalen. |

**Live start standaard read-only. Demo staat standaard directe writes toe, veilig binnen het geheugen.**
`--direct-writes` is geen toestemming voor correcties, verwijderen of klantcommunicatie.
Live writes zijn hier niet als getest of bewezen gepresenteerd; een geslaagde demo bewijst geen live write.

## Toetsen en workflow

- `1`–`7`: Week, Zoeken, Boeken, Support, Correcties, Klantantwoord, Capabilities.
  Tijdens typen: `Alt+cijfer`. `?` opent hulp; `q` sluit af buiten invoervelden.
- `Tab` / `Shift+Tab`: volgend/vorig veld. `Enter` activeert invoer of selectie; `Esc` verlaat invoer.
  `↑`/`↓` of `k`/`j` selecteren regels.
- Week: `←`/`→` of `h`/`l` wisselt dag, `[`/`]` wisselt week, `t` gaat naar vandaag,
  `Enter` toont details, `r` herleest, `b` opent boeken en `c` een correctieconcept.
- Zoeken: `/` of `i` voor zoektekst, `Tab` wisselt bron, `Enter` kiest een taak of ticket.
  Toegewezen taken zijn niet alle taken; projectitems zoeken is geen zoeken op projectnaam.
- Boeken: kies een projecttaak, datum, **expliciete starttijd**, duur (`1h30`, `90` of `1:30`) en
  billable (`b`) of niet-billable (`n`). Splits werk over middernacht in twee boekingen.
- `Ctrl+S` opent review: controleer exacte argumenten, bestemming en waarschuwingen.
  `e`/`Esc` gaat terug naar bewerken; `y` doet één directe write als die is toegestaan.
  Bij mogelijk dubbel boeken is expliciete acceptatie met `d` nodig; FINAL/gesloten dagen blokkeren boeken.
- Support: `i` maakt een interne notitie, `a` een klantantwoordconcept, `b` opent boeken als het ticket
  een projecttaak heeft. Een directe interne notitie bevat geen uren of nieuwe toewijzing.
- Correcties: `x` kiest een verwijderconcept. Klantantwoord: `w` wisselt wachten op klant,
  `f` wisselt follow-up. Na review slaat `s` het concept op; het verstuurt niets.
- Capabilities toont beschikbare, ontbrekende en gewijzigde toolcontracten. Ontbrekende inputs schakelen
  de betreffende tool uit; timers, board- en custom-field-writes worden niet aangeroepen.

## Veiligheid en uitkomsten

Correcties, verwijderen en klantantwoorden zijn **altijd draft-only**, ook met `--direct-writes` en in demo.
De TUI voert `UpdateTimeEntry`, `DeleteTimeEntry` en `ReplyToTicket` niet uit en verstuurt geen klantantwoord.
Concepten bevatten de exacte argumenten, eerdere toestand, neveneffecten en readback-instructies.
Eventuele uitvoering buiten de TUI vereist afzonderlijke review en per-aanroep Executor-approval;
de lokale gateway handhaaft die policy niet en de approvalketen is in deze route niet bewezen.

Directe writes worden **nooit automatisch opnieuw geprobeerd**, ook niet na timeout of verbindingsverlies.
Een succesantwoord alleen volstaat niet: de app leest de opgeslagen boeking of notitie terug.

| Readback   | Betekenis / actie                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| `Verified` | Teruggelezen gegevens komen overeen.                                                                 |
| `Mismatch` | Gegevens of neveneffecten wijken af: stoppen en onderzoeken.                                         |
| `Unknown`  | Niet eenduidig vast te stellen; `r` herleest zonder opnieuw te schrijven. Niet blind opnieuw boeken. |
| `Rejected` | Afgewezen of aantoonbaar niet verstuurd; controleer de reden vóór een nieuwe review.                 |

Orbit levert kloktijden zonder bewezen brontijdzone. Datum en tijd blijven ongeconverteerd;
`Europe/Amsterdam` dient alleen voor weergavewaarschuwingen, niet als bewijs van de opgeslagen zone.
Controleer vooral zomer-/wintertijd en maand-/jaargrenzen.

Houd sleutel en concepten privé: sleutelbestand `0600`, directory `0700`; nieuwe concepten worden met
dezelfde private rechten aangemaakt. Zet een bestaande conceptdirectory zelf op `0700`.
Deel geen sleutels in chat, logs, screenshots of versiebeheer. Concepten kunnen echte klantgegevens bevatten.
De gateway-sleutel is niet read-only: wie hem bezit kan Orbit-tools met jouw rechten gebruiken.
Read-only is een TUI-beperking, geen beperking van de sleutel.
