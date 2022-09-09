import * as preact from "preact";
import * as preactHooks from "preact/hooks";
import { visitParents } from "unist-util-visit-parents";
// import { store } from "@services/notion.js";
import { notionHelpers } from "@src/utils/index.mjs";
// import poko from "@poko";
import Anon from "@components/Anon.jsx";
// import { Img } from "astro-imagetools/components";
// import { renderImg } from "astro-imagetools/api";
// import * as userAssets from "../_data/*";

// const { websiteTree } = poko;

const getBlock = (tree, blockId) => {
  let _block;
  visitParents(
    tree,
    (node) => node.data.id === blockId,
    (node) => {
      _block = node;
    }
  );
  // We can get an 'undefined' collection object if User uses a DB view
  return _block;
};
const getCollection = ({ tree, blockId, collectionName }) => {
  let _collection;
  visitParents(
    tree,
    (node) => node.data.id === blockId,
    (node) => {
      visitParents(
        node,
        (_node) => _node.data.codeName === collectionName,
        (_node) => {
          _collection = _node;
        }
      );
    }
  );
  // We can get an 'undefined' collection object if User uses a DB view
  return _collection;
};

export const addProps = (components, defaultProps) => {
  const withProps = {};

  for (const [key, Component] of Object.entries(components)) {
    if (typeof Component === "function") {
      withProps[key] = (props) => <Component {...defaultProps} {...props} />;
    } else {
      withProps[key] = Component;
    }
  }

  return withProps;
};

// const Poko = ({ children, components, ...props }) => {
//   return children({ poko, components, ...props });
// };
const Preact = ({ children, components, ...props }) => {
  return children({ ...preact, ...preactHooks, components, ...props });
};

const ImgLazy = ({
  children,
  components,
  url, // in case we pass it a fileObject
  src: _src, // in case it is generated from md and passed an src automatically
  alt = "",
  poko: { files },
  img: _img,
  ...props
}) => {
  const file = files.find((f) => f.url === (_src || url));
  const { width, height } = file || {};
  const src = file?.src || _src || url;
  // console.log({ file, src, url, _src });
  return (
    <div {...{ class: "img-lazy-wrapper" }}>
      <img
        {...{
          src,
          alt,
          loading: "lazy",
          width,
          height,
          ..._img,
          class: `img-lazy ${_img?.class || ""}`,
          onload: `this.parentNode.style.backgroundColor = 'transparent';this.style.opacity = 1;${
            _img?.onload || ""
          }`,
        }}
      />
    </div>
  );
};

const NavPicoCss = ({ index, pages }) => {
  return (
    <nav class="container">
      <ul>
        {index && index.title && (
          <li>
            <strong>
              <a href={index.href}>{index.title}</a>
            </strong>
          </li>
        )}
      </ul>

      <ul>
        {pages &&
          pages.map(({ href, title, codeName }) => (
            <li>
              <a {...{ href }}>{title || codeName}</a>
            </li>
          ))}
      </ul>
    </nav>
  );
};

const Nav = ({ index, pages }) => {
  return (
    <nav>
      <ul>
        {index && index.title && (
          <li>
            <strong>
              <a href={index.href}>{index.title}</a>
            </strong>
          </li>
        )}
      </ul>
      <ul>
        {pages &&
          pages.map(({ href, title, codeName }) => (
            <li>
              <a {...{ href }}>{title || codeName}</a>
            </li>
          ))}
      </ul>
    </nav>
  );
};

// const CollectionWrapper = (props) => <div class="grid" {...props} />;
const CollectionWrapper = ({ children, ...props }) => (
  <div class="grid" style="--width-column: 14rem; --gap: 1rem;" {...props}>
    <div>{children}</div>
  </div>
);
const CollectionArticle = ({ id, children }) => {
  return (
    <components.article
      {...{
        article: {
          ["data-id"]: id,
          // class: "box shadowy",
          class:
            "box no-border stack split-after-1 card-shadow breakout-clickable",
          style:
            "max-width: calc(var(--width-column) * 2); border-radius: 6px;",
        },
      }}
    >
      {children}
    </components.article>
  );
};
const CollectionArticleFeaturedImage = ({
  components,
  poko,
  featuredImage,
}) => {
  // console.log({ featuredImage });
  const fi = featuredImage?.[0] || featuredImage;
  return fi ? <components.ImgLazy {...{ poko, ...fi }} /> : null;
};
const CollectionArticleHeading = ({ components, href, heading }) => {
  return href && heading ? (
    <components.h2>
      <components.a
        {...{ href, a: { class: `clickable`, style: `color: inherit;` } }}
      >
        {heading}
      </components.a>
    </components.h2>
  ) : null;
};
const CollectionArticleFooter = ({ components, datePublished, author }) => {
  return datePublished || author ? (
    <div class="cluster">
      <div style="--gap: 1ch;">
        {datePublished ? (
          <components.p>
            On <time datetime={datePublished}>{datePublished}</time>
          </components.p>
        ) : null}
        {author ? <components.p>by {author}</components.p> : null}
      </div>
    </div>
  ) : null;
};
// const ColumnsWrapper = (props) => <div class="grid" {...props} />;
// const Col = ({ ...block }) => {
//   const md = block?.data?.md;
//   console.log(block);
//   // console.log(props);
//   return <div>{md}</div>;
// };

const components = {
  // --- EXAMPLES FROM DOCS --- //
  // // Map `h1` (`# heading`) to use `h2`s.
  // h1: 'h2',
  // // Rewrite `em`s (`*like so*`) to `i` with a goldenrod foreground color.
  // em: (props) => <i style={{color: 'goldenrod'}} {...props} />,
  // // Pass a layout (using the special `'wrapper'` key).
  // wrapper: ({components, ...rest}) => <main {...rest} />,
  // // Pass a component.
  // Planet: () => 'Neptune',
  // // This nested component can be used as `<theme.text>hi</theme.text>`
  // theme: {text: (props) => <span style={{color: 'grey'}} {...props} />},

  // --- ALL HTML ELEMENTS IN MD --- //
  // a: ({ href: _href, ...props }) => {
  //   const href = notionHelpers.convertHref(_href, poko);
  //   return <a {...{ ...props, href }} />;
  // },
  a: ({ children, components, href, ...props }) => <Anon {...{ tag: 'a', href, ...props?.a }}>{children}</Anon>, // prettier-ignore
  blockquote: ({ children, components, ...props }) => <Anon {...{ tag: 'blockquote', ...props?.blockquote }}>{children}</Anon>, // prettier-ignore
  br: ({ children, components, ...props }) => <Anon {...{ tag: 'br', ...props?.br }}>{children}</Anon>, // prettier-ignore
  code: ({ children, components, ...props }) => <Anon {...{ tag: 'code', ...props?.code }}>{children}</Anon>, // prettier-ignore
  em: ({ children, components, ...props }) => <Anon {...{ tag: 'em', ...props?.em }}>{children}</Anon>, // prettier-ignore
  h1: ({ children, components, ...props }) => <Anon {...{ tag: 'h1', ...props?.h1 }}>{children}</Anon>, // prettier-ignore
  h2: ({ children, components, ...props }) => <Anon {...{ tag: 'h2', ...props?.h2 }}>{children}</Anon>, // prettier-ignore
  h3: ({ children, components, ...props }) => <Anon {...{ tag: 'h3', ...props?.h3 }}>{children}</Anon>, // prettier-ignore
  h4: ({ children, components, ...props }) => <Anon {...{ tag: 'h4', ...props?.h4 }}>{children}</Anon>, // prettier-ignore
  h5: ({ children, components, ...props }) => <Anon {...{ tag: 'h5', ...props?.h5 }}>{children}</Anon>, // prettier-ignore
  h6: ({ children, components, ...props }) => <Anon {...{ tag: 'h6', ...props?.h6 }}>{children}</Anon>, // prettier-ignore
  hr: ({ children, components, ...props }) => <Anon {...{ tag: 'hr', ...props?.hr }}>{children}</Anon>, // prettier-ignore
  img: ({ children, components, src, alt, img: _img, ...props }) => <Anon {...{ tag: 'img', src, alt, ..._img }}>{children}</Anon>, // prettier-ignore
  // img: 'ImgLazy', // prettier-ignore
  li: ({ children, components, ...props }) => <Anon {...{ tag: 'li', ...props?.li }}>{children}</Anon>, // prettier-ignore
  ol: ({ children, components, ...props }) => <Anon {...{ tag: 'ol', ...props?.ol }}>{children}</Anon>, // prettier-ignore
  p: ({ children, components, ...props }) => <Anon {...{ tag: 'p', ...props?.p }}>{children}</Anon>, // prettier-ignore
  pre: ({ children, components, ...props }) => <Anon {...{ tag: 'pre', ...props?.pre }}>{children}</Anon>, // prettier-ignore
  strong: ({ children, components, ...props }) => <Anon {...{ tag: 'strong', ...props?.strong }}>{children}</Anon>, // prettier-ignore
  ul: ({ children, components, ...props }) => <Anon {...{ tag: 'ul', ...props?.ul }}>{children}</Anon>, // prettier-ignore
  // With remark-gfm (see guide) you can also use:
  del: ({ children, components, ...props }) => <Anon {...{ tag: 'del', ...props?.del }}>{children}</Anon>, // prettier-ignore
  input: ({ children, components, ...props }) => <Anon {...{ tag: 'input', ...props?.input }}>{children}</Anon>, // prettier-ignore
  section: ({ children, components, ...props }) => <Anon {...{ tag: 'section', ...props?.section }}>{children}</Anon>, // prettier-ignore
  sup: ({ children, components, ...props }) => <Anon {...{ tag: 'sup', ...props?.sup }}>{children}</Anon>, // prettier-ignore
  table: ({ children, components, ...props }) => <Anon {...{ tag: 'table', ...props?.table }}>{children}</Anon>, // prettier-ignore
  tbody: ({ children, components, ...props }) => <Anon {...{ tag: 'tbody', ...props?.tbody }}>{children}</Anon>, // prettier-ignore
  td: ({ children, components, ...props }) => <Anon {...{ tag: 'td', ...props?.td }}>{children}</Anon>, // prettier-ignore
  th: ({ children, components, ...props }) => <Anon {...{ tag: 'th', ...props?.th }}>{children}</Anon>, // prettier-ignore
  thead: ({ children, components, ...props }) => <Anon {...{ tag: 'thead', ...props?.thead }}>{children}</Anon>, // prettier-ignore
  tr: ({ children, components, ...props }) => <Anon {...{ tag: 'tr', ...props?.tr }}>{children}</Anon>, // prettier-ignore
  // Other normal elements
  main: ({ children, components, ...props }) => <Anon {...{ tag: 'main', ...props?.main }}>{children}</Anon>, // prettier-ignore
  footer: ({ children, components, ...props }) => <Anon {...{ tag: 'footer', ...props?.footer }}>{children}</Anon>, // prettier-ignore
  header: ({ children, components, ...props }) => <Anon {...{ tag: 'header', ...props?.header }}>{children}</Anon>, // prettier-ignore
  aside: ({ children, components, ...props }) => <Anon {...{ tag: 'aside', ...props?.aside }}>{children}</Anon>, // prettier-ignore
  article: ({ children, components, ...props }) => <Anon {...{ tag: 'article', ...props?.article }}>{children}</Anon>, // prettier-ignore
  nav: ({ children, components, ...props }) => <Anon {...{ tag: 'nav', ...props?.nav }}>{children}</Anon>, // prettier-ignore
  // nav: Nav,

  // --- SPECIAL COMPONENTS --- //
  // wrapper: ({ children, components, ...props }) => {
  //   return (
  //     <>
  //       <components.Menu {...{ components, ...props }} />
  //       <components.main {...{ components, ...props }}>
  //         <components.header {...{ components, ...props }} />
  //         {children}
  //       </components.main>
  //       <components.footer />
  //     </>
  //   );
  // },
  wrapper: ({ children, components, poko, ...props }) => {
    const {
      title,
      description,
      jsonld,
      featuredImage,
      gallery,
      price,
      _definition,
      Astro,
    } = props || {};
    const ID = props.id || props.ID || props.sku || props.title;
    const titleConcat = props.titleConcat?.string;
    const ld = jsonld || {};
    const fi =
      featuredImage?.[0] || featuredImage || ld?.image?.[0] || ld?.image;

    const priceSymbol =
      _definition?.price?.number?.format === "euro" ? "€" : "?";

    const canonicalUrl = new URL(Astro.url.pathname, Astro.site);

    return (
      <>
        <components.Menu {...{ components, ...props }} />
        <components.main {...{ components, ...props }}>
          {titleConcat && (
            <div
              class="with-sidebar right"
              style="--side-width: 25rem; --content-min: 30%;"
            >
              <div>
                <div class="stack">
                  {fi ? <components.ImgLazy {...{ poko, ...fi }} /> : null}
                  {gallery?.[0] && (
                    <div class="grid" style="--width-column: 4rem;">
                      <div>
                        {gallery.map((i) => (
                          <components.ImgLazy
                            {...{
                              poko,
                              ...i,
                              // img: { style: `max-width: 10rem;` },
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <components.header {...{ components, ...props }}>
                    {titleConcat && <h1>{titleConcat}</h1>}
                  </components.header>
                  {price && (
                    <div class="cluster">
                      <div>
                        <p style="font-size: 1.17rem;">
                          {price}
                          {priceSymbol}
                        </p>
                        <button
                          class="snipcart-add-item"
                          data-item-name={titleConcat}
                          data-item-id={ID}
                          data-item-price={price}
                          data-item-description={description}
                          data-item-image={fi.url}
                          data-item-url={canonicalUrl.href}
                          data-item-has-taxes-included
                        >
                          Ajouter au panier
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {children}
        </components.main>
        <components.footer />
      </>
    );
  },
  Layout: ({ children, components, ...props }) => {
    return (
      <>
        <components.Menu {...{ components, ...props }} />
        <components.main {...{ components, ...props }}>
          <components.header {...{ components, ...props }} />
          {children}
        </components.main>
        <components.footer />
      </>
    );
  },
  // Poko,
  Preact,
  ImgLazy,
  NavPicoCss,
  Nav,
  Menu: ({ children, components, poko, ...props }) => {
    const topLevelPages = poko?.websiteTree?.children
      .filter((block) => {
        return block.data.role === "page" || block.data.role === "collection";
      })
      .map((block) => {
        const page = block.children[0];
        // if (page.data.role === "collection") {
        //   // console.log(page.data.raw.title);
        // }
        return {
          title: page?.data.props.title,
          codeName: page?.data.codeName,
          href: page?.data.props.href,
        };
      });
    const index = topLevelPages.find((p) => p.codeName === "index");
    const pages = topLevelPages.filter((p) => p.codeName !== "index");

    return <components.nav {...{ index, pages }} />;
  },
  ChildPage: () => null,
  BlockLinkPage: ({ poko, pageId }) => {
    const page = poko.pages.find((p) => p.data.id === pageId);
    return (
      <a
        href={page?.data.props.href}
        children={page.data.props.title || page.data.codeName}
      />
    );
  },
  Collection: ({ blockId, collectionName, components, poko, ...propsPage }) => {
    // Need to find the page that is a child of this block
    const collection = getCollection({
      tree: poko.websiteTree,
      blockId,
      collectionName,
    });

    return collection ? (
      <components.CollectionWrapper>
        {collection?.children
          ?.filter(
            ({
              data: {
                props: { status },
              },
            }) => typeof status === "undefined" || status === "published"
          )
          .map(({ data: { id: itemId } }) => {
            const item = poko.pages.find((p) => p.data.id === itemId);
            const { components: componentsItem, ...propsItem } =
              item.data.props;
            const ld = propsItem.jsonld || {};
            const featuredImage =
              propsItem.featuredImage || ld.image?.[0] || ld.image;
            const author = propsItem.author || ld.author?.name || ld.author;
            const datePublished =
              propsItem.datePublished?.start ||
              propsItem.datePublished ||
              ld.datePublished?.start ||
              ld.datePublished;
            const dateModified =
              propsItem.dateModified?.start ||
              propsItem.dateModified ||
              ld.dateModified?.start ||
              ld.dateModified;
            const heading = propsItem.titleConcat?.string;

            // console.log({
            //   propsItem,
            //   author,
            //   datePublished,
            //   // components
            //   // featuredImage,
            // });

            return item ? (
              <components.CollectionArticle
                {...{
                  id: itemId,
                  components,
                  poko,
                  featuredImage,
                  href: propsItem.href,
                  // heading: propsItem.title,
                  heading,
                  datePublished,
                  author,
                }}
              >
                <components.CollectionArticleFeaturedImage
                  {...{ components, poko, featuredImage }}
                />
                <components.CollectionArticleHeading
                  {...{
                    components,
                    href: propsItem.href,
                    // heading: propsItem.title,
                    heading,
                  }}
                />
                <components.CollectionArticleFooter
                  {...{ components, datePublished, author }}
                />
              </components.CollectionArticle>
            ) : null;
          })}
      </components.CollectionWrapper>
    ) : null;
  },
  CollectionWrapper,
  CollectionArticle,
  CollectionArticleFeaturedImage,
  CollectionArticleHeading,
  CollectionArticleFooter,
  CollectionPageHeader: ({ components, poko, ...props }) => {
    const ld = props.jsonld || {};
    const featuredImage = props.featuredImage || ld.image?.[0] || ld.image;
    const author = props.author || ld.author.name;
    const datePublished = props.datePublished || ld.datePublished?.start;

    return (
      <header class="stack" style="--gap: 1rem;">
        {featuredImage ? (
          <components.ImgLazy {...{ poko, ...featuredImage }} />
        ) : null}
        {datePublished || author ? (
          <div class="cluster">
            <div style="--gap: 1ch;">
              {datePublished ? (
                <components.p>
                  On <time datetime={datePublished}>{datePublished}</time>
                </components.p>
              ) : null}
              {author ? <components.p>by {author}</components.p> : null}
            </div>
          </div>
        ) : null}
        {props.title && <h1>{props.title}</h1>}
        <hr />
      </header>
    );
  },
  SearchBar: ({
    collectionId: _collectionId,
    id,
    placeholder = "search",
    components,
    poko,
    searchbar,
    ...props
  }) => {
    const collection = poko.collections.filter((page) => {
      return (
        page.data.id.replaceAll("-", "") === _collectionId?.replaceAll("-", "")
      );
    })[0];
    const collectionId = collection.data.id;
    // const scriptId = `searchbar-script-${collectionId}${id ? `-${id}` : ""}`;
    const styleId = `searchbar-style-${collectionId}${id ? `-${id}` : ""}`;
    const inputId = `searchbar-input-${collectionId}${id ? `-${id}` : ""}`;

    if (!collection) return null;

    // const [inputTerm, setInputTerm] = preactHooks.useState("");

    // const stylesForChildren = preactHooks.useMemo(() => {
    //   const doNotMatchSelector = collection.children
    //     .filter((article) => {
    //       // const { id, status, codeName, props } = article?.data || {}
    //       // console.log(article);
    //       if (article?.data?.codeName.match(inputTerm)) {
    //         return false;
    //       }
    //       return true;
    //     })
    //     .map((child) => `[data-id="${child.data.id}"]`)
    //     .join(",");

    //   return doNotMatchSelector ? `${doNotMatchSelector}{display: none;}` : "";
    // }, [inputTerm, collection.children]);

    const childrenMatchingArray = collection.children?.map((child) => {
      const str = [child.data.codeName].join(" ").toLowerCase();
      return {
        id: child.data.id,
        str,
      };
    });
    return (
      <>
        <style
          id={styleId}
          // dangerouslySetInnerHTML={{
          //   __html: stylesForChildren,
          // }}
        />
        <div {...searchbar} class={`searchbar ${searchbar?.class || ""}`}>
          {placeholder && (
            <label
              htmlFor={inputId}
              style={{
                position: "absolute",
                left: "-10000px",
                top: "auto",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              {placeholder || ""}
            </label>
          )}
          <input
            id={inputId}
            name="search"
            type="text"
            placeholder={placeholder || ""}
            // value={inputTerm}
            // onInput={(e) => {
            //   console.log(e);
            //   setInputTerm(e.target.value);
            // }}
            data-matching-array={JSON.stringify(childrenMatchingArray)}
            oninput={`
              const stylesEl = document.getElementById("${styleId}");

              const val = this.value.toLowerCase();
              const matchingArray = JSON.parse(this.dataset.matchingArray);
              const doNotMatchSelector = matchingArray
                .filter(({str}) => !str.match(val))
                .map(({id}) => '[data-id="' + id + '"]')
                .join(",");
              
              stylesEl.innerHTML = doNotMatchSelector ? doNotMatchSelector + '{display: none;}' : '';
            `}
          />
          {/* <script
            id={scriptId}
            dangerouslySetInnerHTML={{
              __html: `
            const source = document.getElementById('${inputId}');
            // const result = document.getElementById('result');

            const inputHandler = function(e) {
              console.log(e.target.value)
              // result.innerHTML = e.target.value;
            }

            source.addEventListener('input', inputHandler);
            source.addEventListener('propertychange', inputHandler); // for IE8
            `,
            }}
          /> */}
        </div>
      </>
    );
  },
  // Columns: ({ blockId }) => {
  //   const block = getBlock(websiteTree, blockId);
  //   return block?.children?.length ? (
  //     <ColumnsWrapper>
  //       {block.children.map((c) => (
  //         <Col {...c} />
  //       ))}
  //     </ColumnsWrapper>
  //   ) : null;
  // },
  // ColumnsWrapper,
  // Col,
  // Column: () => null,
  //
  // Test: () => {
  //   return (
  //     <Poko>{({ poko }) => <div>{poko?.pages?.[1]?.data?.codeName}</div>}</Poko>
  //   );
  // },
};

export default components;
