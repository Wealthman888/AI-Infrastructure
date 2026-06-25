const STATS = [
  { value: '$2.4B+', label: 'Processed annually' },
  { value: '99.99%', label: 'Platform uptime' },
  { value: '150+', label: 'Countries supported' },
  { value: '<200ms', label: 'Median settlement' },
  { value: '40+', label: 'Currencies orchestrated' },
  { value: '63%', label: 'Avg. fraud loss reduction' },
];

export default function Stats() {
  return (
    <section className="stats" id="security">
      <div className="stats-grid">
        {STATS.map((stat) => (
          <div key={stat.label} className="stat">
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
