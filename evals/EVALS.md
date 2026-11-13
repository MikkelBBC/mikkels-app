# Evals – Mikkels App

Kriterier som appen skal leve op til. `run_evals.py` (review-botten) gennemgår dem og skriver en rapport i `evals/reports/`.

Kør: `python evals/run_evals.py` (serveren skal køre for kategori 6-7). Med `--judge` faktatjekker Claude også alle spørgsmål (kræver Anthropic-login eller `ANTHROPIC_API_KEY`, koster lidt).

| # | Kategori | Hvad betyder det | Hvordan botten tjekker | Grænse |
|---|---|---|---|---|
| 1 | **Faktuel korrekthed** | Ingen falske svar eller forklaringer i quizzen | `--judge`: Claude vurderer hvert spørgsmål (rigtigt svar, forkerte svar er faktisk forkerte, forklaring passer). Uden `--judge`: kun regnestykker der kan genberegnes (hash, heap, Amdahl, paging) | 0 fejl |
| 2 | **Eksamensrelevans** | DOA-enheder dækker emnerne fra de skriftlige sæt 2022-2026; SYS dækker alle 12 mundtlige emner + basis | Tjekker at hvert eksamensemne har en enhed med nok spørgsmål | 100 % dækning, ≥ 6 spm. pr. enhed |
| 3 | **Spørgsmålskvalitet** | Fire svarmuligheder, unikke, med forklaring, ingen pladsholdertekst | Struktur-tjek af `quiz-data.js` | 0 fejl |
| 4 | **Ingen svar-afsløring** | Det rigtige svar må ikke kunne gættes ved at vælge den længste mulighed | Andel spørgsmål hvor rigtigt svar er det længste | ≤ 50 % (advarsel), ≤ 35 % (mål) |
| 5 | **Motivation uden lootboxes** | Point, streak, dagsmål og niveauer – ingen tilfældige belønninger | Søger efter XP/streak/dagsmål i koden og efter lootbox/kiste/`Math.random`-belønninger | Alle til stede, ingen lootbox |
| 6 | **Hastighed** | YouTube-forslag og nyheder skal føles hurtige | Måler API-svartider | YouTube < 6 s, nyheder < 12 s (kold cache) |
| 7 | **Produktivt nudge i YouTube** | Feedet skal vægte læring/AI og skjule gameplay | Tæller andelen af "lær"-søgninger i mix og tjekker gameplay-filter på rigtige resultater | ≥ 45 % lær, 0 gameplay |
| 8 | **Lager** | Appen må ikke fylde på telefonen | Ingen download-kode; "Ryd alt"-endpoint findes | Ingen downloads |
| 9 | **Mobil og design** | Virker på telefon, tydelig kode | viewport-meta, monospace + linjenumre til kode, bundnavigation | Alle til stede |
| 10 | **Nyheder er ikke kedelige** | Markedsføring/kundehistorier skal ikke fylde "Det vigtigste" | Andel af top-5 der matcher markedsføringsfilteret | 0 i top-5 |
| 11 | **Events er ægte og aktuelle** | AI-events fundet af Claude må ikke være opfundne eller udløbne, og søgningen skal bruge abonnementet | Fremtidig dato i rigtigt format, direkte link der virker (ikke en forside), højst 4 dage gammel liste, ANTHROPIC_API_KEY fjernes før `claude -p` | 0 fejl |

## Hvornår køres den
- Efter hver ændring af `quiz-data.js` eller `app.py`
- Ugentligt (kan sættes op som planlagt opgave)

## Tilføj nye kategorier
Tilføj en række her og en funktion `check_<navn>` i `run_evals.py`, og registrér den i `CHECKS`.
