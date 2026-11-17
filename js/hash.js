// Shareable links: the scenario as a readable hash, e.g. #brisbane-nov-ii-spf50-beach-typical-from10-for4h-reapply-a50

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const SKINS = ["i", "ii", "iii", "iv", "v", "vi"];
const ACTIVITIES = ["relax", "beach", "sport"];
const SPFS = [15, 30, 50];
const AMOUNT = { min: 0.2, max: 2.5 };

export const toHash = sc => [
  sc.city.toLowerCase(), MONTHS[sc.month], sc.skin.toLowerCase(), `spf${sc.spf}`, sc.activity, sc.day,
  `from${sc.start}`, `for${sc.hours}h`, sc.reapply ? "reapply" : "once", `a${Math.round(sc.amount * 100)}`
].join("-");

function readToken(token, cities) {
  const city = cities.find(c => c.toLowerCase() === token);
  if (city) return { city };
  if (MONTHS.includes(token)) return { month: MONTHS.indexOf(token) };
  if (SKINS.includes(token)) return { skin: token.toUpperCase() };
  if (ACTIVITIES.includes(token)) return { activity: token };
  if (token === "typical" || token === "clear") return { day: token };
  if (token === "reapply" || token === "once") return { reapply: token === "reapply" };
  const spf = token.match(/^spf(\d+)$/);
  if (spf && SPFS.includes(+spf[1])) return { spf: +spf[1] };
  const from = token.match(/^from(\d+)$/);
  if (from && +from[1] >= 7 && +from[1] <= 16) return { start: +from[1] };
  const hours = token.match(/^for(\d+)h$/);
  if (hours && +hours[1] >= 1 && +hours[1] <= 8) return { hours: +hours[1] };
  const amount = token.match(/^a(\d+)$/);
  if (amount) return { amount: Math.min(AMOUNT.max, Math.max(AMOUNT.min, +amount[1] / 100)) };
  return {};
}

// Returns null when there is no hash, so saved settings can apply instead.
export function fromHash(hash, cities, defaults) {
  const body = hash.replace(/^#/, "").toLowerCase();
  if (!body) return null;
  return body.split("-").reduce((sc, token) => ({ ...sc, ...readToken(token, cities) }), { ...defaults });
}
