"use client";

import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

type WaveformTrackProps = {
  url: string | null;
  duration: number;
  widthPerSecond: number;
};

export const WaveformTrack = ({ url, duration, widthPerSecond }: WaveformTrackProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!url || !containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(147, 51, 234, 0.6)",
      progressColor: "rgba(147, 51, 234, 0.6)",
      cursorColor: "transparent",
      height: 32,
      minPxPerSec: widthPerSecond,
      normalize: true,
      interact: false,
      fillParent: true,
      url: url,
    });

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [url, widthPerSecond]);

  return <div ref={containerRef} className="w-full h-full" />;
};
