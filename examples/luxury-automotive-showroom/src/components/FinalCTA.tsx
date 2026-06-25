import { useState } from 'react'
import { motion } from 'framer-motion'

export default function FinalCTA() {
  const [submitted, setSubmitted] = useState(false)

  // Styled stub only — wire to a GHL webhook endpoint when ready.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section
      id="final-cta"
      className="relative flex min-h-screen items-center justify-center px-6 py-24"
    >
      {/* fal.ai asset: dramatic still backdrop for final conversion */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/showroom-floor-02.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/80" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl sm:p-10"
      >
        <h2 className="font-[var(--font-display)] text-3xl uppercase tracking-tight text-white sm:text-4xl">
          Private Inventory
        </h2>
        <p className="mt-2 text-sm uppercase tracking-widest text-[var(--color-gold)]">
          By appointment only
        </p>

        {submitted ? (
          <p className="mt-8 text-white/80">
            Thank you. A specialist will reach out within one business day.
          </p>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <input
              required
              type="text"
              placeholder="Full name"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-[var(--color-gold)]"
            />
            <input
              required
              type="tel"
              placeholder="Phone number"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-[var(--color-gold)]"
            />
            <input
              type="text"
              placeholder="Car of interest (optional)"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-[var(--color-gold)]"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="magnetic-cta w-full rounded-full bg-[var(--color-gold)] py-4 text-sm font-medium uppercase tracking-widest text-[var(--color-midnight)] shadow-[0_0_30px_rgba(201,169,92,0.4)]"
            >
              Request Private Viewing
            </motion.button>
          </form>
        )}
      </motion.div>
    </section>
  )
}
