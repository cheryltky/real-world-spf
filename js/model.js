// Pure model functions. Hours are on the displayed local clock; UV dose is in J/m2.

export const STEP_HOURS = 5 / 60;
export const BURN_MED = 1;
export const BADLY_BURNT_MED = 2;

// SPF delivered by a layer thinner or thicker than the test dose, under either published model.
export function protection(spf, amount, model, testDose = 2) {
  const r = Math.max(0, amount / testDose);
  const value = model === "exp" ? Math.pow(spf, r) : 1 + (spf - 1) * r;
  return Math.max(1, value);
}

// Protection above bare skin halves every half-life.
export const decayedSpf = (spf0, hours, halfLife) => 1 + (spf0 - 1) * Math.pow(0.5, Math.max(0, hours) / halfLife);

export const uvAt = (hour, { peak, noon, spread }) => peak * Math.exp(-((hour - noon) ** 2) / (2 * spread ** 2));

// ARPANSA data is in local standard time; daylight-saving states run an hour later from October to March.
export const dstOffset = (city, month, dstCities) => (dstCities.includes(city) && (month >= 9 || month <= 2) ? 1 : 0);

export const burnMinutes = (uvi, med, uviW) => med / (uvi * uviW) / 60;

export const lastApplication = (t, start, reapply, interval) =>
  reapply ? start + Math.floor((t - start) / interval) * interval : start;

// The day's UV curve for a city and month, shifted onto the displayed clock.
export function curveFor(cityData, month, day, offset) {
  const m = cityData.months[month];
  return { peak: m[day], noon: m.noon + offset, spread: m.spread };
}

// UV dose one simulated person receives, in multiples of their own sunburn threshold (MED).
export function doseInMed(person, sc, p, curve) {
  const amount = sc.amount * Math.exp(p.amountSigma * person.zAmt);
  const spf = sc.spf * Math.exp(p.spfSigma * person.zSpf);
  const med = p.med[sc.skin] * Math.exp(p.medSigma * person.zMed);
  const spf0 = protection(spf, amount, person.model, p.testDose);
  const halfLife = p.halfLife[sc.activity];
  const steps = Math.round(sc.hours / STEP_HOURS);
  let joules = 0;
  for (let i = 0; i < steps; i++) {
    const t = sc.start + (i + 0.5) * STEP_HOURS;
    const since = t - lastApplication(t, sc.start, sc.reapply, p.reapplyHours);
    joules += (uvAt(t, curve) * p.uviW * STEP_HOURS * 3600) / decayedSpf(spf0, since, halfLife);
  }
  return joules / med;
}

// Scale outcomes to 100 people, rounding by largest remainder so the parts always add to 100.
export function outcomeCounts(doses) {
  if (doses.length === 0) return { burnt: 0, pink: 0, safe: 100 };
  const n = doses.length;
  const raw = {
    safe: doses.filter(d => d < BURN_MED).length / n * 100,
    pink: doses.filter(d => d >= BURN_MED && d < BADLY_BURNT_MED).length / n * 100,
    burnt: doses.filter(d => d >= BADLY_BURNT_MED).length / n * 100
  };
  const counts = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Math.floor(v)]));
  const left = 100 - counts.safe - counts.pink - counts.burnt;
  const order = Object.keys(raw).sort((a, b) => (raw[b] - Math.floor(raw[b])) - (raw[a] - Math.floor(raw[a])));
  order.slice(0, left).forEach(k => { counts[k] += 1; });
  return { burnt: counts.burnt, pink: counts.pink, safe: counts.safe };
}

export function simulate(people, sc, p, curve) {
  const doses = people.map(person => doseInMed(person, sc, p, curve));
  return { doses, counts: outcomeCounts(doses) };
}

// The skin-level UV curve for a typical person (no individual variation) under one model.
export function skinCurve(sc, p, curve, model, maxHour) {
  const spf0 = protection(sc.spf, sc.amount, model, p.testDose);
  const halfLife = p.halfLife[sc.activity];
  const points = [];
  for (let t = sc.start; t <= Math.min(sc.start + sc.hours, maxHour) + 1e-9; t += STEP_HOURS) {
    const since = t - lastApplication(t, sc.start, sc.reapply, p.reapplyHours);
    points.push([t, uvAt(t, curve) / decayedSpf(spf0, since, halfLife)]);
  }
  return points;
}
