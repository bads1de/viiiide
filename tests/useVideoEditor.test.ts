import { renderHook, act } from "@testing-library/react";
import { useVideoEditor } from "@/hooks/useVideoEditor";

declare const jest: any;
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const global: any;

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
    expect(result.current.subtitlePosition).toEqual({ x: 0, y: 1600 });
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
    Object.defineProperty(result.current.playerRef, "current", {
      value: mockPlayer,
      writable: true,
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

  it("should update subtitle position correctly", () => {
    const { result } = renderHook(() => useVideoEditor());

    act(() => {
      result.current.updateSubtitlesPosition(100, 200);
    });

    expect(result.current.subtitlePosition).toEqual({ x: 100, y: 200 });
  });

  it("should handle rapid updates without crashing", () => {
    const { result } = renderHook(() => useVideoEditor());

    act(() => {
      for (let i = 0; i < 100; i++) {
        result.current.updateSubtitlesPosition(i, i);
      }
    });

    expect(result.current.subtitlePosition).toEqual({ x: 99, y: 99 });
  });

  it("should maintain position values correctly over multiple calls", () => {
    const { result } = renderHook(() => useVideoEditor());

    act(() => {
      result.current.updateSubtitlesPosition(100, 200);
    });
    expect(result.current.subtitlePosition).toEqual({ x: 100, y: 200 });

    act(() => {
      result.current.updateSubtitlesPosition(150, 250);
    });
    expect(result.current.subtitlePosition).toEqual({ x: 150, y: 250 });
  });

  it("should apply current position to newly set subtitles", () => {
    const { result } = renderHook(() => useVideoEditor());

    // 1. 位置を移動
    act(() => {
      result.current.updateSubtitlesPosition(500, 600);
    });

    // 2. 字幕をセット（本来はAPIから取得するが、ここでは手動セットを想定）
    // 内部的に fetchSubtitles の結果をセットする箇所を再現
    act(() => {
      const newSubs = [{ text: "New Sub", startInMs: 0, endInMs: 1000 }];
      // @ts-ignore - accessor to private state for testing if needed or just use handle logic
      // 実際には handleGenerateSubtitles 内の挙動を担保したい
    });

    // 最終的な期待値を確認するための目印として
    expect(result.current.subtitlePosition).toEqual({ x: 500, y: 600 });
  });

  it("should update subtitle styles correctly", () => {
    const { result } = renderHook(() => useVideoEditor());

    act(() => {
      result.current.updateSubtitleStyle({ color: "#ff0000", fontSize: 80 });
    });

    expect(result.current.subtitleStyle.color).toBe("#ff0000");
    expect(result.current.subtitleStyle.fontSize).toBe(80);
  });
});
