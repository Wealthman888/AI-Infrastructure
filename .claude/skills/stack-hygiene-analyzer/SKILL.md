# Stack Hygiene Analyzer

## Skill Purpose
Audit the health of a client's codebase and toolchain itself — dependency staleness, version drift across services, dead code, and missing engineering governance files. This is the "is the house in order" check: it doesn't find security vulnerabilities (`trivy-scan`) or cost waste (`cloud-waste-scout`), it finds the accumulated rot that slows teams down and makes everything else riskier to change.

## When to Use
- Part of a full `/infra-audit` run (Stack Hygiene category)
- User asks "how outdated is our stack," "audit our dependencies," or "why does everything feel fragile here"
- Triggered by `/infra-audit hygiene <repo>`
- Before a major version upgrade or a new engineer onboarding, to baseline current state

## How to Execute

### Step 1: Dependency Staleness

Run the relevant outdated-dependency check per ecosystem found in the repo:

```bash
# Node.js
npm outdated --json
# Python
pip list --outdated --format=json
# Go
go list -u -m all
# Ruby
bundle outdated
```

For each dependency, capture: current version, latest version, how many major versions behind, and whether the gap crosses a major version boundary (breaking changes likely).

Flag separately:
- Dependencies with **no commits in 2+ years** upstream (abandoned — check GitHub last-commit date)
- Dependencies **flagged deprecated** by the package registry itself
- **Direct** vs **transitive** outdated deps (direct deps are the client's responsibility to bump; transitive ones may need a parent bump)

### Step 2: Version Consistency (Monorepo / Multi-Service)

If the codebase has multiple services/packages, check whether they agree on:
- Language/runtime version (Node, Python, Go version pinned per service)
- Shared internal library versions (are all services on the same version of the company's own shared package?)
- Lockfile presence and freshness (`package-lock.json`/`yarn.lock`/`poetry.lock`/`go.sum` committed and not stale relative to the manifest)

```bash
# Quick lockfile drift check (Node example)
npm ci --dry-run 2>&1 | grep -i "in sync\|out of sync\|would install"
```

Version drift across services is a multiplier on every other risk in this audit — a CVE fix that's been applied to 2 of 5 services isn't fixed.

### Step 3: Dead Code & Debt Signals

```bash
# TODO/FIXME density as a debt proxy
grep -rEn "TODO|FIXME|HACK|XXX" --include="*.{js,ts,py,go,rb,java}" . | wc -l

# Feature flags that may be permanently on/off and never cleaned up
grep -rEn "feature_flag|featureFlag|FEATURE_" --include="*.{js,ts,py,go}" . | wc -l

# Unused exports (Node/TS — requires the project's own tooling, e.g. ts-prune, knip)
npx knip 2>/dev/null || echo "knip not configured — recommend adding"
```

Don't just count — sample a handful of TODOs/dead branches and assess whether they represent real risk (a TODO next to a security-relevant `if` block matters more than a styling note).

### Step 4: CI/CD & Governance Hygiene

Check for presence and freshness of:

| File/Practice | Why It Matters |
|---|---|
| `README.md` with setup instructions | Onboarding time, tribal knowledge risk |
| `CODEOWNERS` | Review accountability |
| `SECURITY.md` | Vulnerability disclosure process exists |
| `LICENSE` | Legal clarity (critical if open-sourcing or being acquired) |
| `.github/workflows/*` or equivalent CI config | Automated test/lint/build gate exists |
| Branch protection on main/default branch | Prevents unreviewed pushes to prod-deployed branch |
| Dependabot/Renovate config | Automated dependency update PRs |
| Test coverage configured and reported | Visibility into regression risk |

```bash
ls -la README.md CODEOWNERS SECURITY.md LICENSE 2>&1 | grep -v "No such"
find .github/workflows -type f 2>/dev/null
```

### Step 5: Score

```
Stack Hygiene Score (0-100) = 100
  - up to 25 points scaled to (% of direct dependencies >1 major version behind)
  - 15 points if any dependency is abandoned/deprecated with no migration plan
  - 20 points if version drift exists across services/packages for shared runtime or internal libs
  - up to 15 points scaled to TODO/debt density relative to repo size (sampled, not just counted)
  - 10 points if no CI gate (test/lint/build) exists on the default branch
  - 10 points if no branch protection on the default branch
  - 5 points if governance files (README, CODEOWNERS, SECURITY.md, LICENSE) are missing
Floor at 0.
```

| Score | Grade | Meaning |
|---|---|---|
| 90-100 | A | Stack is current, consistent, and well-governed |
| 75-89 | B | Minor staleness, no structural drift |
| 55-74 | C | Noticeable drift — upgrades are starting to get risky |
| 30-54 | D | Significant debt — a dedicated cleanup sprint is overdue |
| 0-29 | F | Stack is effectively unmaintained |

## Output Format

Write to `HYGIENE-AUDIT.md` (or a "Stack Hygiene" section in the combined report):

```markdown
## Stack Hygiene — Score: [X]/100 (Grade: [letter])

**Repo(s) audited:** [path/list] | **Date:** [date]

### Dependency Staleness
| Package | Current | Latest | Major Versions Behind | Status |
|---|---|---|---|---|
| [pkg] | X.Y.Z | A.B.C | N | Deprecated/Abandoned/Current |

### Version Drift Across Services
| Service | Runtime Version | Shared Lib Version | Drift From Baseline |
|---|---|---|---|
| [service] | [version] | [version] | [none/minor/major] |

### Debt Signals
- TODO/FIXME count: [N] ([density] per 1,000 LOC)
- Notable debt items sampled: [2-3 specific examples with file:line]

### Governance Checklist
| Item | Status |
|---|---|
| CI gate on default branch | Present/Missing |
| Branch protection | Present/Missing |
| CODEOWNERS | Present/Missing |
| Dependabot/Renovate | Present/Missing |

### Prioritized Cleanup Plan
1. **Immediate:** [e.g., bump abandoned/deprecated deps with known CVEs — cross-reference `trivy-scan`]
2. **This sprint:** [version drift reconciliation]
3. **This quarter:** [governance file gaps, CI hardening, debt paydown]
```

## Cross-Skill Integration
- Cross-reference `trivy-scan` findings — an outdated dependency this skill flags as "stale" may also appear there as a CVE. Don't report it twice as unrelated; note the overlap and prioritize it higher.
- Version drift findings feed directly into `silent-failure-hunter`: inconsistent error-handling libraries across services is often a symptom of the same drift.

## Error Handling
- If the ecosystem/package manager can't be auto-detected, ask which one(s) are in use rather than guessing.
- `npx knip`/`ts-prune`-style tools may need project-specific config to avoid false positives — note results as directional, not absolute, unless the client already has these configured.
- Don't recommend bumping a major version without flagging that breaking-change review is needed — staleness and "just upgrade it" are not the same recommendation.
