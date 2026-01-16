"use client";

import { Subtitle } from "@/types/subtitle";
import { getAvailableFonts } from "@remotion/google-fonts";
import { useEffect, useState } from "react";

type PreviewSubtitleOverlayProps = {
  subtitles: Subtitle[];
  currentTimeMs: number;
  containerWidth: number;
  containerHeight: number;
};

// プレビュー用の字幕オーバーレイ（Remotion Playerの外に配置）
export const PreviewSubtitleOverlay = ({
  subtitles,
  currentTimeMs,
  containerWidth,
  containerHeight,
}: PreviewSubtitleOverlayProps) => {
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  // 現在の時間に対応する字幕を取得
  const activeSubtitle = subtitles.find(
    (sub) => currentTimeMs >= sub.startInMs && currentTimeMs < sub.endInMs
  );

  // 字幕のフォントをロード
  useEffect(() => {
    const fontFamily = activeSubtitle?.fontFamily;
    if (!fontFamily || loadedFonts.has(fontFamily)) return;

    const font = getAvailableFonts().find((f) => f.fontFamily === fontFamily);
    if (font) {
      font
        .load()
        .then(() => {
          console.log("[PreviewSubtitleOverlay] Font loaded:", fontFamily);
          setLoadedFonts((prev) => new Set(prev).add(fontFamily));
        })
        .catch((e) => {
          console.warn(`Failed to load font ${fontFamily}:`, e);
        });
    }
  }, [activeSubtitle?.fontFamily, loadedFonts]);

  if (!activeSubtitle) return null;

  // 1080x1920 から containerWidth x containerHeight へのスケール
  const scaleX = containerWidth / 1080;
  const scaleY = containerHeight / 1920;

  const style: React.CSSProperties = {
    position: "absolute",
    textAlign: "center",
    width: "100%",
    left: 0,
    top: (activeSubtitle.y !== undefined ? activeSubtitle.y : 1600) * scaleY,
    pointerEvents: "none",
    zIndex: 50,
  };

  const textStyle: React.CSSProperties = {
    fontSize: (activeSubtitle.fontSize || 60) * scaleY,
    fontFamily: `"${activeSubtitle.fontFamily || "Roboto"}", sans-serif`,
    fontWeight: 900,
    textTransform: "uppercase",
    color: activeSubtitle.color || "white",
    textShadow: `-2px -2px 0 ${
      activeSubtitle.strokeColor || "#000"
    }, 2px -2px 0 ${activeSubtitle.strokeColor || "#000"}, -2px 2px 0 ${
      activeSubtitle.strokeColor || "#000"
    }, 2px 2px 0 ${activeSubtitle.strokeColor || "#000"}`,
    lineHeight: 1.2,
    transform: `translateX(${(activeSubtitle.x || 0) * scaleX}px)`,
  };

  return (
    <div style={style}>
      <div style={textStyle}>{activeSubtitle.text}</div>
    </div>
  );
};
