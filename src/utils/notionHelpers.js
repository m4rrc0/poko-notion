// import { store } from "@services/notion.js";

export const notionHelpers = {
  convertHref: (href, leadingSlash = true, pathsMap) => {
    // TODO: find a better way to persist store between different phases of the build

    // const paths = pathsMap || store.get("paths");
    const paths = JSON.parse(process.env.POKO_PATHS);

    const pageMatch = paths.find((pathObj) => {
      return pathObj.notionPath === href || pathObj.notionFullPath === href;
    });
    const path = pageMatch?.path;

    return typeof path !== "undefined"
      ? `${leadingSlash ? "/" : ""}${path}`
      : href;
  },
};
