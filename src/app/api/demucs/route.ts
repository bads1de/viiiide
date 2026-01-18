import { NextResponse } from "next/server";
import { execSync } from "child_process";
import {
  existsSync,
  mkdirSync,
  rmSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "fs";
import path from "path";

export const runtime = "nodejs";

// Configuration
const SEPARATOR_OUTPUT_DIR = path.join(process.cwd(), "temp", "separated");
const SEPARATOR_MODEL_DIR = path.join(
  process.cwd(),
  "temp",
  "audio-separator-models",
);
const SEPARATOR_SCRIPT = path.join(process.cwd(), "scripts", "separate.py");
const PYTHON_PATH = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
const SEPARATOR_BIN = path.join(
  process.cwd(),
  ".venv",
  "Scripts",
  "audio-separator.exe",
);

// Check if audio-separator is installed
function checkSeparatorInstalled(): boolean {
  try {
    execSync(`"${PYTHON_PATH}" -c "import audio_separator"`, {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { videoPath } = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (
        stage: string,
        message: string,
        progress: number,
        outputPath?: string,
      ) => {
        const data = JSON.stringify({ stage, message, progress, outputPath });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        sendUpdate("starting", "ボーカル分離の準備中...", 0);

        // 1. Check input file
        const inputVideo = path.join(process.cwd(), "public", videoPath);
        if (!existsSync(inputVideo)) {
          throw new Error(`Video not found at ${inputVideo}`);
        }

        // 2. Check audio-separator
        sendUpdate("checking", "Audio Separator の確認中...", 5);
        if (!checkSeparatorInstalled()) {
          throw new Error(
            "Audio Separator がインストールされていません。pip install audio-separator[cpu] onnxruntime-directml を実行してください。",
          );
        }

        // 3. Extract audio from video
        sendUpdate("extracting", "音声を抽出中...", 20);
        const tempDir = path.join(process.cwd(), "temp");
        if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });
        if (!existsSync(SEPARATOR_MODEL_DIR))
          mkdirSync(SEPARATOR_MODEL_DIR, { recursive: true });

        const uniqueId = Date.now();
        const tempAudio = path.join(tempDir, `audio_${uniqueId}.wav`);

        try {
          execSync(
            `ffmpeg -i "${inputVideo}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "${tempAudio}" -y`,
            { stdio: "ignore" },
          );
        } catch {
          throw new Error("FFmpeg による音声抽出に失敗しました");
        }

        // 4. Run audio-separator with DirectML (AMD GPU)
        sendUpdate("separating", "AIでボーカルを分離中... (AMD GPU使用)", 30);

        // Create output directory
        const outputDir = path.join(SEPARATOR_OUTPUT_DIR, `${uniqueId}`);
        if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

        // Use Python script with DirectML enabled
        const cmd = `"${PYTHON_PATH}" "${SEPARATOR_SCRIPT}" "${tempAudio}" "${outputDir}" "${SEPARATOR_MODEL_DIR}"`;

        let result: {
          success?: boolean;
          output_files?: string[];
          error?: string;
        };
        try {
          const output = execSync(cmd, {
            encoding: "utf-8",
            timeout: 600000, // 10 minutes timeout
          });

          // Parse the JSON output from the script
          const lines = output.trim().split("\n");
          const lastLine = lines[lines.length - 1];
          result = JSON.parse(lastLine);

          if (result.error) {
            throw new Error(result.error);
          }
        } catch (e: any) {
          console.error("Audio-separator error:", e);
          if (e.message) {
            throw new Error(`ボーカル分離に失敗しました: ${e.message}`);
          }
          throw new Error("ボーカル分離に失敗しました。");
        }

        sendUpdate("processing", "分離結果を処理中...", 80);

        // 5. Find the output vocals file
        const outputFiles = readdirSync(outputDir);
        const vocalsFile = outputFiles.find((f) =>
          f.toLowerCase().includes("vocals"),
        );

        if (!vocalsFile) {
          throw new Error("ボーカルトラックが見つかりません");
        }

        const vocalsPath = path.join(outputDir, vocalsFile);

        // 6. Copy results to session directory
        const sessionDir = path.dirname(inputVideo);
        const outputVocalsPath = path.join(sessionDir, "vocals.wav");

        copyFileSync(vocalsPath, outputVocalsPath);

        // 7. Update session.json
        const sessionJsonPath = path.join(sessionDir, "session.json");
        if (existsSync(sessionJsonPath)) {
          const sessionData = JSON.parse(
            readFileSync(sessionJsonPath, "utf-8"),
          );
          sessionData.vocalsPath = videoPath.replace(/[^/]+$/, "vocals.wav");
          sessionData.hasSeparatedAudio = true;
          writeFileSync(sessionJsonPath, JSON.stringify(sessionData, null, 2));
        }

        // 8. Cleanup temp files
        rmSync(tempAudio, { force: true });
        rmSync(outputDir, { recursive: true, force: true });

        const relativePath = videoPath.replace(/[^/]+$/, "vocals.wav");
        sendUpdate(
          "done",
          "ボーカル分離が完了しました！(DirectML)",
          100,
          relativePath,
        );
        controller.close();
      } catch (error: any) {
        console.error("Separation error:", error);
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

// GET endpoint to check status
export async function GET() {
  const isInstalled = checkSeparatorInstalled();

  // Check if DirectML is available
  let hasDirectML = false;
  try {
    const result = execSync(
      `"${PYTHON_PATH}" -c "import onnxruntime; print('DmlExecutionProvider' in onnxruntime.get_available_providers())"`,
      { encoding: "utf-8" },
    );
    hasDirectML = result.trim() === "True";
  } catch {
    // Ignore errors
  }

  return NextResponse.json({
    installed: isInstalled,
    directml: hasDirectML,
  });
}
