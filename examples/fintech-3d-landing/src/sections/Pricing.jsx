const PLANS = [
  {
    name: 'Launch',
    price: '$0',
    period: 'to start',
    features: ['Up to $50K processed/mo', 'Automated KYC', 'Sandbox + 1 live key', 'Community support'],
  },
  {
    name: 'Scale',
    price: '0.4%',
    period: 'per transaction',
    highlighted: true,
    features: ['Unlimited volume', 'Fraud detection engine', 'Multi-currency orchestration', 'Priority support + SLA'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'volume pricing',
    features: ['Dedicated infrastructure', 'Custom compliance workflows', 'White-label dashboards', 'Dedicated solutions engineer'],
  },
];

export default function Pricing() {
  return (
    <section className="pricing" id="pricing">
      <span className="section-kicker">Pricing</span>
      <h2>Pay for what you move</h2>
      <p className="section-sub">No setup fees, no minimums. Scale from first transaction to billions processed.</p>
      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <div key={plan.name} className={`pricing-card${plan.highlighted ? ' pricing-card-highlight' : ''}`}>
            {plan.highlighted && <span className="pricing-badge">Most popular</span>}
            <h3>{plan.name}</h3>
            <div className="pricing-amount">
              <span className="pricing-value">{plan.price}</span>
              <span className="pricing-period">{plan.period}</span>
            </div>
            <ul className="pricing-features">
              {plan.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <a className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-ghost'} pricing-cta`} href="#contact">
              Get started
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
