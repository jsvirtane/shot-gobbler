import React from "react";

/**
 * Pulses its marker once (a quick scale, see `.marker-pulse`) whenever
 * `pulseKey` changes; nothing while it is undefined. Off under
 * prefers-reduced-motion.
 */
export const Pulse: React.FC<{
  pulseKey?: number;
  children: React.ReactNode;
}> = ({ pulseKey, children }) =>
  pulseKey === undefined ? (
    children
  ) : (
    // A new key remounts the span, which restarts the animation
    <span
      key={pulseKey}
      className="marker-pulse flex items-center justify-center"
      data-testid="marker-pulse"
    >
      {children}
    </span>
  );

export default Pulse;
