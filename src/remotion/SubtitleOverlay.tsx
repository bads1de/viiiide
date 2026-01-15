import { Subtitle } from "@/types/subtitle";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

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

  if (!activeSubtitle) return null;

  return (
    <AbsoluteFill className="justify-center items-center pointer-events-none">
      <div
        style={{
          bottom: 150,
          position: "absolute",
          textAlign: "center",
          width: "80%",
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontFamily: "sans-serif",
            fontWeight: 900,
            textTransform: "uppercase",
            color: "white",
            textShadow:
              "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
            lineHeight: 1.2,
          }}
        >
          {activeSubtitle.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
