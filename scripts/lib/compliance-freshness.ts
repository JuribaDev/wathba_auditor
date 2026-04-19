export type ComplianceFreshnessConfig = {
  lastVerifiedMaxDays: number;
  sourceAccessedMaxDays: number;
  now: Date;
};

export const DEFAULT_COMPLIANCE_FRESHNESS: Omit<ComplianceFreshnessConfig, "now"> = {
  lastVerifiedMaxDays: 180,
  sourceAccessedMaxDays: 180,
};

export type FreshnessInput = {
  id: string;
  slug: string;
  category: string;
  disclaimer: boolean;
  lastVerified: string;
  sources: Array<{ title: string; url: string; accessed: string }>;
};

export type FreshnessIssue = {
  code:
    | "missing-disclaimer"
    | "missing-sources"
    | "last-verified-stale"
    | "source-accessed-stale"
    | "invalid-date";
  field: string;
  message: string;
};

export type FreshnessResult = {
  skillId: string;
  issues: FreshnessIssue[];
};

function daysBetween(earlier: Date, later: Date): number {
  const diff = later.getTime() - earlier.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(timestamp)) return null;
  return new Date(timestamp);
}

export function evaluateComplianceFreshness(
  skill: FreshnessInput,
  config: ComplianceFreshnessConfig,
): FreshnessResult {
  const issues: FreshnessIssue[] = [];
  if (skill.category !== "compliance") {
    return { skillId: skill.id, issues };
  }

  if (!skill.disclaimer) {
    issues.push({
      code: "missing-disclaimer",
      field: "disclaimer",
      message:
        "Compliance skills must set disclaimer: true so the UI shows the engineering-guidance-only notice.",
    });
  }

  if (skill.sources.length === 0) {
    issues.push({
      code: "missing-sources",
      field: "sources",
      message:
        "Compliance skills must cite at least one authoritative source with an access date.",
    });
  }

  const verifiedDate = parseIsoDate(skill.lastVerified);
  if (!verifiedDate) {
    issues.push({
      code: "invalid-date",
      field: "last_verified",
      message: `last_verified "${skill.lastVerified}" is not a valid ISO calendar date.`,
    });
  } else {
    const age = daysBetween(verifiedDate, config.now);
    if (age > config.lastVerifiedMaxDays) {
      issues.push({
        code: "last-verified-stale",
        field: "last_verified",
        message: `last_verified is ${age} days old (limit: ${config.lastVerifiedMaxDays}). Re-read the law/standard, adjust the content if needed, and set last_verified to today (${config.now.toISOString().slice(0, 10)}).`,
      });
    }
  }

  for (const [index, source] of skill.sources.entries()) {
    const accessedDate = parseIsoDate(source.accessed);
    if (!accessedDate) {
      issues.push({
        code: "invalid-date",
        field: `sources[${index}].accessed`,
        message: `Source "${source.title}" has an invalid accessed date "${source.accessed}".`,
      });
      continue;
    }
    const age = daysBetween(accessedDate, config.now);
    if (age > config.sourceAccessedMaxDays) {
      issues.push({
        code: "source-accessed-stale",
        field: `sources[${index}].accessed`,
        message: `Source "${source.title}" was last accessed ${age} days ago (limit: ${config.sourceAccessedMaxDays}). Re-visit ${source.url} and update the accessed date.`,
      });
    }
  }

  return { skillId: skill.id, issues };
}

export function readConfigFromEnv(now: Date = new Date()): ComplianceFreshnessConfig {
  const override = (name: string, fallback: number) => {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };
  return {
    lastVerifiedMaxDays: override(
      "WATHBA_LAST_VERIFIED_MAX_DAYS",
      DEFAULT_COMPLIANCE_FRESHNESS.lastVerifiedMaxDays,
    ),
    sourceAccessedMaxDays: override(
      "WATHBA_SOURCE_ACCESSED_MAX_DAYS",
      DEFAULT_COMPLIANCE_FRESHNESS.sourceAccessedMaxDays,
    ),
    now,
  };
}
