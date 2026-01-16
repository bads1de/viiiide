import { AnimationType } from "./animation";

/**
 * 字幕スタイルプリセット
 * ベーススタイル（通常/過去の単語）とアクティブスタイル（現在話している単語）を分離
 */
export type StylePreset = {
  id: string;
  name: string;
  description: string;
  preview?: string; // プレビュー用のサンプルテキスト

  // ベーススタイル（通常の単語）
  baseStyle: {
    fontFamily: string;
    fontSize: number;
    color: string;
    strokeColor: string;
    fontWeight: number;
    italic?: boolean;
  };

  // アクティブスタイル（現在話している単語）
  activeStyle: {
    fontFamily: string;
    fontSize: number;
    color: string;
    strokeColor?: string;
    textShadow?: string;
    fontWeight: number;
    italic?: boolean;
  };

  // アニメーション
  animation: AnimationType;
};

// プリセットIDの型
export type StylePresetId = string;
