import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useVibeCart } from '../state/store';

export const ActionChips: React.FC = () => {
  const { chips, dismissChip } = useVibeCart();
  if (chips.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed z-50 bottom-24 left-4 md:bottom-auto md:top-20 md:right-8 md:left-auto flex flex-col gap-2 w-[calc(100%-6rem)] max-w-sm pointer-events-none"
    >
      {chips.map((chip) => {
        const borderColor =
          chip.type === 'success'
            ? 'border-[#2EE59D]/50'
            : chip.type === 'error'
              ? 'border-[#FF4D5E]/50'
              : 'border-[#4DA3FF]/50';

        const Icon =
          chip.type === 'success'
            ? CheckCircle2
            : chip.type === 'error'
              ? AlertCircle
              : Info;

        const iconColor =
          chip.type === 'success'
            ? 'text-[#2EE59D]'
            : chip.type === 'error'
              ? 'text-[#FF4D5E]'
              : 'text-[#4DA3FF]';

        return (
          <div
            key={chip.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-[14px] bg-[#111111]/95 backdrop-blur-md border ${borderColor} shadow-xl`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
              <span className="text-xs sm:text-sm font-medium text-[#F5F5F5] truncate">
                {chip.text}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {chip.onUndo && (
                <button
                  type="button"
                  onClick={() => {
                    chip.onUndo?.();
                    dismissChip(chip.id);
                  }}
                  className="text-xs font-semibold text-[#FFA040] hover:text-white cursor-pointer"
                >
                  {chip.undoLabel ?? 'Undo'}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismissChip(chip.id)}
                aria-label="Dismiss notification"
                className="text-[#9A9A9A] hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
