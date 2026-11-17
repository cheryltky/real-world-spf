"""Turn ARPANSA minute UV index files into a small city x month climatology JSON.

Usage: python build_uv_peaks.py <raw_dir> <out_json>
Raw files are named <city>-<year>.csv (columns: timestamp, Lat, Lon, UV_Index).
"""
import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

CITIES = {
    "darwin": "Darwin", "townsville": "Townsville", "brisbane": "Brisbane", "perth": "Perth",
    "sydney": "Sydney", "canberra": "Canberra", "adelaide": "Adelaide", "melbourne": "Melbourne",
    "kingston": "Hobart",
}
MIN_MINUTES_PER_DAY = 1000   # of 1440; drops days with big instrument gaps
SMOOTH_MINUTES = 15          # rolling median, so single-minute glitches don't set the peak
DAYLIGHT_UVI = 0.05


def load_year(path):
    """Read one ARPANSA yearly file into timestamp and uvi columns, dropping bad rows."""
    df = pd.read_csv(path, dtype=str, encoding="utf-8-sig")  # headers vary: timestamp or Date-Time
    df = df.rename(columns={df.columns[0]: "timestamp"})
    df = df.assign(
        timestamp=pd.to_datetime(df.timestamp, format="%Y-%m-%d %H:%M:%S", errors="coerce"),
        uvi=pd.to_numeric(df.UV_Index, errors="coerce"),
    )[["timestamp", "uvi"]]
    return df.dropna().query("uvi >= 0 and uvi < 30").reset_index(drop=True)


def _complete_days(df):
    counts = df.groupby(df.timestamp.dt.date).uvi.transform("size")
    return df[counts >= MIN_MINUTES_PER_DAY]


def daily_summary(df):
    """One row per complete day: date, month and smoothed daily maximum UV index."""
    df = _complete_days(df.sort_values("timestamp"))
    date = df.timestamp.dt.date
    smooth = df.groupby(date).uvi.transform(lambda s: s.rolling(SMOOTH_MINUTES, center=True, min_periods=5).median())
    out = smooth.groupby(date).max().rename("max_uvi").reset_index().rename(columns={"timestamp": "date"})
    return out.assign(month=pd.to_datetime(out.date).dt.month)


def monthly_peaks(daily):
    """Median ('typical') and 90th percentile ('clear') daily maximum by calendar month."""
    g = daily.groupby("month").max_uvi
    return pd.DataFrame({"typical": g.median(), "clear": g.quantile(0.9), "days": g.size()})


def _day_shape(day):
    lit = day[day.uvi > DAYLIGHT_UVI]
    hours = lit.timestamp.dt.hour + lit.timestamp.dt.minute / 60
    w = lit.uvi
    noon = np.average(hours, weights=w)
    return pd.Series({"noon": noon, "spread": np.sqrt(np.average((hours - noon) ** 2, weights=w))})


def diurnal_shape(df):
    """UV-weighted centre (solar noon on the data's clock) and spread of the daily curve.

    Uses the brighter half of days in each month, where cloud distorts the shape least.
    """
    df = _complete_days(df)
    daily = daily_summary(df)
    cutoff = daily.groupby("month").max_uvi.transform("median")
    bright = set(daily.loc[daily.max_uvi >= cutoff, "date"])
    df = df[df.timestamp.dt.date.isin(bright)]
    per_day = df.groupby(df.timestamp.dt.date).apply(_day_shape)
    per_day.index = pd.to_datetime(per_day.index)
    return per_day.groupby(per_day.index.month).median()


def summarise_city(frames):
    df = pd.concat(frames, ignore_index=True)
    peaks = monthly_peaks(daily_summary(df))
    shape = diurnal_shape(df)
    years = sorted(df.timestamp.dt.year.unique().tolist())
    months = [
        {"month": int(m), "typical": round(float(peaks.typical[m]), 1), "clear": round(float(peaks.clear[m]), 1),
         "noon": round(float(shape.noon[m]), 2), "spread": round(float(shape.spread[m]), 2), "days": int(peaks.days[m])}
        for m in peaks.index
    ]
    return {"years": [years[0], years[-1]], "months": months}


def build(raw_dir, cities, out_path):
    raw_dir = Path(raw_dir)
    result = {
        "source": "ARPANSA Ultraviolet Radiation Index, one-minute data, via data.gov.au",
        "licence": "CC BY 2.5 AU (Australian Radiation Protection and Nuclear Safety Agency)",
        "measures": {
            "typical": "median daily maximum UV index (15-minute rolling median)",
            "clear": "90th percentile daily maximum UV index",
            "noon": "UV-weighted centre of the daily curve, hours in local standard time (no daylight saving)",
            "spread": "UV-weighted standard deviation of the daily curve, hours",
        },
        "cities": {},
    }
    for key, name in cities.items():
        files = sorted(raw_dir.glob(f"{key}-*.csv"))
        if not files:
            raise FileNotFoundError(f"no raw files for {key} in {raw_dir}")
        result["cities"][name] = {"station": key, **summarise_city([load_year(f) for f in files])}
    Path(out_path).write_text(json.dumps(result, indent=1))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("raw_dir", type=Path)
    parser.add_argument("out_json", type=Path)
    args = parser.parse_args()
    build(args.raw_dir, CITIES, args.out_json)
    print(f"wrote {args.out_json}")


if __name__ == "__main__":
    main()
