import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineEditor } from "@/components/editor/TimelineEditor";
import { PlayerRef } from "@remotion/player";
import { TimelineState } from "@xzdarcy/react-timeline-editor";

// Mock WaveformTrack
jest.mock("@/components/editor/WaveformTrack", () => ({
  WaveformTrack: () => <div data-testid="waveform-track">Waveform</div>,
}));

// Mock TimeDisplay
jest.mock("@/components/editor/TimeDisplay", () => ({
  TimeDisplay: () => <div>00:00:00</div>,
}));

// Mock @xzdarcy/react-timeline-editor
jest.mock("@xzdarcy/react-timeline-editor", () => ({
  Timeline: jest.fn(({ scaleWidth }) => (
    <div data-testid="timeline">Timeline Scale: {scaleWidth}</div>
  )),
}));

describe("TimelineEditor", () => {
  const mockPlayerRef = {
    current: {
      isPlaying: jest.fn(),
      seekTo: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
    } as unknown as PlayerRef,
  };

  const mockTimelineState = {
    current: {} as TimelineState,
  };

  const defaultProps = {
    videoPath: "test.mp4",
    duration: 100, // frames
    frames: ["frame1.jpg", "frame2.jpg"],
    subtitles: [],
    FPS: 30,
    playerRef: mockPlayerRef as React.RefObject<PlayerRef>,
    timelineState: mockTimelineState as React.RefObject<TimelineState>,
    onTogglePlay: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockPlayerRef.current!.isPlaying as jest.Mock).mockReturnValue(false);
  });

  it("renders timeline editor structure", () => {
    render(<TimelineEditor {...defaultProps} />);
    expect(screen.getByTestId("timeline")).toBeInTheDocument();
    expect(screen.getByText("00:00:00")).toBeInTheDocument(); // TimeDisplay
  });

  it("renders play button when paused", () => {
    (mockPlayerRef.current!.isPlaying as jest.Mock).mockReturnValue(false);
    render(<TimelineEditor {...defaultProps} />);
    // Play icon is usually just an svg, but we can check calls or look for button.
    // The button has onClick onTogglePlay.
    // Let's assume there is a button.
    const buttons = screen.getAllByRole("button");
    // We can try to click the one that calls onTogglePlay
    // Or check if onTogglePlay is called when clicking play button.
    // Since we don't have aria-labels on buttons (based on my previous read), I'll try to find by icon or order.
    // The control bar has: Play/Pause, Settings, ZoomOut, ZoomIn.
    // Play/Pause is the first button.
    fireEvent.click(buttons[0]);
    expect(defaultProps.onTogglePlay).toHaveBeenCalled();
  });

  it("updates zoom level", () => {
    render(<TimelineEditor {...defaultProps} />);
    expect(screen.getByText("Timeline Scale: 120")).toBeInTheDocument();

    const rangeInput = screen.getByRole("slider"); // type="range"
    fireEvent.change(rangeInput, { target: { value: "200" } });
    
    expect(screen.getByText("Timeline Scale: 200")).toBeInTheDocument();
  });

  it("zoom in button increases scale", () => {
    render(<TimelineEditor {...defaultProps} />);
    // Zoom in is the last button? No.
    // Buttons: Play, Settings, ZoomOut, ZoomIn.
    // Wait, the order in code:
    /*
        <div className="flex items-center gap-2">
          <button onClick={onTogglePlay}>...</button>
          <button>Settings</button>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button onClick={ZoomOut}>...</button>
          <input type="range" ... />
          <button onClick={ZoomIn}>...</button>
    */
    // So buttons are: Play, Settings, ZoomOut, ZoomIn.
    // ZoomIn is the 4th button (index 3).
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[3]); // ZoomIn
    
    // Initial 120, +20 = 140
    expect(screen.getByText("Timeline Scale: 140")).toBeInTheDocument();
  });

   it("zoom out button decreases scale", () => {
    render(<TimelineEditor {...defaultProps} />);
    // ZoomOut is 3rd button (index 2).
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[2]); // ZoomOut
    
    // Initial 120, -20 = 100
    expect(screen.getByText("Timeline Scale: 100")).toBeInTheDocument();
  });
});
