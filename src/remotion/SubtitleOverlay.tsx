import { Subtitle } from "@/types/subtitle";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loadGoogleFont } from "@/utils/googleFonts";
import {
  createCaptionPages,
  calculateAnimation,
  getAnimationStyle,
} from "@/utils/animations";
import { useEffect, useMemo } from "react";

export const SubtitleOverlay = ({ subtitles }: { subtitles: Subtitle[] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

  // TikTok スタイルのページを生成
  const pages = useMemo(() => {
    if (subtitles.length === 0) return [];
    return createCaptionPages(subtitles, 1200); // 1.2秒で単語をグループ化
  }, [subtitles]);

  // 現在のページを取得
  const currentPage = useMemo(() => {
    return pages.find(
      (page) =>
        timeInMs >= page.startMs && timeInMs < page.startMs + page.durationMs
    );
  }, [pages, timeInMs]);

  // スタイル情報を最初の字幕から取得
  const style = subtitles[0] || {};
  const animationType = style.animation || "karaoke";

  // フォントをロード
  useEffect(() => {
    if (style.fontFamily) {
      loadGoogleFont(style.fontFamily);
    }
  }, [style.fontFamily]);

  if (!currentPage) return null;

  // アニメーション計算
  const startFrame = Math.floor((currentPage.startMs / 1000) * fps);
  const endFrame = Math.floor(
    ((currentPage.startMs + currentPage.durationMs) / 1000) * fps
  );

  const animationValues = calculateAnimation({
    animationType,
    frame,
    startFrame,
    endFrame,
    fps,
  });
  const animationStyle = getAnimationStyle(animationValues);

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    textAlign: "center" as const,
    width: "100%",
    left: 0,
    top: style.y !== undefined ? style.y : 1600,
    ...animationStyle,
  };

  // ベースのテキストシャドウ（縁取り）
  const baseTextShadow = `-3px -3px 0 ${
    style.strokeColor || "#000"
  }, 3px -3px 0 ${style.strokeColor || "#000"}, -3px 3px 0 ${
    style.strokeColor || "#000"
  }, 3px 3px 0 ${style.strokeColor || "#000"}`;

  return (
    <AbsoluteFill className="justify-center items-center pointer-events-none">
      <div style={containerStyle}>
        <div
          style={{
            display: "inline-flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "8px",
            transform: `translateX(${style.x || 0}px)`,
          }}
        >
          {currentPage.tokens.map((token, index) => {
            // このトークンがアクティブかどうか
            const isActive = timeInMs >= token.fromMs && timeInMs < token.toMs;
            // このトークンが既に過ぎたかどうか
            const isPast = timeInMs >= token.toMs;
            // このトークンがまだ来ていないかどうか
            const isFuture = timeInMs < token.fromMs;

            // アクティブな単語のスケール効果
            let tokenScale = 1;
            if (isActive) {
              // アクティブ時は少し大きく + パルス
              const activeProgress =
                (timeInMs - token.fromMs) / (token.toMs - token.fromMs);
              tokenScale = 1.15 + Math.sin(activeProgress * Math.PI) * 0.1;
            }

            const tokenStyle: React.CSSProperties = {
              fontSize: style.fontSize || 60,
              fontFamily: `"${style.fontFamily || "Roboto"}", sans-serif`,
              fontWeight: 900,
              textTransform: "uppercase" as const,
              // アクティブな単語は黄色、過去は白、未来は半透明
              color: isActive
                ? "#FFD700" // ゴールド
                : isPast
                ? style.color || "white"
                : "rgba(255, 255, 255, 0.5)",
              textShadow: isActive
                ? `${baseTextShadow}, 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)`
                : baseTextShadow,
              lineHeight: 1.2,
              transform: `scale(${tokenScale})`,
              transition: "transform 0.1s ease-out, color 0.1s ease-out",
              display: "inline-block",
            };

            return (
              <span key={index} style={tokenStyle}>
                {token.text.trim()}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
