"""Tests for the UV climatology pipeline, using synthetic minute data."""
import json
import math

import numpy as np
import pandas as pd
import pytest

from build_uv_peaks import build, daily_summary, diurnal_shape, load_year, monthly_peaks


def synthetic_days(dates, peaks, noon=12.0, spread=2.5):
    """Minute UV data shaped as a Gaussian bell around noon, one day per date."""
    frames = []
    for date, peak in zip(dates, peaks):
        ts = pd.date_range(f"{date} 00:00", periods=1440, freq="min")
        hours = ts.hour + ts.minute / 60
        uv = peak * np.exp(-((hours - noon) ** 2) / (2 * spread ** 2))
        frames.append(pd.DataFrame({"timestamp": ts, "uvi": uv}))
    return pd.concat(frames, ignore_index=True)


def test_load_year_parses_arpansa_columns(tmp_path):
    f = tmp_path / "x.csv"
    f.write_text("timestamp,Lat,Lon,UV_Index\n2016-01-01 12:00:00,-34.04,151.1,11.50\n2016-01-01 12:01:00,-34.04,151.1,bad\n")
    df = load_year(f)
    assert list(df.columns) == ["timestamp", "uvi"]
    assert len(df) == 1 and df.uvi.iloc[0] == pytest.approx(11.5)


def test_load_year_handles_bom_date_time_header(tmp_path):
    f = tmp_path / "y.csv"
    f.write_text("﻿Date-Time,Lat,Lon,UV_Index\n2017-01-01 12:00:00,-34.92,138.62,9.0\n", encoding="utf-8")
    assert load_year(f).uvi.tolist() == [9.0]


def test_daily_summary_finds_peak_and_drops_sparse_days():
    full = synthetic_days(["2020-01-01"], [12.0])
    sparse = synthetic_days(["2020-01-02"], [9.0]).iloc[::3]  # a third of the minutes
    daily = daily_summary(pd.concat([full, sparse]))
    assert len(daily) == 1
    assert daily.max_uvi.iloc[0] == pytest.approx(12.0, abs=0.05)


def test_daily_summary_smooths_single_minute_spikes():
    df = synthetic_days(["2020-01-01"], [10.0])
    df.loc[df.timestamp == "2020-01-01 09:00", "uvi"] = 40.0  # instrument glitch
    assert daily_summary(df).max_uvi.iloc[0] < 11


def test_monthly_peaks_typical_and_clear_day():
    dates = pd.date_range("2020-01-01", periods=31).strftime("%Y-%m-%d")
    peaks = np.linspace(4, 13, 31)  # median 8.5, p90 12.1
    monthly = monthly_peaks(daily_summary(synthetic_days(dates, peaks)))
    jan = monthly.loc[1]
    assert jan.typical == pytest.approx(8.5, abs=0.1)
    assert jan.clear == pytest.approx(12.1, abs=0.1)
    assert jan.days == 31


def test_diurnal_shape_recovers_noon_and_spread():
    dates = pd.date_range("2020-02-01", periods=10).strftime("%Y-%m-%d")
    shape = diurnal_shape(synthetic_days(dates, [11.0] * 10, noon=13.1, spread=2.4))
    assert shape.loc[2].noon == pytest.approx(13.1, abs=0.05)
    assert shape.loc[2].spread == pytest.approx(2.4, abs=0.1)


def test_build_writes_rounded_json(tmp_path):
    raw = tmp_path / "raw"
    raw.mkdir()
    dates = pd.date_range("2020-01-01", "2020-12-31").strftime("%Y-%m-%d")
    peaks = [8 + 4 * math.cos(2 * math.pi * i / 366) for i in range(len(dates))]
    df = synthetic_days(dates, peaks).rename(columns={"uvi": "UV_Index"})
    df.assign(Lat=-27.4, Lon=153.0).to_csv(raw / "brisbane-2020.csv", index=False)
    out = tmp_path / "uv.json"
    build(raw, {"brisbane": "Brisbane"}, out)
    data = json.loads(out.read_text())
    months = data["cities"]["Brisbane"]["months"]
    assert len(months) == 12
    assert months[0]["clear"] >= months[0]["typical"]
    assert months[0]["typical"] > months[5]["typical"]  # summer above winter
    assert data["licence"].startswith("CC BY 2.5")
