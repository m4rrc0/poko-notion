// Full Astro Configuration API Documentation:
// https://astro.build/config
import { defineConfig } from "astro/config";
// import sitemap from '@astrojs/sitemap'
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
// import mdx from "@mdx-js/rollup";
// import react from "@astrojs/react";
import preact from "@astrojs/preact";
// import solid from "@astrojs/solid-js";
import fetchAhead from "@m4rrc0/astro-fetch-ahead";

// @type-check enabled!
// VSCode and other TypeScript-enabled text editors will provide auto-completion,
// helpful tooltips, and warnings if your exported object is invalid.
// You can disable this by removing "@ts-check" and `@type` comments below.

console.log(process.env);
// @ts-check
export default defineConfig({
  site: "https://www.poko.page/",
  // markdown: { mode: 'mdx' },
  integrations: [
    // react(),
    preact(),
    // solid(),
    fetchAhead(),
  ],
  vite: {
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
