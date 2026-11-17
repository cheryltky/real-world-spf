// Figure 1: a pump bottle filled to the SPF you get, with leader-line labels.
import { el, fmt } from "../svg.js";
import { decayedSpf, protection } from "../model.js";

const BODY_TOP = 150, BODY_BOT = 440, L = 70, R = 220, LOG_TOP = 64;
const Y = v => BODY_BOT - Math.log(Math.max(1, v)) / Math.log(LOG_TOP) * (BODY_BOT - BODY_TOP - 10);
const BODY = `M ${L} 160 Q ${L} 128 112 122 L 158 122 Q ${R} 128 ${R} 160 L ${R} 425 Q ${R} 445 200 445 L 90 445 Q ${L} 445 ${L} 425 Z`;

function drawShape(s, spf) {
  s.append(el("path", { d: "M 120 40 L 200 40 L 200 54 L 150 54 L 150 70 L 120 70 Z", fill: "var(--card)", stroke: "var(--ink)", "stroke-width": 1.5 }));
  s.append(el("rect", { x: 118, y: 70, width: 34, height: 52, fill: "var(--card)", stroke: "var(--ink)", "stroke-width": 1.5 }));
  s.append(el("path", { d: BODY, fill: "var(--glass)", stroke: "var(--ink)", "stroke-width": 1.5 }));
  const clip = el("clipPath", { id: "bclip" });
  clip.append(el("path", { d: BODY }));
  s.append(clip);
  return () => {
    s.append(el("rect", { x: 92, y: 220, width: 106, height: 56, rx: 6, fill: "var(--card)", stroke: "var(--ink)" }));
    s.append(el("text", { x: 145, y: 252, "text-anchor": "middle", class: "svg-big", "font-size": 24 }, `SPF ${spf}`));
    s.append(el("text", { x: 145, y: 268, "text-anchor": "middle", class: "svg-small" }, "ON THE LABEL"));
  };
}

function drawLeaders(s, marks) {
  let lastY = -Infinity;
  marks.map(m => ({ ...m, y: Y(m.v) })).sort((a, b) => a.y - b.y).forEach(m => {
    const ty = Math.max(m.y, lastY + 40);
    lastY = ty;
    s.append(el("line", { x1: R - 30, x2: R + 4, y1: m.y, y2: m.y, stroke: "var(--ink)", "stroke-dasharray": m.dash ? "3 3" : "none" }));
    s.append(el("polyline", { points: `${R + 4},${m.y} ${R + 30},${ty} ${R + 46},${ty}`, fill: "none", class: "lead" }));
    s.append(el("text", { x: R + 52, y: ty + 1, class: "svg-label", "font-weight": 700 }, m.title));
    s.append(el("text", { x: R + 52, y: ty + 17, class: "svg-small" }, m.sub.toUpperCase()));
  });
}

export function drawBottle(s, { sc, p }) {
  s.replaceChildren();
  const lin = protection(sc.spf, sc.amount, "lin", p.testDose);
  const exp = protection(sc.spf, sc.amount, "exp", p.testDose);
  const later = decayedSpf(exp, p.reapplyHours, p.halfLife[sc.activity]);
  const label = drawShape(s, sc.spf);
  const g = el("g", { "clip-path": "url(#bclip)" });
  g.append(el("rect", { class: "liquid", x: L, y: Y(lin), width: R - L, height: BODY_BOT + 10 - Y(lin), fill: "var(--peach)", "fill-opacity": 0.45 }));
  g.append(el("rect", { class: "liquid", x: L, y: Y(exp), width: R - L, height: BODY_BOT + 10 - Y(exp), fill: "var(--peach)" }));
  [[100, 400, 5], [180, 380, 3], [140, 420, 4], [195, 330, 2.5]].forEach(([x, y, r]) => g.append(el("circle", { cx: x, cy: y, r, fill: "none", stroke: "var(--ink)", "stroke-opacity": 0.25 })));
  s.append(g);
  label();
  drawLeaders(s, [
    { v: sc.spf, title: `SPF ${sc.spf}`, sub: "what the label promises", dash: true },
    { v: lin, title: `SPF ${fmt(lin)}`, sub: "optimistic model" },
    { v: exp, title: `SPF ${fmt(exp)}`, sub: "cautious model" },
    { v: later, title: `SPF ${fmt(later)}`, sub: `cautious, ${p.reapplyHours} hours later` }
  ]);
  return { exp, lin };
}
