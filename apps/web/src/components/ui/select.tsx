import { forwardRef, type SelectHTMLAttributes } from "react";
import { clsx } from "./clsx";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={clsx(
          "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-white",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
