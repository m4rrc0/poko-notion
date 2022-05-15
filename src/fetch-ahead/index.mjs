import { existsSync, promises as fs } from "fs";
import "dotenv/config";
import { unified } from "unified";
import { u } from "unist-builder";
import { visitParents, SKIP, CONTINUE, EXIT } from "unist-util-visit-parents";
import { map as mapAST } from "unist-util-map";
import { is } from "unist-util-is";
// import { filter as filterAST } from "unist-util-filter";
import deepmerge from "deepmerge";
import {
  rootId,
  filesInfo,
  transformRawPage,
  transformRichTextToPlainText,
  transformProp,
  // notionBlockToMd,
  treeToMd,
  toMdx,
  downloadFile,
  extractZip,
  getNotionPage,
  getAllNotionPages,
  getBlockChildrenRecursively,
  populateChildPageOfBlock,
} from "../services/notion.mjs";
import { slugifyPath, parseFileUrl, escapeRegExp } from "../utils/index.mjs";

const dirUserAssets = "user-assets";

export default async function (astroConfig) {
  // [ ] fetch notion pages
  // [ ] create clean tree
  //   [ ] Find root page
  //   [ ] Fetch all blocks recursively
  // [ ] replace all notion paths to local paths in place
  // 	[ ] files, images, pages (? blocks)
  // 	[ ] add a custom attribute next to the path for the original notion path
  // 		[ ] for files and images: next to
  // 		[ ] for pages, at the root of properties
  // [ ] create a map of all the modified paths (pages, images, files)
  // [ ] dowload all files according to the map

  let allFiles = [];
  let allPaths = [];
  let rootID = rootId();
  let root;

  const _allRawPages = await getAllNotionPages();

  // TODO: skip everything if the content hasn't changes
  // [ ] check if data json and .cache exists, if not, go ahead
  // [ ] get some hash from content and compare to hash in .cache. if different, go ahead.
  // [ ] NOTE: we don't fetch blocks at this step so make sure that the "last_edited_time" of pages reflect changes in blocks
  // [ ] write new hash in cache then go ahead
  // [ ] NOTE: I could have an option to skip the build entirely ("throw" for ex) on prod and/or dev (to avoid triggering build on hosting platforms)
  // [ ] If we do all that, we could even have a separate process that fetches data regularly to update the view on dev (contentlayer style)

  let allRawPages = _allRawPages.map(transformRawPage).filter((z) => z); // computed values: _title, _codeName, _titlePropName, _parentId
  allRawPages = await Promise.all(
    allRawPages.map(async (p) => {
      // We don't provide 'allRawPages' so that link_to_page & child_page blocks are not populated
      const _c = await getBlockChildrenRecursively(p);
      const _md = treeToMd(_c);
      const { exports: _MDXExportsSelf } = await toMdx(_md);

      return {
        ...p,
        children: _c,
        _md,
        _MDXExportsSelf,
      };
    })
  );

  // Find root of website
  root = allRawPages.find((p) =>
    typeof rootID === "string"
      ? p.id.replace(/-/g, "") === rootID.replace(/-/g, "")
      : p?.parent?.type === "workspace"
  );
  // console.log(allRawPages, root);
  rootID = root.id;

  const notionTree = u("root", root, root.children);

  // Insert pages into the raw tree
  visitParents(notionTree, (node, ancestors) => {
    if (!Array.isArray(node.children)) return node;

    const children = node.children.map((_c) => {
      const subChildren = populateChildPageOfBlock(_c, allRawPages);
      let c = _c;
      if (subChildren) c.children = subChildren;

      return c;
    });

    node.children = children;

    // return { ...node, children };
  });

  // Try to generate md for every block
  visitParents(
    notionTree,
    (node) => node.object === "block",
    (node, ancestors) => {
      try {
        const _md = treeToMd(node.children);
        // console.log(
        //   `---------md successful on ${node.object} ${node._codeName}`
        // );
        node._md = _md;
      } catch (error) {
        // console.log(
        //   `!!!!!!!!!md impossible on ${node.object} ${node._codeName} of type ${node.type}`
        // );
        // console.error(error);
        // console.log(node.children);
      }
    }
  );

  // Transform raw Notion tree to more proper unist tree
  const tree = mapAST(notionTree, function (_node, index, OriginalParent) {
    // console.log(_node);
    const { children, ...raw } = _node;

    let type, role;

    if (raw.type === "root") {
      type = "root";
      role = "settings";
    } else if (raw.object === "page") {
      type = "page";
      role = "page";
    } else if (raw.object === "database") {
      type = "page";
      role = "collection";
    } else if (raw.object === "block") {
      type = "block";
      role = rawTypes[raw.type];
    } else {
      console.warn(`WARNING: node ${raw} does not have a recognizable type`);
    }

    const {
      // _titlePropName: titlePropName,
      // _title: title,
      _codeName: codeName,
      _md: md,
      _inlineMd: inlineMd,
      _MDXExportsSelf: MDXExportsSelf,
    } = raw;

    // Slug and Path
    const { slug, path } =
      role === "settings" ? { slug: null, path: null } : slugifyPath(codeName);

    // const inline = transformRichText(raw[raw.type]?.rich_text);
    const { rich_text: inline, ...inlineProps } = raw[raw.type] || {};
    const inlinePlainText = transformRichTextToPlainText(inline);
    // const inline = inlineProps?.rich_text;

    // console.log(type, codeName, path);

    const node = {
      type,
      data: {
        id: raw.id,
        // parentPageId,
        status: raw.archived ? "archived" : "published",
        raw,
        role,
        codeName,
        slug,
        path,
        inlineProps,
        inline,
        inlinePlainText,
        // props: { raw: raw._props },
        props: { raw: raw.properties },
        inlineMd,
        md,
        MDXExportsSelf,
      },
    };

    return node;
  });

  // MAIN TRAVERSAL
  visitParents(tree, (node, ancestors) => {
    const { raw, props } = node.data;

    // console.log(node.data.raw.type, " || ", node.data.role);
    // SETTINGS
    if (node.type === "root") {
      const globalStylesBlock = node.children.find((c) => {
        return c.data.role === "code" && c.data.inlineProps.language === "css";
      });
      node.data.globalStylesString = globalStylesBlock.data.inlinePlainText;

      const headBlock = node.children.find((c) => {
        return c.data.role === "code" && c.data.inlineProps.language === "html";
      });
      node.data.headString = headBlock.data.inlinePlainText;
    }

    // PAGES
    if (node.type === "page") {
      //
      // Construct path from ancestors
      //
      for (let i = ancestors.length - 1; i >= 0; i--) {
        const a = ancestors[i];
        if (a.type === "page") {
          node.data.path = [a.data.path, node.data.path].join("/");
          // nodes are visited from parent to children so only the first parent page is necessary
          i = -1;
        }
      }
      const pageId = node.data.id.replace(/-/g, "");
      const pathMap = {
        pageId,
        pageIdHyphen: node.data.id,
        notionPath: `/${pageId}`,
        notionHyphenPath: `/${node.data.id}`,
        notionFullPath: `https://www.notion.so/${pageId}`,
        path: node.data.path,
      };
      allPaths.push(pathMap);
      //
      // merge exports from parents to current page
      //
      const parentsExports =
        ancestors.map((a) => a.data?.MDXExportsSelf).filter((z) => z) || [];
      const exportsCascade = [...parentsExports, node.data?.MDXExportsSelf];
      const exports = deepmerge.all(exportsCascade);
      node.data.MDXExports = exports;
    }

    // --- Handle files --- //
    const { featuredImage, cover, icon, image, file } = filesInfo(node);

    // console.log({ featuredImage, cover, icon, image, file });
    // also replace url in the raw notion data to be able to use n2m
    if (featuredImage) {
      node.data.raw.icon[raw.icon.type].url = featuredImage.url;
    }
    if (cover) node.data.raw.cover[raw.cover.type].url = cover.url;
    if (icon) node.data.raw.callout.icon[raw.callout.icon.type].url = icon.url;
    if (image) node.data.raw.image[raw.image.type].url = image.url;
    if (file) node.data.raw.file[raw.file.type].url = file.url;

    node.data.files = node.data.files || [];
    Object.entries({ featuredImage, cover, icon, image, file }).forEach(
      ([key, fileObject]) => {
        if (fileObject) {
          // allFiles = [...allFiles, fileObject]; // push files in an array to download everything at once after
          node.data[key] = fileObject; // assign data like: node.data.cover = cover;
          node.data.files.push(fileObject);
          allFiles.push(fileObject);

          // Also replace links in md
          const localPath = fileObject.url;
          const re = new RegExp(escapeRegExp(fileObject.originalUrl), "g");

          if (typeof node.data.md === "string") {
            node.data.md = node.data.md.replace(re, localPath);
          }
          if (typeof node.data.inlineMd === "string") {
            node.data.inlineMd = node.data.inlineMd.replace(re, localPath);
          }

          // console.log(node.data.md);
          // console.log(node.data.inlineMd);
        }
      }
    );
    // --- //

    // pages and DBs and Callouts have icon emojis
    const emoji = raw.icon?.emoji || raw[raw.type]?.icon?.emoji;
    node.data.emoji = emoji;

    // Transform props. We keep a copy of the raw props on a prop called 'raw'
    const propsArrayOfObjects =
      (props.raw &&
        Object.entries(props.raw).map(([key, val]) => {
          const prop = transformProp([key, val], node);
          if (val.type === "files" && Array.isArray(prop.files)) {
            node.data.files.push(...prop.files);
            allFiles.push(...prop.files);
          }
          return prop;
        })) ||
      [];

    node.data.props = deepmerge.all([
      ...propsArrayOfObjects,
      node.data.MDXExports || {},
    ]);

    // if (is(node, { role: "callout" })) {}

    // if (is(node, (node) => node.data.role === "image")) {
    // if (node.data.role === "img") {
    // if (is(node, "page")) {
    //   // console.log(props);
    // }
  });

  // TODO: improve this. For example create a map of the downloads and the last modified date
  await Promise.all(
    allFiles.map(async (f) => {
      await downloadFile(f);
      if (f.extension === ".zip") {
        await extractZip(f);
      }
    })
  );

  // Pages tree
  // const pagesTree = filterAST(
  //   tree,
  //   { cascade: false },
  //   // (node) => node.type === "page"
  //   "page"
  // );

  // Replace URLs
  visitParents(
    tree,
    (node) => node.type === "block" && node.data.inline?.length,
    (node, ancestors) => {
      // INLINE BLOCKS: Replace notion links with local paths
      node.data.inline.forEach((il, i) => {
        if (il.href) {
          const pathMatch = allPaths.find((pathObj) => {
            return (
              pathObj.notionPath === il.href ||
              pathObj.notionHyphenPath === il.href ||
              pathObj.notionFullPath === il.href
            );
          });
          if (pathMatch) {
            const localPath = `/${pathMatch.path}`;
            // const re = new RegExp(escapeRegExp(il.href), "g");

            node.data.inline[i].href = localPath;
            if (il.text?.link?.url) {
              node.data.inline[i].text.link.url = localPath;
            }
            // TODO: May work to replace also in md and inlineMd but things to consider...
            // if (node.data.md) {
            //   console.log(node.data.md.match(re));
            //   node.data.md = node.data.md.replaceAll(re, localPath);
            // }
            // if (node.data.inlineMd) {
            //   console.log(node.data.inlineMd.match(re));
            //   node.data.inlineMd = node.data.inlineMd.replaceAll(re, localPath);
            // }
            // // console.log(node.data.md);
            // // console.log(node.data.inlineMd);

            // ancestors.forEach((n, i) => {
            //   if (n.data.md) {
            //     console.log(n.data.md.match(re));
            //     ancestors[i].data.md = ancestors[i].data.md.replaceAll(
            //       re,
            //       localPath
            //     );
            //   }
            //   if (n.data.inlineMd) {
            //     console.log(n.data.inlineMd.match(re));
            //     ancestors[i].data.inlineMd = ancestors[
            //       i
            //     ].data.inlineMd.replaceAll(re, localPath);
            //   }
            //   console.log(ancestors[i].data.md);
            //   console.log(ancestors[i].data.inlineMd);
            // });
          }
        }
      });
    }
  );

  // Replace notion links (files and notion page links) in markdown
  visitParents(
    tree,
    (node) => node.data.md || node.data.raw._mayHaveNotionLink,
    (node) => {
      const { md, inlineMd } = node.data;
      const _mayHaveNotionLink = node.data.raw._mayHaveNotionLink;

      allFiles.forEach((fileObject) => {
        const { originalUrl, url } = fileObject;
        const re = new RegExp(escapeRegExp(originalUrl), "g");

        if (md) node.data.md = node.data.md.replaceAll(re, url);
        if (inlineMd && _mayHaveNotionLink)
          node.data.inlineMd = node.data.inlineMd.replaceAll(re, url);
      });

      allPaths.forEach((pathMap) => {
        const { notionPath, notionHyphenPath, notionFullPath, path } = pathMap;
        // Important to put 'notionFullPath' first because the others will match and we'll end up with a semi replaced content
        const originals = [notionFullPath, notionPath, notionHyphenPath];

        originals.forEach((originalPath, i) => {
          const newPath = `/${path}`;
          const re = new RegExp(escapeRegExp(originalPath), "g");

          if (md) node.data.md = node.data.md.replaceAll(re, newPath);
          if (inlineMd && _mayHaveNotionLink)
            node.data.inlineMd = node.data.inlineMd.replaceAll(re, newPath);
        });
      });

      // console.log({
      //   // _mayHaveNotionLink,
      //   md: node.data.md,
      //   // inlineMd: node.data.inlineMd,
      // });
    }
  );

  let pages = [];
  let settings;
  visitParents(tree, ["root", "page"], (node, ancestors) => {
    if (node.type === "page") {
      const parents = ancestors
        .filter((a) => a.type === "page" || a.type === "root")
        .map(({ children, ...parent }) => parent);
      const page = { ...node, parents };
      pages.push(page);
    } else settings = node;
  });

  // console.log(pagesTree);

  // visitParents(tree, (node, ancestors) => {
  //   console.log(node.type, node.data.role);
  // });

  // console.dir(pagesTree, { depth: null });

  const poko = {
    settings,
    pages,
    files: allFiles,
    paths: allPaths,
    websiteTree: tree,
  };

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

  // throw "Auto Exit";

  return;
}

// const nodeTransforms = [
//   // { is: [node, test, index, parent], func: (node, ancestors, tree) => { doSomething(node) } }
//   { is: true, func: (node, ancestors, tree) => { node = { type: node.type, _: node }; } }
// ]

// async function transformNodes(_tree, transforms = []) {
//   let tree = _tree
//   visitParents(tree, (node, ancestors) => {
//     transforms.forEach(t => {
//       if (t?.is === true || is(...t?.is)) {
//         t?.func(node, ancestors, tree)
//       }
//     })
//     // console.log(node);
//   });

//   return tree
// }

// const fs = require('fs');
// const markdown = require('remark-parse');
// const remark2rehype = require('remark-rehype');
// const html = require('rehype-stringify');
// const imgToFigure = require('./img-to-figure');

// const contents = unified()
//   .use(markdown)
//   .use(remark2rehype)
//   .use(imgToFigure)
//   .processSync(fs.readFileSync('corgi.md'))
//   .toString();

const rawTypes = {
  paragraph: "p",
  heading_1: "h1",
  heading_2: "h2",
  heading_3: "h3",
  bulleted_list_item: "ul",
  numbered_list_item: "ol",
  code: "code",
  to_do: "todo",
  toggle: "toggle",
  child_page: "page",
  child_database: "collection",
  embed: "embed",
  image: "img",
  video: "video",
  file: "file",
  pdf: "pdf",
  bookmark: "bookmark",
  callout: "callout",
  quote: "blockquote",
  equation: "equation",
  divider: "hr",
  table_of_contents: "toc",
  column_list: "columns",
  column: "column",
  link_preview: "a",
  synced_block: "skip",
  template: "none",
  link_to_page: "link",
  table: "table",
  table_row: "tr",
  // "cell": "td", // not that way in API but makes little sense to me to not have cells as children
  unsupported: "none",
};
