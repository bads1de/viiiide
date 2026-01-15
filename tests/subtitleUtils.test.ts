import { fetchSubtitles } from "../src/utils/subtitleUtils";

// Mock global fetch
global.fetch = jest.fn();

describe("subtitleUtils", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it("fetchSubtitles should fetch the correct JSON url and return subtitles", async () => {
    const mockSubtitles = [
      { text: "Hello", startInMs: 0, endInMs: 1000 },
      { text: "World", startInMs: 1000, endInMs: 2000 },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubtitles,
    });

    const videoPath = "/uploads/video.mp4";
    const result = await fetchSubtitles(videoPath);

    expect(global.fetch).toHaveBeenCalledWith("/uploads/video.json");
    expect(result).toEqual(mockSubtitles);
  });

  it("fetchSubtitles should return empty array on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const videoPath = "/uploads/video.mp4";
    const result = await fetchSubtitles(videoPath);

    expect(result).toEqual([]);
  });
});
