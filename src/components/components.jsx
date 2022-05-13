// import { store } from "@services/notion.js";
import { notionHelpers } from "@src/utils/index.mjs";
import poko from "@poko";

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
  a: (props) => <a {...props?.a} />,
  blockquote: (props) => <blockquote {...props?.blockquote} />,
  br: (props) => <br {...props?.br} />,
  code: (props) => <code {...props?.code} />,
  em: (props) => <em {...props?.em} />,
  h1: (props) => <h1 {...props?.h1} />,
  h2: (props) => <h2 {...props?.h2} />,
  h3: (props) => <h3 {...props?.h3} />,
  h4: (props) => <h4 {...props?.h4} />,
  h5: (props) => <h5 {...props?.h5} />,
  h6: (props) => <h6 {...props?.h6} />,
  hr: (props) => <hr {...props?.hr} />,
  img: (props) => <img {...props?.img} />,
  li: (props) => <li {...props?.li} />,
  ol: (props) => <ol {...props?.ol} />,
  p: (props) => <p {...props?.p} />,
  pre: (props) => <pre {...props?.pre} />,
  strong: (props) => <strong {...props?.strong} />,
  ul: (props) => <ul {...props?.ul} />,
  // With remark-gfm (see guide) you can also use:
  del: (props) => <del {...props?.del} />,
  input: (props) => <input {...props?.input} />,
  section: (props) => <section {...props?.section} />,
  sup: (props) => <sup {...props?.sup} />,
  table: (props) => <table {...props?.table} />,
  tbody: (props) => <tbody {...props?.tbody} />,
  td: (props) => <td {...props?.td} />,
  th: (props) => <th {...props?.th} />,
  thead: (props) => <thead {...props?.thead} />,
  tr: (props) => <tr {...props?.tr} />,
  // Other normal elements
  main: (props) => <main {...props?.main} />,
  footer: (props) => <footer {...props?.footer} />,
  header: (props) => <header {...props?.header} />,
  aside: (props) => <aside {...props?.aside} />,
  article: (props) => <article {...props?.article} />,

  // --- SPECIAL COMPONENTS --- //
  wrapper: ({ children, components, ...props }) => {
    return (
      <>
        {components.menu && <components.menu {...{ components, ...props }} />}
        {components.header && (
          <components.header {...{ components, ...props }} />
        )}
        {components.main ? (
          <components.main {...{ components, ...props }}>
            {children}
          </components.main>
        ) : (
          <main>{children}</main>
        )}
        {components.footer && <components.footer />}
      </>
    );
  },
  Layout: ({ children, components, ...props }) => {
    return (
      <>
        {components.menu && <components.menu {...{ components, ...props }} />}
        {components.header && (
          <components.header {...{ components, ...props }} />
        )}
        {components.main ? (
          <components.main {...{ components, ...props }}>
            {children}
          </components.main>
        ) : (
          <main>{children}</main>
        )}
        {components.footer && <components.footer />}
      </>
    );
  },
};

export default components;
