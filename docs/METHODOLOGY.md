# Methodology

## UV through the day

For each city and month, `pipeline/build_uv_peaks.py` takes ARPANSA's one-minute UV index for 2016 to 2025 and computes:

- **Daily peak:** the maximum of a 15-minute rolling median, on days with at least 1,000 of 1,440 minutes recorded.
- **Typical and clear day:** the median and 90th percentile of daily peaks across all years.
- **Daily curve:** on the brighter half of days (peak at or above the month's median), the UV-weighted mean hour (`noon`) and UV-weighted standard deviation (`spread`) of each day, then the median across days.

The page models UV at hour *t* as `peak × exp(−(t − noon)² / (2 × spread²))`. ARPANSA timestamps are local standard time, so the page adds one hour from October to March in NSW, ACT, Victoria, Tasmania and South Australia.

## Dose

- One UV index unit is 0.025 W/m² of erythemally weighted irradiance (WHO, 2002).
- Dose builds in 5-minute steps: `UVI × 0.025 × 300 s / SPF(t)` J/m².
- A person burns at one minimal erythema dose (MED) for their skin type. Badly burnt means 2 MED or more.

## Protection

SPF at amount *a* mg/cm², relative to the 2 mg/cm² test dose:

| Model | Formula | Sources |
|---|---|---|
| Cautious (exponential) | SPF^(a/2) | Faurschou and Wulf 2007; Schalka et al. 2009 |
| Optimistic (linear) | 1 + (SPF − 1) × a/2 | Bimczok et al. 2007; Ou-Yang et al. 2012 |

Protection above bare skin then decays as `1 + (SPF₀ − 1) × 0.5^(hours since applying / half-life)`. Reapplying every 2 hours (Cancer Council Australia) restores SPF₀. The half-lives come from two studies:

| Activity | Half-life | Basis |
|---|---|---|
| Beach and swimming | 6.5 h (4 to 8) | Bodekær et al. 2008: SPF down 55 to 58% after 8 h |
| Running or sport | 8 h (6 to 10) | Ruvolo et al. 2020: SPF 50 to about 30 after 6 h of sweating |
| Relaxing | 24 h (12 to 48) | Ruvolo et al. 2020: no measurable loss over 6 h at rest |

## People

The simulation creates 1,000 people with a fixed seed. Each gets four draws:

- how much they apply relative to the chosen amount (lognormal, σ 0.35);
- how their bottle performs against its label (σ 0.3);
- how sensitive their skin is within its type (σ 0.25);
- which protection model applies to them (50/50).

The same people are reused for every setting, so a change in the result comes from the setting, not from new random numbers. Results are scaled to 100 people by largest remainder, so the three groups always add to 100.

## Validation

Model tests (`tests/model.test.js`):

- Protection equals the label SPF at the test dose and 1 at zero.
- With no sunscreen, the simulated dose matches a fine-grained numerical integral of the same curve.
- Type II skin under UV 12 burns in 15.3 minutes, matching a hand calculation.
- Reapplying never increases any person's dose.
- More sunscreen lowers the median dose, and paler skin raises it.
- The same seed gives the same people.

Pipeline tests use synthetic minute data with a known peak, noon and spread, and check each is recovered.

## Sources

Every value, range and DOI is in [data/parameters.json](../data/parameters.json). Each value is marked "sourced", "derived" (calculated from a source) or "assumption".
