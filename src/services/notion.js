import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
// If we want to use Svelte, we might use the jsx-runtime from https://github.com/kenoxa/svelte-jsx/blob/main/src/jsx-runtime.js
// import * as rt from "../../node_modules/react/jsx-runtime.js";
// import * as rt from "../../node_modules/solid-js/jsx-runtime"; // NOT WORKING
import * as rt from "preact/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import remarkFrontmatter from "remark-frontmatter"; // YAML and such.
import { remarkMdxFrontmatter } from "remark-mdx-frontmatter";

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
export async function getBlockChildren(block_id) {
  const response = await notion.blocks.children.list({
    block_id,
    page_size: 100,
  });
  return response;
}
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
      element.toggle.rich_text[0].plain_text.toLowerCase() === "sitemap"
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
  return response;
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
