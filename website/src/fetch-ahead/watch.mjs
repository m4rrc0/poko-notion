#! /usr/bin/env node

import fetchAhead from "./index.mjs";

async function start() {
  const param = process.argv[3];
  const delay = param ? +param : 120000;
  const delaySec = delay / 1000;

  console.log(`\nWATCHING STARTS - delay: ${delaySec}s\n`);

  // let timer = delaySec - 10;
  // setInterval(() => {
  //   if (timer !== delaySec && timer !== 0) {
  //     console.log(`Fetching in ${timer}s`);
  //   }
  //   timer = timer - 10;
  // }, 10000);

  setInterval(async () => {
    console.log("\nFETCHING STARTS\n");
    await fetchAhead();
    console.log("\nFETCH ENDED\n");
    // timer = delaySec;
  }, delay);
}

start();
