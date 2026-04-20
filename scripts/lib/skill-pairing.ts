import type { SkillSnapshotInput } from "./skill-diff";

export type SkillPair =
  | {
      kind: "compared";
      current: SkillSnapshotInput;
      old: SkillSnapshotInput;
      currentDirectory: string;
      oldDirectory: string;
      renamed: boolean;
      idChanged: boolean;
    }
  | {
      kind: "new";
      current: SkillSnapshotInput;
      currentDirectory: string;
    }
  | {
      kind: "removed";
      old: SkillSnapshotInput;
      oldDirectory: string;
    };

export type PairingInputs = {
  changedDirectories: readonly string[];
  currentByDirectory: Map<string, SkillSnapshotInput>;
  currentById: Map<string, SkillSnapshotInput>;
  oldByDirectory: Map<string, SkillSnapshotInput>;
  oldById: Map<string, SkillSnapshotInput>;
};

export function directoryOfSnapshot(
  snapshot: SkillSnapshotInput,
  lookup: Map<string, string>,
): string | undefined {
  return lookup.get(snapshot.id);
}

export type UnresolvedMigration = {
  added: SkillSnapshotInput[];
  removed: SkillSnapshotInput[];
};

// After the pairing passes complete, any remaining "new" + "removed"
// combination is ambiguous: we cannot prove whether it is an identity
// migration (id + slug + body all rewritten in one PR) or two genuine
// independent changes. Governance surfaces these so a reviewer MUST
// confirm intent, either by:
//   (a) adding `previous_id: [<old-id>]` to the new skill's skill.yaml
//       (governance will then pair them and enforce the major bump), or
//   (b) splitting the unrelated changes into separate PRs
//       (per CONTRIBUTING → "When to split a pull request").
export function findUnresolvedMigrations(
  pairs: readonly SkillPair[],
): UnresolvedMigration | null {
  const added: SkillSnapshotInput[] = [];
  const removed: SkillSnapshotInput[] = [];
  for (const pair of pairs) {
    if (pair.kind === "new") added.push(pair.current);
    else if (pair.kind === "removed") removed.push(pair.old);
  }
  if (added.length === 0 || removed.length === 0) return null;
  return { added, removed };
}

// Pair each changed directory with its matching snapshot from the base ref.
//
// The rules:
//   1. If both old and current snapshots exist at the same directory, pair
//      them there. This handles in-place edits, including in-place `id`
//      changes (where old.id !== current.id at the same path).
//   2. If only a current snapshot exists at the directory, look the skill
//      up in the old-by-id index to resolve slug/folder renames.
//      If no match exists, the skill is genuinely new.
//   3. If only an old snapshot exists at the directory, check whether that
//      id still exists anywhere in the current tree (a rename pointing
//      outward). If it does and that target directory is not already
//      scheduled via rule 1 or 2, pair here. Otherwise report removal.
//
// Every skill is emitted exactly once, regardless of how many of its
// files were touched or where it lives after the change.
export function pairSkills(inputs: PairingInputs): SkillPair[] {
  const {
    changedDirectories,
    currentByDirectory,
    currentById,
    oldByDirectory,
    oldById,
  } = inputs;

  const currentDirById = new Map<string, string>();
  for (const [dir, snapshot] of currentByDirectory) {
    currentDirById.set(snapshot.id, dir);
  }

  const oldDirById = new Map<string, string>();
  for (const [dir, snapshot] of oldByDirectory) {
    oldDirById.set(snapshot.id, dir);
  }

  const pairs: SkillPair[] = [];
  const handledIds = new Set<string>();

  const orderedDirs = Array.from(new Set(changedDirectories)).sort();

  // Pass 1 — directories present in both trees.
  for (const dir of orderedDirs) {
    const current = currentByDirectory.get(dir);
    const old = oldByDirectory.get(dir);
    if (current && old) {
      pairs.push({
        kind: "compared",
        current,
        old,
        currentDirectory: dir,
        oldDirectory: dir,
        renamed: false,
        idChanged: current.id !== old.id,
      });
      handledIds.add(current.id);
      handledIds.add(old.id);
    }
  }

  // Pass 2 — explicit `previous_id` declaration on the new skill. When a
  // contributor performs a full identity migration (id + slug + body rewrite
  // in one PR), no structural key can bridge the old and new snapshots. The
  // canonical signal is an array of prior ids declared on the new skill.
  for (const dir of orderedDirs) {
    const current = currentByDirectory.get(dir);
    if (!current) continue;
    if (handledIds.has(current.id)) continue;
    if (current.previousIds.length === 0) continue;
    let matchedOld: SkillSnapshotInput | undefined;
    let matchedPrevId: string | undefined;
    for (const prevId of current.previousIds) {
      const candidate = oldById.get(prevId);
      if (candidate && !handledIds.has(prevId)) {
        matchedOld = candidate;
        matchedPrevId = prevId;
        break;
      }
    }
    if (matchedOld && matchedPrevId) {
      const oldDirectory = oldDirById.get(matchedPrevId) ?? "<unknown>";
      pairs.push({
        kind: "compared",
        current,
        old: matchedOld,
        currentDirectory: dir,
        oldDirectory,
        renamed: oldDirectory !== dir,
        idChanged: matchedOld.id !== current.id,
      });
      handledIds.add(current.id);
      handledIds.add(matchedPrevId);
    }
  }

  // Pass 3 — new current directories without a base counterpart at the same
  // path: attempt an id-based rename match, otherwise emit "new".
  for (const dir of orderedDirs) {
    const current = currentByDirectory.get(dir);
    if (!current) continue;
    if (handledIds.has(current.id)) continue;
    const renamedFrom = oldById.get(current.id);
    if (renamedFrom) {
      const oldDirectory = oldDirById.get(current.id) ?? "<unknown>";
      pairs.push({
        kind: "compared",
        current,
        old: renamedFrom,
        currentDirectory: dir,
        oldDirectory,
        renamed: oldDirectory !== dir,
        idChanged: false,
      });
      handledIds.add(current.id);
    } else {
      pairs.push({
        kind: "new",
        current,
        currentDirectory: dir,
      });
      handledIds.add(current.id);
    }
  }

  // Pass 4 — directories that disappeared at HEAD: check whether the id
  // moved elsewhere (rename target not listed in changedDirectories for
  // some reason) or whether the skill was genuinely removed.
  for (const dir of orderedDirs) {
    const old = oldByDirectory.get(dir);
    if (!old) continue;
    if (handledIds.has(old.id)) continue;
    const moved = currentById.get(old.id);
    if (moved) {
      const currentDirectory = currentDirById.get(old.id) ?? "<unknown>";
      pairs.push({
        kind: "compared",
        current: moved,
        old,
        currentDirectory,
        oldDirectory: dir,
        renamed: currentDirectory !== dir,
        idChanged: false,
      });
    } else {
      pairs.push({
        kind: "removed",
        old,
        oldDirectory: dir,
      });
    }
    handledIds.add(old.id);
  }

  // Pass 5 — exact SKILL.md body match as a rename inference for legacy
  // PRs that did not declare `previous_id`. If a "new" entry shares its
  // body with a "removed" entry, treat them as a paired migration.
  //
  // Covers: same-content rename where the contributor forgot to set
  // `previous_id`. Does NOT cover: id + slug + body rewrite in one PR.
  // Those cases land as `new` + `removed` and are flagged by the caller
  // as unresolved_migration so governance cannot silently skip them.
  const unpairedNew = pairs.filter(
    (pair): pair is Extract<SkillPair, { kind: "new" }> => pair.kind === "new",
  );
  const unpairedRemoved = pairs.filter(
    (pair): pair is Extract<SkillPair, { kind: "removed" }> =>
      pair.kind === "removed",
  );

  if (unpairedNew.length > 0 && unpairedRemoved.length > 0) {
    const claimedRemoved = new Set<string>();
    const promotedIds = new Set<string>();
    const merged: SkillPair[] = [];

    for (const fresh of unpairedNew) {
      const match = unpairedRemoved.find(
        (removed) =>
          !claimedRemoved.has(removed.old.id) &&
          removed.old.body.length > 0 &&
          removed.old.body === fresh.current.body,
      );
      if (!match) continue;
      claimedRemoved.add(match.old.id);
      promotedIds.add(fresh.current.id);
      merged.push({
        kind: "compared",
        current: fresh.current,
        old: match.old,
        currentDirectory: fresh.currentDirectory,
        oldDirectory: match.oldDirectory,
        renamed: fresh.currentDirectory !== match.oldDirectory,
        idChanged: fresh.current.id !== match.old.id,
      });
    }

    if (merged.length > 0) {
      return [
        ...pairs.filter((pair) => {
          if (pair.kind === "new") return !promotedIds.has(pair.current.id);
          if (pair.kind === "removed") return !claimedRemoved.has(pair.old.id);
          return true;
        }),
        ...merged,
      ];
    }
  }

  return pairs;
}
