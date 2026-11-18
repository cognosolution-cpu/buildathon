import type { Product } from '../types';

export interface ComparisonRow {
  label: string;
  values: string[];
  winnerIndex: number | null;
}

export interface ComparisonResult {
  products: Product[];
  rows: ComparisonRow[];
  bestValueId: string;
  bestRatedId: string;
  verdict: string;
}

export function buildComparison(products: Product[]): ComparisonResult | null {
  if (products.length < 2) return null;
  const list = products.slice(0, 3);

  const specKeys = Array.from(new Set(list.flatMap((p) => Object.keys(p.specs))));

  const rows: ComparisonRow[] = [
    {
      label: 'Price',
      values: list.map((p) => `₹${p.price.toLocaleString('en-IN')}`),
      winnerIndex: list.reduce((best, p, i) => (p.price < list[best].price ? i : best), 0),
    },
    {
      label: 'Rating',
      values: list.map((p) => `${p.rating.toFixed(1)} ★ (${p.ratingCount.toLocaleString('en-IN')})`),
      winnerIndex: list.reduce((best, p, i) => (p.rating > list[best].rating ? i : best), 0),
    },
    ...specKeys.map((key) => {
      const values = list.map((p) => p.specs[key] ?? '—');
      const numericVals = values.map((v) => {
        const m = v.match(/(\d+(?:\.\d+)?)/);
        return m ? Number(m[1]) : NaN;
      });
      let winnerIndex: number | null = null;
      if (numericVals.every((n) => !Number.isNaN(n)) && new Set(numericVals).size > 1) {
        const lowerIsBetter = /latency|weight/i.test(key);
        winnerIndex = numericVals.reduce(
          (best, n, i) => (lowerIsBetter ? (n < numericVals[best] ? i : best) : n > numericVals[best] ? i : best),
          0
        );
      }
      return { label: key, values, winnerIndex };
    }),
  ];

  const ratedGood = list.filter((p) => p.rating >= 4.0);
  const valuePool = ratedGood.length > 0 ? ratedGood : list;
  const bestValue = valuePool.reduce((a, b) => (b.price < a.price ? b : a));
  const bestRated = list.reduce((a, b) => (b.rating > a.rating ? b : a));

  const verdict =
    bestValue.id === bestRated.id
      ? `${bestValue.title} leads on both value (₹${bestValue.price.toLocaleString('en-IN')}) and rating (${bestValue.rating}★).`
      : `Best value: ${bestValue.title} at ₹${bestValue.price.toLocaleString('en-IN')}. Highest rated: ${bestRated.title} (${bestRated.rating}★).`;

  return {
    products: list,
    rows,
    bestValueId: bestValue.id,
    bestRatedId: bestRated.id,
    verdict,
  };
}
