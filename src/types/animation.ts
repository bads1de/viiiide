/**
 * 字幕アニメーションの型定義とプリセット
 */

// アニメーションタイプ
export type AnimationType =
  | "none"
  | "pulse"
  | "pop"
  | "slideUp"
  | "slideDown"
  | "fadeIn"
  | "bounce"
  | "glow"
  | "karaoke" // カラオケスタイル（ハイライト）
  | "shake" // シェイク効果
  | "neon" // ネオン効果
  | "typewriter" // タイプライター
  | "wave" // 波打つ効果
  | "zoom"; // ズームイン

// アニメーションプリセットの定義
export interface AnimationPreset {
  id: AnimationType;
  name: string;
  description: string;
  icon: string;
}

// 利用可能なアニメーションプリセット
export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: "none",
    name: "なし",
    description: "静止テキスト",
    icon: "—",
  },
  {
    id: "karaoke",
    name: "Karaoke",
    description: "TikTok風ハイライト",
    icon: "🎤",
  },
  {
    id: "pulse",
    name: "Pulse",
    description: "脈動する効果",
    icon: "💓",
  },
  {
    id: "neon",
    name: "Neon",
    description: "ネオンサイン風",
    icon: "💡",
  },
  {
    id: "pop",
    name: "Pop",
    description: "弾むような出現",
    icon: "🎈",
  },
  {
    id: "bounce",
    name: "Bounce",
    description: "バウンドして着地",
    icon: "⚡",
  },
  {
    id: "shake",
    name: "Shake",
    description: "振動エフェクト",
    icon: "📳",
  },
  {
    id: "wave",
    name: "Wave",
    description: "波打つテキスト",
    icon: "🌊",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "ズームイン",
    icon: "🔍",
  },
  {
    id: "typewriter",
    name: "Typewriter",
    description: "一文字ずつ表示",
    icon: "⌨️",
  },
  {
    id: "slideUp",
    name: "Slide Up",
    description: "下から上へ",
    icon: "⬆️",
  },
  {
    id: "fadeIn",
    name: "Fade In",
    description: "ふわっと出現",
    icon: "✨",
  },
];

// プリセットをIDで取得
export const getPresetById = (id: AnimationType): AnimationPreset => {
  return ANIMATION_PRESETS.find((p) => p.id === id) || ANIMATION_PRESETS[0];
};
