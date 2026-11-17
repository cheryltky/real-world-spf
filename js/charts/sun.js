// Figure 2: 100 simulated people arranged as a sun, burnt ones in the core.
import { el } from "../svg.js";

const CX = 235, CY = 235, GAP = 23, RAYS = 13;

function positions() {
  const pos = [[CX, CY]];
  for (let ring = 1; ring <= 4; ring++) {
    for (let i = 0; i < ring * 6; i++) {
      const a = i / (ring * 6) * Math.PI * 2 - Math.PI / 2;
      pos.push([CX + Math.cos(a) * ring * GAP, CY + Math.sin(a) * ring * GAP]);
    }
  }
  for (let ray = 0; ray < RAYS; ray++) {
    for (let j = 0; j < 3; j++) {
      const a = ray / RAYS * Math.PI * 2 - Math.PI / 2, r = (5.6 + j * 1.15) * GAP;
      pos.push([CX + Math.cos(a) * r, CY + Math.sin(a) * r]);
    }
  }
  return pos; // 61 in the disc + 39 in the rays
}
const SPOTS = positions();

export function drawSun(s, counts, titleEl) {
  s.replaceChildren();
  SPOTS.forEach(([x, y], i) => {
    const burnt = i < counts.burnt, pink = !burnt && i < counts.burnt + counts.pink;
    s.append(el("circle", { class: "dot", cx: x, cy: y, r: 9.5, fill: burnt ? "var(--burn)" : pink ? "var(--pink)" : "var(--safe)", stroke: "var(--ink)", "stroke-width": burnt ? 2 : 0.8 }));
  });
  [["var(--burn)", `${counts.burnt} badly burnt (2+ MED)`, 2], ["var(--pink)", `${counts.pink} pink (1–2 MED)`, 0.8], ["var(--safe)", `${counts.safe} no burn`, 0.8]].forEach(([c, t, w], i) => {
    s.append(el("circle", { cx: 20, cy: 18 + i * 22, r: 7, fill: c, stroke: "var(--ink)", "stroke-width": w }));
    s.append(el("text", { x: 34, y: 22 + i * 22, class: "svg-label" }, t));
  });
  titleEl.textContent = `Out of 100 people like you, ${counts.burnt + counts.pink} get burnt`;
}
