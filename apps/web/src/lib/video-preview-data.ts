export type VideoStage = "published" | "editing" | "scripted";

export const stageLabels: Record<VideoStage, string> = {
  published: "live",
  editing: "editing",
  scripted: "scripted",
};
