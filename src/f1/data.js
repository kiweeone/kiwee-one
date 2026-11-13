// OpenF1 data access + per-session feature extraction.
// Pure JS (no React) so it runs in the browser and in Node (back-test script).

const BASE = "https://api.openf1.org";

// In the browser on kiwee.one we go through the authenticated proxy (/api/openf1).
// On localhost and in Node we call OpenF1 directly.
const viaProxy = typeof window !== "undefined" && !/^(localhost|127\.)/.test(window.location.hostname);

let fetchImpl = (url) => fetch(url);
/** Back-test script can swap in a cached / throttled fetcher. */
export function setFetch(fn) { fetchImpl = fn; }

// Keep at most 3 requests in flight and retry politely on rate limits.
let active = 0; const queue = [];
const acquire = () => new Promise((res) => { if (active < 3) { active++; res(); } else queue.push(res); });
const release = () => { const next = queue.shift(); if (next) next(); else active--; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function api(path) {
  const url = viaProxy ? `/api/openf1?path=${encodeURIComponent(path)}` : BASE + path;
  await acquire();
  try {
    for (let attempt = 0; ; attempt++) {
      const r = await fetchImpl(url);
      if (r.status === 429 && attempt < 4) { await sleep(1000 * 2 ** attempt); continue; }
      if (r.status === 404) return []; // OpenF1 answers 404 for "no rows"
      if (!r.ok) throw new Error(`OpenF1 ${r.status} for ${path}`);
      return r.json();
    }
  } finally { release(); }
}

// ─── Session discovery ───
export const SESSION_ORDER = ["fp1", "fp2", "fp3", "sprintQuali", "sprint", "quali", "race"];
export const SESSION_LABEL = { fp1: "FP1", fp2: "FP2", fp3: "FP3", sprintQuali: "Sprint Quali", sprint: "Sprint", quali: "Quali", race: "Race" };

export function classifySession(s) {
  const n = (s.session_name || "").toLowerCase().trim();
  if (/practice 1|fp1/.test(n)) return "fp1";
  if (/practice 2|fp2/.test(n)) return "fp2";
  if (/practice 3|fp3/.test(n)) return "fp3";
  if (/sprint (qualifying|shootout)/.test(n)) return "sprintQuali";
  if (n === "sprint") return "sprint";
  if (n === "qualifying") return "quali";
  if (n === "race") return "race";
  return null;
}

/** Group a list of OpenF1 sessions into weekends: [{ meetingKey, name, location, date, sessions: {fp1: key, ...} }] */
export function groupWeekends(sessions) {
  const by = new Map();
  for (const s of sessions) {
    const k = classifySession(s);
    if (!k) continue;
    if (!by.has(s.meeting_key)) by.set(s.meeting_key, { meetingKey: s.meeting_key, name: s.country_name, location: s.location, circuit: s.circuit_short_name, date: s.date_start, sessions: {} });
    by.get(s.meeting_key).sessions[k] = s.session_key;
  }
  return [...by.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Latest weekend of the season that has at least one session started. */
export async function fetchLatestWeekend(year = new Date().getFullYear()) {
  const all = await api(`/v1/sessions?year=${year}`);
  const now = new Date().toISOString();
  const started = all.filter((s) => s.date_start <= now);
  const weekends = groupWeekends(started.length ? started : all);
  if (!weekends.length) throw new Error("No sessions found");
  return weekends[weekends.length - 1];
}

// ─── Lap cleaning + features ───
export const TYRE_DELTA = { SOFT: 0, MEDIUM: 0.6, HARD: 1.2, INTERMEDIATE: 0, WET: 0 };

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };

/**
 * Turn raw OpenF1 rows for one session into per-driver features, keyed by 3-letter code.
 * Drivers are identified from /drivers (name_acronym) — never by a hard-coded car number.
 */
export function buildFeatures({ laps, stints = [], drivers = [], results = [] }) {
  const code = {}, team = {}, name = {};
  for (const d of drivers) {
    code[d.driver_number] = d.name_acronym;
    team[d.name_acronym] = { name: d.team_name, colour: d.team_colour ? `#${d.team_colour}` : null };
    name[d.name_acronym] = d.first_name && d.last_name ? `${d.first_name} ${d.last_name}` : d.full_name || d.name_acronym;
  }

  const stintsBy = {};
  for (const s of stints) (stintsBy[s.driver_number] ||= []).push({ compound: (s.compound || "").toUpperCase(), start: s.lap_start, end: s.lap_end });
  const compoundOf = (dn, lap) => (stintsBy[dn] || []).find((s) => lap >= s.start && (!s.end || lap <= s.end))?.compound || "";

  const lapsBy = {};
  for (const l of laps) if (l.lap_duration > 0 && !l.is_pit_out_lap) (lapsBy[l.driver_number] ||= []).push(l);

  const sessionBest = Math.min(...Object.values(lapsBy).flat().map((l) => l.lap_duration));
  const out = {};

  for (const [dnStr, all] of Object.entries(lapsBy)) {
    const dn = +dnStr;
    const id = code[dn];
    if (!id) continue;
    // Drop cool-down / in-laps and aborted runs: keep laps within 107% of the driver's best
    // and within 115% of the session's best.
    const best = Math.min(...all.map((l) => l.lap_duration));
    const clean = all.filter((l) => l.lap_duration <= best * 1.07 && l.lap_duration <= sessionBest * 1.15);
    if (!clean.length) continue;

    const bestLapObj = clean.reduce((a, b) => (b.lap_duration < a.lap_duration ? b : a));
    const bestTyre = compoundOf(dn, bestLapObj.lap_number);

    const s1 = clean.map((l) => l.duration_sector_1).filter((x) => x > 0);
    const s2 = clean.map((l) => l.duration_sector_2).filter((x) => x > 0);
    const s3 = clean.map((l) => l.duration_sector_3).filter((x) => x > 0);
    const idealLap = s1.length && s2.length && s3.length ? Math.min(...s1) + Math.min(...s2) + Math.min(...s3) : 0;

    // Long runs: 5+ clean laps on one tyre stint. Compare on a soft-equivalent basis and
    // measure consistency *within* each run (not across quali sims and long runs mixed).
    const runs = [];
    for (const st of stintsBy[dn] || []) {
      const rl = clean.filter((l) => l.lap_number >= st.start && (!st.end || l.lap_number <= st.end)).map((l) => l.lap_duration);
      if (rl.length >= 5) {
        const sorted = [...rl].sort((a, b) => a - b).slice(0, -1); // drop the slowest lap of the run
        runs.push({ compound: st.compound, laps: rl.length, avg: mean(sorted), adj: mean(sorted) - (TYRE_DELTA[st.compound] || 0), sd: std(sorted) });
      }
    }
    const longest = runs.reduce((a, r) => (!a || r.laps > a.laps ? r : a), null);

    const speeds = clean.map((l) => l.st_speed || 0).filter((v) => v > 0);
    const res = results.find((r) => r.driver_number === dn);

    out[id] = {
      id, name: name[id], team: team[id] || null,
      bestLap: best, bestTyre,
      paceAdj: best - (TYRE_DELTA[bestTyre] || 0),
      idealLap,
      longRun: longest ? longest.adj : 0,
      longRunInfo: longest,
      consistency: runs.length ? mean(runs.map((r) => r.sd)) : 0,
      topSpeed: speeds.length ? Math.max(...speeds) : 0,
      lapCount: clean.length,
      sector1: s1.length ? Math.min(...s1) : 0,
      sector2: s2.length ? Math.min(...s2) : 0,
      sector3: s3.length ? Math.min(...s3) : 0,
      position: Number.isInteger(res?.position) ? res.position : 0, // official classification when available (OpenF1 can return e.g. "RT")
      dnf: !!(res && (res.dnf || res.dns || res.dsq)),
      timeline: all.map((l) => ({ lap: l.lap_number, time: l.lap_duration })).sort((a, b) => a.lap - b.lap),
    };
  }

  // Classification fallback for practice sessions: order by best lap.
  const order = Object.values(out).sort((a, b) => (a.position || 99) - (b.position || 99) || a.bestLap - b.bestLap);
  order.forEach((d, i) => { if (!d.position) d.position = i + 1; d.rank = i + 1; });
  return out;
}

/** Fetch + featurise one session. Practice sessions skip the results call. */
export async function loadSession(sessionKey, kind) {
  const needsResult = ["quali", "sprintQuali", "sprint", "race"].includes(kind);
  const [laps, stints, drivers, results] = await Promise.all([
    api(`/v1/laps?session_key=${sessionKey}`),
    api(`/v1/stints?session_key=${sessionKey}`).catch(() => []),
    api(`/v1/drivers?session_key=${sessionKey}`).catch(() => []),
    needsResult ? api(`/v1/session_result?session_key=${sessionKey}`).catch(() => []) : Promise.resolve([]),
  ]);
  return buildFeatures({ laps, stints, drivers, results });
}

/** Load every available session of a weekend in parallel. Returns { data: {fp1: {...}}, errors: {fp2: "..."} }. */
export async function loadWeekend(weekend, onProgress) {
  const entries = Object.entries(weekend.sessions);
  const data = {}, errors = {};
  await Promise.all(entries.map(async ([kind, key]) => {
    try {
      const f = await loadSession(key, kind);
      if (Object.keys(f).length) data[kind] = f; else errors[kind] = "No lap data yet";
    } catch (e) { errors[kind] = e.message; }
    onProgress?.(kind, data[kind], errors[kind]);
  }));
  return { data, errors };
}
