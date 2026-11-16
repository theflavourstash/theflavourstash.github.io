import {calculate} from './calc.js';

// Coverage counts distinct concentrates with any stock, not their recipe percentages.
export function availability(recipe, flavours) {
  const result = calculate(recipe, flavours);
  const rows = result.rows.map(row => {
    const flavour = flavours.find(f => f.id === row.id);
    return {...row, company: flavour?.company || '', missing: !flavour || row.available <= 0,
      shortBy: Math.max(0, row.ml - row.available)};
  });
  const owned = rows.filter(row => !row.missing).length;
  const total = rows.length;
  const maxBatch = total && !result.errors.length
    ? Math.min(...rows.map(row => row.available / row.ml * recipe.volume)) : 0;
  return {rows, owned, total, percent: total ? owned / total * 100 : 0,
    missing: rows.filter(row => row.missing),
    short: rows.filter(row => !row.missing && row.shortBy > 0.000001),
    canMake: total > 0 && !result.errors.length && !result.shortages.length,
    maxBatch, errors: result.errors};
}

export function sortRecipes(recipes, mode, flavours) {
  return [...recipes].sort((a,b) => {
    if (mode === 'name') return a.name.localeCompare(b.name);
    if (mode === 'available') return availability(b,flavours).percent - availability(a,flavours).percent || a.name.localeCompare(b.name);
    const ad = Date.parse(a.createdAt), bd = Date.parse(b.createdAt);
    if (!Number.isFinite(ad)) return Number.isFinite(bd) ? 1 : a.name.localeCompare(b.name);
    if (!Number.isFinite(bd)) return -1;
    return mode === 'oldest' ? ad - bd : bd - ad;
  });
}
