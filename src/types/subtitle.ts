import { AnimationType } from "./animation";

export type Subtitle = {
  text: string;
  startInMs: number;
  endInMs: number;
  x?: number;
  y?: number;
  color?: string;
  fontSize?: number;
  strokeColor?: string;
  fontFamily?: string;
  animation?: AnimationType;
  presetId?: string;
  layoutId?: string;
};
