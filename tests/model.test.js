import { describe, expect, it } from "vitest";
import {
  burnMinutes, curveFor, decayedSpf, doseInMed, dstOffset, lastApplication,
  outcomeCounts, protection, simulate, skinCurve, uvAt
} from "../js/model.js";
import { makePeople } from "../js/random.js";
import { toModelParams } from "../js/params.js";
import raw from "../data/parameters.json";
import uv from "../data/uv_peaks.json";

const p = toModelParams(raw);
const base = { city: "Brisbane", month: 0, day: "typical", start: 10, hours: 4, skin: "II", spf: 50, activity: "beach", reapply: true, amount: 0.5 };
const curve = sc => curveFor(uv.cities[sc.city], sc.month, sc.day, dstOffset(sc.city, sc.month, p.dstCities));
const people = makePeople(300, 42, p.weightExp);

describe("protection", () => {
  it("equals the label SPF at the test dose and 1 with nothing applied", () => {
    for (const m of ["exp", "lin"]) {
      expect(protection(50, 2, m)).toBeCloseTo(50);
      expect(protection(50, 0, m)).toBeCloseTo(1);
    }
  });
  it("is cautious (exponential) below optimistic (linear) for thin layers", () => {
    expect(protection(50, 0.5, "exp")).toBeLessThan(protection(50, 0.5, "lin"));
  });
});

describe("decayedSpf", () => {
  it("halves the protection above 1 after one half-life", () => {
    expect(decayedSpf(51, 0, 6)).toBe(51);
    expect(decayedSpf(51, 6, 6)).toBeCloseTo(26);
  });
});

describe("sun and clock", () => {
  it("peaks at noon with the month's peak", () => {
    expect(uvAt(12.5, { peak: 12, noon: 12.5, spread: 2 })).toBe(12);
  });
  it("adds daylight saving only where and when it applies", () => {
    expect(dstOffset("Sydney", 0, p.dstCities)).toBe(1);
    expect(dstOffset("Sydney", 6, p.dstCities)).toBe(0);
    expect(dstOffset("Brisbane", 0, p.dstCities)).toBe(0);
  });
  it("matches the hand calculation for unprotected skin", () => {
    expect(burnMinutes(12, 275, p.uviW)).toBeCloseTo(15.3, 1);
  });
  it("tracks the last application time", () => {
    expect(lastApplication(13.5, 10, true, 2)).toBe(12);
    expect(lastApplication(13.5, 10, false, 2)).toBe(10);
  });
});

describe("simulation", () => {
  const medianDose = sc => {
    const d = simulate(people, sc, p, curve(sc)).doses.slice().sort((a, b) => a - b);
    return d[Math.floor(d.length / 2)];
  };
  it("gives each person a smaller dose when they reapply", () => {
    const c = curve(base);
    for (const person of people.slice(0, 50)) {
      expect(doseInMed(person, base, p, c)).toBeLessThanOrEqual(doseInMed(person, { ...base, reapply: false }, p, c) + 1e-12);
    }
  });
  it("gives less UV with more sunscreen and more with paler skin", () => {
    expect(medianDose({ ...base, amount: 1.5 })).toBeLessThan(medianDose(base));
    expect(medianDose({ ...base, skin: "I" })).toBeGreaterThan(medianDose({ ...base, skin: "IV" }));
  });
  it("matches unprotected sunburn with no sunscreen", () => {
    const sc = { ...base, amount: 0, reapply: false };
    const person = { zAmt: 0, zSpf: 0, zMed: 0, model: "exp" };
    const c = curve(sc);
    let joules = 0;
    for (let t = 10; t < 14; t += 1 / 600) joules += uvAt(t + 1 / 1200, c) * p.uviW * 6;
    expect(doseInMed(person, sc, p, c)).toBeCloseTo(joules / p.med.II, 2);
  });
  it("reports outcome counts that add up to 100", () => {
    const { counts } = simulate(people, base, p, curve(base));
    expect(counts.burnt + counts.pink + counts.safe).toBe(100);
  });
});

describe("outcomeCounts", () => {
  it("rounds to 100 people with largest remainders", () => {
    expect(outcomeCounts([0.1, 1.5, 2.5])).toEqual({ burnt: 33, pink: 33, safe: 34 });
    expect(outcomeCounts([])).toEqual({ burnt: 0, pink: 0, safe: 100 });
  });
});

describe("random people", () => {
  it("are the same for the same seed", () => {
    expect(makePeople(5, 1, 0.5)).toEqual(makePeople(5, 1, 0.5));
    expect(makePeople(5, 1, 0.5)).not.toEqual(makePeople(5, 2, 0.5));
  });
  it("split between the two models by the given weight", () => {
    const all = makePeople(4000, 3, 0.5).filter(x => x.model === "exp").length;
    expect(all / 4000).toBeGreaterThan(0.45);
    expect(all / 4000).toBeLessThan(0.55);
  });
});

describe("toModelParams", () => {
  it("reads every value the model needs from parameters.json", () => {
    expect(p).toMatchObject({ uviW: 0.025, testDose: 2, reapplyHours: 2, weightExp: 0.5 });
    expect(Object.keys(p.med)).toEqual(["I", "II", "III", "IV", "V", "VI"]);
    expect(p.halfLife.beach).toBe(6.5);
  });
  it("fails clearly when a value is missing", () => {
    expect(() => toModelParams({})).toThrow(/parameters.json/);
  });
});

describe("skinCurve", () => {
  it("starts at sky UV divided by the fresh SPF and stops when you go inside", () => {
    const c = curve(base);
    const pts = skinCurve(base, p, c, "exp", 20);
    expect(pts[0][1]).toBeCloseTo(uvAt(10, c) / protection(50, 0.5, "exp"));
    expect(pts.at(-1)[0]).toBeCloseTo(14);
  });
});
