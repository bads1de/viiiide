import { NextResponse } from "next/server";
import { rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

type Props = {
  params: Promise<{
    uuid: string;
  }>;
};

export async function DELETE(req: Request, { params }: Props) {
  try {
    const { uuid } = await params;

    if (!uuid) {
      return NextResponse.json(
        { error: "Session UUID is required" },
        { status: 400 }
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
      { status: 500 }
    );
  }
}
