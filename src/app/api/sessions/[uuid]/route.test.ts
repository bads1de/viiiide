import { PATCH, DELETE } from "./route";
import { NextResponse } from "next/server";
import * as fsPromises from "fs/promises";
import * as fs from "fs";
import path from "path";

// Mock fs and fs/promises
jest.mock("fs/promises");
jest.mock("fs");
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, init })),
  },
}));

describe("Session API", () => {
  const mockUuid = "test-uuid-123";
  const mockSubtitles = [
    { text: "Hello", startInMs: 0, endInMs: 1000 },
    { text: "World", startInMs: 1000, endInMs: 2000 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  describe("PATCH /api/sessions/[uuid]", () => {
    it("should save subtitles to video.json when valid data is provided", async () => {
      const requestObj = {
        json: jest.fn().mockResolvedValue({ subtitles: mockSubtitles }),
      } as any;

      const params = Promise.resolve({ uuid: mockUuid });

      const response = await PATCH(requestObj, { params });

      // Verify response
      expect(response.body).toEqual({ success: true });

      // Verify file path
      const expectedPath = path.join(
        process.cwd(),
        "public",
        "sessions",
        mockUuid,
        "video.json",
      );

      // Verify writeFile was called with correct arguments
      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        expectedPath,
        expect.stringContaining(JSON.stringify(mockSubtitles[0].text)),
        "utf-8",
      );

      // Verify data structure (should only contain necessary fields)
      const writtenData = JSON.parse(
        (fsPromises.writeFile as jest.Mock).mock.calls[0][1],
      );
      expect(writtenData[0]).toHaveProperty("text");
      expect(writtenData[0]).toHaveProperty("startInMs");
      expect(writtenData[0]).toHaveProperty("endInMs");
    });

    it("should return 400 if uuid is missing", async () => {
      const requestObj = {
        json: jest.fn().mockResolvedValue({ subtitles: mockSubtitles }),
      } as any;
      const params = Promise.resolve({ uuid: "" });

      const response = await PATCH(requestObj, { params });

      expect(response.init.status).toBe(400);
      expect(response.body.error).toBe("Session UUID is required");
    });

    it("should return 400 if subtitles are missing", async () => {
      const requestObj = {
        json: jest.fn().mockResolvedValue({}),
      } as any;
      const params = Promise.resolve({ uuid: mockUuid });

      const response = await PATCH(requestObj, { params });

      expect(response.init.status).toBe(400);
      expect(response.body.error).toBe("Subtitles data is required");
    });

    it("should return 404 if session does not exist", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const requestObj = {
        json: jest.fn().mockResolvedValue({ subtitles: mockSubtitles }),
      } as any;
      const params = Promise.resolve({ uuid: mockUuid });

      const response = await PATCH(requestObj, { params });

      expect(response.init.status).toBe(404);
      expect(response.body.error).toBe("Session not found");
    });

    it("should return 500 on file system error", async () => {
      (fsPromises.writeFile as jest.Mock).mockRejectedValue(
        new Error("Write error"),
      );

      const requestObj = {
        json: jest.fn().mockResolvedValue({ subtitles: mockSubtitles }),
      } as any;
      const params = Promise.resolve({ uuid: mockUuid });

      const response = await PATCH(requestObj, { params });

      expect(response.init.status).toBe(500);
      expect(response.body.error).toBe("Failed to update subtitles");
    });
  });

  describe("DELETE /api/sessions/[uuid]", () => {
    it("should delete session directory when session exists", async () => {
      const requestObj = {} as any;
      const params = Promise.resolve({ uuid: mockUuid });

      const response = await DELETE(requestObj, { params });

      expect(response.body).toEqual({ success: true });

      const expectedDir = path.join(
        process.cwd(),
        "public",
        "sessions",
        mockUuid,
      );
      expect(fsPromises.rm).toHaveBeenCalledWith(expectedDir, {
        recursive: true,
        force: true,
      });
    });

    it("should return 404 if session does not exist", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const requestObj = {} as any;
      const params = Promise.resolve({ uuid: mockUuid });

      const response = await DELETE(requestObj, { params });

      expect(response.init.status).toBe(404);
    });
  });
});
