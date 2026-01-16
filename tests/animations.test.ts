import {
  subtitleToCaption,
  createCaptionPages,
  calculateAnimation,
  getAnimationStyle,
} from "@/utils/animations";
import { Subtitle } from "@/types/subtitle";
import { interpolate } from "remotion";

// Mock remotion interpolate
jest.mock("remotion", () => ({
  interpolate: jest.fn(),
}));

describe("animations utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (interpolate as jest.Mock).mockImplementation((v, i, o) => {
      // Simple linear interpolation mock for testing
      return o[o.length - 1];
    });
  });

  describe("subtitleToCaption", () => {
    it("converts Subtitle to Caption", () => {
      const subtitle: Subtitle = {
        text: "Hello",
        startInMs: 1000,
        endInMs: 2000,
      };
      const caption = subtitleToCaption(subtitle);
      expect(caption).toEqual({
        text: " Hello",
        startMs: 1000,
        endMs: 2000,
        timestampMs: 1500,
        confidence: null,
      });
    });
  });

  describe("getAnimationStyle", () => {
    it("converts animation values to CSS", () => {
      const values = {
        scale: 1.5,
        opacity: 0.5,
        translateY: 10,
        translateX: 20,
        rotate: 45,
        textShadow: "shadow",
        letterSpacing: 2,
      };
      const style = getAnimationStyle(values);
      expect(style).toEqual({
        opacity: 0.5,
        transform: "scale(1.5) translateY(10px) translateX(20px) rotate(45deg)",
        textShadow: "shadow",
        letterSpacing: "2px",
      });
    });

    it("omits default values from transform", () => {
      const values = {
        scale: 1,
        opacity: 1,
        translateY: 0,
        translateX: 0,
        rotate: 0,
      };
      const style = getAnimationStyle(values);
      expect(style.transform).toBeUndefined();
    });
  });

  describe("calculateAnimation", () => {
    const defaultParams = {
      animationType: "none" as const,
      frame: 15,
      startFrame: 0,
      endFrame: 30,
      fps: 30,
    };

    it("returns defaults for 'none'", () => {
      const result = calculateAnimation(defaultParams);
      expect(result).toEqual({
        scale: 1,
        opacity: 1,
        translateY: 0,
        translateX: 0,
        rotate: 0,
      });
    });

    it("returns values for 'pop'", () => {
      const result = calculateAnimation({
        ...defaultParams,
        animationType: "pop",
      });
      expect(result).toHaveProperty("scale");
      expect(result).toHaveProperty("opacity");
    });
  });

  describe("createCaptionPages", () => {
    const mockSubtitles: Subtitle[] = [
      { text: "This", startInMs: 0, endInMs: 500 },
      { text: "is", startInMs: 500, endInMs: 1000 },
      { text: "a", startInMs: 1000, endInMs: 1500 },
      { text: "test", startInMs: 1500, endInMs: 2000 },
      { text: "sentence", startInMs: 2000, endInMs: 2500 },
      { text: "for", startInMs: 2500, endInMs: 3000 },
      { text: "pagination", startInMs: 3000, endInMs: 3500 },
    ];

    it("should create pages without token limit when maxTokensPerPage is 0", () => {
      const pages = createCaptionPages(mockSubtitles, 2000, 0);
      expect(pages.length).toBeGreaterThan(0);
    });

    it("should split pages when token count exceeds maxTokensPerPage", () => {
      // 10000ms で結合すれば本来なら1ページ
      const pages = createCaptionPages(mockSubtitles, 10000, 2);

      // 7単語なので 4ページ (2, 2, 2, 1)
      expect(pages.length).toBe(4);
      expect(pages[0].tokens.length).toBe(2);
      expect(pages[0].tokens[0].text.trim()).toBe("This");
      expect(pages[3].tokens.length).toBe(1);
    });

    it("should calculate correct timing for split pages", () => {
      const pages = createCaptionPages(mockSubtitles, 10000, 2);

      expect(pages[0].startMs).toBe(0);
      expect(pages[0].durationMs).toBe(1000);
      expect(pages[1].startMs).toBe(1000);
      expect(pages[1].durationMs).toBe(1000);
    });

    it("should handle text property correctly", () => {
      const pages = createCaptionPages(mockSubtitles, 10000, 2);
      expect(pages[0].text.trim()).toBe("This is");
    });
  });
});
