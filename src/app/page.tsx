"use client";

import { SubtitlePanel } from "../components/editor/SubtitlePanel";
import { VideoPlayer } from "../components/editor/VideoPlayer";
import { TimelineEditor } from "../components/editor/TimelineEditor";
import { useVideoEditor } from "../hooks/useVideoEditor";
import { ProjectLibrary } from "../components/editor/ProjectLibrary";

export default function Home() {
  const {
    videoPath,
    videoFileName,
    frames,
    duration,
    currentFrame,
    isPlaying,
    isDragging,
    isUploading,
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
    handleFileSelect,
    handleRemoveVideo,
    handleGenerateSubtitles,
    subtitles,
    isExporting,
    handleExport,
    subtitlePosition,
    updateSubtitlesPosition,
    subtitleStyle,
    updateSubtitleStyle,
    updateSubtitles,
    sessions,
    activeSessionId,
    isLibraryLoading,
    loadSession,
    deleteSession,
    handleSeparateVocals,
    separationState,
    hasSeparatedAudio,
  } = useVideoEditor();

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white font-sans overflow-hidden">
      <ProjectLibrary
        sessions={sessions}
        activeSessionId={activeSessionId}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
        isLoading={isLibraryLoading}
      />

      <SubtitlePanel
        videoPath={videoPath}
        videoFileName={videoFileName}
        processingState={processingState}
        separationState={separationState}
        hasSeparatedAudio={hasSeparatedAudio}
        onRemoveVideo={handleRemoveVideo}
        onGenerateSubtitles={handleGenerateSubtitles}
        onSeparateVocals={handleSeparateVocals}
        subtitles={subtitles}
        onSubtitlesUpdate={updateSubtitles}
        subtitleStyle={subtitleStyle}
        onStyleChange={updateSubtitleStyle}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <VideoPlayer
          videoPath={videoPath}
          videoFileName={videoFileName}
          duration={duration}
          FPS={FPS}
          isPlaying={isPlaying}
          isDragging={isDragging}
          isUploading={isUploading}
          playerRef={playerRef}
          onTogglePlay={handleTogglePlay}
          onFileSelect={handleFileSelect}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          setCurrentFrame={setCurrentFrame}
          setIsPlaying={setIsPlaying}
          subtitles={subtitles}
          isExporting={isExporting}
          onExport={handleExport}
          subtitlePosition={subtitlePosition}
          onSubtitleMove={updateSubtitlesPosition}
        />

        {videoPath && (
          <TimelineEditor
            videoPath={videoPath}
            duration={duration}
            frames={frames}
            subtitles={subtitles}
            FPS={FPS}
            playerRef={playerRef}
            timelineState={timelineState}
            onTogglePlay={handleTogglePlay}
          />
        )}
      </div>
    </div>
  );
}
