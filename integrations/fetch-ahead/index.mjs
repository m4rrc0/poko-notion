// import type { AstroConfig, AstroIntegration } from 'astro';
// import { fileURLToPath } from "url";
// import { createRequire } from "module";
// import path from "path";
// const resolve = createRequire(import.meta.url).resolve;

export default function createPlugin() {
  let config;
  // const partytownEntrypoint = resolve('@builder.io/partytown/package.json');
  // const partytownLibDirectory = path.resolve(partytownEntrypoint, '../lib');
  return {
    name: "fetch-ahead",
    hooks: {
      // 'astro:config:setup': ({ config: _config, command, injectScript }) => {
      // 	partytownSnippetHtml = partytownSnippet({ debug: command === 'dev' });
      // 	injectScript('head-inline', partytownSnippetHtml);
      // },
      // "astro:config:setup": ({ updateConfig }) => {
      //   console.log("----------ASTRO-----------", import.meta);
      //   updateConfig({
      //     data: { yolo: "california" },
      //   });
      // },
      "astro:config:done": async ({ config: _config }) => {
        config = _config;
        const { default: fetchAhead } = await import(
          `${process.cwd()}/src/fetch-ahead/index.mjs`
        );
        // console.log(fetchAhead);
        const data = await fetchAhead(config);
        process.env.FETCH_AHEAD_DATA = JSON.stringify(data);
      },
      // 'astro:server:setup': ({ server }) => {
      // 	server.middlewares.use(
      // 		sirv(partytownLibDirectory, {
      // 			mount: '/~partytown',
      // 			dev: true,
      // 			etag: true,
      // 			extensions: [],
      // 		})
      // 	);
      // },
      // 'astro:build:done': async ({ dir }) => {
      // 	await copyLibFiles(fileURLToPath(new URL('~partytown', dir)), {
      // 		debugDir: false,
      // 	});
      // },
    },
  };
}
