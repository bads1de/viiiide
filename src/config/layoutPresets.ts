/**
 * レイアウトプリセット
 * スタイルとは独立して、字幕の配置方法を定義
 */
export type LayoutPreset = {
  id: string;
  name: string;
  description: string;
  direction: "horizontal" | "vertical";
};

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "horizontal",
    name: "横並び",
    description: "単語を横方向に並べる（標準）",
    direction: "horizontal",
  },
  {
    id: "vertical",
    name: "縦並び（コラム）",
    description: "単語を縦方向に並べるTikTok風",
    direction: "vertical",
  },
];

export const DEFAULT_LAYOUT_ID = "horizontal";

export const getLayoutById = (id: string): LayoutPreset | undefined => {
  return LAYOUT_PRESETS.find((layout) => layout.id === id);
};
