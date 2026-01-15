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
        if (!existsSync(inputVideo)) throw new Error("Video not found");

        if (!existsSync(WHISPER_BIN))
          throw new Error("Whisper binary missing. Please re-install.");
        if (!existsSync(WHISPER_MODEL_PATH))
          throw new Error("Whisper model missing. Please wait for download.");

        // 2. 音声抽出 (16kHz Mono WAV)
        sendUpdate("extracting", "音声を抽出中...", 10);
        const tempDir = path.join(process.cwd(), "temp");
        if (!existsSync(tempDir)) mkdirSync(tempDir);
        const tempWav = path.join(tempDir, `temp_${Date.now()}.wav`);

        try {
          execSync(
            `ffmpeg -i "${inputVideo}" -ar 16000 -ac 1 -c:a pcm_s16le "${tempWav}" -y`,
            { stdio: "ignore" }
          );
        } catch (e: any) {
          throw new Error("FFmpeg加工に失敗しました");
        }

        // 3. Whisper.cpp 直接実行
        sendUpdate("transcribing", "AIで解析中 (Whisper.cpp)...", 30);

        // whisper.cpp のコマンドライン引数
        // -m: モデル, -f: 入力, -oj: JSON出力, -ml: word-level timestamps, -l: 言語
        const cmd = `"${WHISPER_BIN}" -m "${WHISPER_MODEL_PATH}" -f "${tempWav}" -l ${WHISPER_LANG} -oj`;

        try {
          execSync(cmd, { stdio: "inherit" });
        } catch (e: any) {
          console.error("Whisper error:", e);
          throw new Error("Whisper.cpp の実行に失敗しました");
        }

        // 4. JSON 結果の読み込み
        // whisper.cpp は "audio.wav.json" という名前で出力する
        const outputJson = `${tempWav}.json`;
        if (!existsSync(outputJson)) {
          throw new Error("解析結果ファイルが見つかりません");
        }

        sendUpdate("processing", "字幕データを最適化中...", 80);
        const rawResult = JSON.parse(readFileSync(outputJson, "utf-8"));

        // whisper.cpp の JSON 形式から Remotion 形式に変換
        // rawResult.transcription = [{ text, offsets: { from, to }, tokens: [...] }]
        // ターボモデルの場合、tokens から word level 情報を抽出

        const captions = rawResult.transcription.flatMap((seg: any) => {
          // 単語レベルのデータがある場合 (tokens)
          if (seg.tokens && seg.tokens.length > 0) {
            return seg.tokens
              .filter((t: any) => t.text.trim())
              .map((t: any) => ({
                text: t.text.trim(),
                startInMs: t.offsets.from,
                endInMs: t.offsets.to,
              }));
          }
          // セグメントレベルの場合
          return [
            {
              text: seg.text.trim(),
              startInMs: seg.offsets.from,
              endInMs: seg.offsets.to,
            },
          ];
        });

        // 5. 保存
        const finalJsonPath = inputVideo.replace(/\.[^.]+$/, ".json");
        writeFileSync(finalJsonPath, JSON.stringify(captions, null, 2));

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
