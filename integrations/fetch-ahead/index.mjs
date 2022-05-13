import { existsSync, promises as fs } from "fs";

export default function createPlugin() {
  let config;

  return {
    name: "fetch-ahead",
    hooks: {
      "astro:config:done": async ({ config: _config }) => {
        config = _config;
        const { default: fetchAhead } = await import(
          `${process.cwd()}/src/fetch-ahead/index.mjs`
        );

        const data = await fetchAhead(config);

        if (!data) return null;

        const filePath = "src/_data/poko.json";
        const dir = filePath.split("/").slice(0, -1).join("/");
        const systemDir = `${process.cwd()}/${dir}`;
        const systemPath = `${process.cwd()}/${filePath}`;

        if (!existsSync(systemDir)) {
          await fs.mkdir(systemDir);
        } else if (existsSync(systemPath)) {
          await fs.rm(systemPath);
        }
        await fs.writeFile(systemPath, JSON.stringify(poko));
      },
    },
  };
}
