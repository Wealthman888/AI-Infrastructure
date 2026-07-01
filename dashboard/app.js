const SERIES = ["--series-1", "--series-2", "--series-3", "--series-4",
                 "--series-5", "--series-6", "--series-7", "--series-8"];
const NICHE_ORDER = ["detailing", "cleaning", "handyman"];

function seriesColor(index) {
  return getComputedStyle(document.documentElement).getPropertyValue(SERIES[index % SERIES.length]).trim();
}

function statusForRate(value, warnAt, critAt) {
  if (value >= critAt) return "critical";
  if (value >= warnAt) return "warning";
  return "good";
}

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

async function fetchJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}

function markDemo(isDemo) {
  const badge = document.getElementById("demo-badge");
  if (isDemo) badge.removeAttribute("hidden");
}

// ---- Panel 1: Infrastructure Health -----------------------------------

function renderHealth(data) {
  markDemo(data.demo_mode);
  const tiles = document.getElementById("health-tiles");
  tiles.innerHTML = "";
  const tileDefs = [
    ["Live", data.live], ["Warming", data.warming], ["Rested", data.rested],
    ["Total inboxes", data.total_inboxes],
  ];
  for (const [label, value] of tileDefs) {
    const t = el("div", "stat-tile");
    t.appendChild(el("div", "value", value ?? "—"));
    t.appendChild(el("div", "label", label));
    tiles.appendChild(t);
  }

  const rates = document.getElementById("health-rates");
  rates.innerHTML = "";
  const bounceStatus = statusForRate(data.bounce_rate ?? 0, 2, 3);
  const spamStatus = statusForRate((data.spam_complaint_rate ?? 0) * 10, 0.5, 1); // scaled: 0.1% ceiling
  rates.appendChild(rateRow("Bounce rate", data.bounce_rate, "%", bounceStatus, 3));
  rates.appendChild(rateRow("Spam complaint rate", data.spam_complaint_rate, "%", spamStatus, 0.1));
  if (bounceStatus === "critical") {
    rates.appendChild(el("div", "pill critical", "AUTO-PAUSE: bounce rate over 3% ceiling"));
  }

  const domains = document.getElementById("domain-list");
  domains.innerHTML = "";
  const domainList = data.domains || [];
  if (domainList.length) {
    domains.appendChild(el("h2", null, "Domains by health score"));
    for (const d of domainList.slice(0, 8)) {
      const score = d.health_score ?? d.score ?? "—";
      const status = score !== "—" && score < 70 ? "critical" : score < 85 ? "warning" : "good";
      const row = el("div", "bar-row");
      row.appendChild(el("div", "bar-label", d.domain));
      const track = el("div", "bar-track");
      const fill = el("div", "bar-fill");
      fill.style.width = `${Math.min(100, score === "—" ? 0 : score)}%`;
      fill.style.background = `var(--status-${status})`;
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("div", "bar-value", score));
      domains.appendChild(row);
    }
  }
}

function rateRow(label, value, unit, status, ceiling) {
  const row = el("div", "bar-row");
  row.appendChild(el("div", "bar-label", label));
  const track = el("div", "bar-track");
  const fill = el("div", "bar-fill");
  const pct = Math.min(100, ((value ?? 0) / ceiling) * 100);
  fill.style.width = `${pct}%`;
  fill.style.background = `var(--status-${status})`;
  track.appendChild(fill);
  row.appendChild(track);
  row.appendChild(el("div", "bar-value", `${value ?? 0}${unit}`));
  return row;
}

// ---- Panel 2: Funnel --------------------------------------------------

const FUNNEL_STAGES = [
  ["sent", "Sent"], ["opened", "Opened"], ["replied", "Replied"],
  ["positive_reply", "Positive Reply"], ["call_booked", "Call Booked"],
  ["audit_delivered", "Audit Delivered"], ["closed", "Closed"],
];

function renderFunnel(data) {
  const body = document.getElementById("funnel-body");
  body.innerHTML = "";
  const campaigns = [...(data.campaigns || [])].sort(
    (a, b) => NICHE_ORDER.indexOf(a.campaign) - NICHE_ORDER.indexOf(b.campaign)
  );

  const table = el("table");
  const thead = el("thead", null,
    `<tr><th>Campaign</th>${FUNNEL_STAGES.map(([, l]) => `<th>${l}</th>`).join("")}<th>Open %</th><th>Reply %</th></tr>`);
  table.appendChild(thead);
  const tbody = el("tbody");
  campaigns.forEach((c, i) => {
    const color = seriesColor(i);
    const cells = FUNNEL_STAGES.map(([key]) => `<td>${c[key] ?? "—"}</td>`).join("");
    const openBadge = benchmarkBadge(c.open_rate, 47, 62, 40, 60);
    const replyBadge = benchmarkBadge(c.reply_rate, 15, 30, 3, 8);
    const tr = el("tr", null,
      `<td><span class="legend-swatch" style="background:${color}"></span>${c.campaign}</td>${cells}` +
      `<td>${c.open_rate}% ${openBadge}</td><td>${c.reply_rate}% ${replyBadge}</td>`);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  body.appendChild(table);
}

function benchmarkBadge(value, gemLo, gemHi, baseLo, baseHi) {
  if (value >= gemLo) return '<span class="pill good">on GemLabs benchmark</span>';
  if (value >= baseLo) return '<span class="pill warning">below GemLabs benchmark</span>';
  return '<span class="pill critical">below baseline</span>';
}

// ---- Reply sentiment ----------------------------------------------------

function renderSentiment(data) {
  const body = document.getElementById("sentiment-body");
  body.innerHTML = "";
  const order = ["interested", "question", "not_now", "negative", "unsubscribe"];
  const labels = { interested: "Interested", question: "Question", not_now: "Not Now",
                   negative: "Negative", unsubscribe: "Unsubscribe" };
  const total = order.reduce((s, k) => s + (data[k] || 0), 0) || 1;
  order.forEach((key, i) => {
    const value = data[key] || 0;
    const row = el("div", "bar-row");
    row.appendChild(el("div", "bar-label", labels[key]));
    const track = el("div", "bar-track");
    const fill = el("div", "bar-fill");
    fill.style.width = `${(value / total) * 100}%`;
    fill.style.background = seriesColor(i);
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el("div", "bar-value", value));
    body.appendChild(row);
  });
}

// ---- Panel 3: Revenue ---------------------------------------------------

function renderRevenue(data) {
  const tiles = document.getElementById("revenue-tiles");
  tiles.innerHTML = "";
  const tileDefs = [
    ["Calls booked", data.calls_booked], ["Total closes", data.total_closes],
    ["Close rate", `${data.close_rate_pct}%`],
    ["Revenue this period", `$${(data.revenue_this_period || 0).toLocaleString()}`],
    ["Growth clients closed", `${data.growth_clients_closed}/${data.growth_client_breakeven_target}`],
  ];
  for (const [label, value] of tileDefs) {
    const t = el("div", "stat-tile");
    t.appendChild(el("div", "value", value ?? "—"));
    t.appendChild(el("div", "label", label));
    tiles.appendChild(t);
  }

  const breakdown = document.getElementById("tier-breakdown");
  breakdown.innerHTML = "";
  const tiers = Object.entries(data.closes_by_tier || {});
  if (!tiers.length) {
    breakdown.appendChild(el("div", "empty-state", "No closes logged yet"));
    return;
  }
  tiers.forEach(([tier, count], i) => {
    const row = el("div", "bar-row");
    row.appendChild(el("div", "bar-label", tier));
    const track = el("div", "bar-track");
    const fill = el("div", "bar-fill");
    const max = Math.max(...tiers.map(([, c]) => c));
    fill.style.width = `${(count / max) * 100}%`;
    fill.style.background = seriesColor(i);
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el("div", "bar-value", count));
    breakdown.appendChild(row);
  });
}

// ---- Panel 4: Scaling ---------------------------------------------------

function renderScaling(data) {
  const cohortDiv = document.getElementById("cohort-table");
  cohortDiv.innerHTML = "";
  const cohorts = data.cohorts || [];
  if (cohorts.length) {
    const table = el("table", null,
      "<thead><tr><th>Cohort</th><th>Start</th><th>Inboxes</th></tr></thead>");
    const tbody = el("tbody");
    for (const c of cohorts) {
      tbody.appendChild(el("tr", null,
        `<td>${c.cohort_label}</td><td>${c.cohort_start_date}</td><td>${c.inbox_count}</td>`));
    }
    table.appendChild(tbody);
    cohortDiv.appendChild(table);
  } else {
    cohortDiv.appendChild(el("div", "empty-state", "No cohort data yet"));
  }

  const alertsDiv = document.getElementById("alert-queue");
  alertsDiv.innerHTML = "";
  const alerts = data.recent_alerts || [];
  alertsDiv.appendChild(el("h2", null, "Alert queue"));
  if (!alerts.length) {
    alertsDiv.appendChild(el("div", "empty-state", "No alerts — all green"));
  } else {
    for (const a of alerts.slice().reverse()) {
      const item = el("div", "alert-item");
      item.innerHTML = `<span class="kind">${a.kind}</span> — ${a.target}: ${a.detail}
        <br><span class="ts">${a.timestamp} · ${a.action_taken}</span>`;
      alertsDiv.appendChild(item);
    }
  }
}

// ---- Boot ----------------------------------------------------------------

async function refresh() {
  try {
    const [health, funnel, sentiment, revenue, scaling, meta] = await Promise.all([
      fetchJSON("/api/health"), fetchJSON("/api/funnel"), fetchJSON("/api/reply-sentiment"),
      fetchJSON("/api/revenue"), fetchJSON("/api/scaling"), fetchJSON("/api/meta"),
    ]);
    renderHealth(health);
    renderFunnel(funnel);
    renderSentiment(sentiment);
    renderRevenue(revenue);
    renderScaling(scaling);
    markDemo(meta.demo_mode);
    document.getElementById("last-polled").textContent =
      meta.last_polled ? `last polled ${new Date(meta.last_polled).toLocaleTimeString()}` : "polling...";
  } catch (e) {
    console.error(e);
  }
}

refresh();
setInterval(refresh, 30000);
