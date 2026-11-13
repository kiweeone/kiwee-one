// Prediction model: practice/qualifying features → predicted order → expected fantasy points.
// Defaults below come from scripts/backtest.mjs (see DEFAULTS.backtest for the measured accuracy).
import DEFAULTS from "./defaults.js";

export const SIGNALS = [
  { key: "bestLap", label: "Pace", desc: "Best clean lap", higher: false },
  { key: "paceAdj", label: "Tyre-adjusted pace", desc: "Best lap, corrected to soft-tyre equivalent", higher: false },
  { key: "idealLap", label: "Ideal lap", desc: "Sum of best sectors", higher: false },
  { key: "longRun", label: "Long-run pace", desc: "Longest 5+ lap run, soft-equivalent", higher: false },
  { key: "consistency", label: "Consistency", desc: "Lap-time spread within long runs", higher: false },
  { key: "topSpeed", label: "Top speed", desc: "Speed-trap maximum", higher: true },
  { key: "lapCount", label: "Laps run", desc: "Clean laps completed", higher: true },
];

export const PREDICTORS = { quali: ["fp1", "fp2", "fp3", "sprintQuali", "sprint"], race: ["fp1", "fp2", "fp3", "sprintQuali", "sprint", "quali"] };
const RESULT_SESSIONS = new Set(["sprintQuali", "sprint", "quali", "race"]);

export const DEFAULT_SIGNAL_WEIGHTS = DEFAULTS.signalWeights;
export const DEFAULT_SESSION_WEIGHTS = DEFAULTS.sessionWeights;
export const RANK_SIGMA = DEFAULTS.rankSigma;

// ─── Fantasy scoring (2026 position points) ───
export const POINTS = {
  quali: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  sprint: [8, 7, 6, 5, 4, 3, 2, 1],
  race: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
};
const ptsAt = (table, pos) => table[pos - 1] || 0;

/** Percentile score per driver for one signal in one session: 1 = best, 0 = worst. Ties share the average. Missing → undefined. */
export function rankScores(session, key, higher) {
  const rows = Object.values(session).filter((d) => d[key] > 0);
  if (rows.length < 2) return {};
  rows.sort((a, b) => (higher ? b[key] - a[key] : a[key] - b[key]));
  const out = {};
  for (let i = 0; i < rows.length; ) {
    let j = i; while (j + 1 < rows.length && rows[j + 1][key] === rows[i][key]) j++;
    const s = 1 - ((i + j) / 2) / (rows.length - 1);
    for (let k = i; k <= j; k++) out[rows[k].id] = s;
    i = j + 1;
  }
  return out;
}

/** Score every driver in one session (0–1). Result sessions use the official classification only. */
export function sessionScores(kind, session, signalWeights) {
  if (RESULT_SESSIONS.has(kind)) {
    const r = rankScores(Object.fromEntries(Object.values(session).map((d) => [d.id, { id: d.id, pos: d.position }])), "pos", false);
    return Object.fromEntries(Object.keys(r).map((id) => [id, { score: r[id], signals: { position: r[id] } }]));
  }
  const per = SIGNALS.filter((s) => (signalWeights[s.key] || 0) > 0).map((s) => ({ ...s, w: signalWeights[s.key], r: rankScores(session, s.key, s.higher) }));
  const out = {};
  for (const id of Object.keys(session)) {
    let sum = 0, wsum = 0; const signals = {};
    for (const s of per) { const v = s.r[id]; if (v === undefined) continue; sum += v * s.w; wsum += s.w; signals[s.key] = v; }
    if (wsum > 0) out[id] = { score: sum / wsum, signals };
  }
  return out;
}

/**
 * Composite score per driver for a target ("quali" or "race").
 * Sessions are weighted by sessionWeights; a driver missing a session is averaged over the sessions they ran
 * (with a small confidence penalty for low lap counts), instead of being treated as slowest.
 */
export function predict(data, target, { signalWeights = DEFAULT_SIGNAL_WEIGHTS, sessionWeights = DEFAULT_SESSION_WEIGHTS[target] } = {}) {
  const kinds = PREDICTORS[target].filter((k) => data[k] && (sessionWeights[k] || 0) > 0);
  const per = kinds.map((k) => {
    const maxLaps = Math.max(1, ...Object.values(data[k]).map((d) => d.lapCount || 0));
    return { k, w: sessionWeights[k], s: sessionScores(k, data[k], signalWeights), maxLaps };
  });
  const ids = new Set(per.flatMap((p) => Object.keys(p.s)));
  const rows = [];
  for (const id of ids) {
    let sum = 0, wsum = 0; const bySession = {};
    for (const p of per) {
      const v = p.s[id]; if (!v) continue;
      const laps = data[p.k][id]?.lapCount || 0;
      const conf = RESULT_SESSIONS.has(p.k) ? 1 : 0.6 + 0.4 * Math.min(1, laps / (0.6 * p.maxLaps));
      sum += v.score * p.w * conf; wsum += p.w; bySession[p.k] = v;
    }
    if (wsum > 0) rows.push({ id, score: sum / wsum, bySession });
  }
  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => { r.rank = i + 1; });
  return rows;
}

/** Expected points for finishing around `rank`, treating the prediction as uncertain (Gaussian over positions). */
export function expectedPoints(rank, n, table, sigma = RANK_SIGMA) {
  let z = 0, e = 0;
  for (let p = 1; p <= n; p++) { const w = Math.exp(-((p - rank) ** 2) / (2 * sigma * sigma)); z += w; e += w * ptsAt(table, p); }
  return z ? e / z : 0;
}

/**
 * Projected fantasy points per driver for the weekend.
 * Sessions that already happened score their actual result; the rest use the prediction.
 */
export function projectWeekend(data, opts = {}) {
  const sprintWeekend = !!(opts.sprintWeekend ?? (data.sprintQuali || data.sprint));
  const q = data.quali ? Object.values(data.quali).map((d) => ({ id: d.id, rank: d.position, actual: true })) : predict(data, "quali", { ...opts, sessionWeights: opts.sessionWeights?.quali });
  const r = data.race ? Object.values(data.race).map((d) => ({ id: d.id, rank: d.position, actual: true })) : predict(data, "race", { ...opts, sessionWeights: opts.sessionWeights?.race });
  const s = data.sprint ? Object.values(data.sprint).map((d) => ({ id: d.id, rank: d.position, actual: true })) : r; // sprint follows race-style prediction
  const n = Math.max(q.length, r.length, 20);
  const val = (row, table) => (row ? (row.actual ? ptsAt(table, row.rank) : expectedPoints(row.rank, n, table, opts.sigma)) : 0);
  const ids = new Set([...q, ...r].map((x) => x.id));
  const out = {};
  for (const id of ids) {
    const qr = q.find((x) => x.id === id), rr = r.find((x) => x.id === id), sr = s.find((x) => x.id === id);
    const parts = { quali: val(qr, POINTS.quali), race: val(rr, POINTS.race), sprint: sprintWeekend ? val(sr, POINTS.sprint) : 0 };
    out[id] = { ...parts, total: parts.quali + parts.race + parts.sprint, raceRank: rr?.rank, qualiRank: qr?.rank };
  }
  return out;
}

// ─── Accuracy metrics (used by the back-test and shown in the UI) ───
export function spearman(predRanks, actualRanks) {
  const ids = Object.keys(actualRanks).filter((id) => predRanks[id]);
  const n = ids.length; if (n < 3) return null;
  // re-rank within the common set
  const rr = (m) => Object.fromEntries(ids.slice().sort((a, b) => m[a] - m[b]).map((id, i) => [id, i + 1]));
  const p = rr(predRanks), a = rr(actualRanks);
  const d2 = ids.reduce((s, id) => s + (p[id] - a[id]) ** 2, 0);
  return 1 - (6 * d2) / (n * (n * n - 1));
}
export function meanAbsRankError(predRanks, actualRanks) {
  const ids = Object.keys(actualRanks).filter((id) => predRanks[id]);
  return ids.length ? ids.reduce((s, id) => s + Math.abs(predRanks[id] - actualRanks[id]), 0) / ids.length : null;
}
export function top10Hits(predRanks, actualRanks) {
  const top = (m) => new Set(Object.keys(m).filter((id) => m[id] <= 10));
  const p = top(predRanks), a = top(actualRanks);
  return [...p].filter((id) => a.has(id)).length;
}
