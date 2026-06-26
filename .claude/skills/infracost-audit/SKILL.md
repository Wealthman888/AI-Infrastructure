# Cloud Cost Audit (Infracost)

## Skill Purpose
Estimate and audit the cost impact of a client's Infrastructure-as-Code using [Infracost](https://github.com/infracost/infracost). Surfaces what a Terraform/Terragrunt plan will actually cost before it's applied, flags the most expensive resources, and identifies cost regressions between branches.

## When to Use
- Part of a full `/infra-audit` run (Cloud Cost Efficiency category)
- User asks "what will this cost," "audit our cloud spend," or "review this Terraform change for cost impact"
- Triggered by `/infra-audit cost <path>`
- A pull request touches Terraform/IaC and the user wants a pre-merge cost check

## Prerequisites

```bash
infracost --version || echo "MISSING"
```

Install if missing:
```bash
# macOS
brew install infracost
# Linux
curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh
```

Infracost needs a (free) API key for cloud pricing data:
```bash
infracost auth login
# or
export INFRACOST_API_KEY=ico-...
```
Confirm the client is comfortable running `infracost auth login` (it opens a browser) before doing so on their behalf.

## How to Execute

### Step 1: Baseline Cost Breakdown

```bash
infracost breakdown --path . --format json --out-file infracost-breakdown.json
```

This requires `terraform init` to have been run (or pass `--terraform-init-flags` / use `--usage-file` for usage-based resources like Lambda invocations or data transfer).

### Step 2: Diff Against a Baseline (for PR-style audits)

If comparing a proposed change to current production:

```bash
infracost diff --path . --compare-to infracost-breakdown.json
```

This is the highest-signal command for "is this change going to blow up our bill" — use it whenever a specific PR or branch is the audit target rather than the whole stack.

### Step 3: Parse and Rank

From the JSON, extract per resource:
- `resource.name` / type (e.g. `aws_instance`, `aws_rds_cluster_instance`)
- `monthlyCost`
- `costComponents` (the line items driving the cost — e.g. compute hours, storage, data transfer)
- `usage` assumptions used (flag any defaulted/guessed usage — these are the least reliable numbers)

Rank resources by `monthlyCost` descending. The top 10 resources usually account for 80%+ of spend — that's where to focus recommendations.

### Step 4: Flag Anti-Patterns

While reviewing the breakdown, flag these regardless of absolute cost:
- Compute sized well above what the workload needs (cross-reference with `cloud-waste-scout` findings on actual utilization if available)
- Missing Reserved Instance / Savings Plan / Committed Use discounts on long-running resources
- Multi-AZ or high-availability configs applied to non-production environments
- Untagged resources (cost can't be attributed to a team/project — note as a governance gap, not just a cost issue)
- Storage classes that don't match access patterns (e.g. frequently-accessed data in archival tiers, or vice versa)
- Dev/staging environments provisioned at production scale

### Step 5: Score

```
Cost Efficiency Score (0-100) = 100
  - 10 points if any single resource's cost assumptions are pure defaults (unverified usage)
  - 15 points if no tagging/cost-attribution strategy exists
  - 20 points if dev/staging mirrors production sizing
  - 15 points if no Reserved/Savings Plan coverage on stable long-running compute
  - up to 30 points scaled to (estimated avoidable monthly spend / total monthly spend)
Floor at 0.
```

| Score | Grade | Meaning |
|---|---|---|
| 90-100 | A | Spend is lean and well-attributed |
| 75-89 | B | Minor right-sizing opportunities |
| 55-74 | C | Clear waste, no major cost discipline practices |
| 30-54 | D | Significant overspend, little cost governance |
| 0-29 | F | Spend is effectively unmanaged |

## Output Format

Write to `COST-AUDIT.md` (or a "Cloud Cost Efficiency" section in the combined report):

```markdown
## Cloud Cost Efficiency — Score: [X]/100 (Grade: [letter])

**Path audited:** [path] | **Total estimated monthly cost:** $[X] | **Date:** [date]

### Top Cost Drivers
| Resource | Type | Monthly Cost | % of Total | Usage Assumption |
|---|---|---|---|---|
| [name] | [type] | $X | X% | [actual/estimated] |

### Cost Diff (if comparing branches)
| Resource | Before | After | Delta |
|---|---|---|---|
| [name] | $X | $Y | +$Z |
**Net change: $[X]/month ([+/-X]%)**

### Anti-Patterns Found
| Issue | Resource(s) | Est. Monthly Waste | Fix |
|---|---|---|---|
| No Reserved Instance coverage | [resources] | $X | Purchase 1yr RI/Savings Plan |
| Prod-scale staging | [resources] | $X | Downsize to [recommendation] |

### Savings Opportunities (Ranked)
1. **[Action]** — Est. savings: $X/month — Effort: Low/Med/High
2. ...

**Total identified savings potential: $[X]/month ($[X]/year)**
```

## Cross-Skill Integration
- Pair with `cloud-waste-scout` for the live-resource side of the picture: infracost tells you what the *plan* will cost, cloud-waste-scout tells you what's *actually* sitting idle right now. Present both in `/infra-audit` for the full cost story.
- If a PR triggered this audit, recommend wiring `infracost diff` into CI as a PR comment bot — this is Infracost's most common deployment pattern and a natural "Quick Win."

## Error Handling
- If `terraform init` hasn't been run and modules can't be resolved, run it in a scratch directory rather than the user's working tree, or ask permission first.
- If usage-based resources dominate the bill (Lambda, data transfer, request-based pricing) and no usage file is provided, clearly label those costs as low-confidence estimates.
- Multi-cloud or multi-account setups may need multiple `breakdown` runs — don't silently merge totals across different billing accounts without noting it.
