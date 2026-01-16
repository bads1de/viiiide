import React from "react";
import { render, screen } from "@testing-library/react";
import { SubtitleOverlay } from "@/remotion/SubtitleOverlay";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Subtitle } from "@/types/subtitle";

// Mock remotion hooks
jest.mock("remotion", () => ({
  useCurrentFrame: jest.fn(),
  useVideoConfig: jest.fn(),
  AbsoluteFill: ({ children, className }: any) => <div className={className} data-testid="absolute-fill">{children}</div>,
  interpolate: jest.fn((v) => v),
}));

// Mock google fonts
jest.mock("@/utils/googleFonts", () => ({
  loadGoogleFont: jest.fn(),
}));

describe("SubtitleOverlay", () => {
  const mockSubtitles: Subtitle[] = [
    { 
      text: "Hello", 
      startInMs: 0, 
      endInMs: 500,
      fontSize: 50,
      color: "#ffffff"
    },
    { 
      text: "World", 
      startInMs: 500, 
      endInMs: 1000,
      fontSize: 50,
      color: "#ffffff"
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useVideoConfig as jest.Mock).mockReturnValue({ fps: 30 });
  });

  it("renders nothing when no current page matches time", () => {
    (useCurrentFrame as jest.Mock).mockReturnValue(60); // 2 seconds at 30fps = 2000ms
    const { container } = render(<SubtitleOverlay subtitles={mockSubtitles} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders subtitle tokens when within time range", () => {
    (useCurrentFrame as jest.Mock).mockReturnValue(15); // 0.5 seconds = 500ms
    render(<SubtitleOverlay subtitles={mockSubtitles} />);
    
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("World")).toBeInTheDocument();
  });

  it("highlights active token", () => {
    // createCaptionPages splits "Hello World" into tokens. 
    // Usually "Hello" would be roughly 0-500ms and "World" 500-1000ms.
    (useCurrentFrame as jest.Mock).mockReturnValue(5); // ~166ms -> "Hello" is active
    render(<SubtitleOverlay subtitles={mockSubtitles} />);
    
    const hello = screen.getByText("Hello");
    // Active tokens have color #FFD700 (Gold)
    expect(hello).toHaveStyle({ color: "#FFD700" });
    
    const world = screen.getByText("World");
    // World is future at 166ms
    expect(world).toHaveStyle({ color: "rgba(255, 255, 255, 0.5)" });
  });

  it("applies style from subtitles", () => {
    (useCurrentFrame as jest.Mock).mockReturnValue(5);
    render(<SubtitleOverlay subtitles={mockSubtitles} />);
    
    const hello = screen.getByText("Hello");
    expect(hello).toHaveStyle({ fontSize: "50px" });
  });
});
