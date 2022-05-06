import { h } from "preact";

const Anon = ({ tag, children, ...props }) => h(tag, props, children);

export default Anon;
