import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubtitlePanel } from "@/components/editor/SubtitlePanel";
import { AnimationType } from "@/types/animation";

describe("SubtitlePanel", () => {
  const defaultProps = {
    videoPath: null,
    videoFileName: null,
    processingState: { status: "idle" as const, message: "", progress: 0 },
    onRemoveVideo: jest.fn(),
    onGenerateSubtitles: jest.fn(),
    subtitles: [],
    onSubtitlesUpdate: jest.fn(),
    subtitleStyle: {
      fontSize: 60,
      color: "#ffffff",
      strokeColor: "#000000",
      fontFamily: "Roboto",
      animation: "karaoke" as AnimationType,
    },
    onStyleChange: jest.fn(),
  };

  it("renders empty state when no video is selected", () => {
    render(<SubtitlePanel {...defaultProps} />);
    expect(screen.getByText("動画がありません")).toBeInTheDocument();
  });

  it("renders video info but NOT the AI generation section", () => {
    render(
      <SubtitlePanel
        {...defaultProps}
        videoPath="/uploads/test.mp4"
        videoFileName="test.mp4"
      />
    );
    expect(screen.getByText("test.mp4")).toBeInTheDocument();

    // 削除されるべき要素 (Red phase)
    expect(screen.queryByText("AI字幕生成")).not.toBeInTheDocument();
    expect(screen.queryByText("字幕を生成する")).not.toBeInTheDocument();
    expect(
      screen.queryByText("AIで自動生成または手動追加")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("字幕設定")).not.toBeInTheDocument();
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
