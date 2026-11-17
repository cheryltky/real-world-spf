import { describe, expect, it } from "vitest";
import { fromHash, toHash } from "../js/hash.js";

const cities = ["Brisbane", "Sydney", "Hobart"];
const defaults = { city: "Brisbane", month: 10, day: "typical", start: 10, hours: 4, skin: "II", spf: 50, activity: "beach", reapply: true, amount: 0.5 };

describe("shareable links", () => {
  it("writes a readable hash", () => {
    expect(toHash(defaults)).toBe("brisbane-nov-ii-spf50-beach-typical-from10-for4h-reapply-a50");
  });
  it("round-trips every setting", () => {
    const sc = { city: "Hobart", month: 0, day: "clear", start: 13, hours: 2, skin: "VI", spf: 15, activity: "sport", reapply: false, amount: 1.25 };
    expect(fromHash("#" + toHash(sc), cities, defaults)).toEqual(sc);
  });
  it("fills missing or unknown parts from the defaults", () => {
    expect(fromHash("#sydney-jan", cities, defaults)).toEqual({ ...defaults, city: "Sydney", month: 0 });
    expect(fromHash("#paris-spf99-for12h-from3", cities, defaults)).toEqual(defaults);
    expect(fromHash("", cities, defaults)).toBeNull();
  });
  it("keeps the amount within the slider's range", () => {
    expect(fromHash("#a900", cities, defaults).amount).toBe(2.5);
    expect(fromHash("#a5", cities, defaults).amount).toBe(0.2);
  });
});
