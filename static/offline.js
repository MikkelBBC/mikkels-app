/* Service worker (så appen kan åbnes uden net) og en besked, hvis den lokale server ikke kører.
   I web-versionen (GitHub Pages) er der ingen server at tjekke. */
"use strict";

const WEB_URL = "https://mikkelbbc.github.io/mikkels-app/";

if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* fx ikke-sikker adresse */ });
}

function showOffline() {
  if ($("#offline")) return;
  const el = document.createElement("div");
  el.id = "offline";
  el.innerHTML = `<div class="off-card">
    <div class="pet-wrap big">${typeof petSvg === "function" ? petSvg("Unge", "sleepy") : ""}</div>
    <h2>Serveren kører ikke</h2>
    <p class="muted">Start den på PC'en med <code>python app.py</code>, eller brug web-versionen, som altid kører.</p>
    <a class="btn" href="${WEB_URL}">${ic("globe")}Åbn web-versionen</a>
    <button class="btn ghost" id="off-retry">${ic("refresh")}Prøv igen</button>
  </div>`;
  document.body.appendChild(el);
  $("#off-retry").onclick = () => location.reload();
}

async function checkServer() {
  if (STATIC_MODE) return;
  try {
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 4000);
    const r = await fetch("api/ping", { signal: ctl.signal, cache: "no-store" });
    if (!r.ok) throw new Error();
    $("#offline")?.remove();
  } catch { showOffline(); }
}
checkServer();
window.addEventListener("online", checkServer);
