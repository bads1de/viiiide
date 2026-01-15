import path from "path";

// Whisper.cpp configuration (Vulkan Version)
export const WHISPER_DIR = path.join(process.cwd(), "whisper.cpp");
// The binary is directly in the whisper.cpp folder in this version
export const WHISPER_BIN = path.join(WHISPER_DIR, "whisper-cli.exe");
export const WHISPER_MODEL_PATH = path.join(
  WHISPER_DIR,
  "models",
  "ggml-large-v3-turbo.bin"
);

// GPU setting: true for AMD GPU (Vulkan)
export const USE_GPU = true;

// Language setting
export const WHISPER_LANG = "en";
