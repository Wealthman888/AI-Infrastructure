# Compliance & Control Baseline Audit (audit-tools)

## Skill Purpose
Run the client's environment against standard compliance control baselines (SOC 2, ISO 27001, CIS Benchmarks) using [audit-labs/audit-tools](https://github.com/audit-labs/audit-tools), supplemented with a manual control checklist when the tool doesn't cover a given control natively. This is the "are we following the rules we say we follow" layer of the audit, distinct from the technical vulnerability scan (`trivy-scan`).

## When to Use
- Part of a full `/infra-audit` run (Compliance & Audit Baseline category)
- User asks about SOC 2 readiness, ISO 27001 gaps, CIS benchmark compliance, or "are we audit-ready"
- Triggered by `/infra-audit compliance <target>`
- A client needs evidence/documentation ahead of a third-party compliance audit

## Prerequisites & First-Run Discovery

Because `audit-tools` is an external repo rather than a widely-documented package manager release, **confirm its actual interface before assuming a command shape**:

```bash
# Check if it's already vendored/installed
audit-tools --help 2>/dev/null || which audit-tools 2>/dev/null || echo "NOT FOUND"

# If not found, locate and inspect it before running anything
git clone https://github.com/audit-labs/audit-tools.git /tmp/audit-tools 2>&1 | tail -5
cat /tmp/audit-tools/README.md 2>/dev/null | head -100
```

Read the cloned README/CLI `--help` output to confirm actual subcommands, supported frameworks, and config format before scanning — do not guess flags. If the repo is private, unreachable, or the client has a different internal fork, ask for the correct source/access before proceeding.

**If the tool genuinely cannot be reached**, do not block the audit — fall back to the manual control checklist in Step 2 and clearly label results as "manual review" rather than "automated scan" in the report.

## How to Execute

### Step 1: Select Framework

Confirm with the client (or infer from their industry/contracts) which baseline applies:

| Framework | Typical Trigger |
|---|---|
| SOC 2 (Type I/II) | SaaS selling to enterprise customers |
| ISO 27001 | Selling into EU/regulated enterprise, or pursuing certification |
| CIS Benchmarks | Hardening specific OS/cloud platform configs (often paired with `trivy-scan`) |
| PCI-DSS | Handling card payment data directly |
| HIPAA | Handling US health data |

### Step 2: Run Automated Checks, Fill Gaps Manually

Run `audit-tools` against the confirmed framework per its own documented invocation. Whatever it doesn't cover, walk the relevant manual checklist:

**Access & Identity**
- [ ] MFA enforced for all privileged accounts
- [ ] Least-privilege IAM — no wildcard (`*:*`) policies in production
- [ ] Offboarding process revokes access within 24h of termination
- [ ] Service accounts/API keys have defined owners and rotation schedules

**Data Protection**
- [ ] Encryption at rest for all data stores holding customer data
- [ ] Encryption in transit (TLS) enforced, no plaintext fallback
- [ ] Backup strategy exists and has been tested with a real restore in the last 12 months
- [ ] Data retention/deletion policy exists and is enforced (not just documented)

**Change Management**
- [ ] Production changes require review/approval (PR review, change ticket)
- [ ] CI/CD pipeline has no direct unreviewed push-to-prod path
- [ ] Rollback procedure exists and is documented

**Logging & Monitoring**
- [ ] Centralized logging for production systems (not just local logs)
- [ ] Audit logs for access to sensitive data/admin actions, retained per framework requirement
- [ ] Alerting exists for anomalous access patterns

**Vendor & Third-Party Risk**
- [ ] Subprocessor/vendor list maintained
- [ ] Critical vendors have current SOC 2/ISO certs on file

**Incident Response**
- [ ] Documented incident response plan exists
- [ ] Plan has been tabletop-tested in the last 12 months

### Step 3: Score

```
Compliance Score (0-100) =
  (Controls Passed / Total Applicable Controls) * 100
```

Weight any control marked "critical" for the chosen framework (e.g., encryption at rest, MFA, access revocation) at 2x in the denominator/numerator — a single critical gap should move the score more than a minor documentation gap.

| Score | Grade | Meaning |
|---|---|---|
| 90-100 | A | Audit-ready, evidence collection is the main remaining work |
| 75-89 | B | Strong posture, a handful of control gaps to close |
| 55-74 | C | Meaningful gaps — a formal audit would likely fail today |
| 30-54 | D | Foundational controls missing |
| 0-29 | F | No compliance program in practice |

## Output Format

Write to `COMPLIANCE-AUDIT.md` (or a "Compliance & Audit Baseline" section in the combined report):

```markdown
## Compliance & Audit Baseline — Score: [X]/100 (Grade: [letter])

**Framework(s):** [SOC2/ISO27001/CIS/etc] | **Method:** [automated via audit-tools / manual review] | **Date:** [date]

### Control Summary
| Domain | Controls Passed | Controls Failed | Domain Score |
|---|---|---|---|
| Access & Identity | X/Y | | |
| Data Protection | X/Y | | |
| Change Management | X/Y | | |
| Logging & Monitoring | X/Y | | |
| Vendor Risk | X/Y | | |
| Incident Response | X/Y | | |

### Critical Gaps (fix before any external audit)
| Control | Status | Evidence Gap | Remediation |
|---|---|---|---|
| [control] | Fail | [what's missing] | [specific fix] |

### Remediation Roadmap
1. **Before next audit cycle:** [critical gaps]
2. **This quarter:** [important but non-blocking gaps]
3. **Ongoing:** [process/documentation maintenance]
```

## Error Handling
- Never claim a control "passed" without evidence (a config check, a policy doc, a log sample). If you can't verify it, mark it "Unverified" rather than guessing.
- If `audit-tools` output format/coverage differs from what's assumed above once inspected, adapt the report structure to match what it actually measures rather than forcing it into this template.
- Compliance frameworks are legal/contractual matters — this skill produces a technical readiness assessment, not a certified audit. State that explicitly in any client-facing report.
