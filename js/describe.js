// Plain-language descriptions of each chart, for screen readers and the share preview.
import { hourLabel } from "./svg.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const one = v => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);

export function describe(sc, curve, spf, counts) {
  const kind = sc.day === "clear" ? "a clear" : "a typical";
  return {
    day: `On ${kind} ${MONTHS[sc.month]} day in ${sc.city}, UV peaks at ${curve.peak} around ${hourLabel(curve.noon)}. You're outside from ${hourLabel(sc.start)} for ${sc.hours} hour${sc.hours > 1 ? "s" : ""}${sc.reapply ? ", reapplying every 2 hours" : ", applying once"}.`,
    tube: `You apply ${sc.amount.toFixed(2)} mg/cm², ${Math.round(sc.amount / 2 * 100)}% of the 2 mg/cm² used in SPF testing.`,
    bottle: `The label says SPF ${sc.spf}. At this amount you get about SPF ${one(spf.exp)} under the cautious model and SPF ${one(spf.lin)} under the optimistic one.`,
    sun: `Of 100 simulated people, ${counts.burnt} get badly burnt, ${counts.pink} go pink and ${counts.safe} don't burn.`
  };
}
