"use client";

import { Player, PlayerRef } from "@remotion/player";
import { MyComposition } from "@/remotion/MyComposition";
import { extractFrames } from "@remotion/webcodecs";
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
  Play,
  Pause
} from "lucide-react";
import { useState, useCallback, DragEvent, useRef, useEffect } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("subtitle");
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingState, setProcessingState] = useState<{
    status: "idle" | "processing" | "done" | "error";
    message: string;
    progress: number;
  }>({ status: "idle", message: "", progress: 0 });

  const playerRef = useRef<PlayerRef>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const FPS = 30;
  const PIXELS_PER_SECOND = 120;

  // タイムラインクリック時のシーク処理
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.parentElement?.scrollLeft || 0;
    const clickX = e.clientX - rect.left; // コンテナ内でのX座標
    
    // スクロールされている場合、表示領域外のクリック位置を考慮する必要があるが、
    // ここではクリックイベントがtimelineRef（スクロールされる中身）上で発生することを想定
    // しかし、実際にはクリックイベントは親のscrollable divで拾う方が簡単かもしれない。
    // 今回は timelineRef (widthが固定された内部div) にonClickをつける。
    
    const timeInSeconds = clickX / PIXELS_PER_SECOND;
    const frame = Math.round(timeInSeconds * FPS);
    
    playerRef.current.seekTo(frame);
    setCurrentFrame(frame);
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // フレーム抽出
  const extractVideoFrames = async (file: File) => {
    setIsExtracting(true);
    setFrames([]);
    const url = URL.createObjectURL(file);
    
    // 仮の動画要素を作成して長さを取得
    const video = document.createElement("video");
    video.src = url;
    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve(null);
    });
    const duration = video.duration;
    setDuration(duration);
    
    // 1秒ごとにフレームを抽出
    const timestamps = Array.from(
      { length: Math.ceil(duration) },
      (_, i) => i
    );

    const extractedFrames: string[] = [];

    try {
      await extractFrames({
        src: url,
        timestampsInSeconds: timestamps,
        onFrame: async (frame) => {
          const canvas = document.createElement("canvas");
          canvas.width = frame.codedWidth;
          canvas.height = frame.codedHeight;
          const ctx = canvas.getContext("2d");
          
          if (ctx) {
            ctx.drawImage(frame, 0, 0);
            const imageUrl = canvas.toDataURL("image/jpeg", 0.5);
            extractedFrames.push(imageUrl);
            // リアルタイムで更新したい場合はここでsetFramesしてもよいが、
            // レンダリング回数を減らすため、ある程度まとめて、あるいは最後にセットする戦略もあり。
            // ここではユーザー体験向上のため、逐次追加していく（ただしパフォーマンス注意）
             setFrames((prev) => {
                // 順番が保証されない可能性があるため、タイムスタンプ順に並べるロジックが必要だが、
                // extractFramesは通常順番通りに来る。ここでは単純に追加。
                return [...prev, imageUrl];
             });
          }
          frame.close();
        },
      });
    } catch (e) {
      console.error("Frame extraction error:", e);
    } finally {
      setIsExtracting(false);
      URL.revokeObjectURL(url);
    }
  };

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

    extractVideoFrames(file);
    await uploadFile(file);
  }, []);

  // ファイル選択ハンドラ
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      extractVideoFrames(file);
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
    setFrames([]);
    setCurrentFrame(0);
    setDuration(0);
    setIsPlaying(false);
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
                ref={playerRef}
                component={MyComposition}
                inputProps={{ videoSrc: videoPath }}
                durationInFrames={Math.max(1, Math.ceil(duration * FPS))}
                compositionWidth={1080}
                compositionHeight={1920}
                fps={FPS}
                style={{ width: "100%", height: "100%" }}
                controls
                onFrameUpdate={(f) => setCurrentFrame(f)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
          )}
        </div>

        {/* 下部: タイムライン */}
        {videoPath && (
          <div className="h-64 border-t border-[#333] bg-[#1a1a1a] flex flex-col select-none relative group z-0">
            {/* コントロールバー（簡易） */}
            <div className="h-10 border-b border-[#333] flex items-center px-4 justify-between bg-[#161616] z-20 relative">
              <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                <span className="text-white">
                  {new Date((currentFrame / FPS) * 1000).toISOString().substr(11, 8)}
                </span>
                <span className="text-gray-600">/</span>
                <span>
                  {new Date(duration * 1000).toISOString().substr(11, 8)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={togglePlay}
                  className="p-1.5 hover:bg-[#333] rounded text-white transition-colors"
                >
                   {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors">
                   <Settings size={14} />
                </button>
              </div>
            </div>

            {/* タイムラインエリア */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar relative">
              <div 
                ref={timelineRef}
                className="relative min-w-full h-full cursor-pointer"
                style={{ width: `${Math.max(duration, 10) * PIXELS_PER_SECOND}px` }} 
                onClick={handleTimelineClick}
              >
                {/* ルーラー */}
                <div className="h-8 border-b border-[#333] bg-[#161616] sticky top-0 z-10 flex items-end text-[10px] text-gray-500 font-mono pointer-events-none">
                  {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute bottom-0 border-l border-[#444] h-3 flex items-center pl-1"
                      style={{ left: `${i * PIXELS_PER_SECOND}px` }}
                    >
                      <span className="absolute -top-4 -left-3 select-none">
                        {new Date(i * 1000).toISOString().substr(14, 5)}
                      </span>
                      {/* サブ目盛り */}
                      {[...Array(4)].map((_, j) => (
                         <div 
                           key={j} 
                           className="absolute h-1.5 w-px bg-[#333]" 
                           style={{ left: `${(j + 1) * (PIXELS_PER_SECOND / 5)}px`, bottom: 0 }} 
                         />
                      ))}
                    </div>
                  ))}
                </div>

                {/* トラックエリア */}
                <div className="p-4 relative">
                  {/* 再生ヘッド（ライン） */}
                  <div 
                    className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-transform duration-75 ease-linear will-change-transform"
                    style={{ transform: `translateX(${(currentFrame / FPS) * PIXELS_PER_SECOND}px)` }}
                  >
                    <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rotate-45 transform" />
                  </div>

                  {/* フィルムストリップ */}
                  <div className="h-24 bg-[#252525] rounded-lg border border-[#333] overflow-hidden relative flex items-center">
                    {/* 背景グリッドパターン（読み込み中用） */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" 
                         style={{ backgroundImage: 'linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: `${PIXELS_PER_SECOND}px 100%` }} 
                    />
                    
                    {frames.length > 0 ? (
                      <div className="flex h-full pointer-events-none">
                        {frames.map((frame, index) => (
                          <div 
                            key={index} 
                            className="h-full border-r border-[#333]/50 flex-shrink-0 relative overflow-hidden"
                            style={{ width: `${PIXELS_PER_SECOND}px` }}
                          >
                            <img 
                              src={frame} 
                              alt={`Frame ${index}`} 
                              className="w-full h-full object-cover opacity-80"
                              loading="lazy"
                              draggable={false}
                            />
                            <div className="absolute inset-0 bg-black/10" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center gap-3 text-gray-500 pointer-events-none">
                        {isExtracting && <Loader2 size={16} className="animate-spin" />}
                        <span className="text-xs font-medium">
                          {isExtracting ? "フレーム抽出中..." : "No frames"}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* 音声波形（ダミー） */}
                  <div className="mt-2 h-12 bg-blue-900/10 rounded-lg border border-blue-500/20 overflow-hidden relative">
                     <div className="absolute inset-0 flex items-center opacity-30">
                        {Array.from({ length: Math.ceil(duration * 10) }).map((_, i) => (
                           <div 
                             key={i} 
                             className="w-1 bg-blue-500 mx-px rounded-full"
                             style={{ height: `${20 + Math.random() * 60}%` }}
                           />
                        ))}
                     </div>
                  </div>

                </div>
              </div>
            </div>
            
            {/* スクロールバーのスタイル定義 */}
            <style jsx global>{`
              .custom-scrollbar::-webkit-scrollbar {
                height: 10px;
                background: #1a1a1a;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #333;
                border-radius: 5px;
                border: 2px solid #1a1a1a;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #555;
              }
            `}</style>
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
