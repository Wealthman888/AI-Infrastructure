const TESTIMONIALS = [
  {
    quote: 'Meridian cut our settlement reconciliation from two days of manual work to a real-time dashboard. We reassigned that whole team to product.',
    name: 'Dana Okafor',
    role: 'VP Operations, Brightline Capital',
  },
  {
    quote: 'The automated KYC pipeline alone paid for the platform — onboarding approval time dropped from 48 hours to under five minutes.',
    name: 'Marcus Wei',
    role: 'Head of Compliance, Northstar Pay',
  },
  {
    quote: 'Fraud losses fell 63% in the first quarter after switching, and we still approve more legitimate transactions than before.',
    name: 'Priya Subramaniam',
    role: 'CTO, Lumen Finance',
  },
];

export default function Testimonials() {
  return (
    <section className="testimonials" id="testimonials">
      <span className="section-kicker">Trusted by operators</span>
      <h2>Teams running on Meridian</h2>
      <div className="testimonial-grid">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name} className="testimonial-card">
            <blockquote>“{t.quote}”</blockquote>
            <figcaption>
              <span className="testimonial-name">{t.name}</span>
              <span className="testimonial-role">{t.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
