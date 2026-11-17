// Loads the data, builds the controls and redraws every chart when the scenario changes.
import { burnMinutes, curveFor, dstOffset, simulate } from "./model.js";
import { makePeople } from "./random.js";
import { toModelParams } from "./params.js";
import { buildControls } from "./controls.js";
import { describe } from "./describe.js";
import { fromHash, toHash } from "./hash.js";
import { fmt } from "./svg.js";
import { drawDay } from "./charts/day.js";
import { drawTube } from "./charts/tube.js";
import { drawBottle } from "./charts/bottle.js";
import { drawSun } from "./charts/sun.js";

const PEOPLE = 1000, SEED = 20261117, STORE_KEY = "real-world-spf";
const $ = id => document.getElementById(id);

async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  return res.json();
}

// A shared link wins; otherwise this visitor's last settings; otherwise the defaults.
function initialState(defaults, cities) {
  const linked = fromHash(location.hash, cities, defaults);
  if (linked) return linked;
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (saved && cities.includes(saved.city)) return { ...defaults, ...saved };
  } catch (e) { /* storage blocked: use defaults */ }
  return defaults;
}

function remember(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
  try { history.replaceState(null, "", "#" + toHash(state)); } catch (e) { /* sandboxed frame */ }
}

function render(state, p, uv, people) {
  remember(state);
  const city = uv.cities[state.city];
  const curve = curveFor(city, state.month, state.day, dstOffset(state.city, state.month, p.dstCities));
  const ctx = { sc: state, p, curve };
  drawDay($("daySvg"), ctx);
  drawTube($("tubeSvg"), ctx, $("amountText"));
  const spf = drawBottle($("bottleSvg"), ctx);
  const { counts } = simulate(people, state, p, curve);
  drawSun($("sunSvg"), counts, $("sunTitle"));

  const text = describe(state, curve, spf, counts);
  [["daySvg", text.day], ["tubeSvg", text.tube], ["bottleSvg", text.bottle], ["sunSvg", text.sun]].forEach(([id, t]) => $(id).setAttribute("aria-label", t));
  $("sunSummary").textContent = text.sun;
  const station = city.station[0].toUpperCase() + city.station.slice(1);
  const place = station === state.city ? state.city : `${state.city} (${station} station)`;
  $("srcDay").textContent = `Source: ARPANSA UV index, ${place}, ${city.years.join("–")} · CC BY 2.5 AU`;

  const bare = Math.round(burnMinutes(curve.peak, p.med[state.skin], p.uviW));
  const wearing = state.amount >= p.testDose ? `roughly SPF ${state.spf}` : `somewhere between SPF ${fmt(spf.exp)} and SPF ${fmt(spf.lin)}`;
  $("quoteText").textContent = `You bought SPF ${state.spf}. At this amount you're wearing ${wearing}. Unprotected, type ${state.skin} skin would burn in about ${bare} minutes at the midday peak here.`;
}

async function start() {
  try {
    const [rawParams, uv] = await Promise.all([loadJson("data/parameters.json"), loadJson("data/uv_peaks.json")]);
    const p = toModelParams(rawParams);
    const cities = Object.keys(uv.cities);
    const defaults = { city: "Brisbane", month: new Date().getMonth(), day: "typical", start: 10, hours: 4, skin: "II", spf: 50, activity: "beach", reapply: true, amount: p.defaultAmount };
    const people = makePeople(PEOPLE, SEED, p.weightExp);
    let state = initialState(defaults, cities);
    const update = next => { state = next; sync(); render(state, p, uv, people); };
    const sync = buildControls(() => state, cities, p, change => update({ ...state, ...change }));
    window.addEventListener("hashchange", () => {
      const linked = fromHash(location.hash, cities, defaults);
      if (linked && toHash(linked) !== toHash(state)) update(linked);
    });
    render(state, p, uv, people);
  } catch (err) {
    console.error(err);
    $("quoteText").textContent = "The UV data didn't load, so the charts can't be drawn. Refresh the page to try again.";
  }
}

start();
