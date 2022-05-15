import { visitParents } from "unist-util-visit-parents";
// import { store } from "@services/notion.js";
import { notionHelpers } from "@src/utils/index.mjs";
import poko from "@poko";
import Anon from "@components/Anon.jsx";

const { websiteTree } = poko;

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

const CollectionWrapper = (props) => <div class="grid" {...props} />;
const CollectionArticle = ({ collection, ...props }) => {
  const titlePropName = props?.data?.raw?._titlePropName;
  const title = props.data.props[titlePropName];
  const href = `/${props.data.path}`;
  // console.log(title);
  return (
    <article>
      <h3>
        <a {...{ href }}>{title}</a>
      </h3>
    </article>
  );
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
  a: ({ children, components, href, ...props }) => <Anon {...{ tag: 'a', children, href, ...props?.a }} />, // prettier-ignore
  blockquote: ({ children, components, ...props }) => <Anon {...{ tag: 'blockquote', children, ...props?.blockquote }} />, // prettier-ignore
  br: ({ children, components, ...props }) => <Anon {...{ tag: 'br', children, ...props?.br }} />, // prettier-ignore
  code: ({ children, components, ...props }) => <Anon {...{ tag: 'code', children, ...props?.code }} />, // prettier-ignore
  em: ({ children, components, ...props }) => <Anon {...{ tag: 'em', children, ...props?.em }} />, // prettier-ignore
  h1: ({ children, components, ...props }) => <Anon {...{ tag: 'h1', children, ...props?.h1 }} />, // prettier-ignore
  h2: ({ children, components, ...props }) => <Anon {...{ tag: 'h2', children, ...props?.h2 }} />, // prettier-ignore
  h3: ({ children, components, ...props }) => <Anon {...{ tag: 'h3', children, ...props?.h3 }} />, // prettier-ignore
  h4: ({ children, components, ...props }) => <Anon {...{ tag: 'h4', children, ...props?.h4 }} />, // prettier-ignore
  h5: ({ children, components, ...props }) => <Anon {...{ tag: 'h5', children, ...props?.h5 }} />, // prettier-ignore
  h6: ({ children, components, ...props }) => <Anon {...{ tag: 'h6', children, ...props?.h6 }} />, // prettier-ignore
  hr: ({ children, components, ...props }) => <Anon {...{ tag: 'hr', children, ...props?.hr }} />, // prettier-ignore
  img: ({ children, components, ...props }) => <Anon {...{ tag: 'img', children, ...props?.img }} />, // prettier-ignore
  li: ({ children, components, ...props }) => <Anon {...{ tag: 'li', children, ...props?.li }} />, // prettier-ignore
  ol: ({ children, components, ...props }) => <Anon {...{ tag: 'ol', children, ...props?.ol }} />, // prettier-ignore
  p: ({ children, components, ...props }) => <Anon {...{ tag: 'p', children, ...props?.p }} />, // prettier-ignore
  pre: ({ children, components, ...props }) => <Anon {...{ tag: 'pre', children, ...props?.pre }} />, // prettier-ignore
  strong: ({ children, components, ...props }) => <Anon {...{ tag: 'strong', children, ...props?.strong }} />, // prettier-ignore
  ul: ({ children, components, ...props }) => <Anon {...{ tag: 'ul', children, ...props?.ul }} />, // prettier-ignore
  // With remark-gfm (see guide) you can also use:
  del: ({ children, components, ...props }) => <Anon {...{ tag: 'del', children, ...props?.del }} />, // prettier-ignore
  input: ({ children, components, ...props }) => <Anon {...{ tag: 'input', children, ...props?.input }} />, // prettier-ignore
  section: ({ children, components, ...props }) => <Anon {...{ tag: 'section', children, ...props?.section }} />, // prettier-ignore
  sup: ({ children, components, ...props }) => <Anon {...{ tag: 'sup', children, ...props?.sup }} />, // prettier-ignore
  table: ({ children, components, ...props }) => <Anon {...{ tag: 'table', children, ...props?.table }} />, // prettier-ignore
  tbody: ({ children, components, ...props }) => <Anon {...{ tag: 'tbody', children, ...props?.tbody }} />, // prettier-ignore
  td: ({ children, components, ...props }) => <Anon {...{ tag: 'td', children, ...props?.td }} />, // prettier-ignore
  th: ({ children, components, ...props }) => <Anon {...{ tag: 'th', children, ...props?.th }} />, // prettier-ignore
  thead: ({ children, components, ...props }) => <Anon {...{ tag: 'thead', children, ...props?.thead }} />, // prettier-ignore
  tr: ({ children, components, ...props }) => <Anon {...{ tag: 'tr', children, ...props?.tr }} />, // prettier-ignore
  // Other normal elements
  main: ({ children, components, ...props }) => <Anon {...{ tag: 'main', children, ...props?.main }} />, // prettier-ignore
  footer: ({ children, components, ...props }) => <Anon {...{ tag: 'footer', children, ...props?.footer }} />, // prettier-ignore
  header: ({ children, components, ...props }) => <Anon {...{ tag: 'header', children, ...props?.header }} />, // prettier-ignore
  // header: ({ children, components, ...props }) => {
  //   // console.log({ children, props: props?.header})
  //   return <Anon {...{ tag: 'header', children, ...props?.header }} />
  // }, // prettier-ignore
  aside: ({ children, components, ...props }) => <Anon {...{ tag: 'aside', children, ...props?.aside }} />, // prettier-ignore
  article: ({ children, components, ...props }) => <Anon {...{ tag: 'article', children, ...props?.article }} />, // prettier-ignore

  // --- SPECIAL COMPONENTS --- //
  wrapper: ({ children, components, ...props }) => {
    return (
      <>
        <components.Menu {...{ components, ...props }} />
        <components.header {...{ components, ...props }} />
        <components.main {...{ components, ...props }}>
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
        <components.header {...{ components, ...props }} />
        <components.main {...{ components, ...props }}>
          {children}
        </components.main>
        <components.footer />
      </>
    );
  },
  Menu: ({ children, components, ...props }) => {
    const topLevelPages = poko?.websiteTree?.children
      .filter((block) => {
        return block.data.role === "page" || block.data.role === "collection";
      })
      .map((block) => {
        const page = block.children[0];
        if (page.data.role === "collection") {
          // console.log(page.data.raw.title);
        }
        return {
          title: page?.data.props.title,
          codeName: page?.data.codeName,
          href: `/${page.data.path}`,
        };
      });
    const indexPage = topLevelPages.find((p) => p.codeName === "index");
    const otherPages = topLevelPages.filter((p) => p.codeName !== "index");

    return (
      <nav class="container">
        <ul>
          {indexPage && indexPage.title && (
            <li>
              <strong>
                <a href={indexPage.href}>{indexPage.title}</a>
              </strong>
            </li>
          )}
        </ul>

        <ul>
          {otherPages &&
            otherPages.map(({ href, title, codeName }) => (
              <li>
                <a {...{ href }}>{title || codeName}</a>
              </li>
            ))}
        </ul>
      </nav>
    );
  },
  ChildPage: () => null,
  Collection: ({ ...props }) => {
    // Need to find the page that is a child of this block
    const { blockId, collectionName } = props;
    const getColl = () => {
      let _collection;
      visitParents(
        websiteTree,
        (node) => node.data.id === blockId,
        (node) => {
          visitParents(
            websiteTree,
            (node) => node.data.codeName === collectionName,
            (node) => {
              _collection = node;
            }
          );
        }
      );
      // We can get an 'undefined' collection object if User uses a DB view
      return _collection;
    };
    const collection = getColl();

    return collection ? (
      <CollectionWrapper>
        {collection?.children?.map((props) => (
          <CollectionArticle {...{ collection, ...props }} />
        ))}
      </CollectionWrapper>
    ) : null;
  },
  CollectionWrapper,
  CollectionArticle,
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
};

export default components;
