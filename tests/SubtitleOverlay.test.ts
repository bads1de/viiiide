import { getActiveSubtitle } from "../src/remotion/SubtitleOverlay";

describe("SubtitleOverlay logic", () => {
  const subtitles = [
    { text: "Hello", startInMs: 0, endInMs: 1000 },
    { text: "World", startInMs: 1500, endInMs: 2500 },
  ];

  it("should return the correct subtitle for a given time", () => {
    expect(getActiveSubtitle(subtitles, 500)).toEqual(subtitles[0]);
    expect(getActiveSubtitle(subtitles, 2000)).toEqual(subtitles[1]);
  });

  it("should return undefined if no subtitle is active", () => {
    expect(getActiveSubtitle(subtitles, 1200)).toBeUndefined();
    expect(getActiveSubtitle(subtitles, 3000)).toBeUndefined();
  });
});
