/* Forklaring før quiz. Hver enhed kan have en kort lektion, der vises før spørgsmålene:
   læs (tekst + tegning) → gennemregnet eksempel trin for trin → små tjek-spørgsmål → quiz.
   Kun tryk, ingen skrivning. Tjek-spørgsmål giver ingen XP; de er til at hente viden frem.
   Kort-typer:
     { kind: "read",  title, body, code?, chart?, visual? }   visual = navn på tegnefunktion i LESSON_VIS
     { kind: "steps", title, body, code, rows: [[venstre, højre], ...], outro }
     { kind: "check", q, code?, o: [...], a, e }                o blandes, a = index på rigtigt svar */
"use strict";

const LESSONS = {
  "doa/bigo": [
    { kind: "read", title: "Hvad måler Big-O?",
      body: "Big-O siger ikke hvor mange sekunder noget tager. Det siger hvordan <b>antallet af skridt vokser</b>, når input (n) bliver større.<br><br>Grafen viser tre typiske vækstrater. Ved n = 16 tager n log n 64 skridt, n tager 16, og log n kun 4. Forskellen bliver større jo større n er.",
      chart: { kind: "line", x: "n (antal elementer)", y: "Antal skridt", series: [
        { name: "n log n", pts: Array.from({ length: 16 }, (_, i) => [i + 1, +((i + 1) * Math.log2(i + 1)).toFixed(1)]) },
        { name: "n", pts: Array.from({ length: 16 }, (_, i) => [i + 1, i + 1]) },
        { name: "log n", pts: Array.from({ length: 16 }, (_, i) => [i + 1, +Math.log2(i + 1).toFixed(2)]) },
      ] } },

    { kind: "read", title: "Kun det største led tæller",
      body: "Tæller du skridt, får du ofte noget som T(n) = 2n² + 50n + 10. For små n fylder 50n mest, men når n vokser, æder n²-leddet alt andet.<br><br>Derfor gør man to ting: <b>behold kun det største led</b> og <b>drop konstanten foran</b>. 2n² + 50n + 10 bliver til O(n²).",
      visual: "dominant" },

    { kind: "check", q: "T(n) = 5n + 2000. Hvad er Big-O?",
      o: ["O(n)", "O(1), fordi 2000 er størst", "O(5n + 2000)", "O(2000n)"], a: 0,
      e: "For store n vinder 5n over 2000, og konstanten 5 droppes → O(n). Konstante faktorer skriver man ikke med i Big-O." },

    { kind: "read", title: "Én løkke over n = O(n)",
      body: "Løkken kører én gang pr. element, og arbejdet inde i den er konstant (et plus og en tildeling). n gennemløb × konstant arbejde = <b>O(n)</b>.",
      code: `int sum = 0;
for (int i = 0; i < n; i++)
  sum += a[i];` },

    { kind: "read", title: "Indlejrede løkker ganges",
      body: "Ligger en løkke inde i en anden, kører den inderste helt igennem for hvert gennemløb af den yderste. n × n = <b>n²</b> gange <code>count++</code>.<br><br>Tegningen viser n = 6: alle 36 felter er ét skridt. Starter den indre løkke ved <code>j = i + 1</code>, er det kun de farvede felter over diagonalen, n(n−1)/2 = 15. Det er stadig ca. n²/2, og ½ droppes → også O(n²).",
      code: `for (int i = 0; i < n; i++)
  for (int j = 0; j < n; j++)
    count++;`,
      visual: "grid" },

    { kind: "check", q: "Hvad er Big-O for hele stykket kode?",
      code: `for (int i = 0; i < n; i++)
  for (int j = 0; j < n; j++)
    count++;
for (int k = 0; k < n; k++)
  total++;`,
      o: ["O(n²)", "O(n³), fordi der er tre løkker", "O(n), fordi den sidste løkke er alene", "O(2n), to løkker efter hinanden"], a: 0,
      e: "Løkker efter hinanden lægges sammen: n² + n. Indlejrede ganges. Største led er n² → O(n²)." },

    { kind: "steps", title: "Når i fordobles: log n",
      body: "Følg løkken med n = 16. Tryk for at tage ét gennemløb ad gangen.",
      code: `for (int i = 1; i < n; i *= 2)
  cout << i;`,
      rows: [
        ["i = 1", "1 < 16 → kør (1. gang)"],
        ["i = 2", "2 < 16 → kør (2. gang)"],
        ["i = 4", "4 < 16 → kør (3. gang)"],
        ["i = 8", "8 < 16 → kør (4. gang)"],
        ["i = 16", "16 < 16 er falsk → stop"],
      ],
      outro: "4 gennemløb, og log₂ 16 = 4. Fordobler du n til 32, kommer der kun ét gennemløb mere. Det er kendetegnet for <b>O(log n)</b>: når i ganges eller deles med et fast tal, er antallet af gennemløb log n." },

    { kind: "check", q: "Hvad er tidskompleksiteten?",
      code: `for (int i = n; i > 1; i /= 2)
  steps++;`,
      o: ["O(log n)", "O(n), fordi i starter ved n", "O(n/2), fordi i halveres", "O(1), fordi den stopper ved 1"], a: 0,
      e: "Halvering er fordobling baglæns: n, n/2, n/4 … 1. Antallet af halveringer er log₂ n → O(log n)." },

    { kind: "read", title: "Rangordningen du skal kunne",
      body: "Fra hurtigst til langsomst. Tallene er antal skridt ved n = 16, og bjælkerne er på log-skala, ellers kunne man ikke se de små.",
      visual: "rank" },

    { kind: "read", title: "Best case og worst case",
      body: "Samme algoritme kan tage forskelligt antal skridt alt efter input. Lineær søgning gennem 8 tal:<br><br><b>Best case</b>: tallet står først → 1 sammenligning, O(1).<br><b>Worst case</b>: tallet findes ikke → alle 8 tjekkes, O(n).<br><br>Spørger eksamen bare om tidskompleksiteten, er det næsten altid worst case.",
      visual: "search" },

    { kind: "read", title: "Opskriften",
      body: "<ol class=\"recipe\"><li>Find løkkerne.</li><li>Hvor mange gange kører hver? n, log n (gange/dele) eller et fast tal.</li><li>Indlejrede løkker <b>ganges</b>, løkker efter hinanden <b>lægges sammen</b>.</li><li>Behold største led og drop konstanter.</li><li>Tænk på worst case, medmindre andet står.</li></ol>Nu kommer quizzen. Det er når du selv skal hente svaret frem, at det sætter sig." },
  ],
};

/* ---------- tegninger (ren SVG, farver fra temaet) ---------- */
const LESSON_VIS = {
  dominant() {
    const rows = [10, 100, 1000].map((n) => {
      const parts = [2 * n * n, 50 * n, 10], tot = parts.reduce((s, v) => s + v, 0);
      return { n, pct: parts.map((v) => v / tot * 100) };
    });
    const names = ["2n²", "50n", "10"];
    const bar = (r) => `<div class="dom-row"><span class="dom-n">n = ${r.n}</span><div class="dom-bar">${r.pct.map((p, i) =>
      `<i style="width:${p}%;background:${CHART_COLORS[i]}">${p >= 12 ? Math.round(p) + "%" : ""}</i>`).join("")}</div></div>`;
    return `<div class="dom">${rows.map(bar).join("")}
      <div class="dom-legend">${names.map((t, i) => `<span><i style="background:${CHART_COLORS[i]}"></i>${t}</span>`).join("")}</div>
      <p class="muted">Andel af de samlede skridt. Ved n = 1000 står 2n² for ${rows[2].pct[0].toFixed(1).replace(".", ",")} %.</p></div>`;
  },
  grid() {
    const n = 6, s = 26, g = 4, W = n * (s + g);
    let out = "";
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const upper = j > i;
      out += `<rect x="${j * (s + g)}" y="${i * (s + g)}" width="${s}" height="${s}" rx="5" style="fill:${upper ? CHART_COLORS[0] : "var(--line)"}"/>`;
    }
    return `<div class="vis-center"><svg viewBox="-24 -22 ${W + 28} ${W + 26}" width="220" role="img" aria-label="Gitter med 6 gange 6 felter">
      <text x="${W / 2}" y="-8" class="ct" text-anchor="middle">j →</text><text x="-12" y="${W / 2}" class="ct" text-anchor="middle">i</text>${out}</svg>
      <p class="muted">36 felter = n². Farvede felter (j &gt; i) = 15 = n(n−1)/2.</p></div>`;
  },
  rank() {
    const n = 16, rows = [["O(1)", 1], ["O(log n)", Math.log2(n)], ["O(n)", n], ["O(n log n)", n * Math.log2(n)],
      ["O(n²)", n ** 2], ["O(n³)", n ** 3], ["O(2ⁿ)", 2 ** n]];
    const max = Math.log2(2 ** n + 1);
    return `<div class="rank">${rows.map(([t, v], i) => `<div class="rank-row"><span class="rank-t">${t}</span>
      <div class="rank-bar"><i style="width:${Math.max(4, Math.log2(v + 1) / max * 100)}%;background:${CHART_COLORS[i % 4]}"></i></div>
      <span class="rank-v">${v.toLocaleString("da-DK")}</span></div>`).join("")}</div>`;
  },
  search() {
    const arr = [7, 3, 9, 1, 8, 4, 6, 2];
    const row = (label, hit, find) => `<div class="srch"><span class="muted">${label}</span><div class="srch-cells">${arr.map((v, i) =>
      `<span class="cell ${i < hit ? "seen" : ""} ${find && i === 0 ? "hit" : ""}">${v}</span>`).join("")}</div></div>`;
    return `<div class="srch-wrap">${row("Find 7 (best case): 1 tjek", 1, true)}${row("Find 5 (worst case): 8 tjek", 8, false)}</div>`;
  },

  /* Generelle tegninger, styret af data på kortet: vis: { type: "array" | "tree" | "graph" | "table" | "flow", ... } */
  // rows: [{ label, cells: [...], hl: { index: "a"|"b"|"c"|"dim" }, marks: { index: "tekst" }, idx: true }]
  array(v) {
    return `<div class="va">${v.rows.map((r) => `<div class="va-row">${r.label ? `<span class="muted">${r.label}</span>` : ""}
      <div class="va-cells">${r.cells.map((c, i) => `<div class="va-c"><span class="cell ${r.hl?.[i] || ""}">${esc(String(c))}</span>
        ${r.idx ? `<small>${i}</small>` : ""}${r.marks?.[i] ? `<b>${esc(r.marks[i])}</b>` : ""}</div>`).join("")}</div></div>`).join("")}
      ${v.note ? `<p class="muted">${v.note}</p>` : ""}</div>`;
  },
  // trees: [{ label, nodes: niveauorden med null for huller, hl: [værdier] }]
  tree(v) {
    const one = (t) => {
      const depth = Math.floor(Math.log2(t.nodes.length)) + 1, W = 260, H = 34 + depth * 50;
      const pos = (i) => { const d = Math.floor(Math.log2(i + 1)), p = i - (2 ** d - 1); return [(p + 0.5) / 2 ** d * W, 22 + d * 50]; };
      let lines = "", dots = "";
      t.nodes.forEach((val, i) => {
        if (val === null || val === undefined) return;
        const [x, y] = pos(i);
        if (i > 0) { const [px, py] = pos(Math.floor((i - 1) / 2)); lines += `<line x1="${px}" y1="${py}" x2="${x}" y2="${y}" class="vt-e"/>`; }
        const on = (t.hl || []).includes(val);
        dots += `<circle cx="${x}" cy="${y}" r="15" class="vt-n ${on ? "on" : ""}"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" class="vt-t ${on ? "on" : ""}">${esc(String(val))}</text>`;
      });
      return `<figure class="vt-fig"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Træ">${lines}${dots}</svg>${t.label ? `<figcaption class="muted">${t.label}</figcaption>` : ""}</figure>`;
    };
    return `<div class="vt">${v.trees.map(one).join("")}</div>${v.note ? `<p class="muted">${v.note}</p>` : ""}`;
  },
  // nodes: { navn: [x, y] } i et 300×180-felt, edges: [[fra, til, vægt?]], directed, hl: ["A-B"], squares: [navne]
  graph(v) {
    const N = v.nodes, hl = new Set(v.hl || []);
    const isHl = (a, b) => hl.has(`${a}-${b}`) || (!v.directed && hl.has(`${b}-${a}`));
    let edges = "", nodes = "";
    v.edges.forEach(([a, b, w]) => {
      const [x1, y1] = N[a], [x2, y2] = N[b], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      const sx = x1 + ux * 17, sy = y1 + uy * 17, ex = x2 - ux * (v.directed ? 21 : 17), ey = y2 - uy * (v.directed ? 21 : 17);
      edges += `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" class="vg-e ${isHl(a, b) ? "on" : ""}" ${v.directed ? 'marker-end="url(#vg-arr)"' : ""}/>`;
      if (w !== undefined) {
        const mx = (x1 + x2) / 2 - uy * 11, my = (y1 + y2) / 2 + ux * 11 + 4;
        edges += `<text x="${mx}" y="${my}" text-anchor="middle" class="vg-w ${isHl(a, b) ? "on" : ""}">${esc(String(w))}</text>`;
      }
    });
    for (const [k, [x, y]] of Object.entries(N)) {
      const on = (v.hlNodes || []).includes(k);
      nodes += (v.squares || []).includes(k)
        ? `<rect x="${x - 15}" y="${y - 15}" width="30" height="30" rx="5" class="vt-n sq ${on ? "on" : ""}"/>`
        : `<circle cx="${x}" cy="${y}" r="15" class="vt-n ${on ? "on" : ""}"/>`;
      nodes += `<text x="${x}" y="${y + 4.5}" text-anchor="middle" class="vt-t ${on ? "on" : ""}">${esc(k)}</text>`;
    }
    return `<div class="vis-center"><svg viewBox="0 0 300 185" role="img" aria-label="Graf">
      <defs><marker id="vg-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="vg-a"/></marker></defs>
      ${edges}${nodes}</svg>${v.note ? `<p class="muted">${v.note}</p>` : ""}</div>`;
  },
  // head: [...], rows: [[...]], hl: rækkeindex
  table(v) {
    return `<div class="vtab-wrap"><table class="vtab"><thead><tr>${v.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${v.rows.map((r, i) => `<tr class="${v.hl === i ? "on" : ""}">${r.map((c) => `<td>${esc(String(c))}</td>`).join("")}</tr>`).join("")}</tbody></table>
      ${v.note ? `<p class="muted">${v.note}</p>` : ""}</div>`;
  },
  // steps: ["boks", ...] lodret med pile, hl: index
  flow(v) {
    return `<div class="vf">${v.steps.map((s, i) => `${i ? `<span class="vf-arr">${ic("right")}</span>` : ""}<div class="vf-box ${v.hl === i ? "on" : ""}">${esc(s)}</div>`).join("")}</div>
      ${v.note ? `<p class="muted">${v.note}</p>` : ""}`;
  },
};

/* ---------- visning ---------- */
let lessonSeen = store.get("lessonsSeen", {});
let lessonRun = null;

function lessonFor(c, u) { return u && u.id ? LESSONS[`${c.id}/${u.id}`] : null; }

function renderLessonCard() {
  const R = lessonRun, card = R.cards[R.i], last = R.i === R.cards.length - 1;
  const el = $("#learn");
  let inner = "";
  if (card.kind === "check") {
    inner = `<div class="les-kicker">${ic("bulb")} Tjek dig selv</div><h2>${inline(card.q)}</h2>
      ${card.code ? `<pre class="code">${highlight(card.code)}</pre>` : ""}
      <div id="opts">${R.order.map((o, k) => `<button class="opt" data-i="${o.i}"><span class="k">${"ABCD"[k]}</span><span>${inline(o.t)}</span></button>`).join("")}</div>
      <div id="les-fb"></div>`;
  } else {
    inner = `<div class="les-kicker">${ic("book")} Forklaring</div><h2>${esc(card.title)}</h2>
      <div class="les-body">${card.body}</div>
      ${card.code ? `<pre class="code">${highlight(card.code)}</pre>` : ""}
      ${card.chart ? `<div class="chart-wrap">${chartSvg(card.chart)}</div>` : ""}
      ${card.visual ? LESSON_VIS[card.visual]() : ""}
      ${card.vis ? LESSON_VIS[card.vis.type](card.vis) : ""}
      ${card.kind === "steps" ? `<div class="steps">${card.rows.map((r, k) => `<div class="step ${k < R.shown ? "on" : ""}"><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div>`).join("")}</div>
        ${R.shown >= card.rows.length ? `<div class="les-body les-outro">${card.outro}</div>` : ""}` : ""}`;
  }
  const stepsLeft = card.kind === "steps" && R.shown < card.rows.length;
  const blocked = card.kind === "check" && !R.answered;
  el.innerHTML = `
    <div class="lesson-top">
      <button class="icon" id="les-quit" title="Afslut">${ic("x")}</button>
      <div class="les-dots">${R.cards.map((_, k) => `<i class="${k < R.i ? "done" : k === R.i ? "now" : ""}"></i>`).join("")}</div>
      ${R.seen ? `<button class="btn ghost sm" id="les-skip">Til quiz</button>` : ""}
    </div>
    <div class="qcard les-card ${R.fresh ? "les-in" : ""}">
      <div class="topic">${esc(R.c.name)} · ${esc(R.u.title)}</div>
      ${inner}
    </div>
    <div class="les-nav">
      ${R.i > 0 ? `<button class="btn ghost" id="les-back">${ic("left")} Tilbage</button>` : "<span></span>"}
      ${stepsLeft ? `<button class="btn" id="les-step">Næste trin (${R.shown + 1}/${card.rows.length})</button>`
        : `<button class="btn" id="les-next" ${blocked ? "disabled" : ""}>${last ? `Start quiz (${R.u.questions.length} spm.) ${ic("right")}` : `Videre ${ic("right")}`}</button>`}
    </div>`;

  $("#les-quit").onclick = () => { lessonRun = null; renderLearn(); };
  const skip = $("#les-skip"); if (skip) skip.onclick = () => lessonDone();
  const back = $("#les-back"); if (back) back.onclick = () => lessonGo(R.i - 1);
  const step = $("#les-step"); if (step) step.onclick = () => { R.shown++; renderLessonCard(); const on = document.querySelectorAll(".step.on"); (on[on.length - 1] || $("#les-step"))?.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
  const next = $("#les-next"); if (next) next.onclick = () => last ? lessonDone() : lessonGo(R.i + 1);
  if (card.kind === "check") el.querySelectorAll(".opt").forEach((b) => b.onclick = () => lessonCheck(+b.dataset.i, b));
  R.fresh = false;
}

function lessonGo(i) {
  const R = lessonRun;
  R.i = i; R.shown = 0; R.answered = false; R.fresh = true;
  const card = R.cards[i];
  R.order = card.kind === "check" ? shuffle(card.o.map((t, k) => ({ t, i: k }))) : null;
  renderLessonCard();
  window.scrollTo(0, 0);
}

function lessonCheck(i, btn) {
  const R = lessonRun, card = R.cards[R.i], ok = i === card.a;
  R.answered = true;
  document.querySelectorAll(".opt").forEach((b) => { b.disabled = true; if (+b.dataset.i === card.a) b.classList.add("right"); });
  if (!ok) btn.classList.add("wrong");
  $("#les-fb").innerHTML = `<div class="explain ${ok ? "" : "bad"}"><b>${ok ? "Rigtigt." : "Ikke helt."}</b><br>${inline(card.e)}</div>`;
  const next = $("#les-next"); if (next) next.disabled = false;
  $("#les-fb").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function lessonDone() {
  const R = lessonRun;
  lessonSeen[`${R.c.id}/${R.u.id}`] = today();
  store.set("lessonsSeen", lessonSeen);
  lessonRun = null;
  typeof track === "function" && track("lessonRead", {});
  lessonStartQuiz(R.c, R.u);
}

/* Første gang en enhed åbnes kommer forklaringen automatisk. Har man set den, kan man vælge. */
const lessonStartQuiz = startLesson;
startLesson = function (c, u) {
  const cards = lessonFor(c, u);
  if (!cards) return lessonStartQuiz(c, u);
  const seen = !!lessonSeen[`${c.id}/${u.id}`];
  if (seen) return lessonChooser(c, u, cards);
  lessonRun = { c, u, cards, i: 0, seen: false };
  lessonGo(0);
};

function lessonChooser(c, u, cards) {
  const el = $("#learn");
  const reads = cards.filter((k) => k.kind !== "check").length, checks = cards.length - reads;
  el.innerHTML = `
    <div class="lesson-top"><button class="icon" id="les-quit" title="Afslut">${ic("x")}</button></div>
    <div class="qcard les-card les-choose">
      <div class="topic">${esc(c.name)} · ${esc(u.title)}</div>
      <h2>Hvor vil du starte?</h2>
      <button class="les-opt" id="les-read"><span class="ico">${ic("book")}</span><div><b>Se forklaringen igen</b><span class="muted">${reads} korte kort og ${checks} tjek-spørgsmål, ca. 3 min.</span></div></button>
      <button class="les-opt" id="les-quiz"><span class="ico">${ic("play")}</span><div><b>Gå direkte til quiz</b><span class="muted">${u.questions.length} spørgsmål</span></div></button>
    </div>`;
  $("#les-quit").onclick = () => renderLearn();
  $("#les-read").onclick = () => { lessonRun = { c, u, cards, i: 0, seen: true }; lessonGo(0); };
  $("#les-quiz").onclick = () => lessonStartQuiz(c, u);
  window.scrollTo(0, 0);
}

/* Mærk enheder med forklaring på stien. */
const lessonRenderLearn = renderLearn;
renderLearn = function () {
  const r = lessonRenderLearn.apply(this, arguments);
  document.querySelectorAll("#learn .node").forEach((b) => {
    const label = b.closest(".node-wrap")?.querySelector(".node-label > span:not(.stars)");
    if (label && LESSONS[`${course}/${b.dataset.u}`] && !label.querySelector(".les-tag"))
      label.insertAdjacentHTML("afterbegin", `<span class="les-tag">${ic("book")} Forklaring</span> `);
  });
  return r;
};
