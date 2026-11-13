// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFeatures } from "./data.js";
import { rankScores, predict, expectedPoints, projectWeekend, spearman, POINTS } from "./model.js";
import { optimizeLineups } from "./optimize.js";

const lap = (dn, n, t, extra = {}) => ({ driver_number: dn, lap_number: n, lap_duration: t, duration_sector_1: t / 3, duration_sector_2: t / 3, duration_sector_3: t / 3, st_speed: 300, ...extra });

test("drivers are matched by acronym from /drivers, not by a hard-coded number", () => {
  const f = buildFeatures({ laps: [lap(99, 1, 90), lap(1, 1, 91)], drivers: [{ driver_number: 99, name_acronym: "NEW" }, { driver_number: 1, name_acronym: "OLD" }] });
  assert.deepEqual(Object.keys(f).sort(), ["NEW", "OLD"]);
  assert.equal(f.NEW.rank, 1);
});

test("cool-down and pit-out laps are dropped before computing pace", () => {
  const laps = [lap(1, 1, 120, { is_pit_out_lap: true }), lap(1, 2, 90), lap(1, 3, 140), lap(1, 4, 90.5)];
  const f = buildFeatures({ laps, drivers: [{ driver_number: 1, name_acronym: "AAA" }] });
  assert.equal(f.AAA.bestLap, 90);
  assert.equal(f.AAA.lapCount, 2);
});

test("long-run pace is compared on a soft-equivalent basis", () => {
  const run = (dn, base) => Array.from({ length: 6 }, (_, i) => lap(dn, i + 1, base + i * 0.01));
  const f = buildFeatures({
    laps: [...run(1, 93), ...run(2, 93.4)],
    stints: [{ driver_number: 1, compound: "SOFT", lap_start: 1, lap_end: 6 }, { driver_number: 2, compound: "HARD", lap_start: 1, lap_end: 6 }],
    drivers: [{ driver_number: 1, name_acronym: "SFT" }, { driver_number: 2, name_acronym: "HRD" }],
  });
  assert.ok(f.HRD.longRun < f.SFT.longRun, "0.4s slower on hards should beat the same run on softs");
});

test("rank scores: best = 1, worst = 0, ties share, missing excluded", () => {
  const r = rankScores({ A: { id: "A", x: 1 }, B: { id: "B", x: 2 }, C: { id: "C", x: 2 }, D: { id: "D", x: 0 } }, "x", false);
  assert.equal(r.A, 1); assert.equal(r.B, 0.25); assert.equal(r.C, 0.25); assert.equal(r.D, undefined);
});

test("a driver who skipped a session is not ranked as slowest", () => {
  const s = (pairs) => Object.fromEntries(pairs.map(([id, t]) => [id, { id, bestLap: t, lapCount: 20 }]));
  const data = { fp1: s([["A", 90], ["B", 91], ["C", 92]]), fp2: s([["A", 90], ["C", 92]]) };
  const rows = predict(data, "quali", { signalWeights: { bestLap: 1 }, sessionWeights: { fp1: 1, fp2: 1 } });
  assert.deepEqual(rows.map((r) => r.id), ["A", "B", "C"]);
});

test("race prediction leans on the qualifying result once it exists", () => {
  const s = (pairs) => Object.fromEntries(pairs.map(([id, t]) => [id, { id, bestLap: t, lapCount: 20 }]));
  const q = { A: { id: "A", position: 3 }, B: { id: "B", position: 1 }, C: { id: "C", position: 2 } };
  const rows = predict({ fp3: s([["A", 90], ["B", 91], ["C", 92]]), quali: q }, "race", { signalWeights: { bestLap: 1 }, sessionWeights: { fp3: 10, quali: 100 } });
  assert.equal(rows[0].id, "B");
});

test("expected points are smooth around a predicted position", () => {
  const p1 = expectedPoints(1, 20, POINTS.race, 2), p10 = expectedPoints(10, 20, POINTS.race, 2), p18 = expectedPoints(18, 20, POINTS.race, 2);
  assert.ok(p1 > p10 && p10 > p18 && p18 >= 0);
  assert.ok(p1 < 25, "uncertainty means P1 prediction is worth less than a certain win");
});

test("finished sessions score their actual result", () => {
  const data = { quali: { A: { id: "A", position: 1 }, B: { id: "B", position: 2 } }, race: { A: { id: "A", position: 2 }, B: { id: "B", position: 1 } } };
  const p = projectWeekend(data);
  assert.equal(p.A.total, 10 + 18);
  assert.equal(p.B.total, 9 + 25);
});

test("spearman is 1 for identical order and -1 for reversed", () => {
  assert.equal(spearman({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 }), 1);
  assert.equal(spearman({ a: 3, b: 2, c: 1 }, { a: 1, b: 2, c: 3 }), -1);
});

test("optimizer finds the true best line-up under budget, with 2x boost", () => {
  const drivers = Array.from({ length: 10 }, (_, i) => ({ id: `D${i}`, price: 10 + i, pts: 10 + i * 3 }));
  const teams = Array.from({ length: 4 }, (_, i) => ({ id: `T${i}`, price: 5 + i * 5, pts: 5 + i * 4 }));
  const [best] = optimizeLineups(drivers, teams, { budget: 100 });
  assert.ok(best.cost <= 100);
  // brute-force check
  let top = -1;
  const ds = drivers, n = ds.length;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) for (let d = c + 1; d < n; d++) for (let e = d + 1; e < n; e++)
    for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) {
      const set = [ds[a], ds[b], ds[c], ds[d], ds[e]], cs = [teams[x], teams[y]];
      const cost = [...set, ...cs].reduce((s, z) => s + z.price, 0); if (cost > 100) continue;
      const pts = set.reduce((s, z) => s + z.pts, 0) + Math.max(...set.map((z) => z.pts)) + cs[0].pts + cs[1].pts;
      top = Math.max(top, pts);
    }
  assert.equal(best.pts, top);
});
