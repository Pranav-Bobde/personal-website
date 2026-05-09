import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getBlogPost, getBlogPosts } from "@/lib/blog-data";

const blogIdSchema = z.object({
  id: z.string().min(1),
});

export const listBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  return getBlogPosts();
});

export const fetchBlogPost = createServerFn({ method: "GET" })
  .inputValidator(blogIdSchema)
  .handler(async ({ data }) => {
    return getBlogPost(data.id) ?? null;
  });
