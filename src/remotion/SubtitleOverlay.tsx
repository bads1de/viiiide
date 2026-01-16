import { Subtitle } from "@/types/subtitle";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loadGoogleFont } from "@/utils/googleFonts";
import { calculateAnimation, getAnimationStyle } from "@/utils/animations";
import { useEffect, useMemo } from "react";

export const getActiveSubtitle = (subtitles: Subtitle[], timeInMs: number) => {
  return subtitles.find(
    (sub) => timeInMs >= sub.startInMs && timeInMs < sub.endInMs
  );
};

export const SubtitleOverlay = ({ subtitles }: { subtitles: Subtitle[] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

  const activeSubtitle = getActiveSubtitle(subtitles, timeInMs);

  // フォントをロード
  useEffect(() => {
    if (activeSubtitle?.fontFamily) {
      loadGoogleFont(activeSubtitle.fontFamily);
    }
  }, [activeSubtitle?.fontFamily]);

  // アニメーション値を計算
  const animationValues = useMemo(() => {
    if (!activeSubtitle) return null;

    const startFrame = Math.floor((activeSubtitle.startInMs / 1000) * fps);
    const endFrame = Math.floor((activeSubtitle.endInMs / 1000) * fps);

    return calculateAnimation({
      animationType: activeSubtitle.animation || "none",
      frame,
      startFrame,
      endFrame,
      fps,
    });
  }, [activeSubtitle, frame, fps]);

  if (!activeSubtitle || !animationValues) return null;

  // アニメーションスタイルを取得
  const animationStyle = getAnimationStyle(animationValues);

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    textAlign: "center" as const,
    width: "100%",
    left: 0,
    top: activeSubtitle.y !== undefined ? activeSubtitle.y : 1600,
  };

  // 既存のtextShadow と animationStyle.textShadow をマージ
  const baseTextShadow = `-2px -2px 0 ${
    activeSubtitle.strokeColor || "#000"
  }, 2px -2px 0 ${activeSubtitle.strokeColor || "#000"}, -2px 2px 0 ${
    activeSubtitle.strokeColor || "#000"
  }, 2px 2px 0 ${activeSubtitle.strokeColor || "#000"}`;

  const textStyle: React.CSSProperties = {
    fontSize: activeSubtitle.fontSize || 60,
    fontFamily: `"${activeSubtitle.fontFamily || "Roboto"}", sans-serif`,
    fontWeight: 900,
    textTransform: "uppercase" as const,
    color: activeSubtitle.color || "white",
    textShadow: animationStyle.textShadow
      ? `${baseTextShadow}, ${animationStyle.textShadow}`
      : baseTextShadow,
    lineHeight: 1.2,
    // アニメーションのtransformとX位置を組み合わせ
    transform: [
      `translateX(${activeSubtitle.x || 0}px)`,
      animationStyle.transform,
    ]
      .filter(Boolean)
      .join(" "),
    opacity: animationStyle.opacity,
    // スムーズなアニメーションのため
    willChange: "transform, opacity",
  };

  return (
    <AbsoluteFill className="justify-center items-center pointer-events-none">
      <div style={containerStyle}>
        <div style={textStyle}>{activeSubtitle.text}</div>
      </div>
    </AbsoluteFill>
  );
};
