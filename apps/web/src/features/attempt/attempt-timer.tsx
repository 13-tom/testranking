"use client";

import { useEffect, useRef, useState } from "react";

function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function AttemptTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const expiryMs = new Date(expiresAt).getTime();
  const [remainingSeconds, setRemainingSeconds] = useState(() => Math.max(0, Math.round((expiryMs - Date.now()) / 1000)));
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((expiryMs - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiryMs, onExpire]);

  return (
    <span
      className={remainingSeconds <= 60 ? "font-semibold text-red-500" : "font-semibold"}
      role="timer"
    >
      {formatSeconds(remainingSeconds)}
    </span>
  );
}
