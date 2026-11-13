/* Små grafer til spørgsmål. Spec:
   { kind: "line" | "bar", x: "akse-tekst", y: "akse-tekst", series: [{ name, pts: [[x, y], ...] }], labels?: [...] (bar) }
   Tegnes som ren SVG, farver følger temaet. */
"use strict";

const CHART_COLORS = ["#dd2a7b", "#515bd4", "#f58529", "#10b981"];

function chartSvg(spec) {
  const W = 320, H = 190, L = 34, R = 10, T = 12, B = 34;
  const iw = W - L - R, ih = H - T - B;
  let out = "";
  if (spec.kind === "bar") {
    const vals = spec.series[0].pts.map((p) => p[1]);
    const max = Math.max(...vals) * 1.1 || 1, n = vals.length, bw = iw / n * 0.62;
    vals.forEach((v, i) => {
      const x = L + iw / n * (i + 0.5) - bw / 2, h = v / max * ih;
      out += `<rect x="${x}" y="${T + ih - h}" width="${bw}" height="${h}" rx="4" fill="${CHART_COLORS[i % 4]}" opacity=".9"/>`;
      out += `<text x="${x + bw / 2}" y="${H - B + 15}" class="ct" text-anchor="middle">${esc(spec.labels?.[i] ?? spec.series[0].pts[i][0])}</text>`;
    });
  } else {
    const all = spec.series.flatMap((s) => s.pts);
    const xmin = Math.min(...all.map((p) => p[0])), xmax = Math.max(...all.map((p) => p[0]));
    const ymin = Math.min(0, ...all.map((p) => p[1])), ymax = Math.max(...all.map((p) => p[1])) * 1.08 || 1;
    const sx = (x) => L + (x - xmin) / (xmax - xmin || 1) * iw, sy = (y) => T + ih - (y - ymin) / (ymax - ymin) * ih;
    for (let g = 1; g <= 3; g++) out += `<line x1="${L}" x2="${W - R}" y1="${T + ih * g / 4}" y2="${T + ih * g / 4}" class="cg"/>`;
    spec.series.forEach((s, i) => {
      const d = s.pts.map((p, k) => `${k ? "L" : "M"}${sx(p[0]).toFixed(1)} ${sy(p[1]).toFixed(1)}`).join(" ");
      out += `<path d="${d}" fill="none" stroke="${CHART_COLORS[i % 4]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
      const last = s.pts[s.pts.length - 1];
      if (s.name) out += `<text x="${Math.min(sx(last[0]), W - R) - 2}" y="${sy(last[1]) - 7}" class="ct" text-anchor="end" fill="${CHART_COLORS[i % 4]}" style="fill:${CHART_COLORS[i % 4]};font-weight:700">${esc(s.name)}</text>`;
    });
  }
  out += `<line x1="${L}" x2="${L}" y1="${T}" y2="${T + ih}" class="ca"/><line x1="${L}" x2="${W - R}" y1="${T + ih}" y2="${T + ih}" class="ca"/>`;
  if (spec.x) out += `<text x="${L + iw / 2}" y="${H - 4}" class="ct" text-anchor="middle">${esc(spec.x)}</text>`;
  if (spec.y) out += `<text x="12" y="${T + ih / 2}" class="ct" text-anchor="middle" transform="rotate(-90 12 ${T + ih / 2})">${esc(spec.y)}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Graf">${out}</svg>`;
}

// Hjælper til at lave punkter ud fra en funktion.
const curve = (f, a, b, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, f(x)]; });
