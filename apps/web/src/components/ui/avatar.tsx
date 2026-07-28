import { clsx } from "./clsx";

type AvatarProps = {
  name: string;
  src?: string | null;
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, src, className }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar sources are arbitrary remote URLs, not worth next/image's remotePatterns config yet
      <img
        src={src}
        alt={name}
        className={clsx("h-10 w-10 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        "flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white dark:bg-white dark:text-slate-900",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
