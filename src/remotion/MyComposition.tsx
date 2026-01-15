import { AbsoluteFill, OffthreadVideo, useCurrentFrame } from "remotion";

type MyCompositionProps = {
  videoSrc?: string;
};

export const MyComposition: React.FC<MyCompositionProps> = ({ videoSrc }) => {
  const frame = useCurrentFrame();

  if (!videoSrc) {
    return (
      <AbsoluteFill className="bg-black flex items-center justify-center">
        <div className="text-4xl font-bold text-gray-600">No Video</div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill className="bg-black">
      <OffthreadVideo
        src={videoSrc}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />
    </AbsoluteFill>
  );
};
