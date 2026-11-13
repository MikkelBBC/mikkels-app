/* Fremgang: lokalt (python app.py) tages automatisk backup til serveren i data/progress.json, så Claude kan se den.
   I web-versionen (GitHub Pages) ligger alt kun på enheden, og browseren bedes om ikke at slette det. */
"use strict";

const SYNC_TARGETS = STATIC_MODE ? [] : [""];
if (STATIC_MODE && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
const device = (() => {
  let d = store.get("device", null);
  if (!d) { d = (/android/i.test(navigator.userAgent) ? "telefon-" : /iphone|ipad/i.test(navigator.userAgent) ? "iphone-" : "pc-") + Math.random().toString(36).slice(2, 7); store.set("device", d); }
  return d;
})();

function snapshot() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("ma:") && k !== "ma:device") data[k] = localStorage.getItem(k);
  }
  return data;
}

let syncTimer = null;
function syncSoon() { clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, 3000); }
function syncNow() {
  const body = JSON.stringify({ device, label: `${device} (${location.host})`, xp: game.xp, data: snapshot() });
  for (const base of SYNC_TARGETS) {
    fetch(base + "/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: body.length < 60000 })
      .catch(() => { /* serveren kører ikke – prøver igen næste gang */ });
  }
}

// Sync hver gang noget gemmes, og når appen lukkes/skjules.
const _set = store.set;
store.set = (k, v) => { _set(k, v); if (k !== "device") syncSoon(); };
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") syncNow(); });

// Gendan: er browseren tom (ryddet, ny adresse), hentes den bedste backup for denne enhed – ellers den med mest XP.
async function restoreIfEmpty() {
  if (localStorage.getItem("ma:xp") && JSON.parse(localStorage.getItem("ma:xp")) > 0) { syncSoon(); return; }
  for (const base of SYNC_TARGETS) {
    try {
      const pr = await (await fetch(base + "/api/progress", { cache: "no-store" })).json();
      const devs = Object.entries(pr.devices || {});
      if (!devs.length) continue;
      const pick = (pr.devices[device] && pr.devices[device].xp > 0 ? pr.devices[device] : null)
        || devs.map(([, v]) => v).sort((a, b) => (b.xp || 0) - (a.xp || 0))[0];
      if (!pick || !(pick.xp > 0)) continue;
      for (const [k, v] of Object.entries(pick.data)) localStorage.setItem(k, v);
      toast(`Fremgang gendannet: ${pick.xp} XP`);
      setTimeout(() => location.reload(), 900);
      return;
    } catch { /* prøv næste */ }
  }
}
restoreIfEmpty();
