"use client";

import { Player, PlayerRef } from "@remotion/player";
import { MyComposition } from "@/remotion/MyComposition";
import { Download, Settings, Upload, Loader2 } from "lucide-react";
import { DragEvent, useEffect } from "react";
import { Subtitle } from "@/types/subtitle";
import { useState, useRef } from "react";

type VideoPlayerProps = {
  videoPath: string | null;
  videoFileName: string | null;
  duration: number;
  subtitles: Subtitle[];
  FPS: number;
  isPlaying: boolean;
  isDragging: boolean;
  isUploading: boolean;
  playerRef: React.RefObject<PlayerRef>;
  onTogglePlay: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragEnter: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  setCurrentFrame: (frame: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  isExporting: boolean;
  onExport: () => void;
  subtitlePosition: { x: number; y: number };
  onSubtitleMove: (x: number, y: number) => void;
};

export const VideoPlayer = ({
  videoPath,
  videoFileName,
  duration,
  subtitles,
  FPS,
  isPlaying,
  isDragging,
  isUploading,
  playerRef,
  onTogglePlay,
  onFileSelect,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  setCurrentFrame,
  setIsPlaying,
  isExporting,
  onExport,
  subtitlePosition,
  onSubtitleMove,
}: VideoPlayerProps) => {
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);

    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [playerRef, setIsPlaying, videoPath]); // videoPath changed means player might re-mount
  return (
    <main className="flex-1 bg-[#111] flex flex-col relative min-h-0">
      <header className="h-16 border-b border-[#333] flex items-center justify-between px-6 bg-[#161616]">
        <div className="text-sm text-gray-400">
          {videoFileName || "新規プロジェクト"}
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-[#333] hover:bg-[#444] rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Settings size={16} /> 1080x1920
          </button>
          <button
            disabled={!videoPath || isExporting}
            onClick={onExport}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
              videoPath && !isExporting
                ? "bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/5"
                : "bg-[#333] text-gray-500 cursor-not-allowed"
            }`}
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isExporting ? "出力中..." : "エクスポート"}
          </button>
        </div>
      </header>

      <div
        className="flex-1 flex items-center justify-center p-8 overflow-hidden relative"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* ドロップゾーン（動画がない場合） */}
        {!videoPath && (
          <div
            className={`w-full max-w-lg aspect-[9/16] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-500/10"
                : "border-[#444] hover:border-[#555]"
            }`}
          >
            {isUploading ? (
              <div className="text-center">
                <Loader2
                  size={48}
                  className="mx-auto mb-4 text-blue-500 animate-spin"
                />
                <p className="text-gray-300 font-medium">アップロード中...</p>
              </div>
            ) : (
              <>
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors ${
                    isDragging ? "bg-blue-500/20" : "bg-[#252525]"
                  }`}
                >
                  <Upload
                    size={32}
                    className={isDragging ? "text-blue-400" : "text-gray-500"}
                  />
                </div>
                <p className="text-lg font-medium text-gray-300 mb-2">
                  動画をドロップ
                </p>
                <p className="text-sm text-gray-500 mb-6">または</p>
                <label className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium cursor-pointer transition-colors">
                  ファイルを選択
                  <input
                    type="file"
                    accept="video/*"
                    onChange={onFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-600 mt-4">
                  MP4, WebM, MOV 対応
                </p>
              </>
            )}
          </div>
        )}

        {/* 動画プレビュー */}
        {videoPath && (
          <div
            className="relative shadow-2xl shadow-black rounded-lg overflow-hidden ring-1 ring-[#333] cursor-pointer"
            style={{ width: "360px", height: "640px" }}
            onClick={onTogglePlay}
          >
            <Player
              ref={playerRef}
              component={MyComposition}
              inputProps={{ videoSrc: videoPath, subtitles }}
              durationInFrames={Math.max(1, Math.ceil(duration * FPS))}
              compositionWidth={1080}
              compositionHeight={1920}
              fps={FPS}
              style={{ width: "100%", height: "100%" }}
              controls={false}
            />
            {subtitles.length > 0 && (
              <SubtitleDraggable
                x={subtitlePosition.x}
                y={subtitlePosition.y}
                onMove={onSubtitleMove}
                containerWidth={360}
                containerHeight={640}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
};

const SubtitleDraggable = ({
  x,
  y,
  onMove,
  containerWidth,
  containerHeight,
}: {
  x: number;
  y: number;
  onMove: (x: number, y: number) => void;
  containerWidth: number;
  containerHeight: number;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSubtitlePos = useRef({ x: 0, y: 0 });
  const lastUpdate = useRef({ x, y });
  const rafId = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    startSubtitlePos.current = { x, y };
    lastUpdate.current = { x, y };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId.current) return;

      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const dx = (e.clientX - startPos.current.x) * (1080 / containerWidth);
        const dy = (e.clientY - startPos.current.y) * (1920 / containerHeight);

        const nextX = Math.round(startSubtitlePos.current.x + dx);
        const nextY = Math.round(startSubtitlePos.current.y + dy);

        // 無駄な再レンダリングを防ぐために値が変わったときだけ呼ぶ
        if (nextX !== lastUpdate.current.x || nextY !== lastUpdate.current.y) {
          lastUpdate.current = { x: nextX, y: nextY };
          onMove(nextX, nextY);
        }
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isDragging, onMove, containerWidth, containerHeight]);

  const scaleY = 1920 / containerHeight;
  const scaleX = 1080 / containerWidth;

  const displayY = y / scaleY;
  const displayX = x / scaleX;

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        left: `calc(50% + ${displayX}px)`,
        top: displayY,
        width: "80%",
        height: "80px",
        transform: "translateX(-50%)",
        border: isDragging
          ? "2px solid #3b82f6"
          : "2px dashed rgba(255,255,255,0.3)",
        borderRadius: "8px",
        cursor: "move",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDragging
          ? "rgba(59, 130, 246, 0.2)"
          : "rgba(0,0,0,0.1)",
        transition: isDragging
          ? "none"
          : "border-color 0.2s, background-color 0.2s, top 0.1s, left 0.1s",
      }}
    >
      {isDragging && (
        <div className="text-[10px] uppercase font-bold tracking-wider text-white/40 pointer-events-none select-none">
          {Math.round(x)}, {Math.round(y)}
        </div>
      )}
    </div>
  );
};
