"use client";

import { PlayerRef } from "@remotion/player";
import { useEffect, useState, useRef } from "react";

interface TimeDisplayProps {
  playerRef: React.RefObject<PlayerRef>;
  duration: number;
  FPS: number;
}

export const TimeDisplay = ({ playerRef, duration, FPS }: TimeDisplayProps) => {
  const [frame, setFrame] = useState(0);
  const requestRef = useRef<number | null>(null);

  const animate = () => {
    if (playerRef.current) {
      const currentFrame = playerRef.current.getCurrentFrame();
      if (typeof currentFrame === "number") {
        setFrame(currentFrame);
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [playerRef]);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00:00";
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  };

  return (
    <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
      <span className="text-white">{formatTime(frame / FPS)}</span>
      <span className="text-gray-600">/</span>
      <span>{formatTime(duration)}</span>
    </div>
  );
};
