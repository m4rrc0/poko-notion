import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
// If we want to use Svelte, we might use the jsx-runtime from https://github.com/kenoxa/svelte-jsx/blob/main/src/jsx-runtime.js
// import * as rt from "../../node_modules/react/jsx-runtime.js";
// import * as rt from "../../node_modules/solid-js/jsx-runtime"; // NOT WORKING
import * as rt from "preact/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import remarkFrontmatter from "remark-frontmatter"; // YAML and such.
import { remarkMdxFrontmatter } from "remark-mdx-frontmatter";
import { slugify } from "../utils/index.js";

// console.log(rt);
const runtime = rt;

// const runtime = {
//     default: {
//       Fragment: Symbol(react.fragment),
//       jsx: [Function: jsxWithValidationDynamic],
//       jsxs: [Function: jsxWithValidationStatic]
//     },
//     [Symbol(Symbol.toStringTag)]: 'Module'
//   }

// Initializing a client
const notion = new Client({
  auth: import.meta.env.NOTION_TOKEN,
});

// passing notion client to the option
const n2m = new NotionToMarkdown({ notionClient: notion });

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

export async function getPage() {
  const page = await notion.pages.retrieve({
    page_id: import.meta.env.NOTION_HOMEPAGE_ID,
  });
  const blocks = await notion.blocks.children.list({
    block_id: import.meta.env.NOTION_HOMEPAGE_ID,
    page_size: 100,
  });

  const mdBlocks = await n2m.pageToMarkdown(import.meta.env.NOTION_HOMEPAGE_ID);
  let mdString = n2m.toMarkdownString(mdBlocks);
  // remove leading (and trailing) \n
  //   mdString = mdString.replace(/^\s+|\s+$/g, "");
  mdString = mdString.trim();
  console.log({ mdString });
  //   const mdxCompiled = await compile(str);
  const { default: MDXContent, ...mdxEvaluated } = await evaluate(mdString, {
    ...runtime,
    remarkPlugins: [
      [
        remarkFrontmatter,
        // {
        //   type: "yaml",
        //   fence: { open: "---", close: "---" },
        //   //   anywhere: true,
        // },
      ],
      //   remarkFrontmatter,
      remarkMdxFrontmatter,
    ],
  });

  //   MDXContent(props)

  return { page, blocks, mdBlocks, mdString, MDXContent, mdxEvaluated };
}

const settingsP = {
  object: "page",
  id: "688cd451-1765-45e0-b308-7704b8637670",
  created_time: "2022-04-30T07:22:00.000Z",
  last_edited_time: "2022-04-30T07:28:00.000Z",
  created_by: {
    object: "user",
    id: "e3f69e77-b675-41af-8d63-368515a60dec",
  },
  last_edited_by: {
    object: "user",
    id: "e3f69e77-b675-41af-8d63-368515a60dec",
  },
  cover: null,
  icon: null,
  parent: {
    type: "workspace",
    workspace: true,
  },
  archived: false,
  properties: {
    title: {
      id: "title",
      type: "title",
      title: [
        {
          type: "text",
          text: {
            content: "Poko Website",
            link: null,
          },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: "default",
          },
          plain_text: "Poko Website",
          href: null,
        },
      ],
    },
  },
  url: "https://www.notion.so/Poko-Website-688cd451176545e0b3087704b8637670",
};
const settingsB = {
  object: "list",
  results: [
    {
      object: "block",
      id: "ae7ea4fe-05f9-4de4-95f3-0e504bc2d9dc",
      created_time: "2022-04-30T07:27:00.000Z",
      last_edited_time: "2022-04-30T07:28:00.000Z",
      created_by: [Object],
      last_edited_by: [Object],
      has_children: true,
      archived: false,
      type: "toggle",
      toggle: [Object],
    },
    {
      object: "block",
      id: "423c1796-8759-424f-a63b-55bdae6be34c",
      created_time: "2022-04-30T07:28:00.000Z",
      last_edited_time: "2022-04-30T07:28:00.000Z",
      created_by: [Object],
      last_edited_by: [Object],
      has_children: false,
      archived: false,
      type: "paragraph",
      paragraph: [Object],
    },
  ],
  next_cursor: null,
  has_more: false,
  type: "block",
  block: {},
};

export async function getSettings() {
  const settingsPageRaw = await notion.pages.retrieve({
    page_id: import.meta.env.NOTION_SETTINGS_PAGE,
  });
  const settingsBlocksRaw = await notion.blocks.children.list({
    block_id: import.meta.env.NOTION_SETTINGS_PAGE,
    page_size: 100,
  });
  //   const settings = {
  //     contentType: "settings",
  //     id: settingsPageRaw.id,
  //     codeName: "settings",
  //   };
  const SettingsPageId = settingsPageRaw.id;
  const websiteName = settingsPageRaw.properties.title.title[0].plain_text;
  const sitemapRaw = settingsBlocksRaw.results.find(
    (element) =>
      element.toggle?.rich_text?.[0]?.plain_text?.toLowerCase() === "sitemap"
  );
  const sitemap = async () => {
    if (!sitemapRaw?.has_children) return null;
    const children = await getBlockChildren(sitemapRaw.id);

    // const pages = await Promise.all(
    //   children.results.map(async (childPageBlock) => {
    //     // if (!childPageBlock?.type === "child_page") return null;
    //     const pageName = childPageBlock.child_page.title;
    //     const pageRaw = await notion.search({ query: pageName });
    //     const page = pageRaw?.results?.[0];

    //     return page;
    //   })
    // );

    return children.results;
    return pages.filter((p) => p);
  };

  //   console.log(settingsBlocks);

  //   return settingsBlocksRaw
  return sitemap();
}

export async function getAllPages() {
  const response = await notion.search({
    // query: 'task',
    // sort: {
    //   direction: 'ascending',
    //   timestamp: 'last_edited_time',
    // },
  });
  return response?.results;
}

function loopForParents(elem, elems) {
  let parents = elem.parents; // array with one elem set in transformNotionPage. To be completed
  let fullPath = elem?.path; // path inferred from codeName but lacking parents to be complete
  let newParentId = parents?.[0]; // initialize on the first parent set in transformNotionPage

  while (newParentId) {
    const currentParentElem = elems.find((e) => e.id === newParentId);
    fullPath = currentParentElem?.path
      ? [currentParentElem.path, fullPath].join("/")
      : fullPath;
    newParentId = currentParentElem?.parents?.[0];
    parents = newParentId ? [...parents, newParentId] : parents;
  }
  return { parents, fullPath };
}

function transformNotionPage(p) {
  const contentType = p.parent.type === "workspace" ? "settings" : "page";
  const parents = p.parent.type === "page_id" ? [p.parent.page_id] : null;

  return {
    // notionRaw: p,
    contentType,
    id: p.id,
    codeName: p.properties.title.title[0].plain_text,
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
    slug: null,
    path: "/",
  };
}

async function transformSettings(p) {
  const blocksRaw = await getBlockChildren(p.id);
  const mdBlocks = await n2m.pageToMarkdown(p.id);
  const mdString = n2m.toMarkdownString(mdBlocks).trim(); // trim() to remove leading (and trailing) "\n" to allow top level frontmatter
  //   console.log({ mdString });
  const { default: MDXContent, ...exports } = await evaluate(mdString, {
    ...runtime,
    remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
  });

  const globalStylesRaw = blocksRaw.find((b) => b?.code?.language === "css");
  // TODO: inject global styles in a css file
  const globalStylesString = globalStylesRaw?.code?.rich_text?.plain_text;

  return {
    ...p,
    exports,
  };
}

const slugifyPath = (codeName) => {
  const pathAsArray = codeName
    .split("/") // keep '/' in the names of the pages
    .map(slugify) // slugify (and remove leading and trailing spaces, etc)
    .filter((el) => el !== ""); // remove leading and trailing '/' (and empty path sections between 2 '/')

  const slug = pathAsArray[pathAsArray.length - 1];
  const path = pathAsArray.join("/");
  return { slug, path };
};

async function transformPage(p) {
  const { slug, path } = slugifyPath(p.codeName);

  //   const blocksRaw = await getBlockChildren(p.id);
  const mdBlocks = await n2m.pageToMarkdown(p.id);
  const mdString = n2m.toMarkdownString(mdBlocks).trim(); // trim() to remove leading (and trailing) "\n" to allow top level frontmatter
  //   console.log({ mdString });

  const { default: MDXContent, ...otherExports } = await evaluate(mdString, {
    ...runtime,
    remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
  });

  //   return { page, blocks, mdBlocks, mdString, MDXContent, mdxEvaluated };

  return {
    ...p,
    slug,
    path,
    content: {
      MDXContent,
    },
  };
}

export async function pokoContent() {
  const notionPagesRaw = await getAllPages();
  const notionPages = notionPagesRaw?.map(transformNotionPage); // Format notion pages to keep desired data

  // Isolate Settings Page
  const settingsRaw = notionPages.find(
    ({ contentType }) => contentType === "settings"
  );
  const settings = await transformSettings(settingsRaw);

  // Process pages
  const pagesRaw = notionPages.filter(
    ({ contentType }) => contentType === "page"
  );
  const pagesWithOneParent = await Promise.all(
    pagesRaw.map(await transformPage)
  );
  const pages = pagesWithOneParent.map((p) => {
    const { parents, fullPath } = loopForParents(p, pagesWithOneParent);
    return {
      ...p,
      parents,
      path: fullPath,
    };
  });

  //   return notionPagesRaw;
  return { settings, pages };
}

function findChildrenFromParentId(pagesRaw, parentId) {
  const filtered = pagesRaw.filter((pageRaw) => {
    return (
      pageRaw?.parent?.type === "page_id" &&
      pageRaw?.parent?.page_id === parentId
    );
  });
  return filtered;
}

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
