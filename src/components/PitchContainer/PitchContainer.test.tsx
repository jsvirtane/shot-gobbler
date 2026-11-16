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

// Clicks go to the shared-image area (pitch plus legend)
const getPitch = () => document.getElementById("share-pitch")!;
// The visible pitch itself
const getVisiblePitch = () =>
  document.querySelector<HTMLElement>("[data-testid=pitch]")!;

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
      expect(getVisiblePitch().style.aspectRatio).toBe(String(74 / 110));
      const content = getVisiblePitch().firstElementChild as HTMLElement;
      expect(content.style.height).toBe("100%");
    });
  });

  it("shows the legend under the pitch, inside the shared-image area", () => {
    render(
      <PitchContainer
        onCoordinateClick={onClick}
        legend={<div data-testid="legend" />}
      />,
    );
    const legend = document.querySelector("[data-testid=legend]");
    expect(getPitch().contains(legend as HTMLElement)).toBe(true);
    expect(getVisiblePitch().contains(legend as HTMLElement)).toBe(false);
  });

  describe("half variant", () => {
    it("maps clicks in the visible bottom half to full-pitch coordinates", () => {
      mockRect(200, 200);
      render(<PitchContainer onCoordinateClick={onClick} variant="half" />);

      // Top-left corner of the visible area -> halfway line, left touchline
      fireEvent.click(getPitch(), { clientX: 10, clientY: 20 });
      expect(onClick).toHaveBeenLastCalledWith(0, 50);

      // Bottom edge -> the bottom goal line
      fireEvent.click(getPitch(), { clientX: 60, clientY: 220 });
      expect(onClick).toHaveBeenLastCalledWith(25, 100);

      fireEvent.click(getPitch(), { clientX: 160, clientY: 70 });
      expect(onClick).toHaveBeenLastCalledWith(75, 62.5);
    });

    it("ignores clicks outside the visible area", () => {
      mockRect(200, 200);
      render(<PitchContainer onCoordinateClick={onClick} variant="half" />);

      fireEvent.click(getPitch(), { clientX: 60, clientY: 230 });
      fireEvent.click(getPitch(), { clientX: 5, clientY: 50 });
      expect(onClick).not.toHaveBeenCalled();
    });

    it("crops to the bottom half so children keep full-pitch positions", () => {
      render(
        <PitchContainer onCoordinateClick={onClick} variant="half">
          <span data-testid="marker" style={{ left: "50%", top: "75%" }} />
        </PitchContainer>,
      );
      expect(getVisiblePitch().style.aspectRatio).toBe(String(74 / 55));
      expect(getVisiblePitch().className).toContain("overflow-hidden");
      // Content box is twice the visible height and shifted up by one
      // visible height, so top: 75% of the full pitch lands halfway down
      const content = getVisiblePitch().firstElementChild as HTMLElement;
      expect(content.style.height).toBe("200%");
      expect(content.style.top).toBe("-100%");
      expect(content.querySelector("[data-testid=marker]")).not.toBeNull();
    });
  });
});
