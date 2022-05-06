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

const createDir = async (dir, purge = false) => {
  const systemPath = `${process.cwd()}/${dir}`;

  if (purge) {
    await fs.rm(systemPath, { recursive: true }, async (err) => {
      if (err) {
        console.info(`${dir} could not be deleted.`, err);
        // throw err;
      } else {
        console.info(`${dir} has been deleted.`);
      }

      await fs.mkdir(systemPath, (err) => {
        if (err) {
          console.info(`${dir} could not be created.`, err);
          // throw err;
        } else {
          console.info(`${dir} was created.`);
        }
      });
    });
  } else if (!fs.existsSync(systemPath)) {
    console.info(`Directory ${dir} already exists.`);

    await fs.mkdir(systemPath, (err) => {
      if (err) {
        console.info(`${dir} could not be created.`, err);
        // throw err;
      } else {
        console.info(`${dir} was created.`);
      }
    });
  }
};

const downloadFilesAndExtract = async (
  blocks,
  relativeDir,
  purgePassed = false
) => {
  // TODO: see if working with [astro-imagetools](https://github.com/RafidMuhymin/astro-imagetools), reply to https://discord.com/channels/830184174198718474/855126849159954492/958605946177863730

  let purge = purgePassed;

  const mapFilename = "assets-map.json";
  const systemPathToMap = `${process.cwd()}/public/${relativeDir}/${mapFilename}`;
  let oldMap = null;
  let oldMapString = null;
  // 1. fetch old mapping of assets
  if (fs.existsSync(systemPathToMap) && !purge) {
    await fs.readFile(systemPathToMap, (err, data) => {
      if (err) throw err;
      oldMapString = data;
      oldMap = JSON.parse(data);
    });
  }
  // If no oldMap, we don't know what is good and what is not, so we'll clean up.
  if (!oldMapString) purge = true;

  // 2. create map of files (last_edited_time, sitePath)
  const newMap = blocks.reduce((prev, curr) => {
    const prevSame = prev[curr.sitePath];
    if (prevSame)
      console.warn(
        `--- /!\ WARNING: multiple files referencing ${curr.sitePath}`
      );
    if (prevSame && prevSame > curr.last_edited_time) return prev;
    return {
      ...prev,
      [curr.sitePath]: curr.last_edited_time,
    };
  }, {});
  const newMapString = JSON.stringify(newMap);

  // Skip if maps are he same
  if (newMapString === oldMapString && !purge) {
    return null;
  }

  if (purge)
    await overWriteFileOrDir(
      `${process.cwd()}/public/${relativeDir}`,
      null,
      true
    );

  // 3. compare maps. if files on old map are not on the new map, remove them
  await Promise.all(
    Object.keys(oldMap).map(async (sitePathOld) => {
      if (!newMap.hasOwnProperty(sitePathOld)) {
        await overWriteFileOrDir(`${process.cwd()}/public${sitePathOld}`);
      }
    })
  );
  await Promise.all(
    blocks.map(async (block) => {
      const { filename, extension, sitePath } = block;

      const projectRootPathToFile = `public/${relativeDir}/${filename}`;
      const systemPathToFile = `${process.cwd()}/${projectRootPathToFile}`;

      // Early return if the file is already the newest version
      if (
        newMap.sitePath === oldMap.sitePath &&
        fs.existsSync(systemPathToFile) &&
        !purge
      ) {
        console.info(`File ${filename} is already up-to-date.`);
        return null;
      }

      // 4. for each file: if new file OR if new date > old date delete and download new
      await overWriteFileOrDir(projectRootPathToFile, "", true);

      https.get(block.urlNotion, (res) => {
        const writeStream = fs.createWriteStream(systemPathToFile);

        res.pipe(writeStream);

        writeStream.on("finish", async () => {
          writeStream.close();
          console.info(`File ${filename} downloaded successfully.`);

          if (extension === ".zip") {
            // const zip = new StreamZip.async({ file: 'archive.zip' });
            const zip = new StreamZip.async({ file: systemPathToFile });
            const count = await zip.extract(null, `./public/${relativeDir}`);
            console.info(`Extracted ${count} entries`);
            await zip.close();
          }
        });
      });
    })
  );

  // Remove old Map and create new
  await overWriteFileOrDir(systemPathToMap, newMapString);
};

const writeMyFile = async (localPath, str) => {
  await writeFile(localPath, str, (err) => {
    if (err) console.error(err);
    else {
      console.log(`File ${localPath} written successfully\n`);
    }
  });
};

const overWriteFileOrDir = async (projectRootPath, str, removeOnly = false) => {
  const isDir = typeof str === "undefined" || typeof str === "null";
  const systemPath = `${process.cwd()}/${projectRootPath}`;

  async function write() {
    if (removeOnly) return null;

    if (isDir) {
      await fs.mkdir(systemPath, (err) => {
        if (err) {
          console.info(`${projectRootPath} could not be created.`, err);
          // throw err;
        } else {
          console.info(`${projectRootPath} was created.`);
        }
      });
    } else {
      const s = typeof str === "string" ? str : JSON.stringify(str);
      await writeFile(systemPath, s, (err) => {
        if (err) {
          console.error(`${projectRootPath} could not be created.`, err);
        } else {
          console.log(`${projectRootPath} created successfully`);
        }
      });
    }
  }

  if (!fs.existsSync(systemPath) && !removeOnly) {
    await write();
    return null;
  }

  await fs.rm(systemPath, { recursive: isDir }, async (err) => {
    if (err) {
      console.info(`${projectRootPath} could not be deleted.`, err);
      // throw err;
    } else {
      console.info(`${projectRootPath} has been deleted.`);
    }

    await write();
  });
};

// --- POPULATE LOCAL STORE --- //

export async function populateStore() {
  console.info("--- Fetching Initial Notion Data ---");
  const notionPagesRaw = await getAllNotionPages();
  console.info("--- Formating Notion Pages ---");
  const notionPages = await Promise.all(
    notionPagesRaw?.map(await transformNotionPage)
  ); // Format notion pages to keep desired data

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
    await createDir(`public/${dirUserFiles}`);
    await downloadFilesAndExtract(fileBlocks, dirUserFiles);
  }
  if (imageBlocks.length > 0) {
    console.info("--- Downloading Images ---");
    await createDir(`public/${dirUserImages}`);
    await downloadFilesAndExtract(imageBlocks, dirUserImages);
  }

  // Isolate Settings Page
  const settings = notionPages.find(
    ({ contentType }) => contentType === "settings"
  );

  // Process pages
  const pagesWithOneParent = notionPages.filter(
    ({ contentType }) => contentType === "page"
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
  const contentType = p.parent.type === "workspace" ? "settings" : "page";
  const parents = p.parent.type === "page_id" ? [p.parent.page_id] : null; // /!\ Can be the settings page
  const codeName = p.properties.title.title
    .map(({ plain_text }) => plain_text)
    .join("");
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
    globalStylesString,
    headString,
    // usefull only to retrieve higher
    blocksCopy,
  };
}

function loopForParents(elem, elems) {
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

// export async function getSettings() {
//   const settingsPageRaw = await notion.pages.retrieve({
//     page_id: import.meta.env.NOTION_SETTINGS_PAGE,
//   });
//   const settingsBlocksRaw = await notion.blocks.children.list({
//     block_id: import.meta.env.NOTION_SETTINGS_PAGE,
//     page_size: 100,
//   });
//   //   const settings = {
//   //     contentType: "settings",
//   //     id: settingsPageRaw.id,
//   //     codeName: "settings",
//   //   };
//   const SettingsPageId = settingsPageRaw.id;
//   const websiteName = settingsPageRaw.properties.title.title[0].plain_text;
//   const sitemapRaw = settingsBlocksRaw.results.find(
//     (element) =>
//       element.toggle?.rich_text?.[0]?.plain_text?.toLowerCase() === "sitemap"
//   );
//   const sitemap = async () => {
//     if (!sitemapRaw?.has_children) return null;
//     const children = await getBlockChildren(sitemapRaw.id);

//     // const pages = await Promise.all(
//     //   children.results.map(async (childPageBlock) => {
//     //     // if (!childPageBlock?.type === "child_page") return null;
//     //     const pageName = childPageBlock.child_page.title;
//     //     const pageRaw = await notion.search({ query: pageName });
//     //     const page = pageRaw?.results?.[0];

//     //     return page;
//     //   })
//     // );

//     return children.results;
//     return pages.filter((p) => p);
//   };

//   //   console.log(settingsBlocks);

//   //   return settingsBlocksRaw
//   return sitemap();
// }

// export async function pokoContent() {
//   const notionPagesRaw = await getAllNotionPages();
//   const notionPages = notionPagesRaw?.map(transformNotionPage); // Format notion pages to keep desired data

//   // Isolate Settings Page
//   const settingsRaw = notionPages.find(
//     ({ contentType }) => contentType === "settings"
//   );
//   const settings = await transformSettings(settingsRaw);

//   // Process pages
//   const pagesRaw = notionPages.filter(
//     ({ contentType }) => contentType === "page"
//   );
//   const pagesWithOneParent = await Promise.all(
//     pagesRaw.map(await transformPage)
//   );
//   const pages = pagesWithOneParent.map((p) => {
//     const { parents, fullPath } = loopForParents(p, pagesWithOneParent);
//     return {
//       ...p,
//       parents,
//       path: fullPath,
//     };
//   });

//   //   return notionPagesRaw;
//   return { settings, pages };
// }

// function findChildrenFromParentId(pagesRaw, parentId) {
//   const filtered = pagesRaw.filter((pageRaw) => {
//     return (
//       pageRaw?.parent?.type === "page_id" &&
//       pageRaw?.parent?.page_id === parentId
//     );
//   });
//   return filtered;
// }

// export async function getPage() {
//   const page = await notion.pages.retrieve({
//     page_id: import.meta.env.NOTION_HOMEPAGE_ID,
//   });
//   const blocks = await notion.blocks.children.list({
//     block_id: import.meta.env.NOTION_HOMEPAGE_ID,
//     page_size: 100,
//   });

//   const mdBlocks = await n2m.pageToMarkdown(import.meta.env.NOTION_HOMEPAGE_ID);
//   let mdString = n2m.toMarkdownString(mdBlocks);
//   // remove leading (and trailing) \n
//   //   mdString = mdString.replace(/^\s+|\s+$/g, "");
//   mdString = mdString.trim();
//   // console.log({ mdString });
//   //   const mdxCompiled = await compile(str);
//   const { default: MDXContent, ...mdxEvaluated } = await evaluate(mdString, {
//     ...runtime,
//     remarkPlugins: [
//       [
//         remarkFrontmatter,
//         // {
//         //   type: "yaml",
//         //   fence: { open: "---", close: "---" },
//         //   //   anywhere: true,
//         // },
//       ],
//       //   remarkFrontmatter,
//       remarkMdxFrontmatter,
//     ],
//   });

//   //   MDXContent(props)

//   return { page, blocks, mdBlocks, mdString, MDXContent, mdxEvaluated };
// }

// const myPage = await notion.databases.query({
//     database_id: "897e5a76-ae52-4b48-9fdf-e71f5945d1af",
//     filter: {
//       property: "Landmark",
//       text: {
//         contains: "Bridge",
//       },
//     },
//   })

// const str = `export const Thing = () => <>Awesome revelation!</>

// # Hello, <Thing />`;

// export async function md() {
//   const mdBlocks = await n2m.pageToMarkdown(import.meta.env.NOTION_HOMEPAGE_ID);
//   const mdString = n2m.toMarkdownString(mdBlocks);
//   //   const mdxCompiled = await compile(str);
//   const mdxEvaluated = await evaluate(mdString, { ...runtime });

//   //   console.log({ mdxEvaluated });

//   return { mdBlocks, mdString, mdxEvaluated };
// }

// export async function mdx() {
//   const mdBlocks = await n2m.pageToMarkdown(import.meta.env.NOTION_HOMEPAGE_ID);
//   const mdString = n2m.toMarkdownString(mdBlocks);
//   const mdxString = await compile(mdString);
//   return mdxString;
// }

// async function main() {
//   const compiled = await compile(await fs.readFile("example.mdx"));
//   console.log(String(compiled));
// }

// const settingsP = {
//   object: "page",
//   id: "688cd451-1765-45e0-b308-7704b8637670",
//   created_time: "2022-04-30T07:22:00.000Z",
//   last_edited_time: "2022-04-30T07:28:00.000Z",
//   created_by: {
//     object: "user",
//     id: "e3f69e77-b675-41af-8d63-368515a60dec",
//   },
//   last_edited_by: {
//     object: "user",
//     id: "e3f69e77-b675-41af-8d63-368515a60dec",
//   },
//   cover: null,
//   icon: null,
//   parent: {
//     type: "workspace",
//     workspace: true,
//   },
//   archived: false,
//   properties: {
//     title: {
//       id: "title",
//       type: "title",
//       title: [
//         {
//           type: "text",
//           text: {
//             content: "Poko Website",
//             link: null,
//           },
//           annotations: {
//             bold: false,
//             italic: false,
//             strikethrough: false,
//             underline: false,
//             code: false,
//             color: "default",
//           },
//           plain_text: "Poko Website",
//           href: null,
//         },
//       ],
//     },
//   },
//   url: "https://www.notion.so/Poko-Website-688cd451176545e0b3087704b8637670",
// };
// const settingsB = {
//   object: "list",
//   results: [
//     {
//       object: "block",
//       id: "ae7ea4fe-05f9-4de4-95f3-0e504bc2d9dc",
//       created_time: "2022-04-30T07:27:00.000Z",
//       last_edited_time: "2022-04-30T07:28:00.000Z",
//       created_by: [Object],
//       last_edited_by: [Object],
//       has_children: true,
//       archived: false,
//       type: "toggle",
//       toggle: [Object],
//     },
//     {
//       object: "block",
//       id: "423c1796-8759-424f-a63b-55bdae6be34c",
//       created_time: "2022-04-30T07:28:00.000Z",
//       last_edited_time: "2022-04-30T07:28:00.000Z",
//       created_by: [Object],
//       last_edited_by: [Object],
//       has_children: false,
//       archived: false,
//       type: "paragraph",
//       paragraph: [Object],
//     },
//   ],
//   next_cursor: null,
//   has_more: false,
//   type: "block",
//   block: {},
// };
