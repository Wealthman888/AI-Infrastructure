# Silent Failure Hunter

## Skill Purpose
Find the errors a system is currently failing to tell anyone about: swallowed exceptions, ignored promise rejections, missing alerting on scheduled jobs, and logging that buries real failures at the wrong severity. This is an operational-resilience audit — the goal is to surface failure modes that look fine in a dashboard today but will cause an undiagnosable outage later.

## When to Use
- Part of a full `/infra-audit` run (Operational Resilience category)
- User asks "why didn't we know about this incident sooner," or wants an audit of error handling/observability
- Triggered by `/infra-audit failures <repo>`
- After a postmortem where the root cause was "the error was swallowed" or "nothing alerted us"

## How to Execute

### Step 1: Grep for Swallowed-Exception Patterns

Search across the codebase for common silent-failure shapes. Adjust patterns to the languages actually present:

```bash
# Empty or near-empty catch blocks (JS/TS)
grep -rEn "catch\s*\([^)]*\)\s*\{\s*\}" --include="*.{js,ts,jsx,tsx}" .
grep -rEn "catch\s*\([^)]*\)\s*\{\s*//" --include="*.{js,ts,jsx,tsx}" .

# Catch-and-only-console.log (not re-thrown, not reported)
grep -rEn "catch\s*\([^)]*\)\s*\{\s*console\.(log|warn)" --include="*.{js,ts}" .

# Python bare except / except-pass
grep -rEn "except\s*:\s*$|except\s+Exception\s*:\s*$" -A1 --include="*.py" . | grep -B1 "pass"

# Unhandled promise rejections (no global handler registered)
grep -rln "unhandledRejection" --include="*.{js,ts}" . || echo "No unhandledRejection handler found"

# Go errors discarded with _
grep -rEn ":?=\s*\w+\([^)]*\)\s*;?\s*_\s*$|, _\s*:?=" --include="*.go" .

# Fire-and-forget async calls (no .catch, no await, no error path)
grep -rEn "^\s*\w+\.\w+\([^)]*\)\s*;?\s*$" --include="*.{js,ts}" . | grep -v "await\|return"
```

These greps will have false positives — every hit needs a quick read to confirm the error is actually being dropped versus handled a few lines later (e.g., re-thrown, logged at ERROR with context, or reported to a tracker).

### Step 2: Check Error-Tracking Coverage

```bash
# Is an error tracker even initialized?
grep -rln "Sentry.init\|Rollbar.init\|Bugsnag\|datadog" --include="*.{js,ts,py,go}" .
```

If no error tracker is found anywhere in the codebase, that's a finding on its own — every `catch` block in the codebase is only as good as where its errors end up, and "nowhere" is the default without one.

### Step 3: Audit Scheduled Jobs & Background Workers

Cron jobs and queue consumers are the highest-risk silent-failure surface because there's no user in the loop to notice a 500.

For each scheduled job / worker found:
- [ ] Does it alert (not just log) on failure?
- [ ] Does it alert if it *doesn't run* at all (missed-run / heartbeat monitoring), not just if it errors?
- [ ] Are retries bounded with a dead-letter path, or can a bad message loop forever / get dropped silently?
- [ ] Is there a max-age check — i.e., would anyone notice if this job silently stopped running 2 weeks ago?

```bash
grep -rln "cron\|setInterval\|@scheduled\|CronJob" --include="*.{js,ts,py,go}" .
```

### Step 4: Audit Log Level Discipline

Sample log statements and check whether severity matches reality:

```bash
grep -rEn "log\.(info|debug)\(.*[Ee]rror" --include="*.{js,ts,py,go}" .
```

Errors logged at `info`/`debug` are functionally silent in most setups, since alerting and log-retention policies are usually tiered by severity.

### Step 5: Check Health/Readiness Signals

- [ ] Does each service expose a health check that reflects real dependency health (DB, queue, downstream API), not just "process is running"?
- [ ] Are health check failures wired to actual alerting, or do they just sit in a dashboard nobody watches?

### Step 6: Score

```
Operational Resilience Score (0-100) = 100
  - 20 points if no error tracker (Sentry/equivalent) is initialized anywhere
  - up to 25 points scaled to (confirmed swallowed-exception sites / sampled catch blocks reviewed)
  - 20 points if any scheduled job/worker has no failure alerting
  - 15 points if no missed-run/heartbeat monitoring exists for scheduled jobs
  - 10 points if errors are found logged at info/debug level
  - 10 points if health checks don't reflect real dependency health or aren't wired to alerting
Floor at 0.
```

| Score | Grade | Meaning |
|---|---|---|
| 90-100 | A | Failures surface fast and to the right place |
| 75-89 | B | Solid coverage, a few gaps in less-trafficked paths |
| 55-74 | C | Real failure modes are currently invisible |
| 30-54 | D | The team is finding out about problems from customers, not monitoring |
| 0-29 | F | No meaningful failure visibility — outages will be discovered by accident |

## Output Format

Write to `SILENT-FAILURE-AUDIT.md` (or an "Operational Resilience" section in the combined report):

```markdown
## Operational Resilience — Score: [X]/100 (Grade: [letter])

**Repo(s) audited:** [path] | **Date:** [date]

### Swallowed Exceptions Found
| File:Line | Pattern | Risk | Recommendation |
|---|---|---|---|
| [path:line] | Empty catch block | [what failure this would hide] | Re-throw or report to [tracker], log at ERROR with context |

### Scheduled Job / Worker Audit
| Job | Failure Alerting | Missed-Run Monitoring | Dead-Letter Path | Status |
|---|---|---|---|---|
| [job name] | Yes/No | Yes/No | Yes/No | At Risk/OK |

### Error Tracking Coverage
- Tracker in use: [Sentry/none/etc.]
- Coverage gaps: [services/paths with no instrumentation]

### Log Level Issues
| File:Line | Logged At | Should Be |
|---|---|---|
| [path:line] | info | error |

### Prioritized Fixes
1. **Immediate:** [job with no failure alerting at all — this is the "we won't know until a customer tells us" category]
2. **This sprint:** [swallowed exceptions on critical paths — payments, auth, data writes]
3. **This quarter:** [log level discipline, health check wiring, broader catch-block cleanup]
```

## Cross-Skill Integration
- Findings here often correlate with `stack-hygiene-analyzer`'s version-drift results — inconsistent error-handling patterns across services are usually a symptom of services evolving independently without a shared standard.
- A job with no dead-letter path that's also touching a resource flagged in `cloud-waste-scout` (e.g., a queue with unbounded retries driving up compute cost) is worth calling out as a combined finding in the synthesis report.

## Error Handling
- Every grep hit is a candidate, not a confirmed finding — read enough context to rule out false positives (error handled a few lines later, intentional no-op with a comment explaining why) before listing it as a real gap.
- If the codebase is large, sample representative modules (auth, payments, data pipeline, background jobs) rather than claiming exhaustive coverage, and say so in the report.
- Don't recommend wrapping every catch block in alerting indiscriminately — alert fatigue from over-instrumentation is its own operational risk. Prioritize by blast radius (payments/auth/data integrity over cosmetic UI errors).
