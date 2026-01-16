import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "fs";
import path from "path";
import {
  WHISPER_BIN,
  WHISPER_MODEL_PATH,
  WHISPER_LANG,
} from "@/config/whisper";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const { videoPath } = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (stage: string, message: string, progress: number) => {
        const data = JSON.stringify({ stage, message, progress });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        sendUpdate("starting", "準備中...", 0);

        // 1. パス確認
        const inputVideo = path.join(process.cwd(), "public", videoPath);
        if (!existsSync(inputVideo))
          throw new Error(`Video not found at ${inputVideo}`);

        if (!existsSync(WHISPER_BIN))
          throw new Error("Whisper binary missing. Please re-install.");
        if (!existsSync(WHISPER_MODEL_PATH))
          throw new Error("Whisper model missing. Please wait for download.");

        // 2. 音声抽出 (16kHz Mono WAV)
        sendUpdate("extracting", "音声を抽出中...", 10);
        const tempDir = path.join(process.cwd(), "temp");
        if (!existsSync(tempDir)) mkdirSync(tempDir);
        const uniqueId = Date.now();
        const tempWav = path.join(tempDir, `temp_${uniqueId}.wav`);

        try {
          execSync(
            `ffmpeg -i "${inputVideo}" -ar 16000 -ac 1 -c:a pcm_s16le "${tempWav}" -y`,
            { stdio: "ignore" }
          );
        } catch (e: any) {
          throw new Error("FFmpeg加工に失敗しました");
        }

        // 3. Whisper.cpp 直接実行 (Vulkan GPU)
        sendUpdate("transcribing", "AIで解析中 (Whisper.cpp GPU)...", 30);

        // 出力ファイルを明示的に指定
        const outputBase = path.join(tempDir, `result_${uniqueId}`);
        // -ojf: Full JSON (word-level tokens)
        // -ml 1: Max length 1 (word-level segments)
        // -sow: Split on word
        const cmd = `"${WHISPER_BIN}" -m "${WHISPER_MODEL_PATH}" -f "${tempWav}" -l ${WHISPER_LANG} -ojf -ml 1 -sow -of "${outputBase}"`;

        try {
          // GPUはVulkan版バイナリなら自動で使われます
          execSync(cmd, { stdio: "inherit" });
        } catch (e: any) {
          console.error("Whisper error:", e);
          throw new Error("Whisper.cpp の実行に失敗しました");
        }

        // 4. JSON 結果の読み込み
        const outputJson = `${outputBase}.json`;
        if (!existsSync(outputJson)) {
          throw new Error("解析結果ファイルが見つかりません");
        }

        sendUpdate("processing", "字幕データを最適化中...", 80);
        const rawResult = JSON.parse(readFileSync(outputJson, "utf-8"));

        // Whisper.cpp の JSON 形式を Remotion 形式に変換
        // -ml 1 と -ojf を併用しているため、transcription segments がほぼ単語単位になっています
        const captions = rawResult.transcription
          .map((seg: any) => {
            // 特殊トークン以外を採用
            const text = seg.text.trim();
            if (!text || text.startsWith("[")) return null;

            return {
              text: text,
              startInMs: seg.offsets.from,
              endInMs: seg.offsets.to,
            };
          })
          .filter(Boolean);

        // 5. 保存
        const finalJsonPath = inputVideo.replace(/\.[^.]+$/, ".json");
        writeFileSync(finalJsonPath, JSON.stringify(captions, null, 2));

        // session.json に字幕情報を追記（オプションだが管理しやすくするため）
        const sessionDir = path.dirname(inputVideo);
        const sessionJsonPath = path.join(sessionDir, "session.json");
        if (existsSync(sessionJsonPath)) {
          const sessionData = JSON.parse(
            readFileSync(sessionJsonPath, "utf-8")
          );
          sessionData.subtitlePath = videoPath.replace(/\.[^.]+$/, ".json");
          sessionData.hasSubtitles = true;
          writeFileSync(sessionJsonPath, JSON.stringify(sessionData, null, 2));
        }

        // 後始末
        rmSync(tempWav, { force: true });
        rmSync(outputJson, { force: true });

        sendUpdate("done", "字幕生成が完了しました！", 100);
        controller.close();
      } catch (error: any) {
        console.error("Transcription error:", error);
        sendUpdate("error", error.message || "Unknown error", 0);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
