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
import { getPresetById } from "@/config/stylePresets";
import { getLayoutById } from "@/config/layoutPresets";

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

  // スタイル情報を最初の字幕から取得
  const subtitleData = subtitles[0] || {};

  // プリセットを取得
  const preset = useMemo(() => {
    const presetId = subtitleData.presetId;
    return presetId ? getPresetById(presetId) : null;
  }, [subtitleData]);

  // レイアウトを取得
  const layout = useMemo(() => {
    const layoutId = subtitleData.layoutId || "horizontal";
    return getLayoutById(layoutId);
  }, [subtitleData.layoutId]);

  // ベース/アクティブスタイルを決定
  // ユーザー設定（subtitleData）を優先し、フォールバックとしてプリセット値を使用
  const baseStyle: TokenStyle = {
    fontFamily:
      subtitleData.fontFamily || preset?.baseStyle.fontFamily || "Roboto",
    fontSize: subtitleData.fontSize || preset?.baseStyle.fontSize || 60,
    color: subtitleData.color || preset?.baseStyle.color || "#FFFFFF",
    strokeColor:
      subtitleData.strokeColor || preset?.baseStyle.strokeColor || "#000000",
    fontWeight: preset?.baseStyle.fontWeight || 700,
    italic: preset?.baseStyle.italic,
  };

  // TikTok スタイルのページを生成
  const pages = useMemo(() => {
    if (subtitles.length === 0) return [];

    // フォントサイズに基づいて1ページの最大単語数を決定
    // 例: 60px -> 4単語, 30px -> 8単語
    // 基準値: 280 (60px * 4.6words)
    const fontSize = baseStyle.fontSize;
    const maxTokens = Math.max(1, Math.floor(280 / fontSize));

    return createCaptionPages(subtitles, 1200, maxTokens);
  }, [subtitles, baseStyle.fontSize]);

  // 現在のページを取得
  const currentPage = useMemo(() => {
    return pages.find(
      (page) =>
        timeInMs >= page.startMs && timeInMs < page.startMs + page.durationMs,
    );
  }, [pages, timeInMs]);

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
    ((currentPage.startMs + currentPage.durationMs) / 1000) * fps,
  );

  const animationValues = calculateAnimation({
    animationType,
    frame,
    startFrame,
    endFrame,
    fps,
  });
  const animationStyle = getAnimationStyle(animationValues);

  // Shrink to Fit (はみ出し防止)
  // ページ全体の推定幅を計算
  const charCount = currentPage.text ? currentPage.text.length : 0;
  // 日本語と英語で幅が違うため簡易的な係数を使用
  const estimatedWidth = charCount * baseStyle.fontSize * 0.8;
  const maxContainerWidth = 900; // 画面幅(1080) - マージン
  const shrinkScale =
    estimatedWidth > maxContainerWidth ? maxContainerWidth / estimatedWidth : 1;

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    textAlign: "center" as const,
    width: "100%",
    left: 0,
    top: subtitleData.y !== undefined ? subtitleData.y : 1600,
    ...animationStyle,
    // アニメーションのスケールとは別に、コンテナ全体を縮小して収める
    transform: `${animationStyle.transform || ""} scale(${shrinkScale})`,
  };

  // アクティブ時のフォントサイズ倍率を計算
  const activeScaleRatio = preset
    ? preset.activeStyle.fontSize / preset.baseStyle.fontSize
    : 1.2;

  const activeStyle: TokenStyle = {
    fontFamily: preset?.activeStyle.fontFamily || baseStyle.fontFamily,
    fontSize: baseStyle.fontSize * activeScaleRatio,
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
            flexDirection: layout?.direction === "vertical" ? "column" : "row",
            flexWrap: layout?.direction === "vertical" ? "nowrap" : "wrap",
            justifyContent: "center",
            alignItems:
              layout?.direction === "vertical" ? "center" : "flex-start",
            gap: layout?.direction === "vertical" ? "12px" : "8px",
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
                  { extrapolateRight: "clamp" },
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
