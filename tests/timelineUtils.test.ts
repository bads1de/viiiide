import { Subtitle } from "../src/types/subtitle";
import { subtitlesToTimelineActions } from "../src/utils/timelineUtils";

describe("timelineUtils", () => {
  it("subtitlesToTimelineActions should convert subtitles to valid timeline actions", () => {
    const subtitles: Subtitle[] = [
      { text: "Hello", startInMs: 0, endInMs: 1000 },
      { text: "World", startInMs: 1500, endInMs: 2500 },
    ];

    const actions = subtitlesToTimelineActions(subtitles);

    expect(actions).toHaveLength(2);
    expect(actions[0]).toEqual({
      id: "sub_0",
      start: 0,
      end: 1,
      effectId: "subtitle_effect",
      data: { text: "Hello" },
    });
    expect(actions[1]).toEqual({
      id: "sub_1",
      start: 1.5,
      end: 2.5,
      effectId: "subtitle_effect",
      data: { text: "World" },
    });
  });

  it("should handle empty subtitles", () => {
    const actions = subtitlesToTimelineActions([]);
    expect(actions).toHaveLength(0);
  });
});
