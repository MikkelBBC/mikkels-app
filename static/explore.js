/* UDFORSK: store idéer i små bidder.
   Sund doom-scrolling: uendeligt feed af korte koncepter med ét hurtigt spørgsmål hver.
   Faste point (5 XP første gang du forstår en idé) – ingen tilfældige belønninger. */
"use strict";

const EX_DAILY = 10;
let exDone = store.get("exDone", {});          // id → true når besvaret rigtigt
let exSaved = store.get("exSaved", []);
let exTopic = store.get("exTopic", "all");
const ex = { order: [], pos: 0, obs: null };

function exToday() { const d = store.get("exDay", { day: today(), n: 0 }); return d.day === today() ? d : { day: today(), n: 0 }; }

function exPool() {
  const list = exTopic === "saved" ? CONCEPTS.filter((c) => exSaved.includes(c.id))
    : exTopic === "all" ? CONCEPTS : CONCEPTS.filter((c) => c.t === exTopic);
  // Nye idéer først, så dem du har set – i ny rækkefølge hver runde.
  return [...shuffle(list.filter((c) => !exDone[c.id])), ...shuffle(list.filter((c) => exDone[c.id]))];
}

function exHeroText(d, pct) {
  const known = CONCEPTS.filter((c) => exDone[c.id]).length;
  return `${known} af ${CONCEPTS.length} idéer forstået · ${pct >= 100 ? "dagens idéer klaret" : `${EX_DAILY - d.n} til dagens mål`}`;
}

function renderExplore(el) {
  const d = exToday(), pct = Math.min(100, Math.round(d.n / EX_DAILY * 100));
  el.innerHTML = `
    ${courseSeg("explore")}
    ${typeof petCard === "function" ? petCard() : ""}
    <div class="ex-hero">
      <div class="goal-ring sm" style="--p:${pct}"><span>${d.n}<small>/${EX_DAILY}</small></span></div>
      <div><h2>Store idéer på 30 sekunder</h2><span class="muted" id="ex-sub">${exHeroText(d, pct)}</span></div>
    </div>
    <div class="chips ex-topics">
      <button class="chip ${exTopic === "all" ? "on" : ""}" data-t="all">${ic("shuffle")}Alle</button>
      ${TOPICS.map((t) => `<button class="chip ${exTopic === t.id ? "on" : ""}" data-t="${t.id}">${ic(t.icon)}${esc(t.name)}</button>`).join("")}
      <button class="chip ${exTopic === "saved" ? "on" : ""}" data-t="saved">${ic("bookmark")}Gemte</button>
    </div>
    <div id="ex-feed"></div>
    <div id="ex-sentinel" class="loading"></div>`;
  bindCourseSeg(el);
  el.querySelectorAll(".ex-topics .chip").forEach((b) => b.onclick = () => { exTopic = b.dataset.t; store.set("exTopic", exTopic); renderExplore(el); });
  ex.obs?.disconnect();
  ex.order = exPool(); ex.pos = 0;
  if (!ex.order.length) {
    $("#ex-feed").innerHTML = `<div class="empty">${exTopic === "saved" ? "Tryk på bogmærket på en idé for at gemme den her." : "Ingen idéer her endnu."}</div>`;
    return;
  }
  exMore();
  ex.obs = new IntersectionObserver((es) => { if (es[0].isIntersecting) exMore(); }, { rootMargin: "600px" });
  ex.obs.observe($("#ex-sentinel"));
}

function exMore() {
  const feed = $("#ex-feed");
  if (!feed || !ex.order.length) return;
  for (let k = 0; k < 5; k++) {
    if (ex.pos >= ex.order.length) { ex.order = exPool(); ex.pos = 0; }   // uendeligt: start en ny runde
    feed.insertAdjacentHTML("beforeend", exCard(ex.order[ex.pos++]));
  }
  feed.querySelectorAll(".ex-card:not([data-bound])").forEach(exBind);
}

function exCard(c) {
  const topic = TOPICS.find((t) => t.id === c.t);
  const kind = c.type === "order" ? "Rækkefølge" : c.type === "tf" ? "Sandt eller falsk" : c.chart ? "Læs grafen" : "";
  let answers;
  if (c.type === "order") {
    answers = `<div class="order-list">${shuffle(c.items.map((t, i) => ({ t, i }))).map((o) =>
      `<button class="opt sm ord" data-i="${o.i}"><span class="ord-n"></span><span>${esc(o.t)}</span></button>`).join("")}</div>`;
  } else if (c.type === "tf") {
    answers = `<div class="tf-row">${["Sandt", "Falsk"].map((t) => `<button class="opt sm tf" data-i="${c.o.indexOf(t)}"><span>${t}</span></button>`).join("")}</div>`;
  } else {
    answers = shuffle(c.o.map((t, i) => ({ t, i }))).map((o) => `<button class="opt sm" data-i="${o.i}"><span>${esc(o.t)}</span></button>`).join("");
  }
  return `<article class="ex-card t-${c.t} ${c.type ? "k-" + c.type : ""}" data-id="${c.id}">
    <div class="ex-top"><span class="ex-topic">${ic(topic.icon)}${esc(topic.name)}${kind ? `<span class="ex-kind">${kind}</span>` : ""}</span>
      <button class="icon ghost ex-save ${exSaved.includes(c.id) ? "on" : ""}" aria-label="Gem idé">${ic("bookmark")}</button></div>
    <h3>${esc(c.title)}</h3>
    <p class="ex-text">${esc(c.text)}</p>
    ${c.chart ? `<div class="chart-wrap">${chartSvg(c.chart)}</div>` : ""}
    <div class="ex-q"><b>${esc(c.q)}</b>
      ${answers}</div>
    <div class="ex-fb"></div>
  </article>`;
}

function exBind(card) {
  card.dataset.bound = "1";
  const c = CONCEPTS.find((x) => x.id === card.dataset.id);
  card.querySelector(".ex-save").onclick = (e) => {
    exSaved = exSaved.includes(c.id) ? exSaved.filter((x) => x !== c.id) : [...exSaved, c.id];
    store.set("exSaved", exSaved);
    e.currentTarget.classList.toggle("on", exSaved.includes(c.id));
  };
  if (c.type === "order") {
    // Tryk i rækkefølge. Når alle er trykket, tjekkes rækkefølgen.
    const picked = [];
    card.querySelectorAll(".ord").forEach((b) => b.onclick = () => {
      if (b.classList.contains("picked")) {          // fortryd: fjern dette og alt efter det
        const k = picked.indexOf(+b.dataset.i);
        picked.splice(k).forEach((i) => { const x = card.querySelector(`.ord[data-i="${i}"]`); x.classList.remove("picked"); x.querySelector(".ord-n").textContent = ""; });
        return;
      }
      picked.push(+b.dataset.i);
      b.classList.add("picked");
      b.querySelector(".ord-n").textContent = picked.length;
      try { navigator.vibrate?.(5); } catch { /* */ }
      if (picked.length < c.items.length) return;
      const ok = picked.every((v, k) => v === k);
      card.querySelectorAll(".ord").forEach((x) => {
        x.disabled = true;
        const want = +x.dataset.i, pos = picked.indexOf(want);
        x.classList.add(pos === want ? "right" : "wrong");
        x.querySelector(".ord-n").textContent = want + 1;
      });
      if (!ok) {
        const list = card.querySelector(".order-list");
        [...list.children].sort((p, q) => p.dataset.i - q.dataset.i).forEach((x) => list.appendChild(x));
      }
      exResolve(card, c, ok, b);
    });
    return;
  }
  card.querySelectorAll(".opt").forEach((b) => b.onclick = () => {
    const ok = +b.dataset.i === 0;
    card.querySelectorAll(".opt").forEach((x) => { x.disabled = true; if (+x.dataset.i === 0) x.classList.add("right"); });
    if (!ok) b.classList.add("wrong");
    exResolve(card, c, ok, b);
  });
}

function exResolve(card, c, ok, b) {
  {
    const first = ok && !exDone[c.id];
    if (first) { exDone[c.id] = true; store.set("exDone", exDone); game.add(5); celebrate(b, "+5"); }
    else if (ok) celebrate(null);
    const d = exToday(); d.n++; store.set("exDay", d);
    typeof track === "function" && track("idea", { ok });
    if (d.n === EX_DAILY) toast("Dagens 10 idéer klaret");
    card.classList.add(ok ? "solved" : "missed");
    card.querySelector(".ex-fb").innerHTML = `<div class="explain ${ok ? "" : "bad"}"><b>${ok ? (first ? "Rigtigt · +5 XP" : "Rigtigt") : "Ikke helt"}</b><br>${esc(c.e)}</div>`;
    const pct = Math.min(100, Math.round(d.n / EX_DAILY * 100));
    const ring = $(".ex-hero .goal-ring");
    if (ring) { ring.style.setProperty("--p", pct); ring.innerHTML = `<span>${d.n}<small>/${EX_DAILY}</small></span>`; ring.classList.remove("bump"); void ring.offsetWidth; ring.classList.add("bump"); }
    const sub = $("#ex-sub");
    if (sub) sub.textContent = exHeroText(d, pct);
  }
}

// app.js tegner Lær før denne fil er indlæst – tegn igen hvis Udforsk var valgt.
if (course === "explore" && currentTab === "learn" && !lesson) renderLearn();

// AI-værktøjsguiden bor nu her i Lær som et emne i Udforsk (før var den en fane under AI).
TOPICS.push({ id: "tools", name: "AI-værktøjer", icon: "sparkles" });
AI_TOOLS.forEach((t, i) => {
  const others = AI_TOOLS.filter((x) => x !== t).map((x) => x.pick);
  CONCEPTS.push({ id: "tool-" + i, t: "tools", title: t.task, text: t.why,
    q: `Hvilket værktøj passer bedst til: ${t.task.toLowerCase()}?`, o: [t.pick, others[i % others.length], others[(i + 3) % others.length]],
    e: `${t.pick}. Alternativer: ${t.alts.join(", ")}.` });
});
if (course === "explore" && currentTab === "learn" && !lesson) renderLearn();
