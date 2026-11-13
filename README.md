# Mikkels App

Én app i stedet for tre: eksamensquiz (DOA + SYS) med point og streak, uendelig YouTube-feed, podcasts og AI-nyt. Streamer alt, så den fylder ikke på telefonen.

## Brug den
**På telefonen (ingen PC, ingen Termux):** åbn https://mikkelbbc.github.io/mikkels-app/ i Chrome eller Brave og vælg "Installer app" / "Føj til startskærm". Den kører over HTTPS, virker uden net efter første besøg og opdaterer sig selv.

- YouTube-forslag og AI-nyheder hentes af GitHub Actions hver 4. time (`tools/build_site.py`, `.github/workflows/pages.yml`).
- Podcasts hentes direkte fra podcastens RSS-feed eller Apples podcast-API.
- Fremgang, likes og gemte ting ligger kun på enheden.

**Lokalt på PC'en** (med live YouTube-søgning, event-søgning med Claude og backup til `data/`):
```bash
pip install -r requirements.txt
python app.py
```
Åbn http://127.0.0.1:8770. Serveren svarer kun på localhost og afviser skrivninger fra andre hjemmesider.

## Faner
- **Lær** – Duolingo-agtig sti. `static/quiz-data.js` har alle spørgsmål (DOA fra eksamenssættene 2022-2026, SYS fra de 12 mundtlige emner). XP, streak, dagsmål, niveauer, stjerner og "Repetér fejl". Fremgang gemmes i browseren.
- **YouTube** – rul for flere forslag. Stemninger: Mix, Lær, Interessant, Slå fra. Gameplay filtreres fra. Søgninger står i `MOODS` i `static/app.js`.
- **Podcasts** – iTunes-søgning, gem favoritter, streaming.
- **AI** – nyheder sorteret efter vigtighed, **AI-events** og guide til AI-værktøjer.
  - Events findes af Claude via `claude -p` (Claude Code CLI) med websøgning. Det bruger dit Claude-abonnement, ikke en API-nøgle (`ANTHROPIC_API_KEY` fjernes før kaldet). Søgeprompten står i `events_prompt.md`.
  - Søger automatisk igen hver 3. dag (eller tryk ↻). Tager ca. 2 min. Events med døde links eller gamle datoer smides væk. Resultatet gemmes i `data/events.json`.
  - ☆ Gem et event → påmindelse øverst på Lær-siden. 📅 åbner Google Kalender med eventet udfyldt.
  - Kræver at Claude Code er installeret og logget ind på maskinen, der kører serveren.
- 🧹 – rydder gamle MikkelsYT-downloads (`~/storage/downloads/Medier` eller `~/Downloads/Medier`) og YouTube-historik.

## Evals
Se `evals/EVALS.md`. Kør `python evals/run_evals.py` (serveren skal køre). `--judge` lader Claude (claude-opus-5-5) faktatjekke alle spørgsmål; det kræver `pip install -U anthropic` og login/API-nøgle, og koster lidt. Fallback ved afvisning er slået til (`fallbacks="default"`).
