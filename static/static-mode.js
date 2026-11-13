/* Statisk tilstand: appen kører uden server, fx på GitHub Pages.
   - YouTube-forslag og nyheder er hentet på forhånd af GitHub Actions (data/*.json).
   - Podcasts hentes direkte fra Apples åbne podcast-API (tillader opslag fra browseren).
   - Fremskridt, likes og gemte ting ligger kun på enheden (localStorage).
   Lokalt med python app.py er STATIC_MODE false, og alt går til serveren som før. */
"use strict";

const STATIC_MODE = location.hostname.endsWith(".github.io") || new URLSearchParams(location.search).has("static");

const staticData = {};
async function staticJson(name) {
  if (!staticData[name]) {
    staticData[name] = fetch(`data/${name}.json`, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error("Data er ikke klar endnu – prøv igen om lidt");
      return r.json();
    }).catch((e) => { delete staticData[name]; throw e; });
  }
  return staticData[name];
}

async function itunes(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Podcast-søgning fejlede");
  return (await r.json()).results || [];
}

function rssDuration(v) {
  if (!v) return 0;
  return String(v).split(":").reduce((s, x) => s * 60 + (parseFloat(x) || 0), 0) | 0;
}

async function rssEpisodes(feed) {
  if (!/^https:\/\//.test(feed || "")) return null;   // kun https, så siden forbliver sikker
  const ctl = new AbortController(); setTimeout(() => ctl.abort(), 8000);
  const r = await fetch(feed, { signal: ctl.signal });
  if (!r.ok) return null;
  const doc = new DOMParser().parseFromString(await r.text(), "text/xml");
  const txt = (el, sel) => el.getElementsByTagName(sel)[0]?.textContent?.trim() || "";
  const episodes = [...doc.getElementsByTagName("item")].slice(0, 60).map((it) => {
    const enc = it.getElementsByTagName("enclosure")[0];
    const date = Date.parse(txt(it, "pubDate"));
    const summary = (txt(it, "itunes:summary") || txt(it, "description")).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return { title: txt(it, "title"), audio: enc?.getAttribute("url") || "", date: date ? Math.floor(date / 1000) : 0,
      duration: rssDuration(txt(it, "itunes:duration")), summary: summary.length > 220 ? summary.slice(0, 219) + "…" : summary };
  }).filter((e) => e.audio);
  return { title: txt(doc.getElementsByTagName("channel")[0] || doc, "title"), episodes };
}

const ytWords = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s]/g, " ").split(/\s+/).filter((w) => w.length > 1);

async function staticApi(path) {
  const u = new URL(path, location.href), p = u.searchParams;
  switch (u.pathname.replace(/.*\/api\//, "/api/")) {
    case "/api/yt/search": {
      const q = (p.get("q") || "").trim();
      const link = q.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/);
      if (link) return [{ id: link[1], title: "Video fra link", channel: "", duration: 0, views: 0, thumb: `https://i.ytimg.com/vi/${link[1]}/mqdefault.jpg` }];
      const yt = await staticJson("yt");
      if (yt.queries[q]) return yt.queries[q];
      // Fri søgning: find videoer i den hentede pulje, hvor flest søgeord passer på titel eller kanal
      const want = ytWords(q), seen = new Set(), hits = [];
      for (const list of Object.values(yt.queries)) for (const v of list) {
        if (seen.has(v.id)) continue;
        seen.add(v.id);
        const have = new Set(ytWords(v.title + " " + v.channel));
        const score = want.filter((w) => have.has(w)).length;
        if (score) hits.push([score, v]);
      }
      return hits.sort((a, b) => b[0] - a[0]).slice(0, 24).map((h) => h[1]);
    }
    case "/api/pod/search": {
      const q = p.get("q") || "";
      const res = await itunes(`https://itunes.apple.com/search?media=podcast&country=DK&limit=20&term=${encodeURIComponent(q)}`);
      return res.filter((x) => x.feedUrl).map((x) => ({ id: x.collectionId, title: x.collectionName, author: x.artistName,
        feed: x.feedUrl, art: x.artworkUrl600 || x.artworkUrl100 }));
    }
    case "/api/pod/episodes": {
      // 1) Prøv selve RSS-feedet (giver alle afsnit; mange podcast-værter tillader opslag fra browseren)
      const rss = await rssEpisodes(p.get("feed")).catch(() => null);
      if (rss && rss.episodes.length) return rss;
      // 2) Ellers Apples podcast-API (giver kun de nyeste afsnit for nogle podcasts)
      let id = p.get("id");
      if (!id && p.get("title")) {   // gamle gemte podcasts uden id: find den via titel og feed
        const res = await itunes(`https://itunes.apple.com/search?media=podcast&country=DK&limit=10&term=${encodeURIComponent(p.get("title"))}`);
        id = (res.find((x) => x.feedUrl === p.get("feed")) || res[0] || {}).collectionId;
      }
      if (!id) throw new Error("Kunne ikke finde podcasten – søg efter den igen");
      const res = await itunes(`https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&entity=podcastEpisode&limit=60&country=DK`);
      const show = res.find((x) => x.wrapperType === "track" && x.kind === "podcast") || {};
      const episodes = res.filter((x) => x.episodeUrl).map((x) => ({
        title: x.trackName || "", audio: x.episodeUrl, date: x.releaseDate ? Math.floor(Date.parse(x.releaseDate) / 1000) : 0,
        duration: Math.round((x.trackTimeMillis || 0) / 1000), summary: String(x.description || x.shortDescription || "").slice(0, 220) }));
      return { title: show.collectionName || "", episodes };
    }
    case "/api/news": return (await staticJson("news")).items;
    case "/api/events": {
      const d = await staticJson("events"), today = new Date().toISOString().slice(0, 10);
      return { ...d, events: (d.events || []).filter((e) => (e.date || "") >= today), refreshing: false, error: null };
    }
    case "/api/events/refresh": return { refreshing: false };
    case "/api/storage": return { dirs: [], total: 0 };
    case "/api/storage/clear": return { freed: 0 };
    default: throw new Error("Ikke tilgængelig i web-versionen");
  }
}
