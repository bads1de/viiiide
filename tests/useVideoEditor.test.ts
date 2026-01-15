import { renderHook, act } from "@testing-library/react";
import { useVideoEditor } from "@/hooks/useVideoEditor";

// Mock global APIs
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();
global.fetch = jest.fn();

// Mock Remotion and other external dependencies
jest.mock("@remotion/webcodecs", () => ({
  extractFrames: jest.fn(),
}));

describe("useVideoEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useVideoEditor());

    expect(result.current.videoPath).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.processingState.status).toBe("idle");
  });

  it("should handle handleRemoveVideo", () => {
    const { result } = renderHook(() => useVideoEditor());

    act(() => {
      result.current.handleRemoveVideo();
    });

    expect(result.current.videoPath).toBeNull();
    expect(result.current.frames).toEqual([]);
    expect(result.current.isPlaying).toBe(false);
  });

  it("should handle play/pause toggle", () => {
    const { result } = renderHook(() => useVideoEditor());
    
    const mockPlayer = {
      isPlaying: jest.fn().mockReturnValue(false),
      play: jest.fn(),
      pause: jest.fn(),
    };
    
    // Manually setting the ref for the test
    Object.defineProperty(result.current.playerRef, 'current', {
      value: mockPlayer,
      writable: true
    });

    act(() => {
      result.current.handleTogglePlay();
    });

    expect(mockPlayer.play).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(true);

    mockPlayer.isPlaying.mockReturnValue(true);
    act(() => {
      result.current.handleTogglePlay();
    });

    expect(mockPlayer.pause).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });
});
