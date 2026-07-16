import type { VideoStage } from "@/lib/video-preview-data";
import { stageLabels } from "@/lib/video-preview-data";

const stageMarks: Record<VideoStage, { glyph: string; className: string }> = {
  published: { glyph: "●", className: "text-accent" },
  editing: { glyph: "◐", className: "text-foreground" },
  scripted: { glyph: "○", className: "text-muted-foreground" },
};

/** Shows stage as glyph plus label, so it never depends on color alone. */
export function StageMark({ stage }: { stage: VideoStage }) {
  const mark = stageMarks[stage];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={mark.className} aria-hidden="true">
        {mark.glyph}
      </span>
      <span>{stageLabels[stage]}</span>
    </span>
  );
}
