import { h } from "preact";

const Anon = ({ tag, children, ...props }) => {
  return typeof tag === "string" && (children || Object.keys(props).length)
    ? h(tag, props, children)
    : undefined;
};

export default Anon;
