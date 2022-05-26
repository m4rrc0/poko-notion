import { existsSync, promises as fs } from "fs";
import { copy } from "fs-extra";
import "dotenv/config";
import _get from "lodash.get";
import hash from "object-hash";
import { unified } from "unified";
import { u } from "unist-builder";
import { visitParents, SKIP, CONTINUE, EXIT } from "unist-util-visit-parents";
import { map as mapAST } from "unist-util-map";
import { is } from "unist-util-is";
// import { filter as filterAST } from "unist-util-filter";
import deepmerge from "deepmerge";
import probeImageSize from "probe-image-size";
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
import {
  slugifyPath,
  parseFileUrl,
  escapeRegExp,
  deepMergePropsSelf,
  deepMergePropsAllPages,
} from "../utils/index.mjs";

const dirUserAssets = "user-assets";
const fileData = "poko.json";
const fileHash = ".hash";
const projectDirPublic = "public";

const projectDirData = "src/_data";
const projectFileData = `${projectDirData}/${fileData}`;
const systemDirData = `${process.cwd()}/${projectDirData}`;
const systemFileData = `${process.cwd()}/${projectFileData}`;

const projectDirHash = projectDirData;
const projectFileHash = `${projectDirData}/${fileHash}`;
const systemDirHash = `${process.cwd()}/${projectDirHash}`;
const systemFileHash = `${process.cwd()}/${projectFileHash}`;

const projectDirUserAssets1 = `${projectDirPublic}/${dirUserAssets}`;
const projectDirUserAssets2 = `${projectDirData}/${dirUserAssets}`;
const systemDirUserAssets1 = `${process.cwd()}/${projectDirUserAssets1}`;
const systemDirUserAssets2 = `${process.cwd()}/${projectDirUserAssets2}`;
// const projectFileUserAssets = `${projectDirData}/${fileUserAssets}`;
// const systemFileUserAssets = `${process.cwd()}/${projectFileUserAssets}`;

const param = process.argv[3];
const DEBUG = param === "DEBUG";

const probeFile = async (fileObject) => {
  try {
    const { url: _, ...probe } = await probeImageSize(fileObject.originalUrl);
    // console.log({ probe });
    return { ...fileObject, ...probe };
  } catch (error) {
    // console.error(error);
    return fileObject;
  }
};

const probeHeaders = async (fileObject) => {
  try {
    const _f = await fetch(fileObject.originalUrl);
    const headers = await _f.headers;
    const length = headers.get("content-length");
    const mime = headers.get("content-type");
    const etag = headers.get("etag");
    const _last_modified = headers.get("last-modified");
    const last_modified = new Date(_last_modified).toISOString();
    // console.log({ length, mime, etag, last_modified });

    return { ...fileObject, length, mime, etag, last_modified };
  } catch (error) {
    return fileObject;
  }
};

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

  let pokoPrev = {};
  if (existsSync(systemFileData)) {
    const _pokoPrev = await fs.readFile(systemFileData);
    const pokoPrevString = _pokoPrev.toString();
    pokoPrev = JSON.parse(pokoPrevString);
  }

  const _allRawPages = await getAllNotionPages();

  //
  // SKIP FETCH IF CONTENT HAS NOT CHANGED
  //
  const allLastEditedTimes = _allRawPages.map(
    ({ last_edited_time }) => last_edited_time
  );

  const contentHashPrev = pokoPrev?.cache?.hash;
  const contentHash = hash(allLastEditedTimes);

  if (contentHash === contentHashPrev && !DEBUG) {
    console.log(`\nCONTENT HASN'T CHANGED UNTIL LAST FETCH - SKIPING!\n`);
    return;
  } else {
    console.log(`\nCONTENT HAS CHANGED - PROCESSING...\n`);
  }

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
  });

  // Try to generate md for every block.
  // ?? Is it usefull ??
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
      }
    }
  );

  // Transform raw Notion tree to more proper unist tree
  const tree = mapAST(notionTree, function (_node, index, OriginalParent) {
    const { children, ...raw } = _node;

    let type,
      role,
      files = [];

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
      _MDXExportsSelf,
    } = raw;

    // Slug and Path
    // Currently, path is only the last section, corresponding to the codeName of the page
    const { slug, path } =
      role === "settings" ? { slug: null, path: null } : slugifyPath(codeName);

    // Inline values:
    //   inlineProps is for ex the language of a code block...
    const { rich_text: inline, ...inlineProps } = raw[raw.type] || {};
    const inlinePlainText = transformRichTextToPlainText(inline);

    // Setup Notion page properties as props
    const propsArrayOfObjects =
      (raw.properties &&
        Object.entries(raw.properties).map(([key, val]) => {
          // Transform page properties.
          const prop = transformProp([key, val], role);
          // Save files in our global 'allFiles' array
          if (val.type === "files" && !prop._definition) {
            const commons = {
              last_edited_time: raw.last_edited_time,
              blockId: raw.id,
            };
            const _filesTemp = _get(prop, key, []);
            const filesTemp = _filesTemp.map((f) => ({ ...f, ...commons }));
            files.push(...filesTemp);
            allFiles.push(...filesTemp);
          }
          return prop;
        })) ||
      [];

    // Merge Notion properties with MDXExports for that page (=MDXExportsSelf).
    // Note: MDXExportsSelf contains 'exports' definitions and frontmatter already
    const props = deepMergePropsSelf([
      ...propsArrayOfObjects,
      _MDXExportsSelf || {},
    ]);

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
        // We keep a copy of the raw Notion properties on a prop called 'raw'
        props: { raw: raw.properties, title: codeName, ...props },
        files,
        inlineMd,
        md,
        // MDXExportsSelf,
      },
    };

    return node;
  });

  // MAIN TRAVERSAL
  visitParents(tree, (node, ancestors) => {
    const { raw, props } = node.data;

    if (props) node.data.props = deepMergePropsSelf([props]);

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

    //
    // Record closest parent page
    //
    // let closestParentPage;

    // PAGES
    if (node.type === "page") {
      //
      // Construct path from ancestors -> the closest page is enough since tree is traversed from parent to children and modified in place
      //
      if (node.data.codeName.startsWith("_")) {
        node.data.path = null;
      } else {
        for (let i = ancestors.length - 1; i >= 0; i--) {
          const a = ancestors[i];
          if (
            a.type === "page" &&
            //
            !a.data.codeName.startsWith("_")
          ) {
            // closestParentPage = node;
            node.data.path = [a.data.path, node.data.path]
              .filter((z) => z) // remove empty paths e.g. the 'index' page to avoid leading or double  '/'
              .join("/");
            // nodes are visited from parent to children so only the first parent page (in reverse order) is necessary

            i = -1;
          }
        }
      }

      //
      // merge props from parents to current page
      //
      const parentsProps =
        ancestors.map((a) => a.data?.props).filter((z) => z) || [];

      // take up the title of the parent by default. It is assumed that this is the homepage
      if (node.data.props.title === "index") {
        node.data.props.title = undefined;
      }

      node.data.props = deepMergePropsAllPages([
        ...parentsProps,
        node.data.props,
      ]);

      // Just to avoid confusion with path that has no leading '/'
      node.data.props.href = "/" + node.data.path;

      //
      // Save a MAP of all the pages with the Notion ID, Notion URLs and our local path
      //
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
    }

    // --- Handle files --- //
    const { featuredImage, cover, icon, image, file } = filesInfo(node);

    // also replace url in the raw notion data to be able to use n2m
    // NOTE: not really useful atm bc n2m is used before I think, but might change
    if (featuredImage) {
      node.data.raw.icon[raw.icon.type].url = featuredImage.url;
    }
    if (cover) node.data.raw.cover[raw.cover.type].url = cover.url;
    if (icon) node.data.raw.callout.icon[raw.callout.icon.type].url = icon.url;
    if (image) node.data.raw.image[raw.image.type].url = image.url;
    if (file) node.data.raw.file[raw.file.type].url = file.url;

    // if (node.data.raw?.file?.file?.url === "/user-assets/test.zip") {
    //   console.log(node.data);
    // }

    node.data.files = node.data.files || [];
    Promise.all(
      Object.entries({ featuredImage, cover, icon, image, file }).map(
        async ([key, _fileObject]) => {
          let fileObject = _fileObject;

          // TODO: Seems to be a problem with Notion API retrieving deleted File and Image blocks

          if (fileObject) {
            node.data[key] = fileObject; // assign data like: node.data.cover = cover;
            node.data.files.push(fileObject);
            allFiles.push(fileObject); // push files in an array to download everything at once after

            // Also replace links in md
            const localPath = fileObject.url;
            const re = new RegExp(escapeRegExp(fileObject.originalUrl), "g");

            if (typeof node.data.md === "string") {
              node.data.md = node.data.md.replace(re, localPath);
            }
            if (typeof node.data.inlineMd === "string") {
              node.data.inlineMd = node.data.inlineMd.replace(re, localPath);
            }
          }
        }
      )
    );
    // --- //

    // pages and DBs and Callouts have icon emojis
    const emoji = raw.icon?.emoji || raw[raw.type]?.icon?.emoji;
    node.data.emoji = emoji;
  });

  // Read poko.files
  // const dirPathFile = `${dirUserAssets}`;
  // const filePathFile = `${projectDirData}/${fileHash}`;
  // const systemDirPathFile = `${process.cwd()}/${dirPathFile}`;
  // const systemfilePathFile = `${process.cwd()}/${filePathFile}`;

  let filesPrev = pokoPrev?.files || [];

  // TODO: improve this. For example create a map of the downloads and the last modified date
  allFiles = await Promise.all(
    allFiles.map(async (_f) => {
      // const f = await probeFile(_f);
      const f = {
        ...(await probeFile(_f)),
        ...(await probeHeaders(_f)),
      };
      const { last_edited_time, blockId, url, length, etag, last_modified } = f;
      const alreadyUp = !!filesPrev.find((filePrev) => {
        return (
          last_edited_time === filePrev.last_edited_time &&
          blockId === filePrev.blockId &&
          url === filePrev.url &&
          length === filePrev.length &&
          etag === filePrev.etag &&
          last_modified === filePrev.last_modified
        );
      });

      if (alreadyUp) {
        console.info(`File ${f.filename} already up to date`);
        return f;
      }

      const systemFileUserAssets1 = `${systemDirUserAssets1}/${f.filename}`;
      const systemFileUserAssets2 = `${systemDirUserAssets2}/${f.filename}`;

      // console.log(`-----FILE: ${f.filename}`);

      await downloadFile(f, systemFileUserAssets1);
      await copy(systemFileUserAssets1, systemFileUserAssets2);
      if (f.extension === ".zip") {
        await extractZip(f, systemFileUserAssets1);
        await extractZip(f, systemFileUserAssets2);
      }

      return f;
    })
  );

  // const dirPathFile = `${dirUserAssets}`;
  // const filePathFile = `${projectDirData}/${fileHash}`;
  // const systemDirPathFile = `${process.cwd()}/${dirPathFile}`;
  // const systemfilePathFile = `${process.cwd()}/${filePathFile}`;

  // if (existsSync(systemfilePathFile)) {
  //   const _contentHashPrev = await fs.readFile(systemfilePathFile);
  //   const contentHashPrev = _contentHashPrev.toString();

  //   if (contentHash === contentHashPrev && !DEBUG) {
  //     console.log(`\nCONTENT HASN'T CHANGED UNTIL LAST FETCH - SKIPING!\n`);
  //     return;
  //   } else {
  //     console.log(`\nCONTENT HAS CHANGED - PROCESSING...\n`);
  //     await fs.rm(systemfilePathFile);
  //     await fs.writeFile(systemfilePathFile, contentHash);
  //   }
  // } else {
  //   if (!existsSync(systemDirPathFile)) {
  //     await fs.mkdir(systemDirPathFile);
  //   }
  //   await fs.writeFile(systemfilePathFile, contentHash);
  // }

  // Replace Notion URLs for local ones
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
    }
  );

  let pages = [];
  let settings;
  visitParents(tree, ["root", "page"], (node, ancestors) => {
    // TODO HERE
    if (node.type === "page" && node.data.codeName.startsWith("_")) {
      // do not add to pages list
    } else if (node.type === "page") {
      const parents = ancestors
        .filter((a) => a.type === "page" || a.type === "root")
        .map(({ children, ...parent }) => parent);
      const page = { ...node, parents };
      pages.push(page);
    } else settings = node;
  });

  const poko = {
    cache: { hash: contentHash },
    settings,
    pages,
    files: allFiles,
    paths: allPaths,
    websiteTree: tree,
  };

  const filePathData = "src/_data/poko.json";
  const dir = filePathData.split("/").slice(0, -1).join("/");
  const systemDir = `${process.cwd()}/${dir}`;
  const systemPathData = `${process.cwd()}/${filePathData}`;

  if (!existsSync(systemDir)) {
    await fs.mkdir(systemDir);
  } else if (existsSync(systemPathData)) {
    await fs.rm(systemPathData);
  }
  await fs.writeFile(systemPathData, JSON.stringify(poko));
  // copy files to an 'src' based directory to be able to import and process them with 'astro-imagetools'
  // await copy(
  //   `${process.cwd()}/public/${dirUserAssets}`,
  //   `${process.cwd()}/${dir}/${dirUserAssets}`
  // );

  // throw "Auto Exit";

  return;
}

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
