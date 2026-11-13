# kiwee.one — Zhelyo Ivanov

Source of [kiwee.one](https://www.kiwee.one/), the personal site of **Zhelyo Ivanov** (Жельо Иванов), Chief Product Officer — plus the F1 Fantasy Predictor that lives at [/f1predictor](https://www.kiwee.one/f1predictor).

---

# F1 Fantasy Predictor

Live at [kiwee.one/f1predictor](https://www.kiwee.one/f1predictor). Loads the latest race weekend from [OpenF1](https://openf1.org), predicts qualifying and race order, turns that into expected fantasy points, and finds the best line-ups under the $100M cap.

## How it works

| File | What it does |
|---|---|
| `src/f1/data.js` | OpenF1 access (via `/api/openf1` proxy in production), drivers matched by 3-letter code, lap cleaning (107% rule), per-session features |
| `src/f1/model.js` | Rank-based scoring per signal and session, race prediction anchored on the qualifying result, expected position points with uncertainty |
| `src/f1/optimize.js` | Exact search over every 5-driver + 2-constructor line-up, 2× boost on the top scorer |
| `src/f1/defaults.js` | Tuned weights + back-test accuracy (generated) |
| `scripts/backtest.mjs` | Tunes weights on 2025 weekends, tests on 2026 |

## Commands

```bash
npm install
npm run dev        # local dev (calls OpenF1 directly)
npm test           # model + optimizer tests
npm run backtest   # re-tune weights (needs network access to api.openf1.org)
```

Points cover qualifying, sprint and race position points only — overtakes, positions gained, fastest lap, DOTD, pit stops and DNF penalties are not modelled.
