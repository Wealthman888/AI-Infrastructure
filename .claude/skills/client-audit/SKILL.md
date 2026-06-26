# Client Audit Automation — `/client-audit`

## Skill Purpose
Single entry point that takes just a client's website URL — no system access required — and produces a complete, client-ready business audit combining the full marketing audit with a technical/security assessment. This is the automation for "give the agent a client's website and get a full audit back."

It is built in two phases that share the same command:

- **Discovery phase** (today): website URL only. Runs `market-audit` plus a passive **external** technical/security snapshot. This is what you run on a prospect before they're a client — no repo, cloud, or CRM access needed.
- **Engagement phase** (once a client grants access): pass `--repo`, `--cloud`, and/or `--iac` to additionally run the full `infra-audit` suite (trivy, infracost, cloud-waste-scout, stack-hygiene-analyzer, silent-failure-hunter, audit-tools) in place of the external snapshot for whichever categories now have real access.

CRM integration is intentionally **not** built yet — see "Extension Point" below. Today's automation takes a manually-supplied URL; the seam for a CRM-fed or cron-scheduled batch mode is documented but not implemented, since no specific CRM platform has been confirmed.

## When to Use
- Triggered by `/client-audit <website-url> [client-name]`
- Triggered by `/client-audit <website-url> --repo <path>` and/or `--cloud <account>` and/or `--iac <path>` once deeper access exists
- User says "audit this client," "run a full audit on [website]," or hands you a prospect's URL and asks what a full audit would find

## Command Reference

| Command | Phase | Technical Half Runs | Output |
|---|---|---|---|
| `/client-audit <url>` | Discovery | `scripts/external_scan.py` (passive recon) | `BUSINESS-AUDIT-<slug>.md` |
| `/client-audit <url> --repo <path>` | Partial Engagement | `trivy-scan`, `stack-hygiene-analyzer`, `silent-failure-hunter` against `<path>` | `BUSINESS-AUDIT-<slug>.md` |
| `/client-audit <url> --repo <path> --cloud <account> --iac <path>` | Full Engagement | Full `infra-audit` suite (all 6 sub-skills) | `BUSINESS-AUDIT-<slug>.md` |

The skill auto-detects which sub-skills can run based on what access is provided — there is one command, not one per access level.

## How to Execute

### Step 1: Intake
1. Normalize the URL (prepend `https://` if missing).
2. Derive a client name from the domain if not given explicitly (e.g. `acmeco.com` → "Acme Co").
3. Detect which of `--repo`, `--cloud`, `--iac` were provided this run.
4. Build a filename slug: lowercase, hyphenated client name (e.g. `acme-co`).

### Step 2: Run the Marketing Half

Invoke the `market-audit` skill's existing methodology (5 parallel subagents: content, conversion, competitive, technical, strategy) against the website URL. Don't duplicate its logic here — see `.claude/skills/market-audit/SKILL.md` for the full methodology, and consume its score + findings as-is.

### Step 3: Run the Technical/Security Half (Access-Dependent)

**No `--repo`/`--cloud`/`--iac` provided (Discovery phase):**

```bash
python3 .claude/skills/client-audit/scripts/external_scan.py <url>
```

This performs only passive, read-only checks: security headers, TLS config and cert expiry, common exposed-path probes (`.git/config`, `.env`, backup files, credential paths), robots.txt hints, and CMS/tech fingerprinting. It never attempts exploitation, auth bypass, or port scanning beyond 80/443 — every request targets a publicly routable path, the same class of check free tools like SecurityHeaders.com or SSL Labs run against any public site without needing authorization.

Score the **External Technical Risk Score** (0-100) from the script's JSON:
```
100
  - 10 points per missing security header from {HSTS, CSP} — cap at -20
  - 30 points if any sensitive path is exposed (exposed_path_count > 0)
  - 15 points if http_to_https_redirect.redirects_to_https is false
  - 10 points if TLS cert expires within 30 days, is invalid, or site isn't served over HTTPS
  - 10 points if cookies are missing Secure/HttpOnly flags
Floor at 0.
```

Label this category **"External Snapshot — Limited Visibility"** in the report. State explicitly that it does not cover dependency CVEs, IaC misconfiguration, cloud waste, or compliance controls — those require system access, and surfacing that gap is itself the upsell into an engagement.

**`--repo`/`--cloud`/`--iac` provided (Engagement phase):**

Run only the sub-skills that now have access, per `.claude/skills/infra-audit/SKILL.md`:
- `--repo <path>` → `trivy-scan` (fs/config scan), `stack-hygiene-analyzer`, `silent-failure-hunter` against that path
- `--cloud <account>` → `cloud-waste-scout` against that account
- `--iac <path>` → `infracost-audit` against that path
- `audit-tools` (compliance) can run if policy docs/configs are available regardless of the above; otherwise mark it "Not Assessed — pending engagement scope"

Use each sub-skill's own weighted score in place of the External Technical Risk Score for whichever categories ran. If only `--repo` was given, the technical half is still a blend of full sub-skill scores (security, hygiene, resilience) and "Not Assessed" placeholders for cost/waste/compliance — don't invent numbers for categories with no access.

### Step 4: Synthesize the Composite Score

```
Business Audit Score = Marketing_Score * 0.5 + Technical_Score * 0.5
```

`Marketing_Score` is market-audit's composite. `Technical_Score` is the External Technical Risk Score, or — once any engagement-phase sub-skills ran — the access-weighted average of whichever `infra-audit` categories were actually assessed (re-normalize the weights in `.claude/skills/infra-audit/SKILL.md` §3.1 over only the assessed categories).

If the technical half is still Discovery-phase, mark the composite **PROVISIONAL** and say so plainly — it will move once real system access is granted, so it shouldn't be presented to a client as a final number while they're still deciding whether to engage.

### Step 5: Write the Report

Write `BUSINESS-AUDIT-<slug>.md`:

```markdown
# Business Audit: [Client Name]
**Website:** [url]
**Date:** [date]
**Audit Phase:** Discovery (website-only) | Engagement (access: [repo/cloud/iac as applicable])
**Business Audit Score: [X]/100** [— PROVISIONAL, pending system access, if Discovery phase]

---

## Executive Summary
[Lead with the score, the single biggest marketing gap, the single biggest technical/security
finding, and — if Discovery phase — what a full engagement audit would additionally reveal
(dependency CVEs, IaC misconfig, cloud waste, compliance gaps) as the concrete next step.]

---

## Score Breakdown
| Half | Score | Weight | Source |
|---|---|---|---|
| Marketing | X/100 | 50% | market-audit |
| Technical/Security | X/100 | 50% | External Snapshot / Full Infra Audit (state which) |

---

## Marketing Findings
[market-audit's full output: score table, quick wins, strategic recs]

## Technical & Security Findings
[external_scan.py findings table, OR the relevant infra-audit sub-skill sections]

---

## Recommended Next Step
[Discovery phase: propose the specific access needed (repo read access, cloud account read-only
role, IaC directory) to run the full infra-audit, and name what it would surface that this
snapshot can't.]
[Engagement phase: the standard infra-audit prioritized roadmap — immediate/this month/this quarter.]
```

### Step 6: Save Locally, Then to Google Drive

1. Write the file locally first — the local Markdown file is the source of truth even if the upload step fails.
2. Upload via `mcp__Google_Drive__create_file`:
   - `title`: `BUSINESS-AUDIT-<slug>.md`
   - `textContent`: the full report Markdown
   - `contentMimeType`: `text/plain`
   - `disableConversionToGoogleType`: `true` if the report should stay a flat Markdown/text file in Drive; omit (or set `false`) to let Drive convert it to an editable Google Doc, which is usually nicer for sharing with a client.
   - `parentId`: ask once which Drive folder to use for client audits, then reuse that folder ID for subsequent runs instead of asking every time.
3. Report both the local path and the Drive file's returned link in the terminal summary.

## Terminal Output

```
=== BUSINESS AUDIT COMPLETE ===
Client: [name] ([url])
Phase: [Discovery/Engagement]
Business Audit Score: [X]/100 [PROVISIONAL if Discovery]

  Marketing:           [XX]/100 ███████░░░
  Technical/Security:  [XX]/100 ██████░░░░  ([External Snapshot/Full Infra Audit])

Top 3 Findings:
  1. [finding]
  2. [finding]
  3. [finding]

Local report: BUSINESS-AUDIT-<slug>.md
Drive link:   [url]
```

## Extension Point — Future Cron/CRM Automation (Not Yet Built)

This skill is deliberately structured so **Step 1 (Intake) is the only part that changes** to support batch or automated runs later — Steps 2-6 already take `{url, client_name, access_flags}` as opaque inputs and don't care where they came from.

- **Today:** Step 1 takes one manually-typed URL per invocation.
- **Future cron mode:** wrap this skill in a scheduled job (see `CLAUDE.md`'s "Scheduled Automation" section / Claude Code's `/schedule`) that loops over a list of `{client_name, website_url}` records and calls Steps 2-6 once per record, instead of taking a single URL from a manual command.
- **Future CRM-fed mode:** once a specific CRM is confirmed, Step 1 should pull `{website_url}` (and, later, any already-granted `--repo`/`--cloud`/`--iac` scope) directly from CRM records instead of manual flags.

Do not build the cron or CRM pieces speculatively — confirm the CRM platform and access pattern first. The manual command above is the complete, usable automation today.

## Error Handling
- If the website is unreachable, report the fetch error from both `market-audit` and `external_scan.py` rather than guessing at findings.
- If a `--repo`/`--cloud`/`--iac` path is provided but inaccessible, fall back to the Discovery-phase check for that category and say so explicitly — never silently downgrade without flagging it.
- Never attempt anything beyond passive, read-only checks against a website during the Discovery phase — no auth bypass, no brute force, no scanning beyond the documented public paths.
- If the Google Drive upload fails (auth, quota, permissions), still report success on the local file and surface the Drive error as a separate, non-fatal note.

## Cross-Skill Integration
- Consumes `market-audit` and the `infra-audit` sub-skills as-is; this skill sequences and merges their output, it doesn't reimplement their methodology.
- If `MARKETING-AUDIT.md` or `INFRA-OPS-AUDIT.md` already exist in the working directory for this client from a prior individual run, incorporate them directly rather than re-running the underlying scans.
