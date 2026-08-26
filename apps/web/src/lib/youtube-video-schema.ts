import { z } from "zod";

const nonblankString = z.string().refine((value) => value.trim().length > 0, {
  message: "Must not be blank",
});

export const generatedYoutubeVideosSchema = z.array(
  z
    .object({
      id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
      title: nonblankString,
      summary: nonblankString,
      publishedAt: z.iso.datetime({ offset: true }),
      duration: z.string().regex(/^\d+:[0-5]\d(?::[0-5]\d)?$/),
      thumbnail: z
        .string()
        .regex(/^\/video-previews\/youtube\/[A-Za-z0-9_-]{11}-[a-f0-9]{12}\.jpg$/),
      companionBlogId: z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .optional(),
    })
    .strict()
    .superRefine((video, context) => {
      if (!video.thumbnail.startsWith(`/video-previews/youtube/${video.id}-`)) {
        context.addIssue({
          code: "custom",
          path: ["thumbnail"],
          message: "Thumbnail filename must contain its YouTube video ID",
        });
      }
    }),
);
