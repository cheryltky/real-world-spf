// Flattens data/parameters.json into the numbers the model uses, failing loudly if any are missing.

const need = (value, path) => {
  if (value === undefined || value === null) throw new Error(`parameters.json is missing ${path}`);
  return value;
};

export function toModelParams(raw) {
  const medValues = need(raw.med_by_skin_type?.values, "med_by_skin_type.values");
  const halfLives = need(raw.spf_half_life_hours?.values, "spf_half_life_hours.values");
  return {
    uviW: need(raw.uv_index_irradiance?.value, "uv_index_irradiance.value"),
    testDose: need(raw.test_dose?.value, "test_dose.value"),
    reapplyHours: need(raw.reapply_interval?.value, "reapply_interval.value"),
    medSigma: need(raw.med_person_variation?.value, "med_person_variation.value"),
    amountSigma: need(raw.amount_person_variation?.value, "amount_person_variation.value"),
    spfSigma: need(raw.product_spf_variation?.value, "product_spf_variation.value"),
    weightExp: need(raw.spf_vs_amount?.weight_exponential, "spf_vs_amount.weight_exponential"),
    defaultAmount: need(raw.amount_applied_default?.value, "amount_applied_default.value"),
    fullBodyMl: need(raw.full_body_amount?.value, "full_body_amount.value"),
    dstCities: need(raw.uv_clock?.daylight_saving_cities, "uv_clock.daylight_saving_cities"),
    med: Object.fromEntries(Object.entries(medValues).map(([k, v]) => [k, v.value])),
    medUncertain: Object.keys(medValues).filter(k => medValues[k].uncertain),
    halfLife: Object.fromEntries(Object.entries(halfLives).map(([k, v]) => [k, v.value])),
    halfLifeRange: Object.fromEntries(Object.entries(halfLives).map(([k, v]) => [k, v.range]))
  };
}
