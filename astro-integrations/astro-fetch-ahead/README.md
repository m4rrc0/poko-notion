`astro-fetch-ahead` is a minimal Astro integration. Its only role is to execute an async function before the actual build begins.

The goals of using this could be:

- to execute the code only once even on dev
- to run code early and potentially fail early too
- to play with meaningful Astro paths without interfering with the dev server or build process (for example, for dumping assets in the public/ directory).
