import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubtitlePanel } from "@/components/editor/SubtitlePanel";

describe("SubtitlePanel", () => {
  const defaultProps = {
    videoPath: null,
    videoFileName: null,
    processingState: { status: "idle" as const, message: "", progress: 0 },
    onRemoveVideo: jest.fn(),
    onGenerateSubtitles: jest.fn(),
    subtitleStyle: {
      fontSize: 60,
      color: "#ffffff",
      strokeColor: "#000000",
      fontFamily: "Roboto",
    },
    onStyleChange: jest.fn(),
  };

  it("renders empty state when no video is selected", () => {
    render(<SubtitlePanel {...defaultProps} />);
    expect(screen.getByText("動画がありません")).toBeInTheDocument();
    expect(screen.queryByText("自動字幕起こし")).not.toBeInTheDocument();
  });

  it("renders video info and generate button when video is selected", () => {
    render(
      <SubtitlePanel
        {...defaultProps}
        videoPath="/uploads/test.mp4"
        videoFileName="test.mp4"
      />
    );
    expect(screen.getByText("test.mp4")).toBeInTheDocument();
    expect(screen.getByText("AI字幕生成")).toBeInTheDocument();
    expect(screen.getByText("字幕を生成する")).toBeInTheDocument();
  });

  it("shows progress bar when processing", () => {
    render(
      <SubtitlePanel
        {...defaultProps}
        videoPath="/uploads/test.mp4"
        videoFileName="test.mp4"
        processingState={{
          status: "processing",
          message: "解析中...",
          progress: 45,
        }}
      />
    );
    expect(screen.getByText("解析中...")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
    expect(screen.getByText("生成中...")).toBeDisabled();
  });

  it("shows success message when done", () => {
    render(
      <SubtitlePanel
        {...defaultProps}
        videoPath="/uploads/test.mp4"
        videoFileName="test.mp4"
        processingState={{
          status: "done",
          message: "完了",
          progress: 100,
        }}
      />
    );
    expect(screen.getByText("完了しました")).toBeInTheDocument();
  });

  it("calls onGenerateSubtitles when button is clicked", () => {
    const onGenerateSubtitles = jest.fn();
    render(
      <SubtitlePanel
        {...defaultProps}
        videoPath="/uploads/test.mp4"
        videoFileName="test.mp4"
        onGenerateSubtitles={onGenerateSubtitles}
      />
    );
    fireEvent.click(screen.getByText("字幕を生成する"));
    expect(onGenerateSubtitles).toHaveBeenCalled();
  });

  it("calls onRemoveVideo when x button is clicked", () => {
    const onRemoveVideo = jest.fn();
    render(
      <SubtitlePanel
        {...defaultProps}
        videoPath="/uploads/test.mp4"
        videoFileName="test.mp4"
        onRemoveVideo={onRemoveVideo}
      />
    );
    const removeButton = screen.getByLabelText("Remove video");
    fireEvent.click(removeButton);
    expect(onRemoveVideo).toHaveBeenCalled();
  });
});