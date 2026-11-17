// "Squeeze the tube": amount applied as a line of cream along a teaspoon ruler.
import { el, fmt } from "../svg.js";

const MAX_TSP = 9, ML_PER_TSP = 5;
const X = tsp => 250 + tsp / MAX_TSP * 720;

export function drawTube(s, { sc, p }, textEl) {
  s.replaceChildren();
  const bodyTsp = mg => mg / p.testDose * p.fullBodyMl / ML_PER_TSP;
  const tsp = bodyTsp(sc.amount), labTsp = bodyTsp(p.testDose);
  const squeeze = Math.min(1, sc.amount / 2.5);
  const top = 40 + squeeze * 16, bot = 130 - squeeze * 16;
  s.append(el("path", { d: `M 20 30 L 40 30 L 200 ${top} L 200 ${bot} L 40 140 L 20 140 Z`, fill: "var(--card)", stroke: "var(--ink)", "stroke-width": 1.5 }));
  s.append(el("rect", { x: 14, y: 26, width: 12, height: 118, rx: 3, fill: "var(--peach)", stroke: "var(--ink)", "stroke-width": 1.5 }));
  s.append(el("rect", { x: 200, y: 70, width: 30, height: 30, rx: 4, fill: "var(--peach)", stroke: "var(--ink)", "stroke-width": 1.5 }));
  s.append(el("text", { x: 60, y: 82, class: "svg-label", "font-weight": 700 }, `SPF ${sc.spf}`));
  s.append(el("text", { x: 60, y: 100, class: "svg-small wide-only" }, "BROAD SPECTRUM"));
  const end = X(tsp);
  s.append(el("path", { class: "swatchline", d: `M 232 78 C 240 78 245 85 250 85 L ${end - 10} 85 Q ${end + 8} 85 ${end + 4} 92 Q ${end} 99 ${end - 12} 99 L 250 99 C 244 99 240 92 232 92 Z`, fill: "var(--liquid)", stroke: "var(--ink)", "stroke-width": 1.3 }));
  s.append(el("line", { x1: X(0), x2: X(MAX_TSP), y1: 128, y2: 128, stroke: "var(--ink)" }));
  for (let t = 0; t <= MAX_TSP; t++) {
    s.append(el("line", { x1: X(t), x2: X(t), y1: 128, y2: 136, stroke: "var(--ink)" }));
    s.append(el("text", { x: X(t), y: 154, "text-anchor": "middle", class: "svg-small" }, t));
  }
  s.append(el("text", { x: X(MAX_TSP), y: 190, "text-anchor": "end", class: "svg-small" }, "TEASPOONS FOR A FULL ADULT BODY"));
  s.setAttribute("viewBox", "0 0 1000 200");
  s.append(el("line", { x1: X(labTsp), x2: X(labTsp), y1: 52, y2: 124, stroke: "var(--burn)", "stroke-dasharray": "3 4", "stroke-width": 1.5 }));
  s.append(el("text", { x: X(labTsp), y: 44, "text-anchor": "middle", class: "svg-label", fill: "var(--burn)" }, "the lab test amount"));
  textEl.textContent = `${sc.amount.toFixed(2)} mg/cm² · ${fmt(tsp)} tsp body · ${Math.round(sc.amount / p.testDose * 100)}% of the lab amount`;
}
