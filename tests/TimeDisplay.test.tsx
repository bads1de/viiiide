import React from "react";
import { render, screen, act } from "@testing-library/react";
import { TimeDisplay } from "@/components/editor/TimeDisplay";
import { PlayerRef } from "@remotion/player";

describe("TimeDisplay", () => {
  const mockPlayerRef = {
    current: {
      getCurrentFrame: jest.fn(),
    } as unknown as PlayerRef,
  };

  const defaultProps = {
    playerRef: mockPlayerRef as React.RefObject<PlayerRef>,
    duration: 60, // 1 minute in seconds
    FPS: 30,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock requestAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      // We don't want infinite loop in test unless we control it
      return 1;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders initial time correctly", () => {
    (mockPlayerRef.current!.getCurrentFrame as jest.Mock).mockReturnValue(0);
    render(<TimeDisplay {...defaultProps} />);
    
    // 00:00:00 / 00:01:00
    expect(screen.getByText("00:00:00")).toBeInTheDocument();
    expect(screen.getByText("00:01:00")).toBeInTheDocument();
  });

  it("updates display when frame changes", () => {
    // Initial render
    (mockPlayerRef.current!.getCurrentFrame as jest.Mock).mockReturnValue(0);
    const { rerender } = render(<TimeDisplay {...defaultProps} />);
    
    // Simulate frame change to 30 (1 second at 30 FPS)
    (mockPlayerRef.current!.getCurrentFrame as jest.Mock).mockReturnValue(30);

    // Force animation callback
    const animateCallback = (window.requestAnimationFrame as jest.Mock).mock.calls[0][0];
    act(() => {
      animateCallback();
    });

    expect(screen.getByText("00:00:01")).toBeInTheDocument();
  });

  it("handles non-finite duration", () => {
    render(<TimeDisplay {...defaultProps} duration={Infinity} />);
    const times = screen.getAllByText("00:00:00");
    expect(times).toHaveLength(2);
  });
});
