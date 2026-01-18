import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { NextResponse } from "next/server";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { pathToFileURL } from "url";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoPath, subtitles, durationInFrames } = body;

    if (!videoPath) {
      return NextResponse.json(
        { error: "Video path is required" },
        { status: 400 },
      );
    }

    // Resolve absolute path of input video
    const projectRoot = process.cwd();
    const publicPath = videoPath.startsWith("/")
      ? videoPath.slice(1)
      : videoPath;
    const absoluteVideoPath = path.join(projectRoot, "public", publicPath);

    if (!existsSync(absoluteVideoPath)) {
      return NextResponse.json(
        { error: `Video file not found at ${absoluteVideoPath}` },
        { status: 404 },
      );
    }

    // Bundle the Remotion project
    // Note: In production, you might want to bundle once during build time
    // or cache the bundle location.
    const entryPoint = path.join(projectRoot, "src", "remotion", "index.ts");

    console.log("Bundling Remotion project...");
    const bundleLocation = await bundle({
      entryPoint,
      // Configure webpack to resolve path aliases from tsconfig.json
      webpackOverride: (config) => {
        return {
          ...config,
          resolve: {
            ...config.resolve,
            alias: {
              ...config.resolve?.alias,
              "@": path.join(projectRoot, "src"),
            },
          },
        };
      },
    });

    console.log("Bundle created at:", bundleLocation);

    // Construct HTTP URL for the video (Remotion renderer prefers HTTP over file://)
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const videoUrl = `${protocol}://${host}${videoPath}`;

    // Provide inputs to the composition
    const inputProps = {
      videoSrc: videoUrl,
      subtitles,
      durationInFrames: durationInFrames || 300,
    };

    // Select the composition to get metadata
    const compositionId = "MyComp";
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    // Determine output path
    const downloadsDir = path.join(projectRoot, "public", "downloads");
    if (!existsSync(downloadsDir)) {
      mkdirSync(downloadsDir, { recursive: true });
    }
    const outputFileName = `render_${Date.now()}.mp4`;
    const outputPath = path.join(downloadsDir, outputFileName);

    console.log("Starting render...");

    // Render the media
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
      frameRange: [0, (durationInFrames || composition.durationInFrames) - 1],
    });

    console.log("Render completed:", outputPath);

    return NextResponse.json({
      success: true,
      url: `/downloads/${outputFileName}`,
    });
  } catch (error: any) {
    console.error("Rendering error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      requireStack: error.requireStack,
    });
    return NextResponse.json(
      {
        error: "Rendering failed",
        details: error.message,
        code: error.code,
      },
      { status: 500 },
    );
  }
}
