"use client";

import {
  Film,
  X,
  Wand2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Palette,
  Type,
  PaintBucket,
} from "lucide-react";

type ProcessingState = {
  status: "idle" | "processing" | "done" | "error";
  message: string;
  progress: number;
};

type SubtitlePanelProps = {
  videoPath: string | null;
  videoFileName: string | null;
  processingState: ProcessingState;
  onRemoveVideo: () => void;
  onGenerateSubtitles: () => void;
  subtitleStyle: { fontSize: number; color: string; strokeColor: string };
  onStyleChange: (
    style: Partial<{ fontSize: number; color: string; strokeColor: string }>
  ) => void;
};

export const SubtitlePanel = ({
  videoPath,
  videoFileName,
  processingState,
  onRemoveVideo,
  onGenerateSubtitles,
  subtitleStyle,
  onStyleChange,
}: SubtitlePanelProps) => {
  return (
    <aside className="w-[320px] bg-[#1a1a1a] border-r border-[#333] flex flex-col">
      <div className="p-6 border-b border-[#333]">
        <h2 className="text-xl font-bold mb-1">字幕</h2>
        <p className="text-sm text-gray-400">AIで自動生成または手動追加</p>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {/* 動画が選択されていない場合 */}
        {!videoPath && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#252525] flex items-center justify-center">
              <Film size={28} className="text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm mb-2">動画がありません</p>
            <p className="text-gray-500 text-xs">
              右のエリアに動画をドロップしてください
            </p>
          </div>
        )}

        {/* 動画が選択されている場合 */}
        {videoPath && (
          <>
            {/* 選択中の動画 */}
            <div className="bg-[#252525] rounded-xl p-4 border border-[#333] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Film size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {videoFileName}
                  </p>
                  <p className="text-xs text-gray-500">アップロード済み</p>
                </div>
                <button
                  onClick={onRemoveVideo}
                  className="p-1.5 hover:bg-[#333] rounded-lg transition-colors"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* 字幕生成 */}
            <div
              className={`bg-[#252525] rounded-xl p-5 border transition-all duration-300 mb-4 ${
                processingState.status === "processing"
                  ? "border-blue-500/50 shadow-lg shadow-blue-500/10"
                  : "border-[#333] hover:border-[#555]"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    processingState.status === "processing"
                      ? "bg-blue-500 text-white animate-pulse"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {processingState.status === "processing" ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Wand2 size={18} />
                  )}
                </div>
                <h3 className="font-semibold">自動字幕起こし</h3>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Whisper AIを使って動画から音声を認識し、字幕を自動生成します。
              </p>

              {/* プログレスバー */}
              {processingState.status === "processing" && (
                <div className="mb-4">
                  <div className="h-1.5 w-full bg-[#333] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${processingState.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-xs text-blue-300">
                      {processingState.message}
                    </span>
                    <span className="text-xs font-mono text-blue-300">
                      {Math.round(processingState.progress)}%
                    </span>
                  </div>
                </div>
              )}

              {processingState.status === "done" && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400 text-xs">
                  <CheckCircle2 size={14} /> 完了しました！
                </div>
              )}

              {processingState.status === "error" && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle size={14} /> {processingState.message}
                </div>
              )}

              <button
                onClick={onGenerateSubtitles}
                disabled={processingState.status === "processing"}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  processingState.status === "processing"
                    ? "bg-[#333] text-gray-500 cursor-wait"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                }`}
              >
                {processingState.status === "processing"
                  ? "生成中..."
                  : "字幕を生成する"}
              </button>
            </div>

            {/* スタイル設定 */}
            <div className="bg-[#252525] rounded-xl p-5 border border-[#333]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Palette size={18} />
                </div>
                <h3 className="font-semibold">スタイル設定</h3>
              </div>

              <div className="space-y-6">
                {/* フォントサイズ */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Type size={14} /> サイズ
                    </span>
                    <span className="text-blue-400 font-mono">
                      {subtitleStyle.fontSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={150}
                    step={2}
                    value={subtitleStyle.fontSize}
                    onChange={(e) =>
                      onStyleChange({ fontSize: Number(e.target.value) })
                    }
                    className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* 文字色 */}
                <div className="space-y-3">
                  <span className="text-xs text-gray-400 flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-gray-600"
                      style={{ backgroundColor: subtitleStyle.color }}
                    />
                    文字の色
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      "#ffffff",
                      "#ffff00",
                      "#ff0000",
                      "#00ff00",
                      "#00ffff",
                      "#ff00ff",
                    ].map((c) => (
                      <button
                        key={c}
                        onClick={() => onStyleChange({ color: c })}
                        className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                          subtitleStyle.color === c
                            ? "border-blue-500"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={subtitleStyle.color}
                      onChange={(e) => onStyleChange({ color: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border-none p-0 cursor-pointer overflow-hidden"
                    />
                  </div>
                </div>

                {/* 縁取りの色 */}
                <div className="space-y-3">
                  <span className="text-xs text-gray-400 flex items-center gap-2">
                    <PaintBucket size={14} /> 縁取り
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      "#000000",
                      "#333333",
                      "#666666",
                      "#ffffff",
                      "#ff0000",
                      "#0000ff",
                    ].map((c) => (
                      <button
                        key={c}
                        onClick={() => onStyleChange({ strokeColor: c })}
                        className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                          subtitleStyle.strokeColor === c
                            ? "border-blue-500"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={subtitleStyle.strokeColor}
                      onChange={(e) =>
                        onStyleChange({ strokeColor: e.target.value })
                      }
                      className="w-8 h-8 rounded-lg bg-transparent border-none p-0 cursor-pointer overflow-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
