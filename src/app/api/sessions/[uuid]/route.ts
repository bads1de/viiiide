import { NextResponse } from "next/server";
import { rm, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

type Props = {
  params: Promise<{
    uuid: string;
  }>;
};

export async function PATCH(req: Request, { params }: Props) {
  try {
    const { uuid } = await params;
    const body = await req.json();
    const { subtitles } = body;

    if (!uuid) {
      return NextResponse.json(
        { error: "Session UUID is required" },
        { status: 400 },
      );
    }

    if (!subtitles) {
      return NextResponse.json(
        { error: "Subtitles data is required" },
        { status: 400 },
      );
    }

    const sessionDir = path.join(process.cwd(), "public", "sessions", uuid);
    const videoJsonPath = path.join(sessionDir, "video.json");

    if (!existsSync(sessionDir)) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Extract only the necessary properties for subtitle file
    const subtitlesData = subtitles.map((sub: any) => ({
      text: sub.text,
      startInMs: sub.startInMs,
      endInMs: sub.endInMs,
    }));

    // Write subtitles to video.json
    await writeFile(
      videoJsonPath,
      JSON.stringify(subtitlesData, null, 2),
      "utf-8",
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update subtitles:", error);
    return NextResponse.json(
      { error: "Failed to update subtitles" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request, { params }: Props) {
  try {
    const { uuid } = await params;

    if (!uuid) {
      return NextResponse.json(
        { error: "Session UUID is required" },
        { status: 400 },
      );
    }

    const sessionDir = path.join(process.cwd(), "public", "sessions", uuid);

    if (!existsSync(sessionDir)) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // ディレクトリごと削除
    await rm(sessionDir, { recursive: true, force: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 },
    );
  }
}
