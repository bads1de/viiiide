"use client";

import {
  Timeline,
  TimelineRow,
  TimelineState,
  TimelineAction,
} from "@xzdarcy/react-timeline-editor";
import { Settings, Play, Pause, ZoomIn, ZoomOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { PlayerRef } from "@remotion/player";
import { WaveformTrack } from "./WaveformTrack";
import { TimeDisplay } from "./TimeDisplay";
import { Subtitle } from "@/types/subtitle";
import { subtitlesToTimelineActions } from "@/utils/timelineUtils";

type CustomTimelineAction = TimelineAction & {
  data?: {
    frames?: string[];
    text?: string;
  };
};

type TimelineEditorProps = {
  videoPath: string | null;
  duration: number;
  frames: string[];
  subtitles: Subtitle[];
  FPS: number;
  playerRef: React.RefObject<PlayerRef>;
  timelineState: React.RefObject<TimelineState>;
  onTogglePlay: () => void;
};

export const TimelineEditor = ({
  videoPath,
  duration,
  frames,
  subtitles,
  FPS,
  playerRef,
  timelineState,
  onTogglePlay,
}: TimelineEditorProps) => {
  const [scaleWidth, setScaleWidth] = useState(120);
  const [editorData, setEditorData] = useState<TimelineRow[]>([]);

  useEffect(() => {
    if (!videoPath || duration === 0) {
      setEditorData([]);
      return;
    }

    setEditorData([
      {
        id: "0",
        actions: [
          {
            id: "video_action",
            start: 0,
            end: duration,
            effectId: "video_effect",
            data: { frames },
          } as CustomTimelineAction,
        ],
      },
      {
        id: "1",
        actions: [
          {
            id: "audio_action",
            start: 0,
            end: duration,
            effectId: "audio_effect",
            movable: false,
          },
        ],
      },
      {
        id: "2",
        actions: subtitlesToTimelineActions(subtitles),
      },
    ]);
  }, [videoPath, duration, frames, subtitles]);

  const getActionRender = (action: TimelineAction, row: TimelineRow) => {
    if (action.effectId === "video_effect") {
      const frames =
        ((action as CustomTimelineAction).data?.frames as string[]) || [];
      return (
        <div className="w-full h-full flex overflow-hidden rounded-md">
          {frames.map((frame, i) => (
            <img
              key={i}
              src={frame}
              className="h-full object-cover pointer-events-none"
              style={{ width: `${scaleWidth}px` }}
            />
          ))}
        </div>
      );
    }
    if (action.effectId === "audio_effect") {
      return (
        <WaveformTrack
          url={videoPath}
          duration={duration}
          widthPerSecond={scaleWidth}
        />
      );
    }
    if (action.effectId === "subtitle_effect") {
      return (
        <div className="w-full h-[80%] my-auto bg-[#8b5cf6] rounded flex items-center px-1.5 border border-[#a78bfa]/50 overflow-hidden whitespace-nowrap text-[10px] text-white/90 shadow-sm">
          {(action as CustomTimelineAction).data?.text}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 border-t border-[#333] bg-[#1a1a1a] flex flex-col select-none relative group z-0 flex-shrink-0">
      {/* コントロールバー */}
      <div className="h-10 border-b border-[#333] flex items-center px-4 justify-between bg-[#1f1f1f] z-20 relative">
        <TimeDisplay playerRef={playerRef} duration={duration} FPS={FPS} />
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="p-1.5 hover:bg-[#333] rounded text-white transition-colors"
          >
            {playerRef.current?.isPlaying() ? (
              <Pause size={14} />
            ) : (
              <Play size={14} />
            )}
          </button>
          <button className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors">
            <Settings size={14} />
          </button>
        </div>

        {/* ズームコントロール */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setScaleWidth(Math.max(10, scaleWidth - 20))}
            className="text-gray-400 hover:text-white"
          >
            <ZoomOut size={16} />
          </button>
          <input
            type="range"
            min={10}
            max={400}
            step={10}
            value={scaleWidth}
            onChange={(e) => setScaleWidth(Number(e.target.value))}
            className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <button
            onClick={() => setScaleWidth(Math.min(400, scaleWidth + 20))}
            className="text-gray-400 hover:text-white"
          >
            <ZoomIn size={16} />
          </button>
          <span className="text-[10px] text-gray-500 w-8 text-center">
            {scaleWidth}px
          </span>
        </div>
      </div>

      {/* タイムラインエリア */}
      <div className="flex-1 relative bg-[#151515]">
        <Timeline
          ref={timelineState}
          editorData={editorData}
          effects={{
            video_effect: { id: "video_effect", name: "Video" },
            audio_effect: { id: "audio_effect", name: "Audio" },
            subtitle_effect: { id: "subtitle_effect", name: "Subtitles" },
          }}
          scaleWidth={scaleWidth}
          scale={1}
          startLeft={10}
          rowHeight={40}
          getActionRender={getActionRender}
          onClickTimeArea={(time) => {
            const frame = time * FPS;
            if (playerRef.current) {
              playerRef.current.seekTo(frame);
              return true;
            }
            return false;
          }}
          onCursorDrag={(time) => {
            const frame = time * FPS;
            if (playerRef.current) {
              playerRef.current.seekTo(frame);
            }
          }}
          onChange={(data) => {
            const hasAudio = data.some((row) =>
              row.actions.some((action) => action.id === "audio_action")
            );
            if (hasAudio) {
              setEditorData(data);
            }
          }}
          autoScroll={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
};
