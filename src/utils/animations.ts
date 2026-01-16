/**
 * 字幕アニメーションのユーティリティ関数
 * @remotion/captions と Remotion の interpolate を使用
 */

import { interpolate } from "remotion";
import { createTikTokStyleCaptions, Caption } from "@remotion/captions";
import { AnimationType } from "@/types/animation";
import { Subtitle } from "@/types/subtitle";

// Subtitle を Caption に変換
export const subtitleToCaption = (subtitle: Subtitle): Caption => ({
  text: ` ${subtitle.text}`, // 先頭にスペースを追加（@remotion/captionsの要件）
  startMs: subtitle.startInMs,
  endMs: subtitle.endInMs,
  timestampMs: Math.floor((subtitle.startInMs + subtitle.endInMs) / 2),
  confidence: null,
});

// 字幕配列から TikTok スタイルのページを生成
export const createCaptionPages = (
  subtitles: Subtitle[],
  combineWithinMs: number = 800
) => {
  const captions = subtitles.map(subtitleToCaption);
  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: combineWithinMs,
  });
  return pages;
};

// アニメーション値の型
interface AnimationValues {
  scale: number;
  opacity: number;
  translateY: number;
  translateX: number;
  rotate: number;
  textShadow?: string;
  letterSpacing?: number;
}

interface AnimationParams {
  animationType: AnimationType;
  frame: number;
  startFrame: number;
  endFrame: number;
  fps: number;
}

/**
 * アニメーション値を計算する
 */
export const calculateAnimation = ({
  animationType,
  frame,
  startFrame,
  endFrame,
  fps,
}: AnimationParams): AnimationValues => {
  const framesSinceStart = frame - startFrame;
  const framesUntilEnd = endFrame - frame;
  const duration = endFrame - startFrame;

  // 入場アニメーション
  const entryDuration = Math.min(fps * 0.3, duration / 3);
  const entryProgress = interpolate(
    framesSinceStart,
    [0, entryDuration],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // 退場アニメーション
  const exitDuration = Math.min(fps * 0.2, duration / 4);
  const exitProgress = interpolate(framesUntilEnd, [0, exitDuration], [0, 1], {
    extrapolateRight: "clamp",
  });

  const defaults: AnimationValues = {
    scale: 1,
    opacity: 1,
    translateY: 0,
    translateX: 0,
    rotate: 0,
  };

  switch (animationType) {
    case "none":
      return defaults;

    case "karaoke": {
      const pulseIntensity = Math.sin(framesSinceStart * 0.2) * 0.05 + 1;
      const glowPulse = Math.sin(framesSinceStart * 0.15) * 0.3 + 0.7;

      return {
        ...defaults,
        scale:
          pulseIntensity *
          interpolate(entryProgress, [0, 1], [0.8, 1], {
            extrapolateRight: "clamp",
          }),
        opacity: entryProgress * exitProgress,
        textShadow: `
          0 0 ${10 + glowPulse * 20}px rgba(255, 255, 0, ${glowPulse * 0.8}),
          0 0 ${20 + glowPulse * 40}px rgba(255, 200, 0, ${glowPulse * 0.4})
        `,
      };
    }

    case "pulse": {
      const pulse = Math.sin(framesSinceStart * 0.15) * 0.08;
      return {
        ...defaults,
        scale: 1 + pulse,
        opacity: entryProgress * exitProgress,
      };
    }

    case "neon": {
      const flicker =
        Math.sin(framesSinceStart * 0.5) * Math.cos(framesSinceStart * 0.3) >
        0.7
          ? 0.7
          : 1;
      const hue = (framesSinceStart * 2) % 360;

      return {
        ...defaults,
        opacity: entryProgress * exitProgress * flicker,
        scale: interpolate(entryProgress, [0, 1], [0.9, 1], {
          extrapolateRight: "clamp",
        }),
        textShadow: `
          0 0 5px hsl(${hue}, 100%, 50%),
          0 0 10px hsl(${hue}, 100%, 50%),
          0 0 20px hsl(${hue}, 100%, 50%),
          0 0 40px hsl(${hue}, 100%, 40%)
        `,
      };
    }

    case "pop": {
      const popScale = interpolate(
        entryProgress,
        [0, 0.5, 0.75, 1],
        [0.3, 1.2, 0.95, 1],
        { extrapolateRight: "clamp" }
      );
      return {
        ...defaults,
        scale:
          popScale *
          interpolate(exitProgress, [0, 0.3], [0.8, 1], {
            extrapolateLeft: "clamp",
          }),
        opacity:
          interpolate(entryProgress, [0, 0.2], [0, 1], {
            extrapolateRight: "clamp",
          }) * exitProgress,
      };
    }

    case "bounce": {
      const bounceY = interpolate(
        entryProgress,
        [0, 0.4, 0.6, 0.8, 0.9, 1],
        [-80, 15, -8, 4, -2, 0],
        { extrapolateRight: "clamp" }
      );
      return {
        ...defaults,
        translateY: bounceY,
        opacity: entryProgress * exitProgress,
        scale: interpolate(entryProgress, [0, 0.4], [0.5, 1], {
          extrapolateRight: "clamp",
        }),
      };
    }

    case "shake": {
      const shakeIntensity = interpolate(
        framesSinceStart,
        [0, fps * 0.3, duration - fps * 0.2, duration],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      return {
        ...defaults,
        translateX: Math.sin(framesSinceStart * 2) * 4 * shakeIntensity,
        translateY: Math.cos(framesSinceStart * 2.5) * 2 * shakeIntensity,
        rotate: Math.sin(framesSinceStart * 1.5) * 2 * shakeIntensity,
        opacity: entryProgress * exitProgress,
      };
    }

    case "wave": {
      const waveAmount = Math.sin(framesSinceStart * 0.15) * 10;
      return {
        ...defaults,
        translateY: waveAmount,
        scale: 1 + Math.sin(framesSinceStart * 0.1) * 0.03,
        opacity: entryProgress * exitProgress,
      };
    }

    case "zoom": {
      const zoomScale = interpolate(entryProgress, [0, 0.6, 1], [3, 0.95, 1], {
        extrapolateRight: "clamp",
      });
      return {
        ...defaults,
        scale:
          zoomScale *
          interpolate(exitProgress, [0, 0.5], [0.5, 1], {
            extrapolateLeft: "clamp",
          }),
        opacity:
          interpolate(entryProgress, [0, 0.3], [0, 1], {
            extrapolateRight: "clamp",
          }) * exitProgress,
      };
    }

    case "typewriter": {
      return {
        ...defaults,
        opacity: entryProgress * exitProgress,
        letterSpacing: interpolate(entryProgress, [0, 1], [20, 0], {
          extrapolateRight: "clamp",
        }),
      };
    }

    case "slideUp": {
      const slideY = interpolate(entryProgress, [0, 1], [60, 0], {
        extrapolateRight: "clamp",
      });
      const exitSlideY = interpolate(exitProgress, [0, 1], [-30, 0], {
        extrapolateLeft: "clamp",
      });
      return {
        ...defaults,
        translateY: slideY + exitSlideY,
        opacity: entryProgress * exitProgress,
        scale: interpolate(entryProgress, [0, 1], [0.9, 1], {
          extrapolateRight: "clamp",
        }),
      };
    }

    case "fadeIn": {
      return {
        ...defaults,
        opacity: entryProgress * exitProgress,
        scale: interpolate(entryProgress, [0, 1], [0.95, 1], {
          extrapolateRight: "clamp",
        }),
      };
    }

    default:
      return defaults;
  }
};

/**
 * CSSスタイルオブジェクトに変換
 */
export const getAnimationStyle = (
  values: AnimationValues
): React.CSSProperties => {
  const transforms: string[] = [];

  if (values.scale !== 1) transforms.push(`scale(${values.scale})`);
  if (values.translateY !== 0)
    transforms.push(`translateY(${values.translateY}px)`);
  if (values.translateX !== 0)
    transforms.push(`translateX(${values.translateX}px)`);
  if (values.rotate !== 0) transforms.push(`rotate(${values.rotate}deg)`);

  return {
    opacity: values.opacity,
    transform: transforms.length > 0 ? transforms.join(" ") : undefined,
    textShadow: values.textShadow,
    letterSpacing: values.letterSpacing
      ? `${values.letterSpacing}px`
      : undefined,
  };
};
