/**
 * @jest-environment node
 */
import { POST } from "@/app/api/upload/route";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

// Mock fs/promises and fs
jest.mock("fs/promises", () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

describe("POST /api/upload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 if no file is uploaded", async () => {
    const formData = new FormData();
    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No file uploaded");
  });

  it("returns 400 if file type is invalid", async () => {
    const formData = new FormData();
    // Use global File and Blob if available in Node 20+
    const file = new File(["dummy content"], "test.txt", {
      type: "text/plain",
    });
    formData.append("video", file);

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid file type");
  });

  it("returns 200 and saves file if valid video is uploaded", async () => {
    const formData = new FormData();
    const file = new File(["dummy video data"], "test.mp4", {
      type: "video/mp4",
    });
    formData.append("video", file);

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.path).toContain("/sessions/");
    expect(writeFile).toHaveBeenCalled();
  });
});
