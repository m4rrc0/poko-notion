import deepmerge from "deepmerge";
export { notionHelpers } from "./notionHelpers.mjs";

export function slugify(string) {
  const a =
    "àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìıİłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;";
  const b =
    "aaaaaaaaaacccddeeeeeeeegghiiiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------";
  const p = new RegExp(a.split("").join("|"), "g");

  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export const slugifyPath = (codeName) => {
  if (!codeName) return { slug: undefined, path: undefined };

  const pathAsArray = codeName
    .split("/") // keep '/' in the names of the pages
    .map(slugify) // slugify (and remove leading and trailing spaces, etc)
    .filter((el) => el !== ""); // remove leading and trailing '/' (and empty path sections between 2 '/')

  const slug = pathAsArray[pathAsArray.length - 1];
  const path = pathAsArray.join("/");

  if (path === "index") return { slug: "", path: "" };

  return { slug, path };
};

export const parseFileUrl = (url) => {
  if (typeof url !== "string") return { filename: null, extension: null };

  const parts = url.split("/");
  const last = parts[parts.length - 1];
  const filename = last.split("?")[0];
  const filenameSplit = filename.split(".");
  const extension = "." + filenameSplit[filenameSplit.length - 1];

  return { filename, extension };
};

export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export const deepMergeProps = (elements = []) => {
  const [settingsProps, ...parentsProps] = elements;
  const selfProps =
    parentsProps.length > 1
      ? parentsProps[parentsProps.length - 1]
      : { ...settingsProps };

  const {
    metadata: allMetadata,
    raw: allRaw,
    title: allTitle,
    components,
    ...allMerged
  } = deepmerge.all(elements);

  // Scan for possible components among exports and merge on the 'components' prop later
  const possibleComponents = Object.entries(allMerged).reduce(
    (prev, [key, val]) => {
      const next = (typeof val).match(/function|string/) ? { [key]: val } : {};
      return { ...prev, ...next };
    },
    {}
  );

  const metadata = deepmerge(
    settingsProps.metadata || {},
    selfProps.metadata || {}
  );

  return {
    ...allMerged,
    components: {
      ...components,
      ...possibleComponents,
    },
    raw: selfProps.raw,
    title: selfProps.title,
    metadata,
    self: selfProps,
  };

  //   const parentsExports =
  //   ancestors.map((a) => a.data?.MDXExportsSelf).filter((z) => z) || [];
  // const exportsCascade = [...parentsExports, node.data?.MDXExportsSelf];
  // const exports = deepmerge.all(exportsCascade);

  //

  // const settingsMDX = await toMdx(_settings.data.md)
  // const settings = { ..._settings, data: { ..._settings.data, ...settingsMDX} }
  // const pages = await Promise.all(_pages.map(async p => {
  //   const { MDXContent, exports: pageExports } = await toMdx(p.data.md)
  //   const pageProps = {...p.data?.props, ...pageExports}
  //   // Don't do this map if you want only the exports of the curent page (not inherit from parent pages and settings)
  //   const parentsProps = await Promise.all(p?.parents?.map(async parent => {
  //     const { exports } = await toMdx(parent.data.md)
  //     const parentProps = {...parent.data?.props, ...exports}
  //     return parentProps
  //   })) || []
  //   const propsCascade = [...parentsProps, pageProps]
  //   const props = deepmerge.all(propsCascade)
  //   return { ...p, MDXContent, ...props }
  // }))
};
