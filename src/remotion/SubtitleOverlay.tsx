import { Subtitle } from "@/types/subtitle";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadGoogleFont } from "@/utils/googleFonts";
import {
  createCaptionPages,
  calculateAnimation,
  getAnimationStyle,
} from "@/utils/animations";
import { useEffect, useMemo } from "react";
import { getPresetById } from "@/data/stylePresets";

// 共通のスタイル型
type TokenStyle = {
  fontFamily: string;
  fontSize: number;
  color: string;
  strokeColor: string;
  fontWeight: number;
  italic?: boolean;
  textShadow?: string;
};

export const SubtitleOverlay = ({ subtitles }: { subtitles: Subtitle[] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

  // TikTok スタイルのページを生成
  const pages = useMemo(() => {
    if (subtitles.length === 0) return [];
    return createCaptionPages(subtitles, 1200);
  }, [subtitles]);

  // 現在のページを取得
  const currentPage = useMemo(() => {
    return pages.find(
      (page) =>
        timeInMs >= page.startMs && timeInMs < page.startMs + page.durationMs
    );
  }, [pages, timeInMs]);

  // スタイル情報を最初の字幕から取得
  const subtitleData = subtitles[0] || {};

  // プリセットを取得
  const preset = useMemo(() => {
    const presetId = subtitleData.presetId;
    return presetId ? getPresetById(presetId) : null;
  }, [subtitleData]);

  const animationType =
    subtitleData.animation || preset?.animation || "karaoke";

  // フォントをロード
  useEffect(() => {
    if (preset) {
      loadGoogleFont(preset.baseStyle.fontFamily);
      if (preset.activeStyle.fontFamily !== preset.baseStyle.fontFamily) {
        loadGoogleFont(preset.activeStyle.fontFamily);
      }
    } else if (subtitleData.fontFamily) {
      loadGoogleFont(subtitleData.fontFamily);
    }
  }, [preset, subtitleData.fontFamily]);

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
    top: subtitleData.y !== undefined ? subtitleData.y : 1600,
    ...animationStyle,
  };

  // ベース/アクティブスタイルを決定
  const baseStyle: TokenStyle = {
    fontFamily:
      preset?.baseStyle.fontFamily || subtitleData.fontFamily || "Roboto",
    fontSize: preset?.baseStyle.fontSize || subtitleData.fontSize || 60,
    color: preset?.baseStyle.color || subtitleData.color || "#FFFFFF",
    strokeColor:
      preset?.baseStyle.strokeColor || subtitleData.strokeColor || "#000000",
    fontWeight: preset?.baseStyle.fontWeight || 700,
    italic: preset?.baseStyle.italic,
  };

  const activeStyle: TokenStyle = {
    fontFamily:
      preset?.activeStyle.fontFamily || subtitleData.fontFamily || "Roboto",
    fontSize:
      preset?.activeStyle.fontSize || (subtitleData.fontSize || 60) * 1.2,
    color: preset?.activeStyle.color || "#FFD700",
    strokeColor: preset?.activeStyle.strokeColor || baseStyle.strokeColor,
    fontWeight: preset?.activeStyle.fontWeight || 900,
    italic: preset?.activeStyle.italic,
    textShadow:
      preset?.activeStyle.textShadow || "0 0 20px rgba(255, 215, 0, 0.8)",
  };

  // ベースのテキストシャドウ（縁取り）を作成
  const createStroke = (color: string) =>
    `-3px -3px 0 ${color}, 3px -3px 0 ${color}, -3px 3px 0 ${color}, 3px 3px 0 ${color}`;

  return (
    <AbsoluteFill className="justify-center items-center pointer-events-none">
      <div style={containerStyle}>
        <div
          style={{
            display: "inline-flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "8px",
            transform: `translateX(${subtitleData.x || 0}px)`,
          }}
        >
          {currentPage.tokens.map((token, index) => {
            const isActive = timeInMs >= token.fromMs && timeInMs < token.toMs;
            const isPast = timeInMs >= token.toMs;
            const isFuture = timeInMs < token.fromMs;

            let tokenScale = 1;
            let tokenOpacity = 1;
            let currentStyle: TokenStyle = baseStyle;
            let tokenTextShadow = createStroke(baseStyle.strokeColor);

            if (animationType === "elastic") {
              if (isFuture) {
                tokenScale = 0;
                tokenOpacity = 0;
              } else if (isActive) {
                const timeSinceStart = timeInMs - token.fromMs;
                tokenScale = interpolate(
                  timeSinceStart,
                  [0, 150, 250],
                  [0, 1.3, 1.1],
                  { extrapolateRight: "clamp" }
                );
                currentStyle = activeStyle;
                tokenTextShadow = `${createStroke(activeStyle.strokeColor)}${
                  activeStyle.textShadow ? `, ${activeStyle.textShadow}` : ""
                }`;
              } else {
                tokenScale = 1;
                currentStyle = baseStyle;
              }
            } else {
              // デフォルトのカラオケスタイル
              if (isActive) {
                currentStyle = activeStyle;
                tokenTextShadow = `${createStroke(activeStyle.strokeColor)}${
                  activeStyle.textShadow ? `, ${activeStyle.textShadow}` : ""
                }`;
                const activeProgress =
                  (timeInMs - token.fromMs) / (token.toMs - token.fromMs);
                tokenScale = 1.1 + Math.sin(activeProgress * Math.PI) * 0.1;
              } else if (isFuture) {
                tokenOpacity = 0.5;
              }
            }

            const tokenStyleCSS: React.CSSProperties = {
              fontSize: currentStyle.fontSize,
              fontFamily: `"${currentStyle.fontFamily}", sans-serif`,
              fontWeight: currentStyle.fontWeight,
              fontStyle: currentStyle.italic ? "italic" : "normal",
              textTransform: "uppercase" as const,
              color: currentStyle.color,
              textShadow: tokenTextShadow,
              lineHeight: 1.2,
              transform: `scale(${tokenScale})`,
              opacity: tokenOpacity,
              transition:
                animationType === "elastic"
                  ? "none"
                  : "transform 0.1s ease-out, color 0.1s ease-out",
              display: "inline-block",
            };

            return (
              <span key={index} style={tokenStyleCSS}>
                {token.text.trim()}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
