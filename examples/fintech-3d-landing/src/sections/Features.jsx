const FEATURES = [
  {
    title: 'Bank-grade security',
    body: 'Every transaction is encrypted end-to-end and reconciled against a tamper-evident ledger.',
  },
  {
    title: 'Real-time settlement',
    body: 'Move funds between accounts and currencies in milliseconds, not business days.',
  },
  {
    title: 'Global payouts',
    body: 'Pay out to 150+ countries through a single integration, with local rails handled for you.',
  },
];

export default function Features() {
  return (
    <section className="features" id="features">
      <h2>Built for how money moves today</h2>
      <div className="feature-grid">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="feature-card">
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
