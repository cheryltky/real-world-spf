// Small helpers shared by the charts.

export function el(tag, attrs = {}, text) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

export const fmt = v => (v >= 10 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, ""));

export function hourLabel(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const suffix = hh >= 12 ? "pm" : "am";
  return ((hh + 11) % 12 + 1) + (mm ? ":" + String(mm).padStart(2, "0") : "") + suffix;
}
