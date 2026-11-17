// Hero chart: the sky's UV through the day and the UV that reaches the skin.
import { el, hourLabel } from "../svg.js";
import { lastApplication, skinCurve, uvAt } from "../model.js";

const FROM = 6, TO = 20, LEFT = 40, WIDTH = 650, BASE = 240, TOP_UV = 16;
const X = h => LEFT + (h - FROM) / (TO - FROM) * WIDTH;
const Y = u => BASE - Math.min(u, TOP_UV) / TOP_UV * 200;
const BANDS = [[3, "moderate"], [6, "high"], [8, "very high"], [11, "extreme"]];

const path = points => points.map(([h, u], i) => `${i ? "L" : "M"} ${X(h).toFixed(1)} ${Y(u).toFixed(1)}`).join(" ");

function drawSky(s, curve) {
  for (const [u, name] of BANDS) {
    s.append(el("line", { x1: LEFT, x2: LEFT + WIDTH, y1: Y(u), y2: Y(u), stroke: "var(--ink)", "stroke-opacity": 0.12, "stroke-dasharray": "2 5" }));
    s.append(el("text", { x: LEFT + WIDTH - 4, y: Y(u) - 4, "text-anchor": "end", class: "svg-small" }, name));
  }
  const pts = [];
  for (let h = FROM; h <= TO + 1e-9; h += 0.1) pts.push([h, uvAt(h, curve)]);
  s.append(el("path", { d: `${path(pts)} L ${X(TO)} ${Y(0)} L ${X(FROM)} ${Y(0)} Z`, fill: "var(--butter)", "fill-opacity": 0.75, stroke: "var(--ink)", "stroke-width": 1.2 }));
}

function drawSun(s, curve) {
  const sx = X(curve.noon), sy = Y(curve.peak) - 26;
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    s.append(el("line", { x1: sx + Math.cos(a) * 17, y1: sy + Math.sin(a) * 17, x2: sx + Math.cos(a) * 24, y2: sy + Math.sin(a) * 24, stroke: "var(--ink)", "stroke-width": 1.5, "stroke-linecap": "round" }));
  }
  s.append(el("circle", { cx: sx, cy: sy, r: 13, fill: "var(--butter)", stroke: "var(--ink)", "stroke-width": 1.5 }));
  const anchor = sx > X(15) ? "end" : "start";
  s.append(el("text", { x: anchor === "end" ? sx - 32 : sx + 32, y: sy + 5, "text-anchor": anchor, class: "svg-label" }, `UV ${curve.peak} peak at ${hourLabel(curve.noon)}`));
}

export function drawDay(s, { sc, p, curve }) {
  s.replaceChildren();
  const end = Math.min(TO, sc.start + sc.hours);
  s.append(el("rect", { x: X(sc.start), y: 30, width: X(end) - X(sc.start), height: 210, fill: "var(--glass)", rx: 10 }));
  s.append(el("text", { x: X(sc.start) + 8, y: 48, class: "svg-small" }, "YOU'RE OUTSIDE"));
  drawSky(s, curve);
  s.append(el("path", { d: path(skinCurve(sc, p, curve, "exp", TO)), fill: "none", stroke: "var(--burn)", "stroke-width": 3, "stroke-linecap": "round" }));
  s.append(el("path", { d: path(skinCurve(sc, p, curve, "lin", TO)), fill: "none", stroke: "var(--burn)", "stroke-width": 2, "stroke-dasharray": "4 4" }));
  drawSun(s, curve);
  if (sc.reapply) {
    for (let t = sc.start; t < end; t += p.reapplyHours) {
      const x = X(lastApplication(t, sc.start, true, p.reapplyHours));
      s.append(el("path", { d: `M ${x} ${BASE + 8} q -6 9 0 13 q 6 -4 0 -13 z`, fill: "var(--sky)", stroke: "var(--ink)", "stroke-width": 1 }));
    }
  }
  for (let h = FROM; h <= TO; h += 2) s.append(el("text", { x: X(h), y: 275, "text-anchor": "middle", class: "svg-small" }, hourLabel(h)));
  s.append(el("line", { x1: LEFT, x2: LEFT + WIDTH, y1: BASE, y2: BASE, stroke: "var(--ink)", "stroke-width": 1.2 }));
  s.append(el("rect", { x: LEFT, y: 292, width: 14, height: 8, fill: "var(--butter)", stroke: "var(--ink)" }));
  s.append(el("text", { x: LEFT + 20, y: 300, class: "svg-small" }, "UV in the sky"));
  s.append(el("line", { x1: 250, x2: 270, y1: 296, y2: 296, stroke: "var(--burn)", "stroke-width": 3 }));
  s.append(el("text", { x: 276, y: 300, class: "svg-small" }, "UV on your skin (dashed: optimistic)"));
  s.setAttribute("viewBox", "0 0 740 312");
}
