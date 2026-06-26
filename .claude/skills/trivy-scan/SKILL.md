# Vulnerability & Misconfiguration Scan (Trivy)

## Skill Purpose
Run a comprehensive security scan of a client's container images, IaC, filesystem, git history, and Kubernetes manifests using [Aqua Security Trivy](https://github.com/aquasecurity/trivy). Produces a severity-ranked findings list covering CVEs, exposed secrets, license issues, and infrastructure misconfigurations.

## When to Use
- Part of a full `/infra-audit` run (Security & Vulnerability Posture category)
- User asks to scan a repo, container image, or Terraform/Kubernetes config for vulnerabilities
- Triggered by `/infra-audit security <target>`
- User mentions CVEs, secrets leaks, container hardening, or "is this safe to ship"

## Prerequisites

Check for the binary before running anything:

```bash
trivy --version || echo "MISSING"
```

If missing, surface install instructions rather than guessing a path:

```bash
# macOS
brew install trivy
# Debian/Ubuntu
sudo apt-get install trivy
# Or run without installing, via Docker:
docker run --rm -v "$PWD":/work aquasec/trivy fs /work
```

Do not install system packages on the user's machine without asking first — offer the Docker fallback if installation isn't wanted.

## How to Execute

### Step 1: Identify Scan Type(s)

| Target | Trivy Subcommand | Use When |
|---|---|---|
| Container image | `trivy image <image>` | Auditing a built/published image |
| Filesystem / repo checkout | `trivy fs <path>` | Auditing a cloned repo's dependencies + secrets |
| Remote git repo | `trivy repo <url>` | No local checkout available |
| IaC (Terraform, CloudFormation, K8s manifests, Dockerfile) | `trivy config <path>` | Auditing infrastructure definitions for misconfig |
| SBOM | `trivy sbom <file>` | Client already produces an SBOM |
| Kubernetes cluster (live) | `trivy k8s --report summary cluster` | Auditing a running cluster (requires kubeconfig access — confirm authorization first) |

For a full repo audit, run both `trivy fs` (deps + secrets) and `trivy config` (IaC misconfig) against the same path.

### Step 2: Run with Machine-Readable Output

Always capture JSON so findings can be aggregated programmatically:

```bash
trivy fs --format json --output trivy-fs.json --severity LOW,MEDIUM,HIGH,CRITICAL .
trivy config --format json --output trivy-config.json .
```

Use `--severity HIGH,CRITICAL` for a quick pass when the client only wants actionable signal; use the full severity range for the formal report.

### Step 3: Parse Findings

From the JSON, extract per finding:
- `VulnerabilityID` (CVE/GHSA) or `AVDID` (misconfig rule)
- `PkgName` / resource path
- `Severity`
- `Title` / description
- `FixedVersion` (if a patched version exists) or remediation steps for misconfigs
- File path + line number

Group findings into:
1. **Vulnerable dependencies** (CVEs in libraries)
2. **Exposed secrets** (API keys, tokens, private keys committed to the repo)
3. **IaC misconfigurations** (open security groups, public S3 buckets, missing encryption, privileged containers, missing resource limits)
4. **License risk** (copyleft licenses in commercial codebases, if `--scanners license` was used)

### Step 4: Score

```
Security Score (0-100) = 100
  - 15 points per unresolved CRITICAL finding (cap at -60)
  - 6 points per unresolved HIGH finding (cap at -30)
  - 2 points per unresolved MEDIUM finding (cap at -10)
  - Flat -20 if any plaintext secret is found in version control
Floor at 0.
```

| Score | Grade | Meaning |
|---|---|---|
| 90-100 | A | Production-ready, patch cadence is healthy |
| 75-89 | B | Minor gaps, no critical exposure |
| 55-74 | C | Exploitable gaps exist, needs a remediation sprint |
| 30-54 | D | Material risk — critical CVEs or exposed secrets live in the codebase |
| 0-29 | F | Actively exploitable — treat as an incident, not a backlog item |

## Output Format

Write findings to `VULNERABILITY-AUDIT.md` (or append a "Security & Vulnerability Posture" section if called from `/infra-audit`):

```markdown
## Security & Vulnerability Posture — Score: [X]/100 (Grade: [letter])

**Scanned:** [target] | **Scanner:** Trivy v[version] | **Date:** [date]

### Summary
| Severity | Count | Secrets Found |
|---|---|---|
| CRITICAL | X | |
| HIGH | X | |
| MEDIUM | X | |
| LOW | X | |
| | | [Y secrets] |

### Critical & High Findings
| ID | Type | Package/Resource | Severity | Fix |
|---|---|---|---|---|
| CVE-XXXX-XXXXX | Dependency | [pkg]@[version] | CRITICAL | Upgrade to [fixed version] |
| AVD-AWS-XXXX | IaC Misconfig | [resource path] | HIGH | [remediation] |

### Exposed Secrets
| File | Line | Type | Action |
|---|---|---|---|
| [path] | [line] | AWS Access Key | Rotate immediately, scrub git history |

### Remediation Priority
1. **Immediate (today):** Rotate any exposed secrets, patch CRITICAL CVEs with available fixes
2. **This week:** Patch HIGH CVEs, fix public-facing IaC misconfigurations
3. **This month:** Clear MEDIUM backlog, add Trivy to CI as a merge gate
```

## CI Integration Recommendation

If the client has no automated scanning, recommend adding a CI gate:

```yaml
# Example: fail the build on unresolved CRITICAL/HIGH
- run: trivy fs --exit-code 1 --severity CRITICAL,HIGH .
```

Note this in the report as a "Quick Win" — it's cheap to add and prevents regression of whatever the audit just fixed.

## Error Handling
- If `trivy` is not installed and the user declines Docker, fall back to documenting the categories of risk manually reviewed and flag the gap clearly in the report — do not fabricate scan results.
- If scanning a private registry image requires auth, ask for credentials/scope confirmation before pulling.
- Vulnerability databases update constantly — note the scan date and recommend re-scanning before any release.
