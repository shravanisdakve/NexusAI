# Changes Plan

## 1) What is best for the project long term?

The best long-term approach is to **stabilize by layers** instead of mixing everything in one large change.

Why this is better:

- Keeps risk low and makes regressions easier to detect.
- Makes code reviews clear and faster.
- Makes rollback safe if one layer fails.
- Preserves momentum without losing existing work.

Recommended layer order:

1. University data realism
2. Localization depth
3. Test breadth and CI gates

---

## 2) What is a "dirty state"?

A dirty state means your Git working tree has uncommitted differences from HEAD:

- Modified tracked files
- Untracked new files
- Possibly mixed concerns in the same working tree

In your repo, we currently have many modified and untracked files at once. That is a dirty state.

### Why this is risky

- Accidental commits of unrelated work
- Hard to know which change caused a bug
- Bigger merge conflicts later
- Difficult rollback and release confidence

---

## 3) How to fix dirty state safely

### Option A (recommended): Snapshot everything first

Use this when you want to preserve all current work before cleanup.

```powershell
git checkout -b chore/snapshot-current-state
git add -A
git commit -m "chore: snapshot current workspace before layered hardening"
```

Then start clean layer branches from that snapshot:

```powershell
git checkout -b feat/layer-1-university-realism
git checkout -b feat/layer-2-i18n-coverage
git checkout -b feat/layer-3-test-breadth
```

### Option B: Keep only selected files

Use this if part of the current work is experimental and should not be in baseline.

```powershell
git checkout -b chore/snapshot-selective
git add <only-files-you-want>
git commit -m "chore: selective baseline snapshot"
```

Then move remaining experimental files to a separate branch.

---

## 4) What I will do (layer-by-layer)

I will **not rewrite unrelated files**. I will apply targeted changes only.

### Layer 1: University realism

- Keep DB-backed models/routes already present (`UniversityCircular`, `UniversitySchedule`, `UniversityLink`).
- Harden sync behavior:
  - source URL validation
  - dedupe consistency by `sourceHash`
  - predictable fallback if remote fetch fails
  - explicit sync metadata in API response
- Add/extend tests for university logic and sync route behavior.

### Layer 2: Localization depth

- Replace remaining hardcoded user-facing strings with `t()` keys.
- Expand `contexts/i18n.ts` with missing keys for `en`, `mr`, `hi`.
- Keep key naming consistent by feature namespace.

### Layer 3: Test breadth

- Expand backend tests beyond utility-only coverage.
- Add route-level tests for critical APIs:
  - university
  - placement
  - personalization
- Add CI-ready test command validation and keep tests deterministic.

---

## 5) Exact steps you should do now

Run these in order:

1. Create safety snapshot branch and commit current state.

```powershell
git checkout -b chore/snapshot-current-state
git add -A
git commit -m "chore: snapshot current workspace before layered hardening"
```

2. Tell me to start Layer 1 from this baseline.

3. After I finish each layer, you review and commit before next layer.

Suggested commit rhythm:

- `feat(university): harden data sync and fallback behavior`
- `feat(i18n): complete translation key coverage`
- `test(api): add route-level coverage for core modules`

4. After all layers are done, run final validation:

```powershell
npm run build
cd backend
npm test
```

---

## 6) What not to do

- Do not use destructive cleanup (`git reset --hard`) on this workspace.
- Do not bundle all three layers into one commit.
- Do not skip snapshotting while repo is dirty.
