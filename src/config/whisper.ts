import path from "path";

// Whisper.cpp configuration
export const WHISPER_DIR = path.join(process.cwd(), "whisper.cpp");
export const WHISPER_BIN = path.join(WHISPER_DIR, "Release", "whisper-cli.exe");
export const WHISPER_MODEL_PATH = path.join(
  WHISPER_DIR,
  "models",
  "ggml-large-v3-turbo.bin"
);

// Language setting
export const WHISPER_LANG = "en";
