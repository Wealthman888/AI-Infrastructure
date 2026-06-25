const INTEGRATIONS = [
  'Plaid', 'Stripe', 'Visa', 'Mastercard', 'SWIFT', 'ACH', 'SEPA', 'FedNow',
];

export default function Integrations() {
  return (
    <section className="integrations" id="integrations">
      <span className="section-kicker">Connected</span>
      <h2>Plugs into the rails you already use</h2>
      <div className="integration-grid">
        {INTEGRATIONS.map((name) => (
          <div key={name} className="integration-chip">{name}</div>
        ))}
      </div>
    </section>
  );
}
