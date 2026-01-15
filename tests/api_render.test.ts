/**
 * @jest-environment node
 */
import { POST } from "@/app/api/render/route";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync } from "fs";

// Mock remotion tools
jest.mock("@remotion/bundler", () => ({
  bundle: jest.fn().mockResolvedValue("/tmp/bundle.js"),
}));

jest.mock("@remotion/renderer", () => ({
  renderMedia: jest.fn().mockResolvedValue(undefined),
  selectComposition: jest.fn().mockResolvedValue({
    id: "MyComp",
    durationInFrames: 300,
    fps: 30,
    width: 1080,
    height: 1920,
  }),
}));

// Mock fs
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

describe("POST /api/render", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 if videoPath is missing", async () => {
    const request = new Request("http://localhost/api/render", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Video path is required");
  });

  it("returns 404 if video file does not exist", async () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    const request = new Request("http://localhost/api/render", {
      method: "POST",
      body: JSON.stringify({ videoPath: "/uploads/missing.mp4" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("Video file not found");
  });

  it("returns 200 and triggers rendering if everything is valid", async () => {
    (existsSync as jest.Mock).mockReturnValue(true);

    const request = new Request("http://localhost/api/render", {
      method: "POST",
      body: JSON.stringify({
        videoPath: "/uploads/test.mp4",
        subtitles: [],
        durationInFrames: 150,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.url).toContain("/downloads/render_");

    expect(bundle).toHaveBeenCalled();
    expect(selectComposition).toHaveBeenCalled();
    expect(renderMedia).toHaveBeenCalled();
  });

  it("handles rendering errors", async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (renderMedia as jest.Mock).mockRejectedValue(new Error("FFmpeg error"));

    const request = new Request("http://localhost/api/render", {
      method: "POST",
      body: JSON.stringify({ videoPath: "/uploads/test.mp4" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Rendering failed");
    expect(data.details).toContain("FFmpeg error");
  });
});
