"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  RefObject,
  DragEvent,
  ChangeEvent,
} from "react";
import { PlayerRef } from "@remotion/player";
import { TimelineState } from "@xzdarcy/react-timeline-editor";
import { extractFrames } from "@remotion/webcodecs";
import { Subtitle } from "../types/subtitle";
import { AnimationType } from "../types/animation";
import { fetchSubtitles } from "../utils/subtitleUtils";
import { loadGoogleFont } from "../utils/googleFonts";
import { getPresetById, DEFAULT_PRESET_ID } from "../config/stylePresets";

export const useVideoEditor = () => {
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingState, setProcessingState] = useState<{
    status: "idle" | "processing" | "done" | "error";
    message: string;
    progress: number;
  }>({ status: "idle", message: "", progress: 0 });
  const [subtitlePosition, setSubtitlePosition] = useState({ x: 0, y: 1600 });
  const [subtitleStyle, setSubtitleStyle] = useState({
    presetId: DEFAULT_PRESET_ID,
    fontSize: 60,
    color: "#ffffff",
    strokeColor: "#000000",
    fontFamily: "Roboto",
    animation: "karaoke" as AnimationType,
  });

  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);

  const playerRef = useRef<PlayerRef>(null) as RefObject<PlayerRef>;
  const timelineState = useRef<TimelineState>(null) as RefObject<TimelineState>;
  const FPS = 30;

  const fetchSessions = useCallback(async () => {
    setIsLibraryLoading(true);
    try {
      const response = await fetch("/api/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setIsLibraryLoading(false);
    }
  }, []);

  // Load initial font and sessions
  useEffect(() => {
    loadGoogleFont(subtitleStyle.fontFamily);
    fetchSessions();
  }, [fetchSessions, subtitleStyle.fontFamily]);

  // プレイヤー同期ループ
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      if (playerRef.current && timelineState.current) {
        const frame = playerRef.current.getCurrentFrame();
        if (typeof frame === "number") {
          const time = frame / FPS;
          timelineState.current.setTime(time);
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      rafId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  const handleTogglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (playerRef.current.isPlaying()) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const extractVideoFrames = async (file: File) => {
    setIsExtracting(true);
    setFrames([]);
    const url = URL.createObjectURL(file);

    const video = document.createElement("video");
    video.src = url;
    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve(null);
    });
    const duration = video.duration;
    setDuration(duration);

    const timestamps = Array.from({ length: Math.ceil(duration) }, (_, i) => i);

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
            setFrames((prev) => [...prev, imageUrl]);
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
      setActiveSessionId(result.sessionId);
      setUploadProgress(100);

      // セッションリストを更新
      await fetchSessions();
    } catch (error) {
      console.error("Upload error:", error);
      alert("アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  const loadSession = useCallback(
    async (session: any) => {
      setActiveSessionId(session.id);
      setVideoPath(session.videoPath);
      setVideoFileName(session.originalName);
      setProcessingState({
        status: session.hasSubtitles ? "done" : "idle",
        message: session.hasSubtitles ? "字幕生成済み" : "",
        progress: session.hasSubtitles ? 100 : 0,
      });

      // 字幕の読み込みを試行
      const subs = await fetchSubtitles(session.videoPath);
      if (subs.length > 0) {
        setSubtitles(
          subs.map((s) => ({
            ...s,
            ...subtitlePosition,
            ...subtitleStyle,
          }))
        );
      } else {
        setSubtitles([]);
      }

      // 動画時間を取得するためにメタデータをロード
      const video = document.createElement("video");
      video.src = session.videoPath;
      video.onloadedmetadata = () => {
        setDuration(video.duration);
      };
    },
    [subtitlePosition, subtitleStyle]
  );

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

  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      extractVideoFrames(file);
      await uploadFile(file);
    },
    []
  );

  const handleRemoveVideo = () => {
    setVideoPath(null);
    setVideoFileName(null);
    setFrames([]);
    setCurrentFrame(0);
    setDuration(0);
    setIsPlaying(false);
    setProcessingState({ status: "idle", message: "", progress: 0 });
    setActiveSessionId(null);
  };

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

              if (data.stage === "done" && videoPath) {
                // セッションリストを更新（hasSubtitlesを反映させるため）
                fetchSessions();

                const subs = await fetchSubtitles(videoPath);
                // 現在の位置情報とスタイルを適用してから状態を更新
                setSubtitles(
                  subs.map((s) => ({
                    ...s,
                    ...subtitlePosition,
                    ...subtitleStyle,
                  }))
                );
              }
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

  const updateSubtitlesPosition = useCallback((x: number, y: number) => {
    setSubtitlePosition({ x, y });
    setSubtitles((prev) => prev.map((s) => ({ ...s, x, y })));
  }, []);

  const updateSubtitleStyle = useCallback(
    async (style: Partial<typeof subtitleStyle>) => {
      if (style.fontFamily) {
        loadGoogleFont(style.fontFamily);
      }
      setSubtitleStyle((prev) => {
        const next = { ...prev, ...style };
        setSubtitles((subs) => {
          const updated = subs.map((s) => ({ ...s, ...next }));
          return updated;
        });
        return next;
      });
    },
    []
  );

  const updateSubtitles = useCallback((newSubtitles: Subtitle[]) => {
    setSubtitles(newSubtitles);
  }, []);

  const handleExport = async () => {
    if (!videoPath) return;

    setIsExporting(true);
    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoPath,
          subtitles,
          durationInFrames: Math.ceil(duration * FPS),
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const data = await response.json();
      if (data.url) {
        const link = document.createElement("a");
        link.href = data.url;
        link.download = `video_export_${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("エクスポートに失敗しました");
    } finally {
      setIsExporting(false);
    }
  };

  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (
        !confirm(
          "本当にこのプロジェクトを削除しますか？\nこの操作は取り消せません。"
        )
      ) {
        return;
      }

      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete session");
        }

        // アクティブなセッションを削除した場合はリセット
        if (activeSessionId === sessionId) {
          handleRemoveVideo();
        }

        await fetchSessions();
      } catch (error) {
        console.error("Failed to delete session:", error);
        alert("プロジェクトの削除に失敗しました");
      }
    },
    [activeSessionId, fetchSessions]
  );

  return {
    videoPath,
    videoFileName,
    frames,
    subtitles,
    duration,
    currentFrame,
    isPlaying,
    isDragging,
    isUploading,
    isExtracting,
    isExporting,
    uploadProgress,
    processingState,
    playerRef,
    timelineState,
    FPS,
    setCurrentFrame,
    setIsPlaying,
    handleTogglePlay,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    updateSubtitles,
    handleFileSelect,
    handleRemoveVideo,
    handleGenerateSubtitles,
    subtitlePosition,
    updateSubtitlesPosition,
    subtitleStyle,
    updateSubtitleStyle,
    handleExport,
    sessions,
    activeSessionId,
    isLibraryLoading,
    loadSession,
    deleteSession,
  };
};
