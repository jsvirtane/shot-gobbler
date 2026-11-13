import { act, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

/**
 * jsdom has no PointerEvent, so fireEvent.pointer* would drop clientX/Y.
 * Call once per test file before firing pointer events.
 */
export const polyfillPointerEvent = () => {
  if (typeof window.PointerEvent !== "undefined") return;
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "mouse";
    }
  }
  window.PointerEvent = PointerEventPolyfill as typeof PointerEvent;
};

/** Mocks every element's bounding rect (i.e. the pitch) to a fixed box. */
export const mockRect = (width: number, height: number) =>
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    width,
    height,
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });

/**
 * Long-presses `marker` and drags it to `to` (viewport px), then releases.
 * Needs fake timers.
 */
export const longPressDrag = (
  marker: HTMLElement,
  to: { clientX: number; clientY: number },
) => {
  const rect = marker.getBoundingClientRect();
  fireEvent.pointerDown(marker, {
    pointerId: 1,
    pointerType: "touch",
    clientX: rect.left,
    clientY: rect.top,
  });
  act(() => {
    vi.advanceTimersByTime(450);
  });
  fireEvent.pointerMove(marker, { pointerId: 1, pointerType: "touch", ...to });
  fireEvent.pointerUp(marker, { pointerId: 1, pointerType: "touch", ...to });
  // Browsers may follow a drag with a click; it must be ignored
  fireEvent.click(marker, to);
};
