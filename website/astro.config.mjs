// Full Astro Configuration API Documentation:
// https://astro.build/config
import { defineConfig } from "astro/config";
import "dotenv/config";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
// import mdx from "@mdx-js/rollup";
import preact from "@astrojs/preact";
import { astroImageTools } from "astro-imagetools";
import fetchAhead from "@m4rrc0/astro-fetch-ahead";

// @type-check enabled!
// VSCode and other TypeScript-enabled text editors will provide auto-completion,
// helpful tooltips, and warnings if your exported object is invalid.
// You can disable this by removing "@ts-check" and `@type` comments below.

const site = process.env.SITE;

// @ts-check
export default defineConfig({
  experimental: {
    integrations: true,
  },
  ...(site ? { site } : {}),
  integrations: [
    ...(site ? [sitemap(), robotsTxt()] : []),
    preact(),
    fetchAhead(),
    astroImageTools,
  ],
  vite: {
    // assetsInclude: ["**/*.png"],
    // NOTE: necessary for astro-icon apparently (https://github.com/natemoo-re/astro-icon)
    // ssr: {
    //   external: ['svgo'],
    // },
    plugins: [
      viteCommonjs(),
      // mdx(/* jsxImportSource: …, otherOptions… */)
    ],
  },
});
