import type { NextConfig } from "next";

// STATIC_EXPORT=1 (see scripts/export.sh) produces a server-less build for a
// free static host; BASE_PATH covers GitHub Pages' /<repo>/ prefix.
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.BASE_PATH || "";

const config: NextConfig = {
  serverExternalPackages: ["pg"],
  ...(isStatic
    ? { output: "export" as const, basePath, images: { unoptimized: true } }
    : {}),
};

export default config;
