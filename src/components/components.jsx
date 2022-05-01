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
  a: ({ style, ...props }) => (
    <a style={{ color: "red", ...style }} {...props} />
  ),
  blockquote: "blockquote",
  br: "br",
  code: "code",
  em: "em",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  hr: "hr",
  img: "img",
  li: "li",
  ol: "ol",
  p: "p",
  pre: "pre",
  strong: "strong",
  ul: "ul",
  // With remark-gfm (see guide) you can also use:
  del: "del",
  input: "input",
  section: "section",
  sup: "sup",
  table: "table",
  tbody: "tbody",
  td: "td",
  th: "th",
  thead: "thead",
  tr: "tr",

  // --- SPECIAL COMPONENTS --- //
  Layout: ({ children }) => {
    return (
      <>
        <button>Layout from CODE</button>
        <main>{children}</main>
      </>
    );
  },
  wrapper: ({ children }) => {
    return (
      <>
        <button>Layout from wrapper component</button>
        <main>{children}</main>
      </>
    );
  },
};

export default components;
