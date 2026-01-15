import { TimelineAction } from "@xzdarcy/react-timeline-editor";
import { Subtitle } from "../types/subtitle";

export const subtitlesToTimelineActions = (
  subtitles: Subtitle[]
): TimelineAction[] => {
  return subtitles.map((sub, index) => ({
    id: `sub_${index}`,
    start: sub.startInMs / 1000,
    end: sub.endInMs / 1000,
    effectId: "subtitle_effect",
    data: { text: sub.text },
  }));
};
