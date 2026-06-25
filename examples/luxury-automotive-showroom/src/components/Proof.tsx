import { motion } from 'framer-motion'
import { testimonials } from '../data/content'

const stats = [
  { label: 'Cars Delivered', value: '1,240+' },
  { label: 'Avg. Time to Match', value: '9 Days' },
  { label: 'Client Retention', value: '94%' },
]

export default function Proof() {
  return (
    <section className="bg-[var(--color-midnight-soft)] px-6 py-24 sm:px-16">
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-center"
          >
            <div className="font-[var(--font-display)] text-4xl text-[var(--color-gold)]">
              {stat.value}
            </div>
            <div className="mt-2 text-sm uppercase tracking-widest text-white/50">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mx-auto mt-20 grid max-w-5xl gap-8 sm:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.blockquote
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80"
          >
            <p className="italic">&ldquo;{t.quote}&rdquo;</p>
            <footer className="mt-4 text-sm text-[var(--color-teal)]">{t.name}</footer>
          </motion.blockquote>
        ))}
      </div>
    </section>
  )
}
