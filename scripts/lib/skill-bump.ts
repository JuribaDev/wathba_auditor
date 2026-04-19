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

const SEMVER_CORE = /^(\d+)\.(\d+)\.(\d+)/;

export type SemverTriplet = {
  major: number;
  minor: number;
  patch: number;
};

export function parseSemverCore(version: string): SemverTriplet | null {
  const match = version.trim().match(SEMVER_CORE);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function compareSemverCore(a: SemverTriplet, b: SemverTriplet): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
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
  return "patch";
}
