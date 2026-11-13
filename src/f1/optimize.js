// Exact line-up search: every 5-driver × 2-constructor combination under the budget.
// ~26k driver sets × 55 constructor pairs — a few tens of milliseconds in the browser.

function* combos(items, k, start = 0, acc = []) {
  if (acc.length === k) { yield acc; return; }
  for (let i = start; i <= items.length - (k - acc.length); i++) yield* combos(items, k, i + 1, [...acc, items[i]]);
}

/**
 * @param drivers [{id, price, pts}]  @param teams [{id, price, pts}]
 * The highest-scoring driver in each line-up gets the 2× boost.
 * Returns the `top` best distinct line-ups.
 */
export function optimizeLineups(drivers, teams, { budget = 100, top = 5 } = {}) {
  const dsets = [];
  for (const set of combos(drivers, 5)) {
    let cost = 0, pts = 0, best = set[0];
    for (const d of set) { cost += d.price; pts += d.pts; if (d.pts > best.pts) best = d; }
    if (cost <= budget) dsets.push({ set, cost, pts: pts + best.pts, boost: best.id });
  }
  dsets.sort((a, b) => b.pts - a.pts);

  const results = [];
  for (const pair of combos(teams, 2)) {
    const cCost = pair[0].price + pair[1].price, cPts = pair[0].pts + pair[1].pts;
    const room = budget - cCost;
    // dsets is sorted by points: the first few that fit are the best for this pair.
    let found = 0;
    for (const d of dsets) {
      if (d.cost > room + 1e-9) continue;
      results.push({ drivers: d.set, constructors: pair, boost: d.boost, cost: +(d.cost + cCost).toFixed(1), pts: d.pts + cPts });
      if (++found >= top) break;
    }
  }
  results.sort((a, b) => b.pts - a.pts || a.cost - b.cost);
  return results.slice(0, top);
}
