"use client";

import { Player } from "@remotion/player";
import { MyComposition } from "@/remotion/MyComposition";
import {
  Type,
  Wand2,
  Settings,
  Download,
  MonitorPlay,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Film,
  X,
} from "lucide-react";
import { useState, useCallback, DragEvent } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("subtitle");
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingState, setProcessingState] = useState<{
    status: "idle" | "processing" | "done" | "error";
    message: string;
    progress: number;
  }>({ status: "idle", message: "", progress: 0 });

  // ドラッグ＆ドロップハンドラ
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("video/")) {
      alert("動画ファイルのみアップロードできます");
      return;
    }

    await uploadFile(file);
  }, []);

  // ファイル選択ハンドラ
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      await uploadFile(file);
    },
    []
  );

  // ファイルアップロード
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("video", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      setVideoPath(result.path);
      setVideoFileName(result.fileName);
      setUploadProgress(100);
    } catch (error) {
      console.error("Upload error:", error);
      alert("アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  // 動画を削除
  const handleRemoveVideo = () => {
    setVideoPath(null);
    setVideoFileName(null);
    setProcessingState({ status: "idle", message: "", progress: 0 });
  };

  // 字幕生成
  const handleGenerateSubtitles = async () => {
    if (!videoPath || processingState.status === "processing") return;

    setProcessingState({
      status: "processing",
      message: "開始中...",
      progress: 0,
    });

    try {
      const response = await fetch("/api/whisper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoPath: videoPath.replace(/^\//, "") }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace("data: ", "");
            try {
              const data = JSON.parse(jsonStr);
              setProcessingState({
                status:
                  data.stage === "done"
                    ? "done"
                    : data.stage === "error"
                    ? "error"
                    : "processing",
                message: data.message,
                progress: data.progress,
              });
            } catch (e) {
              console.error("JSON Parse error", e);
            }
          }
        }
      }
    } catch (error) {
      setProcessingState({
        status: "error",
        message: "エラーが発生しました",
        progress: 0,
      });
    }
  };

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white font-sans overflow-hidden">
      {/* 左サイドバー: ツールバー */}
      <aside className="w-[72px] bg-[#0f0f0f] flex flex-col items-center py-6 border-r border-[#333] z-10">
        <div className="mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20">
            <MonitorPlay size={20} className="text-white" />
          </div>
        </div>

        <nav className="flex flex-col gap-6 w-full">
          <SidebarButton
            icon={<Type size={20} />}
            label="字幕"
            active={activeTab === "subtitle"}
            onClick={() => setActiveTab("subtitle")}
          />
          <SidebarButton
            icon={<Wand2 size={20} />}
            label="AI編集"
            active={activeTab === "ai"}
            onClick={() => setActiveTab("ai")}
          />
          <SidebarButton
            icon={<Settings size={20} />}
            label="設定"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
        </nav>
      </aside>

      {/* サブサイドバー */}
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
                    onClick={handleRemoveVideo}
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
                  onClick={handleGenerateSubtitles}
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
            </>
          )}
        </div>
      </aside>

      {/* 中央: プレビューエリア */}
      <main className="flex-1 bg-[#111] flex flex-col relative">
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
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
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
                      onChange={handleFileSelect}
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
              className="relative shadow-2xl shadow-black rounded-lg overflow-hidden ring-1 ring-[#333]"
              style={{ width: "360px", height: "640px" }}
            >
              <Player
                component={MyComposition}
                inputProps={{ videoSrc: videoPath }}
                durationInFrames={300}
                compositionWidth={1080}
                compositionHeight={1920}
                fps={30}
                style={{ width: "100%", height: "100%" }}
                controls
              />
            </div>
          )}
        </div>

        {/* 下部: タイムライン */}
        {videoPath && (
          <div className="h-48 border-t border-[#333] bg-[#161616] flex flex-col">
            <div className="h-10 border-b border-[#333] flex items-center px-4 gap-2 text-xs text-gray-500">
              <div className="cursor-pointer hover:text-white">00:00</div>
              <div className="flex-1 h-full flex items-center relative">
                <div className="absolute inset-0 flex justify-between px-2">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-px h-2 bg-[#333] self-end" />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-x-auto">
              <div className="h-10 bg-purple-900/30 border border-purple-500/50 rounded-lg flex items-center px-3 text-purple-200 text-xs w-[500px]">
                <Film size={14} className="mr-2" />
                {videoFileName}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const SidebarButton = ({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 w-full py-3 relative group transition-all ${
      active ? "text-blue-400" : "text-gray-400 hover:text-white"
    }`}
  >
    {active && (
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-r-full" />
    )}
    <div
      className={`transition-transform duration-200 ${
        active ? "scale-110" : "group-hover:scale-110"
      }`}
    >
      {icon}
    </div>
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);
