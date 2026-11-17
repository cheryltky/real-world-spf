import { describe as group, expect, it } from "vitest";
import { describe } from "../js/describe.js";

const sc = { city: "Sydney", month: 0, day: "clear", start: 10, hours: 1, skin: "II", spf: 50, activity: "beach", reapply: false, amount: 0.5 };

group("chart descriptions", () => {
  it("names the setting and the numbers each chart shows", () => {
    const d = describe(sc, { peak: 13, noon: 13.1, spread: 2 }, { exp: 2.66, lin: 13.25 }, { burnt: 40, pink: 30, safe: 30 });
    expect(d.day).toBe("On a clear January day in Sydney, UV peaks at 13 around 1:06pm. You're outside from 10am for 1 hour, applying once.");
    expect(d.tube).toContain("25% of the 2 mg/cm²");
    expect(d.bottle).toContain("SPF 2.7 under the cautious model and SPF 13");
    expect(d.sun).toBe("Of 100 simulated people, 40 get badly burnt, 30 go pink and 30 don't burn.");
  });
});
