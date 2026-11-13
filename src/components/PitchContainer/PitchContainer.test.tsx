import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PitchContainer from "./PitchContainer";

vi.mock("../../assets/football_pitch.svg", () => ({
  default: "mocked-football-pitch",
}));

// Visible pitch area: 200px wide, offset 10px/20px from the viewport origin
const mockRect = (width: number, height: number) => {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    width,
    height,
    left: 10,
    top: 20,
    right: 10 + width,
    bottom: 20 + height,
    x: 10,
    y: 20,
    toJSON: () => ({}),
  });
};

const getPitch = () => document.getElementById("share-pitch")!;

describe("PitchContainer", () => {
  const onClick = vi.fn();

  beforeEach(() => onClick.mockReset());
  afterEach(() => vi.restoreAllMocks());

  describe("full variant", () => {
    it("maps clicks to full-pitch % coordinates", () => {
      mockRect(200, 400);
      render(<PitchContainer onCoordinateClick={onClick} />);

      fireEvent.click(getPitch(), { clientX: 110, clientY: 120 });
      expect(onClick).toHaveBeenLastCalledWith(50, 25);

      fireEvent.click(getPitch(), { clientX: 210, clientY: 420 });
      expect(onClick).toHaveBeenLastCalledWith(100, 100);
    });

    it("uses the 74:110 aspect ratio and no zoom", () => {
      render(<PitchContainer onCoordinateClick={onClick} />);
      expect(getPitch().style.aspectRatio).toBe(String(74 / 110));
      const content = getPitch().firstElementChild as HTMLElement;
      expect(content.style.height).toBe("100%");
    });
  });

  describe("half-top variant", () => {
    it("maps clicks in the visible top half to full-pitch coordinates", () => {
      mockRect(200, 200);
      render(<PitchContainer onCoordinateClick={onClick} variant="half-top" />);

      // Top-left corner -> top-left corner of the pitch
      fireEvent.click(getPitch(), { clientX: 10, clientY: 20 });
      expect(onClick).toHaveBeenLastCalledWith(0, 0);

      // Bottom edge of the visible area -> halfway line
      fireEvent.click(getPitch(), { clientX: 60, clientY: 220 });
      expect(onClick).toHaveBeenLastCalledWith(25, 50);

      fireEvent.click(getPitch(), { clientX: 160, clientY: 70 });
      expect(onClick).toHaveBeenLastCalledWith(75, 12.5);
    });

    it("ignores clicks outside the visible area", () => {
      mockRect(200, 200);
      render(<PitchContainer onCoordinateClick={onClick} variant="half-top" />);

      fireEvent.click(getPitch(), { clientX: 60, clientY: 230 });
      fireEvent.click(getPitch(), { clientX: 5, clientY: 50 });
      expect(onClick).not.toHaveBeenCalled();
    });

    it("crops to the top half so children keep full-pitch positions", () => {
      render(
        <PitchContainer onCoordinateClick={onClick} variant="half-top">
          <span data-testid="marker" style={{ left: "50%", top: "25%" }} />
        </PitchContainer>,
      );
      expect(getPitch().style.aspectRatio).toBe(String(74 / 55));
      expect(getPitch().className).toContain("overflow-hidden");
      // Content box is twice the visible height, so top: 25% of the full
      // pitch lands halfway down the visible half
      const content = getPitch().firstElementChild as HTMLElement;
      expect(content.style.height).toBe("200%");
      expect(content.querySelector("[data-testid=marker]")).not.toBeNull();
    });
  });
});
