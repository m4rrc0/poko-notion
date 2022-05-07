import fs, { writeFile } from "fs";

import https from "https";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
// If we want to use Svelte, we might use the jsx-runtime from https://github.com/kenoxa/svelte-jsx/blob/main/src/jsx-runtime.js
// import * as rt from "../../node_modules/react/jsx-runtime.js";
// import * as rt from "../../node_modules/solid-js/jsx-runtime"; // NOT WORKING
import * as rt from "preact/jsx-runtime";
// import Gun from "gun/gun";
import { evaluate } from "@mdx-js/mdx";
import remarkFrontmatter from "remark-frontmatter"; // YAML and such.
import { remarkMdxFrontmatter } from "remark-mdx-frontmatter";
import remarkUnwrapImages from "remark-unwrap-images";
import remarkGfm from "remark-gfm";
import rehypeAttr from "rehype-attr";
import rehypeSlug from "rehype-slug";
import StreamZip from "node-stream-zip";
import NodeCache from "node-cache";
import { slugify } from "@utils";

const fsPromises = fs.promises;

// --- GLOBAL CONTANTS --- //
const dirUserFiles = "user-assets";
const dirUserImages = "user-images";

// --- INITIALIZATION --- //
// const gun = Gun(['http://localhost:8765/gun']);
// export const gun = Gun();

// export let store = {};
export const store = new NodeCache();

const runtime = rt;
// const runtime = {
//     default: {
//       Fragment: Symbol(react.fragment),
//       jsx: [Function: jsxWithValidationDynamic],
//       jsxs: [Function: jsxWithValidationStatic]
//     },
//     [Symbol(Symbol.toStringTag)]: 'Module'
//   }

// Initializing notion client
const notion = new Client({
  auth: import.meta.env.NOTION_TOKEN,
});

// passing notion client to the option
const n2m = new NotionToMarkdown({ notionClient: notion });

// --- UTILS --- //
const slugifyPath = (codeName) => {
  const pathAsArray = codeName
    .split("/") // keep '/' in the names of the pages
    .map(slugify) // slugify (and remove leading and trailing spaces, etc)
    .filter((el) => el !== ""); // remove leading and trailing '/' (and empty path sections between 2 '/')

  const slug = pathAsArray[pathAsArray.length - 1];
  const path = pathAsArray.join("/");

  if (path === "index") return { slug: "", path: "" };

  return { slug, path };
};

const parseFileUrl = (url) => {
  const parts = url.split("/");
  const last = parts[parts.length - 1];
  const filename = last.split("?")[0];
  const filenameSplit = filename.split(".");
  const extension = "." + filenameSplit[filenameSplit.length - 1];

  return { filename, extension };
};

// const createDir = async (dir, purge = false) => {
//   const systemPath = `${process.cwd()}/${dir}`;

//   console.log("\n----- createDir -----\n", process.cwd(), dir);

//   if (purge) {
//     await fs.rm(systemPath, { recursive: true }, async (err) => {
//       if (err) {
//         console.info(`${dir} could not be deleted.`, err);
//         // throw err;
//       } else {
//         console.info(`${dir} has been deleted.`);
//       }

//       await fs.mkdir(systemPath, (err) => {
//         if (err) {
//           console.info(`${dir} could not be created.`, err);
//           // throw err;
//         } else {
//           console.info(`${dir} was created.`);
//         }
//       });
//     });
//   } else if (!fs.existsSync(systemPath)) {
//     console.info(`Directory ${dir} already exists.`);

//     await fs.mkdir(systemPath, (err) => {
//       if (err) {
//         console.info(`${dir} could not be created.`, err);
//         // throw err;
//       } else {
//         console.info(`${dir} was created.`);
//       }
//     });
//   }
// };

// const downloadFilesAndExtract = async (
const downloadFilesAndExtract = (blocks, dirName, purgePassed = true) => {
  // TODO: see if working with [astro-imagetools](https://github.com/RafidMuhymin/astro-imagetools), reply to https://discord.com/channels/830184174198718474/855126849159954492/958605946177863730

  let purge = purgePassed;
  const projectPathDir = `public/${dirName}`;

  // const mapFilename = "assets-map.json";
  // const projectPathToMap = `${projectPathDir}/${mapFilename}`;
  // const systemPathToMap = `${process.cwd()}/${projectPathToMap}`;
  // let oldMap = null;
  // let oldMapString = null;
  // // 1. fetch old mapping of assets
  // if (fs.existsSync(systemPathToMap) && !purge) {
  //   await fs.readFile(systemPathToMap, (err, data) => {
  //     if (err) throw err;
  //     oldMapString = data;
  //     oldMap = JSON.parse(data);
  //   });
  // }
  // // If no oldMap, we don't know what is good and what is not, so we'll clean up.
  // if (!oldMapString) purge = true;

  // // 2. create map of files (last_edited_time, sitePath)
  // const newMap = blocks.reduce((prev, curr) => {
  //   const prevSame = prev[curr.sitePath];
  //   if (prevSame)
  //     console.warn(
  //       `--- /!\ WARNING: multiple files referencing ${curr.sitePath}`
  //     );
  //   if (prevSame && prevSame > curr.last_edited_time) return prev;
  //   return {
  //     ...prev,
  //     [curr.sitePath]: curr.last_edited_time,
  //   };
  // }, {});
  // // console.log({ blocks, newMap });
  // const newMapString = JSON.stringify(newMap);

  if (purge) {
    // await overWriteFileOrDir(projectPathDir, undefined);
    overWriteFileOrDir(projectPathDir, undefined);
  }
  // else if (newMapString === oldMapString) {
  //   // Skip if !purge and maps are he same
  //   return null;
  // } else if (typeof oldMap === "object") {
  //   // 3. compare maps. if files on old map are not on the new map, remove them
  //   // await Promise.all(
  //   //   Object.keys(oldMap).map(async (sitePathOld) => {
  //   //     if (!newMap.hasOwnProperty(sitePathOld)) {
  //   //       await overWriteFileOrDir(`public${sitePathOld}`);
  //   //     }
  //   //   })
  //   // );
  //   Object.keys(oldMap).map((sitePathOld) => {
  //     if (!newMap.hasOwnProperty(sitePathOld)) {
  //       overWriteFileOrDir(`public${sitePathOld}`);
  //     }
  //   });
  // }

  // await Promise.all(
  //   blocks.map(async (block) => {
  blocks.map(
    (block) => {
      const { filename, extension, sitePath } = block;

      const projectPathToFile = `${projectPathDir}/${filename}`;
      const systemPathToFile = `${process.cwd()}/${projectPathToFile}`;

      // Early return if the file is already the newest version
      // if (
      //   !purge &&
      //   newMap?.[sitePath] === oldMap?.[sitePath] &&
      //   fs.existsSync(systemPathToFile)
      // ) {
      //   console.info(`File ${filename} is already up-to-date.`);
      //   return null;
      // }

      // 4. for each file: if new file OR if new date > old date delete and download new
      // await overWriteFileOrDir(projectPathToFile, "", true);
      // overWriteFileOrDir(projectPathToFile, "", true);

      https.get(block.urlNotion, (res) => {
        const writeStream = fs.createWriteStream(systemPathToFile);

        res.pipe(writeStream);

        // writeStream.on("finish", async () => {
        writeStream.on("finish", () => {
          writeStream.close();
          console.info(`File ${filename} downloaded successfully.`);

          if (extension === ".zip") {
            // const zip = new StreamZip.async({ file: systemPathToFile });
            // const count = await zip.extract(null, `./${projectPathDir}`);
            // console.info(`Extracted ${count} entries`);
            // await zip.close();

            // Sync Callback version
            const zip = new StreamZip({ file: systemPathToFile });
            zip.on("ready", () => {
              zip.extract(null, `./${projectPathDir}`, (err, count) => {
                console.log(
                  err ? "Extract error" : `Extracted ${count} entries`
                );
                zip.close();
              });
            });
            zip.on("error", (err) => {
              console.error(`Error unziping file ${projectPathDir}.\n`, err);
            });
          }
        });
        // This is here incase any errors occur
        writeStream.on("error", function (err) {
          console.error(
            `Error writing stream for file ${projectPathDir}.\n`,
            err
          );
        });
      });
    } //)
  );

  // Remove old Map and create new
  // await overWriteFileOrDir(projectPathToMap, newMapString);
};

const writeMyFile = async (localPath, str) => {
  await writeFile(localPath, str, (err) => {
    if (err) console.error(err);
    else {
      console.log(`File ${localPath} written successfully\n`);
    }
  });
};

// async function overWriteFileOrDir(
function overWriteFileOrDir(pathFromProjectRoot, str, removeOnly = false) {
  // console.log(
  //   "\n----- overWriteFileOrDir -----\n",
  //   process.cwd(),
  //   pathFromProjectRoot
  // );

  const isDir = typeof str === "undefined";
  const systemPath = `${process.cwd()}/${pathFromProjectRoot}`;

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
      console.info(`${pathFromProjectRoot} was created.`);
    } catch (err) {
      console.info(`${pathFromProjectRoot} could not be created.`, err);
      throw err;
    }
  }

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
      console.info(`${pathFromProjectRoot} has been deleted.`);
    } catch (err) {
      console.info(`${pathFromProjectRoot} could not be deleted.`, err);
      throw err;
    }
  }

  if (!removeOnly) {
    // await write();
    write();
  }
}

// --- POPULATE LOCAL STORE --- //

export async function populateStore() {
  console.info("--- Fetching Initial Notion Data ---");
  const notionPagesRaw = await getAllNotionPages();
  console.info("--- Formating Notion Pages ---");
  const notionPages = await Promise.all(
    notionPagesRaw?.map(await transformNotionPage)
  ); // Format notion pages to keep desired data

  // TODO: remove pages or DBs with a leading '_' in codeName

  // Merge blockCopies needed for download
  const { imageBlocks, fileBlocks } = notionPages.reduce(
    ({ imageBlocks, fileBlocks }, curr) => {
      const {
        blocksCopy: { image, file },
      } = curr;
      return {
        imageBlocks: [...imageBlocks, ...image],
        fileBlocks: [...fileBlocks, ...file],
      };
    },
    { imageBlocks: [], fileBlocks: [] }
  );

  // Download files and images
  if (fileBlocks.length > 0) {
    console.info("--- Downloading Files ---");
    // await createDir(`public/${dirUserFiles}`);
    await downloadFilesAndExtract(fileBlocks, dirUserFiles);
  }
  if (imageBlocks.length > 0) {
    console.info("--- Downloading Images ---");
    // await createDir(`public/${dirUserImages}`);
    await downloadFilesAndExtract(imageBlocks, dirUserImages);
  }

  // Isolate Settings Page
  const settings = notionPages.find(
    ({ contentType }) => contentType === "settings"
  );

  // Process pages
  const pagesWithOneParent = notionPages.filter(
    ({ contentType }) => contentType === "page" || contentType === "collection"
  );

  console.info("--- Linking all parent pages ---");
  const pages = pagesWithOneParent.map((p) => {
    const { parents, fullPath, exportsMerged } = loopForParents(
      p,
      pagesWithOneParent
    );
    return {
      ...p,
      parents,
      path: fullPath,
      exports: exportsMerged,
    };
  });

  // Create a map of page ids and paths to allow link transforms
  const paths = pages.map((page) => {
    const pageId = page.id.replace(/-/g, "");

    return {
      pageId,
      pageIdHyphen: page.id,
      notionPath: `/${pageId}`,
      notionFullPath: `https://www.notion.so/${pageId}`,
      path: page.path,
    };
  });
  // console.log(paths);

  // Write JSON file for now, because store is not preserved during the whole build
  // await writeMyFile("temp/paths.json", JSON.stringify(paths));

  // Now we can populate the store
  // store.settings = settings;
  // store.pages = pages;
  // store.paths = paths;
  store.set("settings", settings);
  store.set("pages", pages);
  store.set("paths", paths);

  process.env.POKO_SETTINGS = JSON.stringify(settings);
  process.env.POKO_PAGES = JSON.stringify(pages);
  process.env.POKO_PATHS = JSON.stringify(paths);

  // Now we can populate Gun
  // await gun.get("settings").put(settings);
  // await Promise.all(
  //   pages.map(async (page) => {
  //     const gunPage = await gun.get(`page/${page.id}`).put(page);
  //     // await gunPage.once((v) => {
  //     //   console.log(v);
  //     // });
  //     await gun.get("pages").set(gunPage);
  //   })
  // );

  console.info("--- READY ---");

  return { settings, pages };
}

// --- FETCH DATA --- //

async function getAllNotionPages() {
  let pages = [];
  let start_cursor;
  let has_more = true;
  while (has_more) {
    const newPages = await notion.search({
      // query: 'task',
      // sort: {
      //   direction: 'ascending',
      //   timestamp: 'last_edited_time',
      // },
      start_cursor,
      page_size: 100,
    });
    pages = [...pages, ...newPages?.results];
    start_cursor = newPages.next_cursor;
    has_more = newPages.has_more;
  }

  return pages;
}

async function getBlockChildren(block_id) {
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

async function getChildrenRecursively(blocks) {
  const bc = {
    file: [],
    image: [],
    codeCss: [],
    codeHtml: [],
  };

  const blocksPopulated = await Promise.all(
    blocks.map(async (blockRaw) => {
      const block = transformBlock(blockRaw);
      const md = await n2m.blockToMarkdown(block);

      if (block.type === "file") bc.file = [...bc.file, block];
      if (block.type === "image") bc.image = [...bc.image, block];
      if (block?.code?.language === "css") bc.codeCss = [...bc.codeCss, block];
      if (block?.code?.language === "html")
        bc.codeHtml = [...bc.codeHtml, block];

      if (!block.has_children)
        return { ...block, md, parent: md, children: null };

      const children = await getBlockChildren(block.id);
      const {
        blocksCopy: { file, image, codeCss, codeHtml },
        blocks: childrenPopulated,
      } = await getChildrenRecursively(children);

      bc.file = [...bc.file, ...file];
      bc.image = [...bc.image, ...image];
      bc.codeCss = [...bc.codeCss, ...codeCss];
      bc.codeHtml = [...bc.codeHtml, ...codeHtml];

      return { ...block, md, parent: md, children: childrenPopulated };
    })
  );

  return { blocksCopy: bc, blocks: blocksPopulated };
}

// --- TRANSFORM DATA --- //

async function transformNotionPage(p) {
  // if (!p?.type?.title?.title) {
  //   console.log(p);
  //   return null;
  // }
  // if (!p?.properties?.title?.title) {
  //   console.log(p);
  //   return null;
  // }

  // const inlineDB = {
  //   object: 'database',
  //   id: '9a96fcb2-b23e-47a2-83e4-c4eb15a5bed2',
  //   cover: null,
  //   icon: null,
  //   created_time: '2022-05-06T13:30:00.000Z',
  //   created_by: { object: 'user', id: 'e3f69e77-b675-41af-8d63-368515a60dec' },
  //   last_edited_by: { object: 'user', id: 'e3f69e77-b675-41af-8d63-368515a60dec' },
  //   last_edited_time: '2022-05-06T13:33:00.000Z',
  //   title: [
  //     {
  //       type: 'text',
  //       text: [Object],
  //       annotations: [Object],
  //       plain_text: 'Inline Blog',
  //       href: null
  //     }
  //   ],
  //   properties: {
  //     Tags: {
  //       id: 'H%5DLs',
  //       name: 'Tags',
  //       type: 'multi_select',
  //       multi_select: [Object]
  //     },
  //     Name: { id: 'title', name: 'Name', type: 'title', title: {} }
  //   },
  //   parent: { type: 'page_id', page_id: 'a234584e-99da-4f5c-8a23-a4c3ef9ca545' },
  //   url: 'https://www.notion.so/9a96fcb2b23e47a283e4c4eb15a5bed2',
  //   archived: false
  // }

  // const collectionItem = {
  //   object: 'page',
  //   id: 'a18eac77-f1f0-4623-b861-e53d1f93a959',
  //   created_time: '2022-05-06T13:30:00.000Z',
  //   last_edited_time: '2022-05-06T14:14:00.000Z',
  //   created_by: { object: 'user', id: 'e3f69e77-b675-41af-8d63-368515a60dec' },
  //   last_edited_by: { object: 'user', id: 'e3f69e77-b675-41af-8d63-368515a60dec' },
  //   cover: null,
  //   icon: null,
  //   parent: {
  //     type: 'database_id',
  //     database_id: '9a96fcb2-b23e-47a2-83e4-c4eb15a5bed2'
  //   },
  //   archived: false,
  //   properties: {
  //     Tags: { id: 'H%5DLs', type: 'multi_select', multi_select: [Array] },
  //     Name: { id: 'title', type: 'title', title: [Array] }
  //   },
  //   url: 'https://www.notion.so/Inline-Article-a18eac77f1f04623b861e53d1f93a959'
  // }
  // const contentType = () => {
  //   let ct = "";
  //   switch (true) {
  //     case p.parent.type === "workspace":
  //       ct = "settings";
  //       break;
  //     case p.object === "database": // DB
  //       // No way to know if it is inline from here.
  //       // It is important because we need to know if we need to include the DB in the page generation process and its name in the path of children.
  //       // We could also have 2 collections on the same page so maybe decide a way to skip a DB (or page) name.
  //       // Ex; leading '_' in the name if it is to be skipped
  //       // NOTE: we also need a way to express if we need to generate a page for children (ex testimonials)
  //       ct = "collection";
  //       break;

  //     default:
  //       ct = "page";
  //       break;
  //   }
  //   return ct;
  // };
  const contentType =
    p.parent.type === "workspace"
      ? "settings"
      : p.object === "database"
      ? "collection"
      : "page";
  // Direct Parent of Page
  const parent = p?.parent?.page_id || p?.parent?.database_id;
  const parents = parent ? [parent] : null; // /!\ Can be the settings page or a hidden page or DB (leading '_')
  // Find Title of the page
  let dbItemTitlePropName;
  if (p.parent.type === "database_id") {
    // A collection item
    Object.entries(p.properties).forEach(([propName, propVal]) => {
      if (propVal.type === "title") dbItemTitlePropName = propName;
    });
  }
  const title =
    p?.title || // database
    p?.properties?.title?.title || // page
    p?.properties?.[dbItemTitlePropName]?.title; // collection item
  // CodeName
  const codeName = title.map(({ plain_text }) => plain_text).join("");
  // Slug and Path
  const { slug, path } =
    contentType === "settings"
      ? { slug: null, path: null }
      : slugifyPath(codeName);

  const npFormatted = {
    // notionRaw: p,
    contentType,
    id: p.id,
    codeName,
    // role: null,
    // specificity: null,
    // markup: null,
    content: null,
    // props: null,
    // layouts: null,
    // class: null,
    // style: null,
    // metadata: null,
    // children: null,
    parents, // only first parent for now
    slug,
    path,
  };

  console.info(
    `--- Formating ${contentType}${
      (path === "" && " index") || (path && ` ${path}`) || ""
    } ---`
  );

  const blocksLevel1 = await getBlockChildren(p.id);
  const { blocks, blocksCopy } = await getChildrenRecursively(blocksLevel1);

  // HERE
  console.log({ codeName, p });

  // -------EXPERIMENTS ----------
  let nb;
  blocks.forEach((block, i) => {
    // LATER: exploration of rich_text field for parsing it myself
    // if (block.type === "heading_3") {
    //   console.log("---BLOCK---", block);
    //   console.log("--- RICH TEXT FIELD ---", block.heading_3.rich_text);
    //   console.log("--- LINKS ---");
    //   block?.heading_3?.rich_text?.forEach((richT) => {
    //     console.log(richT.text.link);
    //   });
    // }
    // if (block.type === "image" || block.type === "file") {
    //   nb = i;
    //   console.log("---BLOCK---", block);
    //   console.log("--- CAPTION FIELD ---", block?.image?.caption);
    //   // console.log("--- LINKS ---");
    //   // block?.heading_3?.rich_text?.forEach((richT) => {
    //   //   console.log(richT.text.link);
    //   // });
    // }
    // if (block.has_children) {
    //   const currentType = block.type;
    //   console.log(`---BLOCK OF TYPE: ${currentType}---\n`, block);
    //   console.log(`--- ${currentType} ---\n`, block[currentType]);
    //   // Block types which support children are "paragraph", "bulleted_list_item", "numbered_list_item", "toggle", "to_do", "quote", "callout", "synced_block", "template", "column", "child_page", "child_database", and "table".
    // }
  });
  // --------------------------------

  // const mdBlocks = await n2m.pageToMarkdown(p.id);
  // mdBlocks.forEach((b) => {
  //   console.log("---mdBlock---", b);
  //   console.log("---mdBlock children---", b);
  // });

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
      rehypePlugins: [rehypeAttr, rehypeSlug],
    });

    MDXContent = MDXContentIn;
    exports = exportsIn;
  } catch (error) {
    console.error(`Error evaluating ${contentType} ${path || ""} with MDX.\n`);
    console.log(`Page info:\n`, { slug, path, mdString });
    throw error;
  }

  let globalStylesString, headString;

  if (contentType === "settings") {
    globalStylesString = blocksCopy.codeCss
      .map((block) => {
        return block?.code?.rich_text
          ?.map(({ plain_text }) => plain_text)
          .join("");
      })
      .join("");
    // if (typeof globalStylesString === "string") {
    //   await writeMyFile("dist/user-styles.css", globalStylesString);
    // }
    // TODO: minify CSS
    process.env.POKO_GLOBAL_STYLES_STRING = globalStylesString;

    headString = blocksCopy.codeHtml
      .map((block) => {
        return block?.code?.rich_text
          ?.map(({ plain_text }) => plain_text)
          .join("");
      })
      .join("");
  }
  //   return { page, blocks, mdBlocks, mdString, MDXContent, mdxEvaluated };

  return {
    ...p,
    ...npFormatted,
    exports,
    MDXContent,
    blocks,
    globalStylesString,
    headString,
    // usefull only to retrieve higher
    blocksCopy,
  };
}

function loopForParents(elem, elems) {
  // TODO: how to properly remove _name pages and dBs from the output tree

  let parents = elem.parents; // array with one elem set in transformNotionPage. To be completed
  let fullPath = elem?.path; // path inferred from codeName but lacking parents to be complete
  let newParentId = parents?.[0]; // initialize on the first parent set in transformNotionPage
  let exportsArray = [elem.exports];

  while (newParentId) {
    const currentParentElem = elems.find((e) => e.id === newParentId);
    fullPath = currentParentElem?.path
      ? [currentParentElem.path, fullPath].join("/")
      : fullPath;
    exportsArray = [currentParentElem?.exports, ...exportsArray];
    newParentId = currentParentElem?.parents?.[0];
    parents = newParentId ? [...parents, newParentId] : parents;
  }
  const exportsMerged = exportsArray.reduce(
    (prev, curr) => ({ ...prev, ...curr }),
    {}
  );
  return { parents, fullPath, exportsMerged };
}

function transformBlock(blockRaw) {
  let block = blockRaw;
  const blockType = block.type;

  if (blockType === "file" || blockType === "image") {
    const fileObjectType = block[blockType].type; // The 'File Object' is used by notion to describe both files and images. Its type can be 'external' or 'file'
    const urlNotion = block[blockType][fileObjectType].url;
    const { filename, extension } = parseFileUrl(urlNotion);
    const relativeDir = blockType === "file" ? dirUserFiles : dirUserImages;
    const sitePath = `/${relativeDir}/${filename}`;
    block[blockType][fileObjectType].url = sitePath;
    return {
      ...block,
      urlNotion,
      sitePath,
      filename,
      extension,
    };
  }

  return block;
}

// --- --------------- --- //
