#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const file = process.argv[2];

if (!file) {
  console.error("Usage: validate-zatca-xml.mjs <file>");
  process.exit(1);
}

const contents = await readFile(file, "utf8");

if (!contents.includes("<Invoice")) {
  console.error("Missing <Invoice root element.");
  process.exit(1);
}

if (!contents.includes("<cbc:ID")) {
  console.error("Missing invoice identifier.");
  process.exit(1);
}

console.log("Basic XML checks passed.");
