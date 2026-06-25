const FEATURES = [
  {
    icon: '🛡️',
    title: 'Automated KYC & compliance',
    body: 'Identity verification, sanctions screening, and document checks run automatically at signup — no manual review queues.',
  },
  {
    icon: '⚡',
    title: 'Real-time settlement',
    body: 'Move funds between accounts and currencies in milliseconds, not business days, with continuous reconciliation.',
  },
  {
    icon: '🌐',
    title: 'Global payouts',
    body: 'Pay out to 150+ countries through a single integration, with local rails and FX handled for you.',
  },
  {
    icon: '🔍',
    title: 'Fraud detection engine',
    body: 'Machine-learning risk scoring flags anomalous transactions in real time and routes them for instant action.',
  },
  {
    icon: '💱',
    title: 'Multi-currency orchestration',
    body: 'Hold, convert, and route 40+ currencies with smart rail selection that minimizes cost and latency.',
  },
  {
    icon: '📊',
    title: 'Embedded analytics',
    body: 'Live dashboards for cash position, settlement health, and risk exposure — embeddable directly in your product.',
  },
  {
    icon: '🔄',
    title: 'Auto-reconciliation',
    body: 'Every ledger entry is matched against bank and processor records continuously, surfacing breaks before they compound.',
  },
  {
    icon: '🚀',
    title: 'Instant payouts',
    body: 'Trigger payouts on milestone, schedule, or webhook — funds land in minutes via push-to-card and RTP rails.',
  },
  {
    icon: '🔌',
    title: 'Workflow automation',
    body: 'No-code rules engine connects onboarding, underwriting, and servicing events to your existing stack.',
  },
];

export default function Features() {
  return (
    <section className="features" id="features">
      <span className="section-kicker">Platform</span>
      <h2>Built for how money moves today</h2>
      <p className="section-sub">
        Every operational layer a modern fintech needs — automated end to end, so your team
        ships product instead of babysitting back-office process.
      </p>
      <div className="feature-grid">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="feature-card">
            <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
