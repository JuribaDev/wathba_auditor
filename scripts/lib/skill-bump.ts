export type BumpLevel = "none" | "patch" | "minor" | "major";

const BUMP_RANK: Record<BumpLevel, number> = {
  none: 0,
  patch: 1,
  minor: 2,
  major: 3,
};

export function rankBump(level: BumpLevel): number {
  return BUMP_RANK[level];
}

export function stricterBump(a: BumpLevel, b: BumpLevel): BumpLevel {
  return rankBump(a) >= rankBump(b) ? a : b;
}

// Full SemVer parser that preserves prerelease identifiers and discards build
// metadata (per SemVer §9–10, build metadata does not affect precedence).
const SEMVER_FULL =
  /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export type PrereleaseIdentifier = string | number;

export type SemverTriplet = {
  major: number;
  minor: number;
  patch: number;
  prerelease: PrereleaseIdentifier[] | null;
};

function toIdentifier(raw: string): PrereleaseIdentifier {
  return /^(?:0|[1-9]\d*)$/.test(raw) ? Number(raw) : raw;
}

export function parseSemverCore(version: string): SemverTriplet | null {
  const match = version.trim().match(SEMVER_FULL);
  if (!match) return null;
  const [, major, minor, patch, pre] = match;
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    prerelease: pre ? pre.split(".").map(toIdentifier) : null,
  };
}

function comparePrerelease(
  a: PrereleaseIdentifier[] | null,
  b: PrereleaseIdentifier[] | null,
): number {
  // A release version has higher precedence than any prerelease (SemVer §11.3).
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    const ai = a[i];
    const bi = b[i];
    // A longer prerelease chain beats a shorter one when all shared parts are
    // equal (SemVer §11.4.4).
    if (ai === undefined) return -1;
    if (bi === undefined) return 1;
    const aIsNum = typeof ai === "number";
    const bIsNum = typeof bi === "number";
    // Numeric identifiers always sort lower than alphanumeric (SemVer §11.4.3).
    if (aIsNum && !bIsNum) return -1;
    if (!aIsNum && bIsNum) return 1;
    if (ai < bi) return -1;
    if (ai > bi) return 1;
  }
  return 0;
}

export function compareSemverCore(a: SemverTriplet, b: SemverTriplet): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  return comparePrerelease(a.prerelease, b.prerelease);
}

export function classifyActualBump(
  oldVersion: string,
  newVersion: string,
): BumpLevel | "invalid" | "regressed" {
  const previous = parseSemverCore(oldVersion);
  const next = parseSemverCore(newVersion);
  if (!previous || !next) return "invalid";

  const comparison = compareSemverCore(next, previous);
  if (comparison < 0) return "regressed";
  if (comparison === 0) return "none";

  if (next.major > previous.major) return "major";
  if (next.minor > previous.minor) return "minor";
  if (next.patch > previous.patch) return "patch";
  // Same core triple but the prerelease identifier advanced (or the version
  // left prerelease for release). Count this as a patch-level bump.
  return "patch";
}
