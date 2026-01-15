import { Subtitle } from "../types/subtitle";

export const fetchSubtitles = async (
  videoPath: string
): Promise<Subtitle[]> => {
  if (!videoPath) return [];

  try {
    const jsonPath = videoPath.replace(/\.[^.]+$/, ".json");
    const response = await fetch(jsonPath);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch subtitles", error);
    return [];
  }
};
