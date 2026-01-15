"use client";

import { Player, PlayerRef } from "@remotion/player";
import { MyComposition } from "@/remotion/MyComposition";
import {
  Download,
  Settings,
  Upload,
  Loader2,
} from "lucide-react";
import { DragEvent } from "react";

type VideoPlayerProps = {
  videoPath: string | null;
  videoFileName: string | null;
  duration: number;
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
};

export const VideoPlayer = ({
  videoPath,
  videoFileName,
  duration,
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
}: VideoPlayerProps) => {
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
            disabled={!videoPath}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
              videoPath
                ? "bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/5"
                : "bg-[#333] text-gray-500 cursor-not-allowed"
            }`}
          >
            <Download size={16} /> エクスポート
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
              inputProps={{ videoSrc: videoPath }}
              durationInFrames={Math.max(1, Math.ceil(duration * FPS))}
              compositionWidth={1080}
              compositionHeight={1920}
              fps={FPS}
              style={{ width: "100%", height: "100%" }}
              controls={false}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        )}
      </div>
    </main>
  );
};
