import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fetchLatestWeekend, loadWeekend, SESSION_ORDER, SESSION_LABEL } from "./f1/data.js";
import { SIGNALS, DEFAULT_SIGNAL_WEIGHTS, DEFAULT_SESSION_WEIGHTS, RANK_SIGMA, PREDICTORS, projectWeekend, predict } from "./f1/model.js";
import DEFAULTS from "./f1/defaults.js";
import { optimizeLineups } from "./f1/optimize.js";
import { DEFAULT_DRIVER_PRICES, DEFAULT_TEAM_PRICES, BUDGET, rosterFrom } from "./f1/fantasy.js";

/* ─── F1 Fantasy Predictor ─────────────────────────────────────────────
   Data: OpenF1 · Model + optimizer: ./f1/*.js (tested, back-tested)      */

const C = { bg: "#fafafa", card: "#fff", line: "#e6e6e6", ink: "#1a1a1a", sub: "#6b6b6b", faint: "#9a9a9a", red: "#e10600", green: "#14873e", soft: "#f2f2f2" };
const TYRE = { SOFT: ["#e10600", "#fff", "S"], MEDIUM: ["#f5c518", "#1a1a1a", "M"], HARD: ["#e9e9e9", "#1a1a1a", "H"], INTERMEDIATE: ["#14873e", "#fff", "I"], WET: ["#3671C6", "#fff", "W"] };

const fmtLap = (s) => { if (!s || s <= 0) return "—"; const m = Math.floor(s / 60); const r = s - m * 60; return m ? `${m}:${r.toFixed(3).padStart(6, "0")}` : r.toFixed(3); };
const money = (v) => (v == null ? "—" : `$${v.toFixed(1)}M`);
const short = (name = "") => name.split(" ").slice(-1)[0];

// localStorage that survives private mode / disabled storage
function useStored(key, initial) {
  const [v, setV] = useState(() => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch { return initial; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV];
}

const Tyre = ({ c }) => { const t = TYRE[c]; return t ? <span title={c} style={{ display: "inline-grid", placeItems: "center", width: 26, height: 26, borderRadius: "50%", background: t[0], color: t[1], fontSize: 12, fontWeight: 800, border: `1px solid ${C.line}` }}>{t[2]}</span> : <span style={{ color: C.faint }}>—</span>; };
const Bar = ({ colour }) => <span style={{ width: 5, height: 30, borderRadius: 3, background: colour, flexShrink: 0 }} />;
const Card = ({ children, style }) => <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, ...style }}>{children}</div>;
const H2 = ({ children, sub }) => <div style={{ margin: "40px 0 16px" }}><h2 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 900, letterSpacing: "-0.02em" }}>{children}</h2>{sub && <p style={{ fontSize: 16, color: C.sub, marginTop: 6, maxWidth: 760, lineHeight: 1.5 }}>{sub}</p>}</div>;

function Slider({ label, desc, value, onChange, max = 100 }) {
  return (
    <label style={{ display: "block", padding: "14px 0", borderTop: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <span><span style={{ fontSize: 17, fontWeight: 700 }}>{label}</span>{desc && <span style={{ fontSize: 14, color: C.sub, marginLeft: 8 }}>{desc}</span>}</span>
        <span style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: value ? C.ink : C.faint }}>{value}</span>
      </div>
      <input type="range" min={0} max={max} value={value} onChange={(e) => onChange(+e.target.value)} style={{ width: "100%", marginTop: 8 }} />
    </label>
  );
}

export default function F1Predictor() {
  const [tab, setTab] = useState("predict");
  const [weekend, setWeekend] = useState(null);
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fatal, setFatal] = useState(null);

  const [driverPrices, setDriverPrices] = useStored("f1p.driverPrices", DEFAULT_DRIVER_PRICES);
  const [teamPrices, setTeamPrices] = useStored("f1p.teamPrices", DEFAULT_TEAM_PRICES);
  const [signalWeights, setSignalWeights] = useStored("f1p.signalWeights.v2", DEFAULT_SIGNAL_WEIGHTS);
  const [sessionWeights, setSessionWeights] = useStored("f1p.sessionWeights.v2", DEFAULT_SESSION_WEIGHTS);
  const [myTeam, setMyTeam] = useStored("f1p.myTeam", { drivers: [], teams: [] });
  const [statsSession, setStatsSession] = useState(null);
  const [traceDrivers, setTraceDrivers] = useState([]);

  const load = useCallback(async () => {
    setLoading(true); setFatal(null); setData({}); setErrors({});
    try {
      const w = await fetchLatestWeekend();
      setWeekend(w);
      const acc = {};
      const { errors } = await loadWeekend(w, (kind, d) => { if (d) { acc[kind] = d; setData({ ...acc }); } });
      setErrors(errors);
    } catch (e) { setFatal(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const loaded = SESSION_ORDER.filter((k) => data[k]);
  const hasData = loaded.length > 0;
  const roster = useMemo(() => rosterFrom(data), [data]);
  const proj = useMemo(() => (hasData ? projectWeekend(data, { signalWeights, sessionWeights, sigma: RANK_SIGMA }) : {}), [data, hasData, signalWeights, sessionWeights]);
  const raceOrder = useMemo(() => (hasData ? predict(data, "race", { signalWeights, sessionWeights: sessionWeights.race }) : []), [data, hasData, signalWeights, sessionWeights]);

  const fantasyDrivers = Object.values(roster.drivers).filter((d) => driverPrices[d.id] != null).map((d) => ({ ...d, price: driverPrices[d.id], pts: proj[d.id]?.total || 0 }));
  const fantasyTeams = Object.values(roster.teams).filter((t) => teamPrices[t.id] != null).map((t) => ({
    ...t, price: teamPrices[t.id], pts: Object.values(roster.drivers).filter((d) => d.team === t.id).reduce((s, d) => s + (proj[d.id]?.total || 0), 0),
  }));
  const lineups = useMemo(() => (hasData ? optimizeLineups(fantasyDrivers, fantasyTeams, { budget: BUDGET, top: 5 }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasData, JSON.stringify(fantasyDrivers.map((d) => [d.id, d.price, d.pts])), JSON.stringify(fantasyTeams.map((t) => [t.id, t.price, t.pts]))]);

  const mine = { drivers: myTeam.drivers.filter((id) => roster.drivers[id] || driverPrices[id] != null), teams: myTeam.teams };
  const myCost = mine.drivers.reduce((s, id) => s + (driverPrices[id] || 0), 0) + mine.teams.reduce((s, id) => s + (teamPrices[id] || 0), 0);
  const myPtsList = mine.drivers.map((id) => proj[id]?.total || 0);
  const myPts = myPtsList.reduce((a, b) => a + b, 0) + (myPtsList.length ? Math.max(...myPtsList) : 0) + mine.teams.reduce((s, id) => s + (fantasyTeams.find((t) => t.id === id)?.pts || 0), 0);

  const ss = statsSession && data[statsSession] ? statsSession : loaded[loaded.length - 1];
  const statsRows = ss ? Object.values(data[ss]).sort((a, b) => a.rank - b.rank) : [];
  const trace = traceDrivers.length ? traceDrivers : statsRows.slice(0, 4).map((d) => d.id);
  const traceData = useMemo(() => {
    if (!ss) return [];
    const rows = {};
    for (const id of trace) for (const p of data[ss][id]?.timeline || []) (rows[p.lap] ||= { lap: p.lap })[id] = p.time;
    const all = Object.values(rows).flatMap((r) => trace.map((id) => r[id]).filter(Boolean));
    const best = Math.min(...all);
    return Object.values(rows).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, k === "lap" || v <= best * 1.08 ? v : null]))).sort((a, b) => a.lap - b.lap);
  }, [data, ss, trace.join()]);

  const bt = DEFAULTS.backtest;
  // Once the race is run, list drivers in finishing order; before that, in predicted order.
  const tableRows = raceOrder.filter((r) => roster.drivers[r.id]).sort((a, b) => (proj[a.id]?.raceRank || 99) - (proj[b.id]?.raceRank || 99));
  const pill = (active) => ({ minHeight: 44, padding: "10px 20px", borderRadius: 999, border: `1px solid ${active ? C.ink : C.line}`, background: active ? C.ink : C.card, color: active ? "#fff" : C.ink, fontSize: 16, fontWeight: 700, cursor: "pointer" });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "'Inter', -apple-system, 'Helvetica Neue', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0} a{color:inherit;text-decoration:none} button{font-family:inherit}
        input[type=range]{accent-color:${C.red};height:28px;cursor:pointer}
        table{width:100%;border-collapse:collapse} th{font-size:13px;font-weight:700;color:${C.sub};text-transform:uppercase;letter-spacing:.06em;text-align:left;padding:14px 16px;white-space:nowrap}
        td{padding:14px 16px;font-size:16px;border-top:1px solid ${C.line};font-variant-numeric:tabular-nums;white-space:nowrap}
        .wrap{max-width:1200px;margin:0 auto;padding:0 24px}
        .grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(440px,100%),1fr));gap:24px}
        .tabs{display:flex;gap:8px;overflow-x:auto;padding:16px 0;scrollbar-width:none}
        @media (max-width:640px){ td,th{padding:12px 10px} .wrap{padding:0 16px} }
      `}</style>

      {/* ─── Header ─── */}
      <header style={{ background: C.red, color: "#fff" }}>
        <div className="wrap" style={{ padding: "18px 24px 36px" }}>
          <Link to="/" style={{ fontSize: 15, fontWeight: 600, opacity: 0.8 }}>← kiwee.one</Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginTop: 28 }}>
            <div>
              <h1 style={{ fontSize: "clamp(44px, 8vw, 96px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95 }}>F1 Predictor</h1>
              <p style={{ fontSize: 18, marginTop: 12, opacity: 0.9 }}>{weekend ? `${weekend.name} · ${weekend.circuit || weekend.location}` : "Fantasy picks from practice and qualifying data"}</p>
            </div>
            <button onClick={load} disabled={loading} style={{ minHeight: 48, padding: "12px 26px", borderRadius: 999, border: "2px solid #fff", background: loading ? "transparent" : "#fff", color: loading ? "#fff" : C.red, fontSize: 16, fontWeight: 800, cursor: loading ? "default" : "pointer" }}>
              {loading ? "Loading…" : "Refresh data"}
            </button>
          </div>
        </div>
      </header>

      <nav style={{ position: "sticky", top: 0, zIndex: 10, background: `${C.bg}f2`, backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div className="wrap tabs">
          {[["predict", "Prediction"], ["lineups", "Best line-ups"], ["team", "My team"], ["sessions", "Sessions"], ["model", "Model & accuracy"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ ...pill(tab === k), flexShrink: 0 }}>{l}</button>
          ))}
        </div>
      </nav>

      <main className="wrap" style={{ paddingBottom: 96 }}>
        {/* Session status */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
          {weekend && SESSION_ORDER.filter((k) => weekend.sessions[k]).map((k) => (
            <span key={k} style={{ fontSize: 15, fontWeight: 600, padding: "8px 14px", borderRadius: 999, background: data[k] ? "#e7f5ec" : C.soft, color: data[k] ? C.green : C.faint, border: `1px solid ${data[k] ? "#bfe3cc" : C.line}` }}>
              {data[k] ? "✓ " : errors[k] ? "· " : loading ? "… " : "· "}{SESSION_LABEL[k]}
            </span>
          ))}
        </div>
        {fatal && <Card style={{ padding: 24, marginTop: 24, borderColor: "#f3c2bf", background: "#fff6f5" }}><b>Couldn't load data.</b> <span style={{ color: C.sub }}>{fatal}</span></Card>}
        {!hasData && !loading && !fatal && <Card style={{ padding: 32, marginTop: 24, fontSize: 18, color: C.sub }}>No session data yet for this weekend. Check back after FP1.</Card>}

        {/* ═══ PREDICTION ═══ */}
        {tab === "predict" && hasData && (<>
          <H2 sub={data.race ? "Race finished — showing the actual result and points." : data.quali ? "Qualifying is done, so the race prediction starts from the grid and adjusts for practice pace." : "Predicted from practice so far. Points combine expected qualifying, sprint and race position points."}>
            Projected weekend
          </H2>
          <Card style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th style={{ width: 56, textAlign: "center" }}>#</th><th>Driver</th><th>Quali</th><th>Race</th>{data.race && <th>Model said</th>}<th style={{ textAlign: "right" }}>{data.race ? "Points" : "Proj. pts"}</th><th style={{ textAlign: "right" }}>Price</th><th style={{ textAlign: "right" }}>Pts / $M</th></tr></thead>
                <tbody>
                  {tableRows.map((r, i) => {
                    const d = roster.drivers[r.id], p = proj[r.id] || {}, price = driverPrices[r.id];
                    return (
                      <tr key={r.id} style={{ background: i < 3 ? "#fcfcfc" : undefined }}>
                        <td style={{ textAlign: "center", fontSize: 20, fontWeight: 900, color: i < 3 ? C.ink : C.faint }}>{i + 1}</td>
                        <td><div style={{ display: "flex", alignItems: "center", gap: 12 }}><Bar colour={d.colour} /><div><div style={{ fontSize: 17, fontWeight: 700 }}>{d.name}</div><div style={{ fontSize: 14, color: C.sub }}>{roster.teams[d.team]?.name}</div></div></div></td>
                        <td style={{ color: C.sub }}>P{p.qualiRank ?? "—"}</td>
                        <td style={{ color: C.sub }}>P{p.raceRank ?? "—"}</td>
                        {data.race && <td style={{ color: C.sub }}>P{r.rank}{p.raceRank && <span style={{ marginLeft: 8, fontSize: 14, color: Math.abs(r.rank - p.raceRank) <= 2 ? C.green : C.faint }}>{r.rank === p.raceRank ? "✓" : `${r.rank > p.raceRank ? "+" : "−"}${Math.abs(r.rank - p.raceRank)}`}</span>}</td>}
                        <td style={{ textAlign: "right", fontSize: 18, fontWeight: 800 }}>{(p.total || 0).toFixed(1)}</td>
                        <td style={{ textAlign: "right", color: C.sub }}>{money(price)}</td>
                        <td style={{ textAlign: "right", color: C.sub }}>{price ? ((p.total || 0) / price).toFixed(2) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <p style={{ fontSize: 15, color: C.sub, marginTop: 14, lineHeight: 1.6 }}>
            Counts qualifying, sprint and race <b>position points</b> only. Overtakes, positions gained, fastest lap, driver of the day, pit-stop and DNF points aren't predicted.
            {bt && <> On past weekends, this model put drivers within about <b>{bt.race.mae.toFixed(1)} places</b> of their actual race finish.</>}
          </p>
        </>)}

        {/* ═══ LINE-UPS ═══ */}
        {tab === "lineups" && hasData && (<>
          <H2 sub={`${data.race ? "The race is over, so these are the best line-ups in hindsight. " : ""}Every combination of 5 drivers and 2 constructors under $${BUDGET}M is checked. The top scorer in each line-up gets the 2× boost.`}>Best line-ups</H2>
          <div className="grid2">
            {lineups.map((lu, i) => (
              <Card key={i} style={{ padding: 24, borderColor: i === 0 ? C.ink : C.line, borderWidth: i === 0 ? 2 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: i === 0 ? C.red : C.sub, textTransform: "uppercase", letterSpacing: ".06em" }}>{i === 0 ? "Best line-up" : `Option ${i + 1}`}</span>
                  <span><span style={{ fontSize: 30, fontWeight: 900 }}>{lu.pts.toFixed(0)}</span><span style={{ fontSize: 16, color: C.sub }}> pts · {money(lu.cost)}</span></span>
                </div>
                {lu.drivers.map((d) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
                    <Bar colour={d.colour} /><span style={{ flex: 1, fontSize: 17, fontWeight: 700 }}>{d.name}{d.id === lu.boost && <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 800, background: C.red, color: "#fff", padding: "3px 8px", borderRadius: 6 }}>2×</span>}</span>
                    <span style={{ fontSize: 16, color: C.sub }}>{d.pts.toFixed(1)} pts · {money(d.price)}</span>
                  </div>
                ))}
                {lu.constructors.map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
                    <Bar colour={t.colour} /><span style={{ flex: 1, fontSize: 17, fontWeight: 700 }}>{t.name} <span style={{ fontSize: 14, color: C.faint, fontWeight: 500 }}>constructor</span></span>
                    <span style={{ fontSize: 16, color: C.sub }}>{t.pts.toFixed(1)} pts · {money(t.price)}</span>
                  </div>
                ))}
              </Card>
            ))}
          </div>

          <H2 sub="Prices change every week — update them here. Your edits are saved in this browser.">Prices</H2>
          <div className="grid2">
            {[["Drivers", Object.values(roster.drivers), driverPrices, setDriverPrices], ["Constructors", Object.values(roster.teams), teamPrices, setTeamPrices]].map(([title, list, prices, setPrices]) => (
              <Card key={title} style={{ padding: "8px 24px 16px" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: ".06em", padding: "14px 0" }}>{title}</div>
                {list.sort((a, b) => (prices[b.id] || 0) - (prices[a.id] || 0)).map((x) => (
                  <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: `1px solid ${C.line}` }}>
                    <Bar colour={x.colour} /><span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{x.name}</span>
                    <span style={{ fontSize: 16, color: C.sub }}>$</span>
                    <input type="number" step="0.1" min="0" value={prices[x.id] ?? ""} placeholder="set"
                      onChange={(e) => setPrices((p) => ({ ...p, [x.id]: e.target.value === "" ? undefined : +e.target.value }))}
                      style={{ width: 84, minHeight: 40, fontSize: 16, padding: "6px 10px", border: `1px solid ${C.line}`, borderRadius: 10, textAlign: "right", fontFamily: "inherit" }} />
                    <span style={{ fontSize: 16, color: C.sub }}>M</span>
                  </div>
                ))}
              </Card>
            ))}
          </div>
          <button onClick={() => { setDriverPrices(DEFAULT_DRIVER_PRICES); setTeamPrices(DEFAULT_TEAM_PRICES); }} style={{ ...pill(false), marginTop: 16 }}>Reset prices</button>
        </>)}

        {/* ═══ MY TEAM ═══ */}
        {tab === "team" && (<>
          <H2 sub="Pick 5 drivers and 2 constructors. Saved in this browser.">My team</H2>
          <Card style={{ padding: 24, display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center" }}>
            <div><div style={{ fontSize: 15, color: C.sub }}>Cost</div><div style={{ fontSize: 36, fontWeight: 900, color: myCost > BUDGET ? C.red : C.ink }}>{money(myCost)}</div></div>
            <div><div style={{ fontSize: 15, color: C.sub }}>Projected (with 2×)</div><div style={{ fontSize: 36, fontWeight: 900 }}>{hasData ? myPts.toFixed(0) : "—"}</div></div>
            <div><div style={{ fontSize: 15, color: C.sub }}>Picked</div><div style={{ fontSize: 36, fontWeight: 900 }}>{mine.drivers.length}/5 · {mine.teams.length}/2</div></div>
            {lineups[0] && <div style={{ fontSize: 16, color: C.sub }}>Best possible: <b style={{ color: C.ink }}>{lineups[0].pts.toFixed(0)} pts</b></div>}
          </Card>
          {[["Drivers", Object.values(roster.drivers).length ? Object.values(roster.drivers) : Object.keys(DEFAULT_DRIVER_PRICES).map((id) => ({ id, name: id, colour: "#888" })), "drivers", 5, driverPrices],
            ["Constructors", Object.values(roster.teams).length ? Object.values(roster.teams) : Object.keys(DEFAULT_TEAM_PRICES).map((id) => ({ id, name: id, colour: "#888" })), "teams", 2, teamPrices]].map(([title, list, key, max, prices]) => (
            <div key={key}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: ".06em", margin: "32px 0 12px" }}>{title} ({mine[key].length}/{max})</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 10 }}>
                {[...list].sort((a, b) => (prices[b.id] || 0) - (prices[a.id] || 0)).map((x) => {
                  const on = mine[key].includes(x.id);
                  return (
                    <button key={x.id} onClick={() => setMyTeam((t) => ({ ...t, [key]: on ? t[key].filter((y) => y !== x.id) : t[key].length < max ? [...t[key], x.id] : t[key] }))}
                      style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 60, padding: "10px 16px", borderRadius: 14, cursor: "pointer", textAlign: "left", background: on ? "#fff" : C.card, border: `2px solid ${on ? x.colour : C.line}`, boxShadow: on ? "0 4px 14px rgba(0,0,0,.06)" : "none" }}>
                      <Bar colour={x.colour} />
                      <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 17, fontWeight: 700, color: C.ink }}>{x.name}</span>
                        {hasData && key === "drivers" && <span style={{ fontSize: 14, color: C.sub }}>{(proj[x.id]?.total || 0).toFixed(1)} pts</span>}</span>
                      <span style={{ fontSize: 16, color: C.sub, fontWeight: 600 }}>{money(prices[x.id])}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </>)}

        {/* ═══ SESSIONS ═══ */}
        {tab === "sessions" && hasData && (<>
          <H2>Session results</H2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {loaded.map((k) => <button key={k} onClick={() => setStatsSession(k)} style={pill(ss === k)}>{SESSION_LABEL[k]}</button>)}
          </div>
          <Card style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th style={{ textAlign: "center" }}>Pos</th><th>Driver</th><th>Tyre</th><th>Best lap</th><th>Ideal lap</th><th>Long run</th><th>Top speed</th><th>Laps</th></tr></thead>
                <tbody>
                  {statsRows.map((d) => (
                    <tr key={d.id}>
                      <td style={{ textAlign: "center", fontSize: 18, fontWeight: 800 }}>{d.position}</td>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 12 }}><Bar colour={d.team?.colour || "#888"} /><span style={{ fontSize: 17, fontWeight: 700 }}>{d.name}</span></div></td>
                      <td><Tyre c={d.bestTyre} /></td>
                      <td style={{ fontWeight: 700 }}>{fmtLap(d.bestLap)}</td>
                      <td style={{ color: C.sub }}>{fmtLap(d.idealLap)}</td>
                      <td style={{ color: C.sub }}>{d.longRunInfo ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Tyre c={d.longRunInfo.compound} />{fmtLap(d.longRunInfo.avg)} · {d.longRunInfo.laps} laps</span> : "—"}</td>
                      <td style={{ color: C.sub }}>{d.topSpeed ? `${d.topSpeed} km/h` : "—"}</td>
                      <td style={{ color: C.sub }}>{d.lapCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <H2 sub="Clean laps only. Tap drivers to compare (up to 6).">Lap times — {SESSION_LABEL[ss]}</H2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {statsRows.map((d) => { const on = trace.includes(d.id); return (
              <button key={d.id} onClick={() => setTraceDrivers(on ? trace.filter((x) => x !== d.id) : trace.length < 6 ? [...trace, d.id] : trace)}
                style={{ minHeight: 40, padding: "8px 14px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", background: on ? "#fff" : C.soft, color: on ? C.ink : C.sub, border: `2px solid ${on ? d.team?.colour || C.ink : "transparent"}` }}>{short(d.name)}</button>
            ); })}
          </div>
          <Card style={{ padding: "24px 12px 12px" }}>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={traceData} margin={{ left: 8, right: 16 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="lap" minTickGap={24} tick={{ fill: C.sub, fontSize: 14 }} label={{ value: "Lap", position: "insideBottomRight", offset: -4, fill: C.faint, fontSize: 13 }} />
                <YAxis tick={{ fill: C.sub, fontSize: 14 }} domain={["auto", "auto"]} tickFormatter={fmtLap} width={78} />
                <Tooltip formatter={(v, id) => [fmtLap(v), short(data[ss][id]?.name)]} labelFormatter={(l) => `Lap ${l}`} contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 15 }} />
                <Legend formatter={(id) => short(data[ss][id]?.name)} wrapperStyle={{ fontSize: 15 }} />
                {trace.map((id) => <Line key={id} dataKey={id} stroke={data[ss][id]?.team?.colour || C.ink} strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} isAnimationActive={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>)}

        {/* ═══ MODEL ═══ */}
        {tab === "model" && (<>
          <H2 sub="The weights below were tuned on every 2025 weekend, then tested on 2026 weekends the model had never seen. Comparisons use the same cleaned data; the old app also mis-matched some drivers, so it did worse than the 'old weights' line suggests.">How accurate is it?</H2>
          {bt ? (
            <div className="grid2">
              {[["Qualifying order", bt.quali, [["Old hand-set weights", bt.baselines.qualiPrevious], ["Best practice lap only", bt.baselines.qualiBestLapOnly]]],
                ["Race finishing order", bt.race, [["Old hand-set weights", bt.baselines.racePrevious], ["Starting grid only", bt.baselines.raceGridOnly]]]].map(([title, m, base]) => (
                <Card key={title} style={{ padding: 24 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</div>
                  <div style={{ display: "flex", gap: 28, flexWrap: "wrap", margin: "14px 0 18px" }}>
                    <div><div style={{ fontSize: 40, fontWeight: 900 }}>±{m.mae.toFixed(1)}</div><div style={{ fontSize: 15, color: C.sub }}>places, average error</div></div>
                    <div><div style={{ fontSize: 40, fontWeight: 900 }}>{m.top10.toFixed(1)}<span style={{ fontSize: 20, color: C.sub }}>/10</span></div><div style={{ fontSize: 15, color: C.sub }}>top-10 picked correctly</div></div>
                    <div><div style={{ fontSize: 40, fontWeight: 900 }}>{m.rho.toFixed(2)}</div><div style={{ fontSize: 15, color: C.sub }}>rank correlation</div></div>
                  </div>
                  {base.map(([label, b]) => <div key={label} style={{ fontSize: 15, color: C.sub, padding: "8px 0", borderTop: `1px solid ${C.line}` }}>{label}: ±{b.mae.toFixed(1)} places · {b.top10.toFixed(1)}/10 · {b.rho.toFixed(2)}</div>)}
                  <div style={{ fontSize: 14, color: C.faint, marginTop: 8 }}>{m.n} weekends · {bt.date}</div>
                </Card>
              ))}
            </div>
          ) : <Card style={{ padding: 24, color: C.sub }}>Back-test results not available.</Card>}

          <H2 sub="How much each practice measurement counts. 0 switches a signal off.">Signal weights</H2>
          <Card style={{ padding: "8px 24px" }}>
            {SIGNALS.map((s) => <Slider key={s.key} label={s.label} desc={s.desc} value={signalWeights[s.key] || 0} onChange={(v) => setSignalWeights((w) => ({ ...w, [s.key]: v }))} />)}
          </Card>
          <H2 sub="How much each session counts towards the prediction.">Session weights</H2>
          <div className="grid2">
            {["quali", "race"].map((t) => (
              <Card key={t} style={{ padding: "8px 24px" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: ".06em", padding: "14px 0" }}>Predicting {t === "quali" ? "qualifying" : "the race"}</div>
                {PREDICTORS[t].map((k) => <Slider key={k} label={SESSION_LABEL[k]} value={sessionWeights[t]?.[k] || 0} onChange={(v) => setSessionWeights((w) => ({ ...w, [t]: { ...w[t], [k]: v } }))} />)}
              </Card>
            ))}
          </div>
          <button onClick={() => { setSignalWeights(DEFAULT_SIGNAL_WEIGHTS); setSessionWeights(DEFAULT_SESSION_WEIGHTS); }} style={{ ...pill(false), marginTop: 16 }}>Reset to tuned defaults</button>
        </>)}
      </main>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: "24px", textAlign: "center", fontSize: 15, color: C.sub }}>
        F1 Predictor · data from <a href="https://openf1.org" target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>OpenF1</a> · made by <Link to="/" style={{ textDecoration: "underline" }}>Zhelyo Ivanov</Link>
      </footer>
    </div>
  );
}
