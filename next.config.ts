import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        source: "/lottie/:decorativeGif*.gif",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/sitemap-tours-:chunk.xml", destination: "/sitemap-tours/:chunk" },
    ];
  },
  async redirects() {
    return [
      { source: "/es/tour/a%D9%90swan-to-abu-simbel-private-transfer", destination: "/es/tour/private-tour-to-abu-simbel-from-aswan", statusCode: 301 },
      { source: "/zh/tour/a%D9%90swan-to-abu-simbel-private-transfer/", destination: "/zh/rent-car", statusCode: 301 },
      { source: "/blog/Bazar%20Khan%20El%20Khalili%20del%20Cairo%20%7C%20Tour%20delle%20Piramidi%20del%20Sole", destination: "/blog/khan-el-khalili-bazaar", statusCode: 301 },
      { source: "/fr/blog/Bazar%20Khan%20El%20Khalili%20del%20Cairo%20%7C%20Tour%20delle%20Piramidi%20del%20Sole", destination: "/fr/blog/khan-el-khalili-bazaar", statusCode: 301 },
      { source: "/de/blog/Bazar%20Khan%20El%20Khalili%20del%20Cairo%20%7C%20Tour%20delle%20Piramidi%20del%20Sole", destination: "/de/blog/khan-el-khalili-bazaar", statusCode: 301 },
      { source: "/it/blog/Bazar%20Khan%20El%20Khalili%20del%20Cairo%20%7C%20Tour%20delle%20Piramidi%20del%20Sole", destination: "/it/blog/khan-el-khalili-bazaar", statusCode: 301 },
      { source: "/pt/blog/Bazar%20Khan%20El%20Khalili%20del%20Cairo%20%7C%20Tour%20delle%20Piramidi%20del%20Sole", destination: "/pt/blog/khan-el-khalili-bazaar", statusCode: 301 },
      { source: "/es/blog/Bazar%20Khan%20El%20Khalili%20del%20Cairo%20%7C%20Tour%20delle%20Piramidi%20del%20Sole", destination: "/es/blog/khan-el-khalili-bazaar", statusCode: 301 },
      { source: "/zh/blog/Bazar%20Khan%20El%20Khalili%20del%20Cairo%20%7C%20Tour%20delle%20Piramidi%20del%20Sole", destination: "/zh/blog/khan-el-khalili-bazaar", statusCode: 301 },
      { source: "/fr/tour/cairo's-islamic-gems-citadel-alabaster-mosque-art-museum", destination: "/fr/blog/salah-el-din-citadel", statusCode: 301 },
      { source: "/zh/blog/Bazar%20Khan%20El%20Khalili%20del%20Cairo%20%7C%20Tour%20%20delle%20Piramidi%20del%20Sole", destination: "/zh/blog/khan-el-khalili-bazaar", statusCode: 301 },
      { source: "/zh/tour/cairo's-islamic-gems-citadel-alabaster-mosque-art-museum", destination: "/zh/blog/salah-el-din-citadel", statusCode: 301 },
      { source: "/blog/Bazar%20Khan%20El%20Khalili%20du%20Caire%20%7C%20Visites%20%20des%20pyramides%20du%20soleil", destination: "/blog/khan-el-khalili-bazaar", statusCode: 301 },
      { source: "/tour/2-day-cairo-adventure-tours", destination: "/tour/2-day-white-desert-bahariya-fayoum-tour-from-cairo", statusCode: 301 },
      { source: "/fr/tour/2-day-cairo-adventure-tours", destination: "/fr/tour/2-day-white-desert-bahariya-fayoum-tour-from-cairo", statusCode: 301 },
      { source: "/de/tour/2-day-cairo-adventure-tours", destination: "/de/tour/2-day-white-desert-bahariya-fayoum-tour-from-cairo", statusCode: 301 },
      { source: "/it/tour/2-day-cairo-adventure-tours", destination: "/it/tour/2-day-white-desert-bahariya-fayoum-tour-from-cairo", statusCode: 301 },
      { source: "/pt/tour/2-day-cairo-adventure-tours", destination: "/pt/tour/2-day-white-desert-bahariya-fayoum-tour-from-cairo", statusCode: 301 },
      { source: "/es/tour/2-day-cairo-adventure-tours", destination: "/es/tour/2-day-white-desert-bahariya-fayoum-tour-from-cairo", statusCode: 301 },
      { source: "/zh/tour/2-day-cairo-adventure-tours", destination: "/zh/tour/2-day-white-desert-bahariya-fayoum-tour-from-cairo", statusCode: 301 },
    ];
  },
  images: {
    // Verified bug repair (get-img-props.js forces unoptimized=true when
    // config.unoptimized is true, disabling all custom loaders): use a global
    // custom loader backed by the existing /media/image service instead of
    // Vercel's billed /_next/image (prior deployment returned 402). Remote
    // hosts below are unchanged; no redirects/routes/cache flags modified.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sunpyramidtours.com",
      },
      {
        protocol: "https",
        hostname: "sunpyramidstours.com",
      },
      {
        protocol: "https",
        hostname: "new-sunpyramids-demo.vercel.app",
      },
      {
        protocol: "https",
        hostname: "pub-5ccb6ad334fb427684d7f3fa11a34197.r2.dev",
      },
    ],
  },
};

export default nextConfig;
