import React from "react";
import { render } from "@testing-library/react";
import { WaveformTrack } from "@/components/editor/WaveformTrack";
import WaveSurfer from "wavesurfer.js";

// Mock WaveSurfer
jest.mock("wavesurfer.js", () => {
  return {
    create: jest.fn(() => ({
      destroy: jest.fn(),
    })),
  };
});

describe("WaveformTrack", () => {
  const defaultProps = {
    url: "test.mp4",
    duration: 10,
    widthPerSecond: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders container div", () => {
    const { container } = render(<WaveformTrack {...defaultProps} />);
    expect(container.firstChild).toHaveClass("w-full h-full flex flex-col justify-center");
  });

  it("creates WaveSurfer instance on mount with correct options", () => {
    render(<WaveformTrack {...defaultProps} />);
    expect(WaveSurfer.create).toHaveBeenCalledTimes(1);
    const options = (WaveSurfer.create as jest.Mock).mock.calls[0][0];
    expect(options).toMatchObject({
      url: "test.mp4",
      minPxPerSec: 100,
      interact: false,
    });
  });

  it("destroys WaveSurfer instance on unmount", () => {
    const { unmount } = render(<WaveformTrack {...defaultProps} />);
    const mockWs = (WaveSurfer.create as jest.Mock).mock.results[0].value;
    unmount();
    expect(mockWs.destroy).toHaveBeenCalledTimes(1);
  });

  it("does not create WaveSurfer if url is null", () => {
    render(<WaveformTrack {...defaultProps} url={null} />);
    expect(WaveSurfer.create).not.toHaveBeenCalled();
  });
});
