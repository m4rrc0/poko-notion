#! /usr/bin/env node

import fetchAhead from "./index.mjs";

async function start() {
  let param = process.argv[3] || process.argv[2];
  param = param ? param.replace(/-/g, "") : 120000;
  param = +param;
  const delay = Number.isNaN(param) ? 120000 : param;
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
