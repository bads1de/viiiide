import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function GET() {
  try {
    const sessionsDir = path.join(process.cwd(), "public", "sessions");

    if (!existsSync(sessionsDir)) {
      return NextResponse.json({ sessions: [] });
    }

    const sessionFolders = await readdir(sessionsDir);
    const sessions = [];

    for (const folder of sessionFolders) {
      const sessionDir = path.join(sessionsDir, folder);
      const sessionJsonPath = path.join(sessionDir, "session.json");

      if (existsSync(sessionJsonPath)) {
        try {
          const content = await readFile(sessionJsonPath, "utf-8");
          const metadata = JSON.parse(content);
          sessions.push(metadata);
        } catch (e) {
          console.error(`Error reading session.json in ${folder}:`, e);
        }
      }
    }

    // 作成日時順（新しい順）にソート
    sessions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Failed to list sessions:", error);
    return NextResponse.json(
      { error: "Failed to list sessions" },
      { status: 500 }
    );
  }
}
