// Prints the headline results quoted in the README, from the same model the page uses.
import { readFileSync } from "node:fs";
import { curveFor, dstOffset, protection, simulate } from "../js/model.js";
import { makePeople } from "../js/random.js";
import { toModelParams } from "../js/params.js";

const read = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const p = toModelParams(read("parameters.json"));
const uv = read("uv_peaks.json");
const people = makePeople(1000, 20261117, p.weightExp);
const base = { city: "Brisbane", month: 11, day: "typical", start: 10, hours: 4, skin: "II", spf: 50, activity: "beach", reapply: true, amount: p.defaultAmount };

const run = sc => simulate(people, sc, p, curveFor(uv.cities[sc.city], sc.month, sc.day, dstOffset(sc.city, sc.month, p.dstCities))).counts;
const rows = [
  ["Brisbane, December, 0.5 mg/cm2, reapplying", base],
  ["Same, lab amount 2 mg/cm2", { ...base, amount: 2 }],
  ["Same, 0.39 mg/cm2 (median applied)", { ...base, amount: 0.39 }],
  ["Same, 0.5 mg/cm2, applied once", { ...base, reapply: false }],
  ["Same, SPF 30", { ...base, spf: 30 }],
  ["Hobart, December, 0.5 mg/cm2, reapplying", { ...base, city: "Hobart" }]
];
for (const [label, sc] of rows) {
  const c = run(sc);
  console.log(`${label}: burnt ${c.burnt}, pink ${c.pink}, safe ${c.safe}`);
}
for (const a of [0.39, 0.5, 1, 2]) console.log(`SPF 50 at ${a} mg/cm2: exp ${protection(50, a, "exp").toFixed(1)}, lin ${protection(50, a, "lin").toFixed(1)}`);
