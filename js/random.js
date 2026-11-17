// Seeded random draws, so every setting reuses the same simulated people.

export function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Each person: how far they sit from typical amount, product SPF and skin sensitivity, and which dose model applies.
export function makePeople(n, seed, weightExp) {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, () => ({
    zAmt: gaussian(rand), zSpf: gaussian(rand), zMed: gaussian(rand),
    model: rand() < weightExp ? "exp" : "lin"
  }));
}
