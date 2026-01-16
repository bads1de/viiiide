import { Subtitle } from "@/types/subtitle";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loadGoogleFont } from "@/utils/googleFonts";
import { useEffect } from "react";

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

  if (!activeSubtitle) return null;

  const style: React.CSSProperties = {
    position: "absolute",
    textAlign: "center" as const,
    width: "100%",
    left: 0,
    top: activeSubtitle.y !== undefined ? activeSubtitle.y : 1600,
  };

  const textStyle: React.CSSProperties = {
    fontSize: activeSubtitle.fontSize || 60,
    fontFamily: `"${activeSubtitle.fontFamily || "Roboto"}", sans-serif`,
    fontWeight: 900,
    textTransform: "uppercase" as const,
    color: activeSubtitle.color || "white",
    textShadow: `-2px -2px 0 ${
      activeSubtitle.strokeColor || "#000"
    }, 2px -2px 0 ${activeSubtitle.strokeColor || "#000"}, -2px 2px 0 ${
      activeSubtitle.strokeColor || "#000"
    }, 2px 2px 0 ${activeSubtitle.strokeColor || "#000"}`,
    lineHeight: 1.2,
    transform: `translateX(${activeSubtitle.x || 0}px)`,
  };

  return (
    <AbsoluteFill className="justify-center items-center pointer-events-none">
      <div style={style}>
        <div style={textStyle}>{activeSubtitle.text}</div>
      </div>
    </AbsoluteFill>
  );
};
