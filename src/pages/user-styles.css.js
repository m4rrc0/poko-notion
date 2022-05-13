import poko from "@poko";

export async function get() {
  const globalStylesString = poko?.settings?.data?.globalStylesString;

  return {
    body: globalStylesString,
  };
}
