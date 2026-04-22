#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const problems = [];

function require(file, message) {
  if (!existsSync(path.join(root, file))) {
    problems.push(`${file}: ${message}`);
  }
}

require("package.json", "Missing package.json at repository root.");

const ciPaths = [
  ".github/workflows",
  ".gitlab-ci.yml",
  ".circleci/config.yml",
  "azure-pipelines.yml",
  "bitbucket-pipelines.yml",
];
const hasAnyCi = ciPaths.some((candidate) =>
  existsSync(path.join(root, candidate)),
);
if (!hasAnyCi) {
  problems.push(
    "No CI configuration found. Add a pipeline that lints, typechecks, tests, and builds on pull requests.",
  );
}

const packageJsonPath = path.join(root, "package.json");
if (existsSync(packageJsonPath)) {
  const manifest = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const scripts = manifest.scripts ?? {};
  for (const required of ["lint", "test", "build"]) {
    if (!(required in scripts)) {
      problems.push(`package.json: missing "${required}" script.`);
    }
  }
}

if (problems.length === 0) {
  console.log("CI smoke check passed. This is a structural check, not a guarantee.");
  process.exit(0);
}

console.error("CI smoke check found issues:");
for (const issue of problems) {
  console.error(`- ${issue}`);
}
process.exit(1);
