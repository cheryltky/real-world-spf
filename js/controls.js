// Builds the input controls and keeps them in sync with the scenario state.
import { hourLabel } from "./svg.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const SKIN = [
  { id: "I", color: "#f6dcc8", hint: "always burns, never tans" },
  { id: "II", color: "#edc3a3", hint: "usually burns, tans a little" },
  { id: "III", color: "#d9a37f", hint: "sometimes burns, tans gradually" },
  { id: "IV", color: "#b97f58", hint: "rarely burns, tans easily" },
  { id: "V", color: "#8d5a3b", hint: "very rarely burns" },
  { id: "VI", color: "#5c3a26", hint: "almost never burns" }
];
const ACTIVITY = [["relax", "Relaxing"], ["beach", "Beach and swimming"], ["sport", "Running or sport"]];
const $ = id => document.getElementById(id);

function select(id, options, key, get, onChange) {
  const box = $(id);
  options.forEach(([value, label]) => box.append(new Option(label, value)));
  box.onchange = e => onChange({ [key]: typeof get()[key] === "number" ? +e.target.value : e.target.value });
  return () => { box.value = String(get()[key]); };
}

function chips(id, items, key, get, onChange) {
  const box = $(id);
  const render = () => box.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === String(get()[key]))));
  items.forEach(([value, label]) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.dataset.v = String(value); b.textContent = label;
    b.onclick = () => onChange({ [key]: value });
    box.append(b);
  });
  return render;
}

function skinSwatches(get, p, onChange) {
  const box = $("skin");
  const render = () => {
    box.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === get().skin)));
    const sk = SKIN.find(s => s.id === get().skin);
    $("skinHint").textContent = `Type ${sk.id}: ${sk.hint}${p.medUncertain.includes(sk.id) ? " (less studied, so less certain)" : ""}`;
  };
  SKIN.forEach(sk => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "sw"; b.dataset.v = sk.id; b.style.background = sk.color; b.textContent = sk.id;
    b.setAttribute("aria-label", `Skin type ${sk.id}, ${sk.hint}`);
    b.onclick = () => onChange({ skin: sk.id });
    box.append(b);
  });
  return render;
}

function amountSlider(get, p, onChange) {
  const slider = $("amount");
  slider.oninput = e => onChange({ amount: +e.target.value });
  [[0.39, "What people usually apply"], [1.0, "A generous layer"], [p.testDose, "The lab amount"]].forEach(([v, label]) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = label;
    b.onclick = () => { slider.value = v; onChange({ amount: v }); };
    $("presets").append(b);
  });
  return () => { slider.value = get().amount; };
}

// Builds every control once and returns sync(), which redraws them all from the current state.
export function buildControls(get, cities, p, onChange) {
  const syncs = [
    select("city", cities.map(c => [c, c]), "city", get, onChange),
    select("month", MONTHS.map((m, i) => [i, m]), "month", get, onChange),
    select("start", Array.from({ length: 10 }, (_, i) => [i + 7, hourLabel(i + 7)]), "start", get, onChange),
    select("hours", Array.from({ length: 8 }, (_, i) => [i + 1, `for ${i + 1} hour${i ? "s" : ""}`]), "hours", get, onChange),
    chips("day", [["typical", "Typical day"], ["clear", "Clear day"]], "day", get, onChange),
    chips("spf", [[15, "SPF 15"], [30, "SPF 30"], [50, "SPF 50"]], "spf", get, onChange),
    chips("activity", ACTIVITY, "activity", get, onChange),
    chips("reapply", [[true, "Yes"], [false, "No, once only"]], "reapply", get, onChange),
    skinSwatches(get, p, onChange),
    amountSlider(get, p, onChange)
  ];
  const sync = () => syncs.forEach(fn => fn());
  sync();
  return sync;
}
