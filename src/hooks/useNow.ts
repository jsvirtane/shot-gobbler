import { useEffect, useState } from "react";

/** The current time, updated every second while `ticking`. */
export const useNow = (ticking: boolean) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!ticking) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [ticking]);
  return now;
};
