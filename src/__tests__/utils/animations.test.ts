import { createCaptionPages } from "../../utils/animations";
import { Subtitle } from "../../types/subtitle";

// Subtitleのモックデータ
const mockSubtitles: Subtitle[] = [
  { text: "This", startInMs: 0, endInMs: 500 },
  { text: "is", startInMs: 500, endInMs: 1000 },
  { text: "a", startInMs: 1000, endInMs: 1500 },
  { text: "test", startInMs: 1500, endInMs: 2000 },
  { text: "sentence", startInMs: 2000, endInMs: 2500 },
  { text: "for", startInMs: 2500, endInMs: 3000 },
  { text: "pagination", startInMs: 3000, endInMs: 3500 },
];

describe("createCaptionPages", () => {
  it("should create pages without token limit when maxTokensPerPage is 0", () => {
    // 時間でグループ化される（combineWithinMsによる）
    // デフォルト800msなので、それぞれ分かれるか、いくつかは結合されるはず
    // ここではロジック自体が走ることを確認
    const pages = createCaptionPages(mockSubtitles, 2000, 0);
    // 2000ms で結合すれば、全部1つのページになる可能性がある
    expect(pages.length).toBeGreaterThan(0);
  });

  it("should split pages when token count exceeds maxTokensPerPage", () => {
    // 全て結合するように大きな時間枠を指定
    // これで本来なら1ページになるはず
    const pages = createCaptionPages(mockSubtitles, 10000, 2);

    // 7単語あるので、2単語ずつ分割され、最後は1単語になるはず
    // Pages: ["This is", "a test", "sentence for", "pagination"] -> 4 pages
    expect(pages.length).toBe(4);

    expect(pages[0].tokens.length).toBe(2);
    expect(pages[0].tokens[0].text.trim()).toBe("This");
    expect(pages[0].tokens[1].text.trim()).toBe("is");

    expect(pages[1].tokens.length).toBe(2);
    expect(pages[1].tokens[0].text.trim()).toBe("a");

    expect(pages[3].tokens.length).toBe(1);
    expect(pages[3].tokens[0].text.trim()).toBe("pagination");
  });

  it("should calculate correct timing for split pages", () => {
    const pages = createCaptionPages(mockSubtitles, 10000, 2);

    // Page 1: "This is" (0ms - 1000ms)
    // startMs: 0
    // durationMs: 1000
    expect(pages[0].startMs).toBe(0);
    // Page 1 endMs = subtitle[1].endInMs = 1000
    // Duration = 1000 - 0 = 1000
    expect(pages[0].durationMs).toBe(1000);

    // Page 2: "a test" (1000ms - 2000ms)
    expect(pages[1].startMs).toBe(1000);
    expect(pages[1].durationMs).toBe(1000);
  });

  it("should handle text property correctly", () => {
    const pages = createCaptionPages(mockSubtitles, 10000, 2);
    // @remotion/captions adds a space before text usually
    expect(pages[0].text.trim()).toBe("This is");
  });
});
