/**
 * @jest-environment node
 */
import { POST } from "@/app/api/whisper/route";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { TextDecoder, TextEncoder } from "util";

// If using older node, we might need these from undici, but usually util or global is fine in recent node.
// Next.js Request/Response are available globally in modern node/jest.

// Mock dependencies
jest.mock("child_process", () => ({
  execSync: jest.fn(),
}));

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  rmSync: jest.fn(),
  readFileSync: jest.fn(),
}));

describe("api/whisper/route", () => {
  const mockVideoPath = "uploads/test.mp4";

  beforeEach(() => {
    jest.clearAllMocks();
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
      transcription: [
        { text: "Hello", offsets: { from: 0, to: 1000 } },
        { text: "World", offsets: { from: 1000, to: 2000 } },
      ]
    }));
  });

  it("should stream progress updates and complete transcription", async () => {
    const request = new Request("http://localhost/api/whisper", {
      method: "POST",
      body: JSON.stringify({ videoPath: mockVideoPath }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let results: any[] = [];

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      const text = decoder.decode(value);
      // text is like "data: {"stage": "starting", ...}\n\n"
      const lines = text.split("\n\n").filter(l => l.startsWith("data: "));
      for (const line of lines) {
        results.push(JSON.parse(line.replace("data: ", "")));
      }
    }

    // Verify stages
    expect(results).toContainEqual(expect.objectContaining({ stage: "starting" }));
    expect(results).toContainEqual(expect.objectContaining({ stage: "extracting" }));
    expect(results).toContainEqual(expect.objectContaining({ stage: "transcribing" }));
    expect(results).toContainEqual(expect.objectContaining({ stage: "processing" }));
    expect(results).toContainEqual(expect.objectContaining({ stage: "done", progress: 100 }));

    // Verify FFmpeg and Whisper were called
    expect(execSync).toHaveBeenCalledTimes(2);
    // Verify file operations
    expect(writeFileSync).toHaveBeenCalled();
  });

  it("should handle missing video error", async () => {
    (existsSync as jest.Mock).mockImplementation((p: string) => {
        if (p.includes("test.mp4")) return false;
        return true;
    });

    const request = new Request("http://localhost/api/whisper", {
      method: "POST",
      body: JSON.stringify({ videoPath: mockVideoPath }),
    });

    const response = await POST(request);
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let results: any[] = [];

    while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          results.push(JSON.parse(line.replace("data: ", "")));
        }
    }

    expect(results).toContainEqual(expect.objectContaining({ stage: "error", message: expect.stringContaining("Video not found") }));
  });
});
