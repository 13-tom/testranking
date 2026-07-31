import type { RankScope } from "@board-ranking/shared";
import { clsx } from "@/components/ui/clsx";

export type ScopeOption = { scope: RankScope; scopeId: string; label: string };

export function ScopeTabs({
  options,
  active,
  onSelect,
}: {
  options: ScopeOption[];
  active: ScopeOption;
  onSelect: (option: ScopeOption) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.scope === active.scope && option.scopeId === active.scopeId;
        return (
          <button
            key={`${option.scope}-${option.scopeId}`}
            onClick={() => onSelect(option)}
            className={clsx(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              isActive
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
