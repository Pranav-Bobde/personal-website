import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

const blogsDirectory = path.resolve("../../content/blogs");
const isHiddenBlogPost = (fileName: string) => {
  const fileContent = fs.readFileSync(path.join(blogsDirectory, fileName), "utf8");

  return /^hidden:\s*true\s*$/m.test(fileContent);
};

const blogPages = fs.existsSync(blogsDirectory)
  ? fs
      .readdirSync(blogsDirectory)
      .filter((fileName) => fileName.endsWith(".md"))
      .filter((fileName) => !isHiddenBlogPost(fileName))
      .map((fileName) => ({ path: `/blogs/${fileName.replace(/\.md$/, "")}` }))
  : [];

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      pages: [{ path: "/" }, { path: "/blogs" }, ...blogPages],
      prerender: {
        enabled: true,
        failOnError: true,
      },
    }),
    nitro(),
    viteReact(),
  ],
});
