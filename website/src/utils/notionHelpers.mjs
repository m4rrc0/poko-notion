// import { store } from "@services/notion.js";

export const notionHelpers = {
  convertHref: (href, poko, leadingSlash = true) => {
    const { paths } = poko;
    const pageMatch = paths.find((pathObj) => {
      return pathObj.notionPath === href || pathObj.notionFullPath === href;
    });
    const path = pageMatch?.path;

    return typeof path !== "undefined"
      ? `${leadingSlash ? "/" : ""}${path}`
      : href;
  },
};
