#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error("Usage: scan-for-secrets.mjs <file> [<file> ...]");
  process.exit(1);
}

const patterns = [
  { name: "AWS access key", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "Private key header", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "Generic bearer token", regex: /\b[Bb]earer\s+[A-Za-z0-9-_\.=]{20,}/ },
  { name: "Slack webhook", regex: /https:\/\/hooks\.slack\.com\/services\/[A-Z0-9\/]+/ },
  { name: "Generic long hex token", regex: /\b[a-f0-9]{40,}\b/ },
];

let found = false;

for (const file of files) {
  const contents = await readFile(file, "utf8");
  for (const pattern of patterns) {
    if (pattern.regex.test(contents)) {
      console.error(`Possible ${pattern.name} found in ${file}`);
      found = true;
    }
  }
}

if (found) {
  console.error(
    "Resolve findings before committing. Rotate any value that was already pushed.",
  );
  process.exit(1);
}

console.log("No obvious secrets found. This scan is a safety net, not a guarantee.");
