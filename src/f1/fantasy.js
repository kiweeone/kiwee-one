// Fantasy prices. These are starting values only — the app lets you edit them each week
// and remembers your edits in the browser.
export const DEFAULT_DRIVER_PRICES = {
  VER: 27.7, NOR: 27.2, RUS: 27.4, PIA: 25.5, LEC: 24.0, HAM: 21.0, ANT: 23.2, HAD: 13.5,
  GAS: 9.5, ALO: 10.0, STR: 7.5, BEA: 7.0, OCO: 8.5, SAI: 11.8, ALB: 11.6, LAW: 7.0,
  LIN: 5.5, HUL: 8.0, BOR: 6.5, COL: 6.0, PER: 6.0, BOT: 5.0,
};
export const DEFAULT_TEAM_PRICES = {
  mclaren: 30.0, redbull: 28.5, mercedes: 27.0, ferrari: 25.0, astonmartin: 14.0, alpine: 8.5,
  haas: 10.0, racingbulls: 6.3, williams: 12.0, audi: 7.0, cadillac: 5.0,
};
export const BUDGET = 100;

/** "Red Bull Racing" → "redbull", "Haas F1 Team" → "haas", "Racing Bulls" → "racingbulls". */
export function teamKey(name = "") {
  const n = name.toLowerCase().replace(/[^a-z]/g, "");
  if (n.includes("racingbulls") || n === "rb" || n.includes("visacashapp")) return "racingbulls";
  if (n.includes("redbull")) return "redbull";
  for (const k of Object.keys(DEFAULT_TEAM_PRICES)) if (n.includes(k)) return k;
  if (n.includes("kick") || n.includes("sauber")) return "audi";
  return n || "unknown";
}

/** Drivers and teams in the most recent loaded session (so FP1 stand-ins drop out once the race drivers return). */
export function rosterFrom(data) {
  const drivers = {}, teams = {};
  const latest = ["race", "quali", "sprint", "sprintQuali", "fp3", "fp2", "fp1"].find((k) => data[k]);
  for (const kind of latest ? [latest] : []) {
    for (const d of Object.values(data[kind] || {})) {
      if (!d.team?.name) continue;
      const tk = teamKey(d.team.name);
      drivers[d.id] = { id: d.id, name: d.name || d.id, team: tk, colour: d.team.colour || "#888" };
      teams[tk] = { id: tk, name: d.team.name.replace(/ F1 Team$/, "").replace(/ Racing$/, ""), colour: d.team.colour || "#888" };
    }
  }
  return { drivers, teams };
}
