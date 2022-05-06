// import { store } from "../services/notion.js";

export async function get() {
  //   const { settings: { globalStylesString } = {} } = store;

  return {
    body: process.env.POKO_GLOBAL_STYLES_STRING,
  };
}
