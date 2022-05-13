# Poko Astro-Notion

\# Digital garden  
\# Learn in Public

<!-- [Demo](https://simple-blog-template.netlify.app/) 👀  -->

## tl;dr

Astro + Notion + MDX = ❤️

<!-- [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/minimal) -->

### If you are a developer:

```shell
npm init astro -- --template m4rrc0/poko-astro-notion
npm install
npm run dev
```

For Astro documentation, visit: https://docs.astro.build

### If you are a writer:

#### Setup the project once

1. Create free accounts: Github, Notion, A static host (see list bellow)
1. Connect accounts as explained in the docs or the video

#### Publish content (as much as possible 😉)

1. Write in Notion
1. Hit 'Publish'
1. Share your brand new digital home! 🚀

## Intro

This is an alpha release. I you like the idea, please share your thoughts to encourage our work.

This is a starter template for Astro.  
Its goal is to make it unbearably easy to publish content on the web.  
Its primary target user is 'The Tech Savvy Writer'
It is making use of Notion as its CMS; Just write in Notion, click 'Publish' and 30 seconds later your site is online.  
If you want extra functionnality you can even directly write MDX in Notion. The

## Why Astro

To me, Astro is one of the most exciting tech being built in the world of front-end web development. It is a complicated tool aimed at making things easy and performant for the end user (the developer in this case).

## Why 'Poko'

Poko is a project of the _Supertera collective_.

Supertera is:

> An overground movement of independant minds aiming for collective growth through individual emancipation and shared knowledge.

'Growth' is defined as 'becoming better and better humans', not as 'making profit'.

Poko is meant to be an answer to 'yes, I'd like to [write a blog] [publish my digital garden] [share what I am working on] [...] but I need to create a website first...'.  
No more excuses. Be the master of your faith. Write, write, write and publish your content on your own name.

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
