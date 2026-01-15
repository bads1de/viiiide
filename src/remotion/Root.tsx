import { Composition } from "remotion";
import { MyComposition } from "./MyComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: (props as any).durationInFrames || 300,
          };
        }}
        defaultProps={{
          videoSrc: "",
          subtitles: [],
          durationInFrames: 300,
        }}
      />
    </>
  );
};
