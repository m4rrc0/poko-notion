import "dotenv/config";
import Downloader from "nodejs-file-downloader";
import { Client } from "@notionhq/client";
import _set from "lodash.set";
import { NotionToMarkdown } from "notion-to-md";
import * as runtime from "preact/jsx-runtime";
// If we want to use Svelte, we might use the jsx-runtime from https://github.com/kenoxa/svelte-jsx/blob/main/src/jsx-runtime.js
// To use with React, apparently we need this
// import * as rt from "../../node_modules/react/jsx-runtime.js";
// const runtime = { default: { Fragment: Symbol(react.fragment), jsx: [Function: jsxWithValidationDynamic], jsxs: [Function: jsxWithValidationStatic] }, [Symbol(Symbol.toStringTag)]: 'Module' }
import { evaluate } from "@mdx-js/mdx";
import remarkFrontmatter from "remark-frontmatter"; // YAML and such.
import { remarkMdxFrontmatter } from "remark-mdx-frontmatter";
import remarkUnwrapImages from "remark-unwrap-images";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import StreamZip from "node-stream-zip";
import { parseFileUrl } from "../utils/index.mjs";

// --- INITIALIZATION --- //

const dirUserAssets = "user-assets";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_ROOT_ID = process.env.NOTION_ROOT_ID;
// Initializing notion client
const notion = new Client({ auth: NOTION_TOKEN });

// NotionToMarkdown: passing notion client to the option
const n2m = new NotionToMarkdown({ notionClient: notion });

// --- UTILS --- //
export function rootId() {
  return NOTION_ROOT_ID;
}

// export function fileInfo(blockOrPage, )

export function filesInfo(blockOrPage, localDir = dirUserAssets) {
  let raw = blockOrPage?.data?.raw || blockOrPage;
  const { last_edited_time } = raw;

  const commons = { last_edited_time, blockId: raw.id };

  const isPage = raw?.object === "page" || raw?.object === "database";
  const blockType = raw?.type;
  const isCallout = blockType === "callout";
  const isImage = blockType === "image";
  const isFile = blockType === "file";

  let oType, originalUrl, url;

  if (isPage) {
    oType = raw.icon?.type;
    originalUrl = oType && raw.icon?.[oType]?.url;
    const { filename: fi_f, extension: fi_e } = parseFileUrl(originalUrl);
    url = oType && `/${localDir}/${fi_f}`;

    const featuredImage = oType && {
      ...commons,
      originalUrl,
      filename: fi_f,
      extension: fi_e,
      url,
    };

    oType = raw.cover?.type;
    originalUrl = oType && raw.cover?.[oType]?.url;
    const { filename: f, extension: e } = parseFileUrl(originalUrl);
    url = oType && `/${localDir}/${f}`;

    const cover = oType && {
      ...commons,
      originalUrl,
      filename: f,
      extension: e,
      url,
    };

    return { featuredImage, cover };
  }
  if (isCallout) {
    oType = raw.callout?.icon?.type;
    // Exclude "Emoji" type as it is handled on its own
    oType = oType === "emoji" ? null : oType;
    originalUrl = oType && raw.callout?.icon?.[oType]?.url;
    const { filename: f, extension: e } = parseFileUrl(originalUrl);
    url = oType && `/${localDir}/${f}`;

    const icon = oType && {
      ...commons,
      originalUrl,
      filename: f,
      extension: e,
      url,
    };

    return { icon };
  }
  if (isImage) {
    oType = raw.image?.type;
    originalUrl = oType && raw.image?.[oType]?.url;
    const { filename: f, extension: e } = parseFileUrl(originalUrl);
    url = oType && `/${localDir}/${f}`;

    const image = oType && {
      ...commons,
      originalUrl,
      filename: f,
      extension: e,
      url,
    };

    return { image };
  }
  if (isFile) {
    oType = raw.file?.type;
    originalUrl = oType && raw.file?.[oType]?.url;
    const { filename: f, extension: e } = parseFileUrl(originalUrl);
    url = oType && `/${localDir}/${f}`;

    const file = oType && {
      ...commons,
      originalUrl,
      filename: f,
      extension: e,
      url,
    };

    return { file };
  }

  return {};
}

export function transformRawPage(p) {
  const _parentType = p?.parent?.type;
  // The title of a Pages is always 'Title'. For a collection item it can be anything but then the property has a type of 'title'
  let _titlePropName = "title";
  if (_parentType === "database_id") {
    // A collection item
    Object.entries(p?.properties).forEach(([propName, propVal]) => {
      if (propVal.type === "title") _titlePropName = propName;
    });
  }
  const _title =
    p?.title || // database
    p?.properties?.title?.title || // page
    p?.properties?.[_titlePropName]?.title; // collection item

  const _codeName = _title?.map(({ plain_text }) => plain_text).join("");
  const _parentId = p.parent[_parentType];

  return _codeName
    ? {
        ...p,
        _title,
        _codeName,
        _titlePropName,
        _parentId,
        // _props,
      }
    : null; // pages are created automatically in DBs. If no title, we don't want them
}

export function transformRichTextToPlainText(_val) {
  if (typeof _val === "string") return _val;
  if (Array.isArray(_val))
    return _val.map(({ plain_text }) => plain_text).join("");
  // Can be object if value is empty
  if ((typeof _val).match(/undefined|object/)) return undefined;

  return _val;
}

export function transformProp([_key, _val] = [], role) {
  let key = _key;
  // name === _key
  // not sure id is useful
  // type tells us where to find the actual value
  const { id, name, type } = _val;
  let val = _val[type];

  if (role === "collection") {
    key = `_definition.${_key}`;
    val = _val;
  } else if (type === "title" || type === "rich_text") {
    // title can be a string or a rich_text field
    // console.log({ type, key, val });
    // console.dir(val, { depth: null });

    val = transformRichTextToPlainText(val);
  } else if (type === "multi_select" && Array.isArray(val.options)) {
    val = val.options.map(({ name }) => name);
  } else if (type === "select") {
    val = val?.name;
  } else if (type === "files") {
    val = val.map((f) => {
      const {
        /*name, type, */ file: { url: originalUrl },
      } = f;

      const { filename, extension } = parseFileUrl(originalUrl);
      const url = `/${dirUserAssets}/${filename}`;
      // if (key.match("jsonld")) {
      //   return url;
      // }
      return { originalUrl, filename, extension, url };
    });
  } else if (type === "date") {
    // if (val?.start && !val?.end && !val?.time_zone) {
    //   val = val?.start;
    // }
  } else if (type === "relation") {
    // console.log({ type, key, _val, val });
    // TODO: transform link OR have the page data in directly?
  } else if (type) {
    // TODO: handle more types
    // val = _val[type];
    //
  }

  // ?? TODO: map notion prop types to own types???
  // All props types: "title", "rich_text", "number", "select", "multi_select", "date", "people", "files", "checkbox", "url", "email", "phone_number", "formula", "relation", "rollup", "created_time", "created_by", "last_edited_time", "last_edited_by",

  if (key.match(/\./)) {
    let obj = {};
    _set(obj, key, val);
    return obj;
  }

  return { [key]: val };
}

export const transformJsonld = (_jsonld) => {
  if (typeof _jsonld !== "object" || Array.isArray(_jsonld)) {
    return _jsonld;
  }

  return Object.entries(_jsonld).reduce((prev, [key, _val]) => {
    let val = _val;
    const transformVal = (value) => {
      if (value?.start) {
        return value.start;
      } // a date
      if (value?.originalUrl) {
        return value.url;
      } // an image or file
      return value;
    };

    if (Array.isArray(val)) {
      val = val.map(transformVal);
    } else {
      val = transformVal(val);
    }

    return {
      ...prev,
      [key]: val,
    };
  }, {});
};

export async function notionBlockToMd(block) {
  let inlineMd;
  switch (block.type) {
    case "child_database":
      inlineMd = `<Collection blockId="${block.id}" collectionName="${block.child_database?.title}" />`;
      break;
    case "child_page":
      inlineMd = `<ChildPage blockId="${block.id}" pageName="${block.child_page?.title}" />`;
      break;
    case "link_to_page":
      console.log({
        block,
        pageId:
          block?.link_to_page?.page_id || block?.link_to_page?.database_id,
      });
      inlineMd = `<BlockLinkPage blockId="${block.id}" pageId="${
        block?.link_to_page?.page_id || block?.link_to_page?.database_id
      }" />`;
      break;
    case "numbered_list_item":
      // Not handled properly by notion-to-markdown apparently
      inlineMd = await n2m.blockToMarkdown(block);
      inlineMd = inlineMd.replace(/^-/, "1.");
      break;
    // case "column_list":
    //   // console.log(block);
    //   inlineMd = `<Columns blockId="${block.id}"></Columns>`;
    //   break;
    // case "column":
    //   // inlineMd = `<Column blockId="${block.id}"></Column>`;
    //   break;
    case "toggle":
    // inlineMd = ``;
    // break;
    case "synced_block":
    case "paragraph":
    case "image":
    case "file":
    case "code":
    case "bulleted_list_item":
    case "heading_1":
    case "heading_2":
    case "heading_3":
    case "quote":
    case "divider":
    case "callout":
    default:
      inlineMd = await n2m.blockToMarkdown(block);
      break;
  }
  // if (blockType === "child_page") {
  //   inlineMd = ``;
  //   console.log({ blockType, inlineMd });
  // } else if (blockType === "child_database") {
  //   inlineMd = `<collection><h3>Collection</h3>{pages && pages?.map(page => <collection-item {...page} />)}</collection>`;
  //   // TODO: fetch children pages ?? -> Should be children of the db page itself
  //   console.log({ blockType, inlineMd, block });
  // } else {
  // }
  return inlineMd;
}

export function treeToMd(blocks) {
  // if (!blocks || !Array.isArray(blocks.children)) return undefined;
  const mdString = n2m
    // .toMarkdownString(mdBlocks)
    .toMarkdownString(blocks)
    .trim() // trim() to remove leading (and trailing) "\n" to allow top level frontmatter
    .replace(/‘/g, "'")
    .replace(/’/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/⇒/g, "=>")
    .replace(/→/g, "->")
    .replace(/—/g, "-");
  // console.log({ mdString });
  return mdString;
}

export async function toMdx(mdString, debugString) {
  let MDXContent = undefined;
  let exports = undefined;

  try {
    const { default: MDXContentIn, ...exportsIn } = await evaluate(mdString, {
      ...runtime,
      remarkPlugins: [
        [
          remarkFrontmatter,
          {
            type: "yaml",
            fence: { open: "```yaml", close: "```" },
            //   anywhere: true,
          },
        ],
        remarkMdxFrontmatter,
        remarkUnwrapImages,
        remarkGfm,
      ],
      rehypePlugins: [rehypeSlug],
    });

    MDXContent = MDXContentIn;
    exports = exportsIn;
  } catch (error) {
    // console.error(
    //   `Error evaluating with MDX: ${debugString || `\n${mdString}`}`
    // );
    // console.info(`Page info:\n`, { slug, path, mdString });
    console.error(error);
    const matches = mdString.match(/.*\n/g);
    console.log(
      "The error is here:\n",
      matches.slice(error.line - 6, error.line + 4).join("")
    );
    throw error;
  }

  return { MDXContent, exports };
}

export async function extractZip(fileObject, systemFile) {
  const { originalUrl, filename, extension, url } = fileObject;
  // const projectPathToFile = url.replace("/", "public/");
  // const systemFile = `${process.cwd()}/${projectPathToFile}`;
  const systemDir = systemFile.replace(`/${filename}`, "");

  // Async version
  const zip = new StreamZip.async({ file: systemFile });
  const count = await zip.extract(null, systemDir);
  console.info(`Extracted ${count} entries from ${filename}`);

  zip.on("error", (err) => {
    console.error(`Error unziping file ${filename}.\n`, err);
  });

  await zip.close();
}

export async function downloadFile(fileObject, systemFile) {
  const { originalUrl, filename, extension, url } = fileObject;
  // const projectPathToFile = url.replace("/", "public/");
  // const systemPathToFile = `${process.cwd()}/${projectPathToFile}`;
  // const projectPathToFile = `${projectPathToDownloadDir}/${filename}`;
  const systemDir = systemFile.replace(`/${filename}`, "");
  // console.log({ systemFile, systemDir });

  const downloader = new Downloader({
    url: originalUrl, //If the file name already exists, a new file with the name followed by '1' is created.
    directory: systemDir, //This folder will be created, if it doesn't exist.
    fileName: filename,
    // cloneFiles: false, //This will cause the downloader to re-write an existing file.
    skipExistingFileName: true, // completely skip downloading a file, when a file with the same name already exists
    maxAttempts: 3,
  });
  try {
    await downloader.download(); //Downloader.download() returns a promise.

    console.info(`File ${filename} downloaded successfully.`);
  } catch (err) {
    //IMPORTANT: Handle a possible error. An error is thrown in case of network errors, or status codes of 400 and above.
    //Note that if the maxAttempts is set to higher than 1, the error is thrown only if all attempts fail.
    console.error(`Error writing stream for file ${filename}.\n`, err);
  }
}

// const downloadFilesAndExtract = async (
// const downloadFilesAndExtract = (
//   fileObjects,
//   downloadDir,
//   purgePassed = true
// ) => {
//   // TODO: see if working with [astro-imagetools](https://github.com/RafidMuhymin/astro-imagetools), reply to https://discord.com/channels/830184174198718474/855126849159954492/958605946177863730

//   let purge = purgePassed;
//   const projectPathToDownloadDir = `public/${downloadDir}`;

//   if (purge) {
//     // await overWriteFileOrDir(projectPathToDownloadDir, undefined);
//     overWriteFileOrDir(projectPathToDownloadDir, undefined);
//   }

//   // await Promise.all(
//   //   blocks.map(async (block) => {
//   fileObjects.map(
//     (fileObject) => {
//       downloadFile(fileObject, () => {
//         if (extension === ".zip") {
//           extractZip(fileObject);
//         }
//       });
//     } //)
//   );
// };

// async function overWriteFileOrDir(
function overWriteFileOrDir(projectPathToTarget, str, removeOnly = false) {
  // Target can be a file or dir
  // str is used for files. If not a string, it is stringified.
  const isDir = typeof str === "undefined";
  const systemPath = `${process.cwd()}/${projectPathToTarget}`;

  // Early return: Does not already exists && not remove only
  if (!fs.existsSync(systemPath) && !removeOnly) {
    // await write();
    write();
    return null;
  }

  if (fs.existsSync(systemPath)) {
    try {
      // await fsPromises.rm(systemPath, { recursive: isDir });
      fs.rmSync(systemPath, { recursive: isDir });
      console.info(`${projectPathToTarget} has been deleted.`);
    } catch (err) {
      console.info(`${projectPathToTarget} could not be deleted.`, err);
      throw err;
    }
  }

  if (!removeOnly) {
    // await write();
    write();
  }

  // async function write() {
  function write() {
    if (removeOnly) return null;

    try {
      if (isDir) {
        // await fsPromises.mkdir(systemPath);
        fs.mkdirSync(systemPath);
      } else {
        const s = typeof str === "string" ? str : JSON.stringify(str);
        // await fsPromises.writeFile(systemPath, s);
        fs.writeFileSync(systemPath, s);
      }
      console.info(`${projectPathToTarget} was created.`);
    } catch (err) {
      console.info(`${projectPathToTarget} could not be created.`, err);
      throw err;
    }
  }
}

// --- FETCH DATA --- //

export async function getNotionPage(page_id = NOTION_ROOT_ID) {
  const _page = await notion.pages.retrieve({ page_id });
  //   const page = await complementDbData(_page);
  return _page;
}

// export async function complementDbData(_page) {
//   if (_page.object === "database") {
//     const db = await notion.databases.retrieve({ database_id: _page.id });
//     return { ..._page, ...db };
//   }
//   return _page;
// }

export async function getAllNotionPages() {
  let _pages = [];
  let start_cursor;
  let has_more = true;
  while (has_more) {
    const newPages = await notion.search({
      start_cursor,
      page_size: 100,
    });
    _pages = [..._pages, ...newPages?.results];
    start_cursor = newPages.next_cursor;
    has_more = newPages.has_more;
  }

  //   let val = await getProperty(_val, page_id);
  //
  // const pages = await Promise.all(_pages.map(getProperties));
  // const pages = _pages.map((p) => ({ ...p, props: p.properties }));
  //   console.log({ pages });

  // const pages = await Promise.all(
  //   _pages.map(async (p) => {
  //     const children = await getBlockChildrenRecursively(p, _pages, p.id);
  //     return { ...p, children };
  //   })
  // );

  // pages.forEach((p) => {
  //   console.log({ properties: p.properties });
  // });

  return _pages;
}

// export async function getProperty(_prop, page_id) {
//   const [_key, _val] = _prop;
//   const { id, name, type } = _val;

//   // results are not paginated here
//   let newProp;
//   //   if (!type.match(/title|rich_text|relation|people/)) {
//   //     try {
//   //       newProp = await notion.pages.properties.retrieve({
//   //         page_id,
//   //         property_id: id,
//   //       });
//   //     } catch (err) {
//   //       //   console.error(err);
//   //     }
//   // }
//   console.log({ page_id, _val, newProp });

//   return null;

//   let valArr = [];
//   let start_cursor;
//   let has_more = true;
//   while (has_more) {
//     const prop = await notion.pages.properties.retrieve({
//       page_id: pageId,
//       property_id: id,
//       start_cursor,
//       page_size: 100,
//     });

//     //   console.log("---PROP FETCH---", _val, prop);

//     valArr = [...valArr, ...prop?.results];
//     start_cursor = prop.next_cursor;
//     has_more = prop.has_more;
//   }

//   return valArr;
// }

// export async function getProperties(page) {
//   const { properties } = page;

//   const _propsArray = Object.entries(properties);
//   const propsArray = await Promise.all(
//     _propsArray.map((prop) => getProperty(prop, page.id))
//   );

//   return page;
// }

async function getBlockChildren(block_id = NOTION_ROOT_ID) {
  let blocks = [];
  let start_cursor;
  let has_more = true;
  while (has_more) {
    const newBlocks = await notion.blocks.children.list({
      block_id,
      start_cursor,
      page_size: 100,
    });
    blocks = [...blocks, ...newBlocks?.results];
    start_cursor = newBlocks.next_cursor;
    has_more = newBlocks.has_more;
  }

  return blocks;
}

export async function getBlockChildrenRecursively(
  blocksOrBlock = NOTION_ROOT_ID,
  allPages,
  _currentPageId,
  notAPage
) {
  // blocksOrBlock can be [...blocks], "id_of_block", {...block}
  // We want to know the current page ID (for child_page block type)
  let _blocks;
  let currentPageId = _currentPageId;
  if (Array.isArray(blocksOrBlock)) {
    _blocks = blocksOrBlock;
  } else if (typeof blocksOrBlock === "string") {
    // only the ID. It means it is the first call and the id of a page (probably the root page)
    if (!(notAPage === true)) {
      currentPageId = blocksOrBlock;
    }
    _blocks = await getBlockChildren(blocksOrBlock);
  } else if (typeof blocksOrBlock === "object") {
    // it is an object, not necessarily a page though.
    if (
      blocksOrBlock.object === "page" ||
      blocksOrBlock.object === "database"
    ) {
      currentPageId = blocksOrBlock.id;
    }
    _blocks = await getBlockChildren(blocksOrBlock.id);
  } else {
    console.error(
      `Wrong argument provided to getBlockChildrenRecursively: blocksOrBlock = ${blocksOrBlock}`
    );
  }

  const blocks = await Promise.all(
    _blocks.map(async (_block) => {
      let block = _block;

      if (block.object !== "page") {
        const _inlineMd = await notionBlockToMd(_block);
        const _mayHaveNotionLink = !!_inlineMd.match(/\/[0-9a-z\-]{32}/);
        block = { ..._block, _inlineMd, parent: _inlineMd, _mayHaveNotionLink };
      }

      //   let blockId;
      let children;
      const syncedBlockId = block?.synced_block?.synced_from?.block_id;
      const linkToPageId =
        block?.link_to_page?.page_id || block?.link_to_page?.database_id;
      const childPageTitle =
        block?.child_page?.title || block?.child_database?.title;

      if (syncedBlockId) {
        children = await getBlockChildrenRecursively(
          syncedBlockId,
          allPages,
          currentPageId,
          true
        );
      } else if (linkToPageId) {
        // We handle this elsewhere when 'allPages' is not provided
        if (allPages) {
          // Only fetch page data, not children recursively
          const page = allPages.find((p) => p.id === linkToPageId);
          children = [page];
        }
      } else if (childPageTitle) {
        // A 'child_page' block
        // We handle this elsewhere when 'allPages' is not provided
        if (allPages) {
          const pages = allPages
            .filter((p) => {
              return p._codeName === childPageTitle;
            })
            .filter((p) => {
              return p._parentId === currentPageId;
            });

          let subChildren = [];
          if (pages[0].object === "database") {
            // TODO: might be an inline DB or just a subPage...
            subChildren = allPages.filter((p) => {
              return p._parentId === pages[0].id;
            });
          } else {
            subChildren = await getBlockChildrenRecursively(
              pages[0],
              allPages,
              currentPageId
            );
          }

          const page = { ...pages[0], children: subChildren };
          children = [page];
        }
      } else if (!block.has_children) {
        return block;
      } else {
        children = await getBlockChildrenRecursively(
          block,
          allPages,
          currentPageId
        );
      }

      //   const _children = await getBlockChildren(block.id);
      //   const children = await getBlockChildrenRecursively(_children);

      return { ...block, _parentPageId: currentPageId, children };
    })
  );

  // allPages.forEach((p) => {
  //   console.log({ properties: p.properties, props: p._props });
  // });

  return blocks;

  //   return { blocksCopy: bc, blocks: blocksPopulated };
}

export function populateChildPageOfBlock(_block, allRawPages) {
  let block = _block;
  let children = _block.children;

  const linkToPageId =
    _block?.link_to_page?.page_id || _block?.link_to_page?.database_id;
  const childPageTitle =
    _block?.child_page?.title || _block?.child_database?.title;

  if (linkToPageId && !children?.length) {
    // Only place page data, not children recursively
    const pageAndChildren = allRawPages.find((p) => p.id === linkToPageId);
    // console.log(`Injecting page with linkToPage ${pageAndChildren._codeName}`);

    const { children: _, ...page } = pageAndChildren;
    children = [page];
  } else if (childPageTitle && !children?.length) {
    // A 'child_page' _block
    const childPage = allRawPages
      .filter((p) => {
        return p._codeName === childPageTitle;
      })
      .filter((p) => {
        return p._parentId === _block._parentPageId;
      })[0];

    // console.log(`Injecting page with childPage ${childPage._codeName}`);

    let subChildren;
    if (childPage.object === "database") {
      // TODO: might be an inline DB or just a subPage...
      subChildren = allRawPages.filter((p) => {
        if (p._parentId === childPage.id) {
          // console.log(`Injecting page in DB ${childPage._codeName}`);
        }
        return p._parentId === childPage.id;
      });
    }

    const page = {
      ...childPage,
      children: subChildren || childPage.children,
    };
    children = [page];
  }
  return children;
}
