import { env } from "@oreno-website.bts-migration/env/web";

import type { BlogPost } from "@/lib/blog-data";

const siteUrl = env.VITE_SITE_URL.replace(/\/$/, "");

function absoluteUrl(pathname: string) {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${siteUrl}${normalizedPathname === "/" ? "" : normalizedPathname}`;
}

interface PageSeoInput {
  title: string;
  description: string;
  pathname: string;
  type: "website" | "article";
}

function pageSeo({ title, description, pathname, type }: PageSeoInput) {
  const url = absoluteUrl(pathname);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function homePageSeo() {
  return pageSeo({
    title: "Pranav Bobde - Personal Website",
    description:
      "Personal website of Pranav Bobde, featuring engineering notes, links, and writing.",
    pathname: "/",
    type: "website",
  });
}

export function blogIndexPageSeo() {
  return pageSeo({
    title: "Engineering Blog - Pranav Bobde",
    description: "Engineering notes and practical technical writing by Pranav Bobde.",
    pathname: "/blogs",
    type: "website",
  });
}

export function blogPostPageSeo(post: BlogPost) {
  const title = `${post.title} - Pranav Bobde`;
  const description = post.summary;
  const seo = pageSeo({
    title,
    description,
    pathname: `/blogs/${post.id}`,
    type: "article",
  });

  return {
    meta: [
      ...seo.meta,
      { property: "article:published_time", content: post.date },
      ...post.tags.map((tag) => ({
        name: `article:tag:${tag}`,
        property: "article:tag",
        content: tag,
      })),
      { name: "keywords", content: post.tags.join(", ") },
    ],
    links: seo.links,
  };
}
