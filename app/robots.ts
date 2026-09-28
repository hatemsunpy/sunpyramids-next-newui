import type { MetadataRoute } from "next";
import { FRONTEND_ORIGIN } from "@/lib/seo";

const disallowedPaths = [
  "/api/",
  "/admin/",
  "/dashboard/",
  "/cart/checkout",
  "/*?wmc-currency=",
  "/*?currency=",
  "/*?car_",
  "/*?wordfence_lh",
];

const allowedCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "meta-externalagent",
  "Bytespider",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: disallowedPaths },
      ...allowedCrawlers.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: disallowedPaths,
      })),
    ],
    sitemap: `${FRONTEND_ORIGIN}/sitemap.xml`,
  };
}
