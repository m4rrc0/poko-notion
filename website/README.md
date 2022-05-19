# Poko Astro-Notion

\# Digital garden  
\# Learn in Public

<!-- [Demo](https://simple-blog-template.netlify.app/) 👀  -->

## tl;dr

Astro + Notion + MDX = ❤️

<!-- [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/minimal) -->

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/m4rrc0/poko-notion)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fm4rrc0%2Fpoko-notion&env=NOTION_TOKEN,SITE&envDescription=Your%20notion%20integration%20token%20and%20production%20website%20URL&envLink=https%3A%2F%2Fpoko.m4rr.co)

### If you are a human:

- You will need a Notion account.
- Copy [this template](https://m4rr-co.notion.site/Poko-Website-688cd451176545e0b3087704b8637670) to bootstrap your project and create a sub-page called 'index' then write some content.
- Then check out the [Getting Started](https://developers.notion.com/docs/getting-started) page for the Notion API. You will need to create an integration and 'invite' the integration just like if it was a guest to the root page of your web project.  
  We will need the integration's API key as an environment variable here.

### If you are a developer:

<!-- ```shell
npm init astro -- --template m4rrc0/poko-astro-notion
npm install
npm run dev
``` -->

```shell
git clone https://github.com/m4rrc0/poko-notion.git
cd poko-notion
npm install
```

Rename or copy `.env.dist` file in `.env` and paste your API key as the `NOTION_TOKEN` and optionnaly the ID of the Notion page that is the root of your web project as `NOTION_ROOT_ID`.

Then the magic should operate with

```shell
npm run dev
```

### If you are a writer:

#### Setup the project once

1. Create free accounts: Github, Notion, A static host (see list bellow)
1. Connect accounts as explained [on the website](https://poko.m4rr.co/)

#### Publish content (as much as possible 😉)

1. Write in Notion
1. Hit 'Publish'
1. Share your brand new digital home! 🚀

## Intro

This is an alpha release. I you like the idea, please share your thoughts to encourage our work.

This is a starter template for Astro.  
Its goal is to make it unbearably easy to publish content on the web.  
Its primary target user is 'The Tech Savvy Writer'.
It is making use of Notion as its CMS; Just write in Notion, click 'Publish' and 30 seconds later your site is online.  
If you want extra functionnality you can even directly write MDX in Notion.

## Why Astro

To me, Astro is one of the most exciting tech being built in the world of front-end web development. It is a complicated tool aimed at making things easy and performant for the end user (the developer in this case). It builds zero-JS websites by default with smart enhancement.

## Why 'Poko'

Poko is a project of the _Supertera collective_.

Supertera is:

> An overground movement of independant minds aiming for collective growth through individual emancipation and shared knowledge.

'Growth' is defined as 'becoming better and better humans' and opposed to the traditionnal concept of 'making profit' above all.

Poko is meant to be an answer to 'yes, I'd like to [write a blog] [publish my digital garden] [share what I am working on] [...] but I need to create a website first...'.  
No more excuses. Be the master of your faith. Write, write, write and publish your content on your own terms.

As to why really the name 'Poko'... That is a secret. Maybe if you go on reading you'll find out...

## Why Notion

It is free. It is easy. It is popular. It is more powerful than a cloud document. It is less complicated than a classic headless CMS. It has an (~~sometimes shity~~) API.  
The goal is one day to support more sources, especialy more FOSS software. The front-end API would stay the same (somewhat opiniated) structure to allow easily building on that side too (components, themes, ...).

### 'Everything in the CMS'

Users do not write code.  
For a lambda user, the maximum effort is a copy/paste. The tech-savvy user will happily copy/paste to achieve something cool but most won't dive into the code.

With the approach we are taking, components, themes, and even complex functionnality are all a copy/paste away from one notion page to another.

NOTE: It also means that you need to be careful of the code you copy/paste. If you don't understand what you are putting onto your site, at least make sure it comes from a reputable source!

## Why MDX

In the current example, we use MDX to render the content. It is not mandatory though.  
For now, (as far as I know) MDX allows more freedom and functionnality than the native Astro `<Markdown />` component. But we definitely look forward to using more of Astro!

NOTE: The Astro `<Markdown />` component should work just fine for simple content without variables, custom components, ...

NOTE 2: We also envision a 'markdownless' version where we use structured data all the way to the HTML composition without resorting to markdown at all.

## Any static host

A few static hosting providers:

- Cloudflare Pages
- netlify
- firebase
- github pages
- gitlab pages
- surge
- zeit
- forge
- aerobatic
- Amazon S3

## What next: short and long term goals in random order

- [ ] Improve many things in Poko Astro-Notion... (list to come)
- [ ] Examples using different libraries, CSS frameworks, ...
- [ ] More default components ready to use
- [ ] Finalize front-end API to allow for 'markdownless' rendering
- [ ] Support Mark Doc as a markdown renderer
- [ ] Transform data format from Notion to MDX using Unist directly (will allow nesting elements like columns more easily)
- [ ] Automatic RSS feed on DBs?
- [ ]

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Installs dependencies                        |
| `npm run dev`     | Starts local dev server at `localhost:3000`  |
| `npm run build`   | Build your production site to `./dist/`      |
| `npm run preview` | Preview your build locally, before deploying |

<!--
## Features

* Full Markdown support.
* Separation between Markdown files and Astro pages
* Drafts directory for posts that aren't published yet
* Syntax Highlighting with Shiki
* Global styles directory
* RSS 2.0 generation  -->

<!--
## 💡 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```
/
├── public
└── src
    ├── components
    │   ├── layouts
    │   └── utilities
    ├── content
    ├── pages
    └── style
```

 * *pages* - This directory is significant for Astro. Files here become URLs.
 * *components* - Template parts, layouts, utilities, all go here.
 * *content* - Keep the content separate from the system for clearer separation.
 * *style* - Global SCSS styles.
 * *public* - A directory where to place any static files that need to be used on the site.


## 👀 Want to learn more?

Feel free to check out [Astro documentation](https://github.com/withastro/astro) or jump into [Astro's Discord server](https://astro.build/chat). -->

## Deep dive

### Before Astro's build even starts

- Fetching all Notion Pages the `NOTION_TOKEN` (environment variable) has access to
- Transform 'raw' Notion pages to make them more usable on next steps.
- Populate pages with their blocks recursively
  - Exceptions for the following blocks: `link_to_page`, `child_page`, `child_database`. These will be filled a few steps later when pages get their full data.
  - We use the library `notion-to-markdown` to convert blocks to md then generate the markdown for the page. (This was a quick win but will be technical debt in the short term)
  - Each page is parsed with `MDX` as well so we can extract frontmatter and other `exports`early and use these as build options if necessary.
- Find the root of the project (settings page) with these rules. Either
  - the only Notion page (the token can access) placed at the root in Notion, or
  - the page corresponding to the ID provided in the ` NOTION_ROOT_ID` environment variable
- Create a full tree of the Notion data by placing pages into their respective `block`s of types `link_to_page`, `child_page`, `child_database`
- Transform the tree of Notion Pages to a more friendly data structure (and more Unist friendly hopefully)

  - 3 types of nodes:

    - `root` is the settings page = the root page in Notion. This node has a property `data.role = "settings"`
    - `page`: can be a classic page or a database page (the latter is not properly supported yet though) with respectively `data.role = "page"` and `data.role = "collection"`
    - `block`for Notion blocks. These are more or less equivalent to HTML block elements.

    - This is the current mapping of Notion block types into our node's `data.role`
      ```
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
      unsupported: "none",
      };
      ```

  - NOTE: Inline elements are currently described inside their block (as an 'Notion-style' array of data and as markdown). In the near future, we might want to transform this data in a proper subtree to allow easier composability and improve compatibility with the Unified ecosystem.

- Extract relevant info from the settings page.
  - `globalStylesString` will be injected in a `user-styles.css` thanks to the 'non-html page' Astro API. (See in `/src/pages/user-styles.css.js`)
  - `headString` will be injected into the head of each page with a `<Fragment slot="head" set:html={headString} />` inside our `<SkeletonPage ... />` layout.
- Complement page info:
  - Construct the full URL of the page based on own page name and parents' names (keeping '/' in place). For example, a structure in Notion like "root" > "Super" > "SeCrEt" > " / hidden / / SECRET - Page / " would create this path ` super/secret/hidden/secret-page`
  - Merge MDX `exports` from root to each page. The data cascade seems the most convenient way to handle data to avoid repetition.
- Record a list of all pages with Notion ID, Notion URLs for this page and our generated path. This is usefull to be able to replace internal Notion links with our internal website's links.
- Process Images and files
  - We have 5 properties that can describe an image or file
    - `featuredImage` (only on nodes with `type = 'page'`) is a page's icon (if the icon is an image. See further in case it is an Emoji)
    - `cover` (only on nodes with `type = 'page'`) is a page's cover image.
    - `icon` (only on nodes with `data.role = 'callout'`) is a callout's icon (if the icon is an image. See further in case it is an Emoji)
    - `image` (only on nodes with `data.role = 'img'`) is the content of an independant `img` block
    - `file` (only on nodes with `data.role = 'file'`) is the content of an independant `file` block
  - An image of file description has the following properties:
    `const imageOrFile = { last_edited_time, // comes directly from Notion originalUrl, // Notion URL (expires for uploaded ressources) filename, // like 'my-image.png' extension, // like '.png' url, // our local file URL }`
- An `emoji` property can contain the emoji character chosen in Page Icon or Callout Icon.
- Process Notion's Page Properties (the properties attributed to a page when it is a child of a database)
  - ... This is a work in progress ...
  - We try to make this props as easily usable as possible on the front-end to make it easy for components to consume the data (as props since these are passed as props to the page).
  - For example, a property called 'country' defined as a single `select` can be accessed as `props.country` on the front-end and will return a single string (for example `"Belgium"`)
  - For the moment, these are handled:
    - `rich_text` will be returned as plain string
    - `select` will be returned as single string
    - ` multi_select` will be returned as array of strings
    - `files` will be returned as array of `fileObject` (as described above)
- Merge Notion page properties and MDX exports into `data.props`
- Record a list of all assets (images and files) with the same properties as described earlier. This is usefull to be able to replace Notion's generated links with our internal website's links.
- Download all assets locally (currently hard coded to `public/user-assets`) and unzip `.zip` files in place.
- Replace Notion URLs (pages and assets) in blocks data and in markdown.
- Isolate Settings for convenience
- Flatten Pages as an array for convenience
- Save computed data to disk for access during build and on the front-end.
  - A JSON file is created at `src/_data/poko.json` (currently hard coded)
  - The structure is the following:
    `` const poko = { settings, // the isolated root node pages, // array of pages with all info we gathered and full list of children recursively files, // array of `fileObject` definitions for assets downloaded from Notion paths, // array of `pathsMap` for all our pages websiteTree, // the full tree of nodes from root (settings) to leaves (blocks on the most nested pages) } ``

#### Notes about 'fetching ahead'

NOTE: this part is currently handled by a minimal Astro integration I called `fetch-ahead`. The only role of this integration is to execute an async function before the actual build begins.

The goals of using this could be:

- to execute the code only once even on dev
- to run code early and potentially fail early too
- to play with meaningful Astro paths without interfering (like dumping assets in the `public/` directory.

TODO: There is a potential for improving developer experience tenfold by running this in parallel to the dev server to live reload on changes in Notion.

### The front-end mainly consists of

- A 'catch-all' `[...path].astro` page
  - Imports poko data
  - Re-process pages and settings with MDX + data cascade
  - Generate pages according to their `path`s
  - Dispatch the page to the desired Renderer Layout
- A `SkeletonPage.astro` layout
  - Handles metadata and head injection
- Default MDX `components`
  - ... Work in progress ...
  - A set of smart default components
  - Can be overwritten in code AND in Notion directly through exports
- Renderer layouts. Currently `MDXPage.astro` is the only useful one in all practicality.
  - Renders the desired flavour of Markdown and/or the data tree directly
