// import * as runtime from "../../node_modules/react/jsx-runtime.js";
// console.log({ runtime });

// import { compile, evaluate } from "@mdx-js/mdx";
// const str = `export const Thing = () => <>World!</>
// # Hello, <Thing />`;

// const { default: MDXContent } = await evaluate(str, { ...runtime.default });

// export default MDXContent({});

export default ({ mdxEvaluated }) => {
  //   const compiled = compile(str);
  //   console.log({ mdxEvaluated });
  //   const Comp = mdxEvaluated.default;
  return <mdxEvaluated.default />;
};

// import {compile} from '@mdx-js/mdx'

// main()

// async function main() {
//   const compiled = await compile(str)
//   console.log(String(compiled))
// }

// import Imported from "../../imported/test.mdx";

// export default () => {
//   //   const Imported = await import("../../imported/test.mdx");

//   return <Imported />;
// };
