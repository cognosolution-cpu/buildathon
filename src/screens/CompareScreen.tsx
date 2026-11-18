import React from 'react';
import { Award, Check, Plus } from 'lucide-react';
import { buildComparison } from '../nlu/compareLogic';
import { useVibeCart } from '../state/store';

export const CompareScreen: React.FC = () => {
  const { products, compareIds, setCompareIds, addToCart, navigate } = useVibeCart();

  const selectedProducts = compareIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is (typeof products)[number] => Boolean(p));

  const comparison = buildComparison(
    selectedProducts.length >= 2 ? selectedProducts : products.slice(0, 2)
  );

  const handleSlotChange = (slotIdx: number, nextId: string) => {
    const next = [...(selectedProducts.length >= 2 ? selectedProducts.map((p) => p.id) : [products[0].id, products[1].id])];
    next[slotIdx] = nextId;
    setCompareIds(Array.from(new Set(next)));
  };

  if (!comparison) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F5F5]">
            Compare Gear
          </h1>
          <p className="text-sm text-[#9A9A9A] mt-1">
            Side-by-side acoustic and hardware specification breakdown.
          </p>
        </div>

        {comparison.products.length < 3 && (
          <button
            type="button"
            onClick={() => {
              const unused = products.find((p) => !comparison.products.some((sp) => sp.id === p.id));
              if (unused) setCompareIds([...comparison.products.map((p) => p.id), unused.id]);
            }}
            className="h-10 px-4 rounded-[14px] bg-white/5 border border-white/10 text-xs font-medium text-[#F5F5F5] hover:border-[#FF6A00] inline-flex items-center gap-1.5 self-start cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add 3rd product</span>
          </button>
        )}
      </div>

      {/* Deterministic Assistant Verdict */}
      <div className="rounded-[20px] vc-glass p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FF6A00]/15 text-[#FFA040] flex items-center justify-center shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-[#FFA040]">Assistant Verdict</p>
          <p className="font-display text-base font-semibold text-[#F5F5F5] mt-0.5">
            {comparison.verdict}
          </p>
        </div>
      </div>

      {/* Product Selector & Comparison Table */}
      <div className="rounded-[20px] vc-glass overflow-x-auto">
        <table className="w-full min-w-[600px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-5 text-xs font-medium text-[#9A9A9A] w-44 align-top">
                Specification
              </th>
              {comparison.products.map((prod, idx) => (
                <th key={prod.id} className="p-5 align-top">
                  <div className="space-y-3">
                    <label className="block">
                      <span className="sr-only">Select product {idx + 1}</span>
                      <select
                        value={prod.id}
                        onChange={(e) => handleSlotChange(idx, e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#111111] border border-white/15 text-xs font-medium text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00]"
                      >
                        {products.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => navigate('product', prod.id)}
                      className="block w-full aspect-[4/3] rounded-[14px] bg-[#0B0B0B] overflow-hidden cursor-pointer"
                    >
                      <img
                        src={prod.imageUrl}
                        alt={prod.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>

                    <div className="text-xs text-[#FFA040] font-medium">
                      {prod.id === comparison.bestRatedId
                        ? 'Highest Rated'
                        : prod.id === comparison.bestValueId
                          ? 'Best Value'
                          : prod.brand}
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(prod.id, 1)}
                      className="w-full h-10 px-3 rounded-[14px] bg-white text-[#050505] text-xs font-semibold hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                    >
                      Add to Cart
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {comparison.rows.map((row) => (
              <tr key={row.label}>
                <td className="p-4 px-5 text-xs font-medium text-[#9A9A9A]">
                  {row.label}
                </td>
                {row.values.map((val, colIdx) => {
                  const isWinner = row.winnerIndex === colIdx;
                  return (
                    <td
                      key={`${row.label}-${colIdx}`}
                      className={`p-4 px-5 text-sm tabular-nums ${
                        isWinner ? 'text-[#2EE59D] font-semibold' : 'text-[#F5F5F5]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {val}
                        {isWinner && <Check className="w-3.5 h-3.5 text-[#2EE59D]" />}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
