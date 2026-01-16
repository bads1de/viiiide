import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("video") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // ファイル形式チェック
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only MP4, WebM, and MOV are allowed." },
        { status: 400 }
      );
    }

    // セッションUUID生成
    const sessionId = uuidv4();
    const sessionDir = path.join(
      process.cwd(),
      "public",
      "sessions",
      sessionId
    );

    if (!existsSync(sessionDir)) {
      await mkdir(sessionDir, { recursive: true });
    }

    // ファイル保存 (video.mp4として固定名で保存することで管理しやすくする)
    const extension = path.extname(file.name) || ".mp4";
    const videoFileName = `video${extension}`;
    const filePath = path.join(sessionDir, videoFileName);

    // ファイルを保存
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // メタデータ (session.json) の作成
    const metadata = {
      id: sessionId,
      originalName: file.name,
      fileName: videoFileName,
      videoPath: `/sessions/${sessionId}/${videoFileName}`,
      createdAt: new Date().toISOString(),
    };
    const metadataPath = path.join(sessionDir, "session.json");
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      path: metadata.videoPath,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
