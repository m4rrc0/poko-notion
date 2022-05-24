#! /usr/bin/env node

import fetchAhead from "./index.mjs";

async function start() {
  console.log("\nFETCHING ONCE\n");
  await fetchAhead();
}

start();
