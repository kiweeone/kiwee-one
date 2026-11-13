// Back-test the predictor on completed race weekends and tune its default weights.
//
//   node scripts/backtest.mjs            # fetch (cached in .cache/), tune on 2025, test on 2026, write src/f1/defaults.js
//   node scripts/backtest.mjs --no-write # report only
//
// Run with NODE_USE_ENV_PROXY=1 if your network needs a proxy.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { setFetch, api, groupWeekends, buildFeatures } from "../src/f1/data.js";
import { predict, spearman, meanAbsRankError, top10Hits, SIGNALS } from "../src/f1/model.js";

const CACHE = ".cache/openf1";
mkdirSync(CACHE, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0, calls = 0;
setFetch(async (url) => {
  const f = `${CACHE}/${createHash("md5").update(url).digest("hex")}.json`;
  if (existsSync(f)) return new Response(readFileSync(f), { status: 200 });
  const wait = last + 400 - Date.now(); if (wait > 0) await sleep(wait);
  last = Date.now(); calls++;
  const r = await fetch(url);
  if (r.ok) { const t = await r.text(); writeFileSync(f, t); return new Response(t, { status: 200 }); }
  if (r.status === 404) { writeFileSync(f, "[]"); return new Response("[]", { status: 200 }); }
  return r;
});

// ─── Load weekends ───
async function loadSeason(year) {
  const now = new Date().toISOString();
  const weekends = groupWeekends(await api(`/v1/sessions?year=${year}`)).filter((w) => w.sessions.race && w.date < now);
  const out = [];
  for (const w of weekends) {
    const drivers = await api(`/v1/drivers?session_key=${w.sessions.race}`);
    const data = {};
    for (const [kind, key] of Object.entries(w.sessions)) {
      if (["fp1", "fp2", "fp3"].includes(kind)) {
        const [laps, stints] = [await api(`/v1/laps?session_key=${key}`), await api(`/v1/stints?session_key=${key}`)];
        const f = buildFeatures({ laps, stints, drivers });
        if (Object.keys(f).length) data[kind] = f;
      } else {
        const results = await api(`/v1/session_result?session_key=${key}`);
        if (!results.length) continue;
        // Result sessions only need the classification.
        data[kind] = Object.fromEntries(results.filter((r) => Number.isInteger(r.position)).map((r) => {
          const id = drivers.find((d) => d.driver_number === r.driver_number)?.name_acronym;
          return [id, { id, position: r.position }];
        }).filter(([id]) => id));
      }
    }
    if (data.quali && data.race && (data.fp1 || data.fp2 || data.fp3)) out.push({ year, name: w.name, data });
    process.stdout.write(`\r${year}: ${out.length} weekends loaded (${calls} API calls)   `);
  }
  console.log();
  return out;
}

// ─── Scoring ───
const ranksOf = (rows) => Object.fromEntries(rows.map((r) => [r.id, r.rank]));
const actualOf = (s) => Object.fromEntries(Object.values(s).map((d) => [d.id, d.position]));

function evaluate(weekends, target, cfg) {
  let rho = 0, mae = 0, hits = 0, n = 0;
  for (const w of weekends) {
    const data = target === "quali" ? { ...w.data, quali: undefined, race: undefined } : { ...w.data, race: undefined };
    const rows = predict(data, target, cfg);
    if (rows.length < 10) continue;
    const a = actualOf(w.data[target]);
    const p = ranksOf(rows);
    const e = meanAbsRankError(p, a);
    if (process.env.DEBUG && !Number.isFinite(e)) console.log("bad", w.year, w.name, target, JSON.stringify(Object.keys(a).filter((id) => p[id] && !Number.isFinite(p[id] - a[id])).map((id) => [id, p[id], a[id]])));
    rho += spearman(p, a); mae += e; hits += top10Hits(p, a); n++;
  }
  return { rho: rho / n, mae: mae / n, top10: hits / n, n };
}

// Coordinate descent over a small grid of values.
function tune(weekends, target, start, keys, grid = [0, 5, 10, 20, 35, 50, 75, 100]) {
  let cfg = structuredClone(start), best = evaluate(weekends, target, cfg).rho;
  for (let pass = 0; pass < 3; pass++) {
    let improved = false;
    for (const [group, key] of keys) {
      for (const v of grid) {
        const trial = structuredClone(cfg); trial[group][key] = v;
        if (Object.values(trial.signalWeights).every((x) => !x)) continue;
        const r = evaluate(weekends, target, trial).rho;
        if (r > best + 1e-4) { best = r; cfg = trial; improved = true; }
      }
    }
    if (!improved) break;
  }
  return cfg;
}

const fmt = (m) => `ρ ${m.rho.toFixed(3)} · avg position error ${m.mae.toFixed(2)} · top-10 hits ${m.top10.toFixed(1)}/10 · ${m.n} weekends`;

// ─── Main ───
const train = await loadSeason(2025);
const test = await loadSeason(2026);
const all = [...train, ...test];

const old = { // the previous hand-set weights, mapped onto the new signals
  signalWeights: { bestLap: 20, paceAdj: 20, idealLap: 15, longRun: 15, consistency: 10, topSpeed: 0, lapCount: 0 },
  sessionWeights: { fp1: 25, fp2: 35, fp3: 40, sprintQuali: 0, sprint: 0, quali: 0 },
};
const fp3Only = { signalWeights: { bestLap: 1 }, sessionWeights: { fp1: 1, fp2: 1, fp3: 1 } };
const gridOnly = { signalWeights: { bestLap: 1 }, sessionWeights: { quali: 1 } };

const sigKeys = SIGNALS.map((s) => ["signalWeights", s.key]);
const qStart = { signalWeights: { bestLap: 20, paceAdj: 20, idealLap: 15, longRun: 20, consistency: 5, topSpeed: 0, lapCount: 0 }, sessionWeights: { fp1: 20, fp2: 30, fp3: 50, sprintQuali: 60, sprint: 40 } };
const qCfg = tune(train, "quali", qStart, [...sigKeys, ...["fp1", "fp2", "fp3", "sprintQuali", "sprint"].map((k) => ["sessionWeights", k])]);
const rStart = { signalWeights: qCfg.signalWeights, sessionWeights: { ...qCfg.sessionWeights, quali: 100 } };
const rCfg = tune(train, "race", rStart, ["fp1", "fp2", "fp3", "sprintQuali", "sprint", "quali"].map((k) => ["sessionWeights", k]));

const report = {
  trainedOn: `${train.length} weekends of 2025`, testedOn: `${test.length} weekends of 2026`,
  quali: { tuned: evaluate(test, "quali", qCfg), previous: evaluate(test, "quali", old), bestLapOnly: evaluate(test, "quali", fp3Only) },
  race: { tuned: evaluate(test, "race", rCfg), previous: evaluate(test, "race", old), gridOnly: evaluate(test, "race", gridOnly) },
};
console.log("\nOut-of-sample (2026) accuracy");
for (const t of ["quali", "race"]) for (const [k, m] of Object.entries(report[t])) console.log(`  ${t.padEnd(5)} ${k.padEnd(12)} ${fmt(m)}`);
console.log("\nTuned signal weights:", qCfg.signalWeights);
console.log("Tuned session weights (quali):", qCfg.sessionWeights);
console.log("Tuned session weights (race):", rCfg.sessionWeights);

if (!process.argv.includes("--no-write")) {
  const round = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, +v.toFixed(3)]));
  const defaults = {
    signalWeights: qCfg.signalWeights,
    sessionWeights: { quali: qCfg.sessionWeights, race: rCfg.sessionWeights },
    rankSigma: +(report.race.tuned.mae * 1.25).toFixed(2),
    backtest: {
      date: new Date().toISOString().slice(0, 10), trainedOn: report.trainedOn, testedOn: report.testedOn,
      quali: round(report.quali.tuned), race: round(report.race.tuned),
      baselines: { qualiPrevious: round(report.quali.previous), qualiBestLapOnly: round(report.quali.bestLapOnly), racePrevious: round(report.race.previous), raceGridOnly: round(report.race.gridOnly) },
    },
  };
  writeFileSync("src/f1/defaults.js", `// Model defaults — generated by scripts/backtest.mjs on ${defaults.backtest.date}. Re-run it to refresh.\nexport default ${JSON.stringify(defaults, null, 2)};\n`);
  console.log("\nWrote src/f1/defaults.js");
}
