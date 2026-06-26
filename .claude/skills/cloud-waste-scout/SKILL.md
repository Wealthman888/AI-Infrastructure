# Cloud Waste Scout

## Skill Purpose
Find live cloud resources that are running, billed, and delivering little or no value: idle compute, orphaned storage, unattached volumes, unused IPs, overprovisioned databases, and zombie services. This audits **actual deployed state**, which is the necessary complement to `infracost-audit` (which audits what the *IaC plan* will cost, not what's actually idling in the account today).

## When to Use
- Part of a full `/infra-audit` run (Cloud Resource Waste category)
- User asks "why is our cloud bill so high," "find unused resources," or "audit our AWS/GCP/Azure account for waste"
- Triggered by `/infra-audit waste <cloud-account>`
- Before a cost-cutting initiative, to get a ranked list of cuts rather than guessing

## Prerequisites

This skill reads live account state, which requires the client's cloud CLI to be configured with read access (billing + resource metadata + CloudWatch/Monitoring read). **Confirm scope and get explicit authorization before querying a client's live cloud account** — this is not a local repo scan.

```bash
aws sts get-caller-identity   # confirm AWS auth/account
gcloud config list            # confirm GCP project
az account show               # confirm Azure subscription
```

## How to Execute

Run the checks relevant to the client's cloud provider(s). Use a 14-30 day lookback window for utilization metrics — shorter windows can mistake legitimate low-traffic periods (weekends, off-peak) for true idleness.

### AWS

```bash
# Unattached EBS volumes (paying for storage, attached to nothing)
aws ec2 describe-volumes --filters Name=status,Values=available \
  --query 'Volumes[*].{ID:VolumeId,Size:Size,Type:VolumeType,Created:CreateTime}'

# Idle EC2 instances (low average CPU over lookback window)
aws cloudwatch get-metric-statistics --namespace AWS/EC2 --metric-name CPUUtilization \
  --statistics Average --period 86400 --start-time <30-days-ago> --end-time <now> \
  --dimensions Name=InstanceId,Value=<instance-id>

# Unused Elastic IPs (allocated, not attached — billed hourly for nothing)
aws ec2 describe-addresses --query 'Addresses[?AssociationId==null]'

# Load balancers with zero/near-zero request count
aws cloudwatch get-metric-statistics --namespace AWS/ApplicationELB --metric-name RequestCount \
  --statistics Sum --period 86400 --start-time <30-days-ago> --end-time <now>

# Orphaned snapshots (no source volume, or far older than retention policy implies)
aws ec2 describe-snapshots --owner-ids self \
  --query 'Snapshots[*].{ID:SnapshotId,Vol:VolumeId,Created:StartTime,Size:VolumeSize}'

# RDS instances with low connection count / low CPU (overprovisioned)
aws cloudwatch get-metric-statistics --namespace AWS/RDS --metric-name DatabaseConnections \
  --statistics Average --period 86400 --start-time <30-days-ago> --end-time <now>

# S3 buckets with no lifecycle policy (storage growing unbounded)
aws s3api get-bucket-lifecycle-configuration --bucket <bucket> 2>&1 | grep -q "NoSuchLifecycleConfiguration" && echo "NO LIFECYCLE POLICY"
```

### GCP

```bash
# Unattached persistent disks
gcloud compute disks list --filter="-users:*"

# Idle VM instances (use Recommender for a pre-computed list)
gcloud recommender recommendations list \
  --recommender=google.compute.instance.IdleResourceRecommender \
  --project=<project> --location=<region>

# Unused static IPs
gcloud compute addresses list --filter="status=RESERVED"
```

### Azure

```bash
# Azure Advisor cost recommendations (pre-computed idle/oversized resource list)
az advisor recommendation list --category Cost -o table

# Unattached managed disks
az disk list --query "[?managedBy==null]"
```

### Kubernetes (any provider, if applicable)

```bash
# Nodes with sustained low CPU/memory requests vs allocatable
kubectl top nodes

# Namespaces/deployments with zero recent activity but still running
kubectl get deployments -A -o json | jq '.items[] | select(.spec.replicas > 0)'
```

Cross-reference with ingress/service mesh metrics for actual traffic — a running deployment with zero ingress traffic for 30 days is a zombie service candidate.

### Step: Rank and Estimate Savings

For every flagged resource, pull its actual monthly cost (from the billing API or unit cost x quantity) and rank by `monthly_cost` descending — same principle as `infracost-audit`: the top handful of items usually dominate the total opportunity.

### Score

```
Cloud Waste Score (0-100) = 100
  - up to 40 points scaled to (identified monthly waste / total monthly cloud spend)
  - 15 points if any unattached volumes/disks exist
  - 10 points if any unused static/elastic IPs exist
  - 15 points if any zero-traffic load balancer or zombie service is found
  - 10 points if no S3/storage lifecycle policies exist on buckets with unbounded growth
  - 10 points if no Reserved/Savings Plan or Committed Use Discount coverage on stable long-running compute
Floor at 0.
```

| Score | Grade | Meaning |
|---|---|---|
| 90-100 | A | Lean — minimal waste, good cost hygiene |
| 75-89 | B | Minor waste, easy quick wins available |
| 55-74 | C | Material waste — a cleanup pass would meaningfully cut the bill |
| 30-54 | D | Significant unmanaged spend |
| 0-29 | F | Resources are provisioned and forgotten as a pattern, not an exception |

## Output Format

Write to `CLOUD-WASTE-AUDIT.md` (or a "Cloud Resource Waste" section in the combined report):

```markdown
## Cloud Resource Waste — Score: [X]/100 (Grade: [letter])

**Account(s) audited:** [account/project IDs] | **Lookback window:** [N days] | **Date:** [date]

### Waste Inventory (Ranked by Monthly Cost)
| Resource | Type | Monthly Cost | Utilization | Recommendation | Est. Savings |
|---|---|---|---|---|---|
| [id] | Unattached EBS volume | $X | N/A | Delete or snapshot+delete | $X/mo |
| [id] | EC2 instance | $X | 2% avg CPU | Downsize or terminate | $X/mo |
| [id] | Load balancer | $X | 0 requests/30d | Decommission | $X/mo |

### By Category
| Category | Count | Total Monthly Waste |
|---|---|---|
| Unattached storage | N | $X |
| Idle compute | N | $X |
| Unused IPs | N | $X |
| Zombie services | N | $X |
| Missing discount coverage | N/A | $X |

**Total identified savings potential: $[X]/month ($[X]/year, [X]% of current spend)**

### Action Plan
1. **Safe to act on immediately (no risk):** unattached volumes/disks, unused IPs, orphaned snapshots past retention
2. **Verify before acting (confirm not in use first):** idle-looking instances, zero-traffic load balancers — confirm with the owning team before terminating
3. **Requires a change/commitment:** Reserved Instance/Savings Plan purchases, storage class migrations
```

## Cross-Skill Integration
- Pair with `infracost-audit` in the combined `/infra-audit` report: infracost shows planned-cost story, this shows live-reality story. A resource that infracost estimated as cheap but is actually idle 100% of the time is a "shouldn't have been provisioned at all" finding worth flagging in both sections.
- A zombie service or unbounded retry loop found here may trace back to a `silent-failure-hunter` finding (e.g., a queue consumer stuck retrying forever, driving up compute cost while also failing silently).

## Error Handling
- **Never delete or terminate anything as part of this audit** — this skill produces a findings/recommendation report only. Deletion is a separate, explicitly-authorized action.
- "Idle" by CPU/network metrics can still be load-bearing (e.g., a standby failover instance, a low-traffic but business-critical endpoint) — flag for human confirmation rather than asserting it's safe to remove.
- If billing/cost-explorer API access isn't granted, fall back to listing resource counts and known unit pricing, and label the cost estimates as approximate.
