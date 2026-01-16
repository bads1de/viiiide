import { StylePreset } from "@/types/stylePreset";

/**
 * 事前定義されたスタイルプリセット
 * TikTok/Reels風の様々なキャプションスタイル
 */
export const STYLE_PRESETS: StylePreset[] = [
  // 1. クラシック - シンプルで読みやすい
  {
    id: "classic",
    name: "クラシック",
    description: "シンプルで読みやすいスタイル",
    baseStyle: {
      fontFamily: "Roboto",
      fontSize: 56,
      color: "#FFFFFF",
      strokeColor: "#000000",
      fontWeight: 700,
    },
    activeStyle: {
      fontFamily: "Roboto",
      fontSize: 56,
      color: "#FFD700",
      textShadow: "0 0 20px rgba(255, 215, 0, 0.6)",
      fontWeight: 900,
    },
    animation: "karaoke",
  },

  // 2. ネオン - 光るエフェクト
  {
    id: "neon",
    name: "ネオン",
    description: "光るネオンサイン風",
    baseStyle: {
      fontFamily: "Outfit",
      fontSize: 52,
      color: "#E0E0E0",
      strokeColor: "#1a1a1a",
      fontWeight: 600,
    },
    activeStyle: {
      fontFamily: "Outfit",
      fontSize: 58,
      color: "#00FFFF",
      textShadow:
        "0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 40px #00FFFF, 0 0 80px #0088FF",
      fontWeight: 700,
    },
    animation: "neon",
  },

  // 3. スクリプト - 筆記体とゴシックの組み合わせ（画像のような）
  {
    id: "script-mix",
    name: "スクリプトミックス",
    description: "筆記体とゴシックの組み合わせ",
    baseStyle: {
      fontFamily: "Roboto",
      fontSize: 48,
      color: "#FFFFFF",
      strokeColor: "#000000",
      fontWeight: 700,
    },
    activeStyle: {
      fontFamily: "Dancing Script",
      fontSize: 72,
      color: "#FFE033",
      textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
      fontWeight: 700,
      italic: true,
    },
    animation: "elastic",
  },

  // 4. ボールド - 太くて力強い
  {
    id: "bold",
    name: "ボールド",
    description: "太くてインパクトのあるスタイル",
    baseStyle: {
      fontFamily: "Anton",
      fontSize: 64,
      color: "#FFFFFF",
      strokeColor: "#000000",
      fontWeight: 400,
    },
    activeStyle: {
      fontFamily: "Anton",
      fontSize: 72,
      color: "#FF4757",
      textShadow: "4px 4px 0px #000000",
      fontWeight: 400,
    },
    animation: "pop",
  },

  // 5. ミニマル - 控えめでエレガント
  {
    id: "minimal",
    name: "ミニマル",
    description: "シンプルで洗練されたスタイル",
    baseStyle: {
      fontFamily: "Inter",
      fontSize: 44,
      color: "rgba(255,255,255,0.7)",
      strokeColor: "transparent",
      fontWeight: 400,
    },
    activeStyle: {
      fontFamily: "Inter",
      fontSize: 48,
      color: "#FFFFFF",
      fontWeight: 600,
    },
    animation: "fadeIn",
  },

  // 6. ポップ - カラフルで楽しい
  {
    id: "pop",
    name: "ポップ",
    description: "カラフルで楽しいスタイル",
    baseStyle: {
      fontFamily: "Fredoka",
      fontSize: 52,
      color: "#FFFFFF",
      strokeColor: "#FF6B6B",
      fontWeight: 600,
    },
    activeStyle: {
      fontFamily: "Fredoka",
      fontSize: 64,
      color: "#FFE66D",
      strokeColor: "#FF6B6B",
      textShadow: "3px 3px 0px #FF6B6B",
      fontWeight: 700,
    },
    animation: "bounce",
  },

  // 7. エレガント - 高級感のあるスタイル
  {
    id: "elegant",
    name: "エレガント",
    description: "高級感のある上品なスタイル",
    baseStyle: {
      fontFamily: "Playfair Display",
      fontSize: 48,
      color: "#F5F5F5",
      strokeColor: "#1a1a1a",
      fontWeight: 400,
      italic: true,
    },
    activeStyle: {
      fontFamily: "Playfair Display",
      fontSize: 56,
      color: "#D4AF37",
      textShadow: "0 0 15px rgba(212, 175, 55, 0.5)",
      fontWeight: 700,
      italic: true,
    },
    animation: "fadeIn",
  },

  // 8. ストリート - グラフィティ風
  {
    id: "street",
    name: "ストリート",
    description: "ストリート・グラフィティ風",
    baseStyle: {
      fontFamily: "Bebas Neue",
      fontSize: 60,
      color: "#FFFFFF",
      strokeColor: "#000000",
      fontWeight: 400,
    },
    activeStyle: {
      fontFamily: "Permanent Marker",
      fontSize: 68,
      color: "#39FF14",
      textShadow: "3px 3px 0px #000000, -1px -1px 0px #000000",
      fontWeight: 400,
    },
    animation: "shake",
  },
];

/**
 * IDでプリセットを取得
 */
export const getPresetById = (id: string): StylePreset | undefined => {
  return STYLE_PRESETS.find((preset) => preset.id === id);
};

/**
 * デフォルトプリセット
 */
export const DEFAULT_PRESET_ID = "classic";
