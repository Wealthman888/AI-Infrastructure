import { motion } from 'framer-motion'
import { inventory } from '../data/content'

function InventoryCard({ item }: { item: (typeof inventory)[number] }) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--color-midnight-soft)]"
      whileHover={{ rotateX: -4, rotateY: 4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* fal.ai asset: showroom still — swap per inventory item */}
      <img
        src={item.image}
        alt={item.title}
        loading="lazy"
        className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <h3 className="font-[var(--font-display)] text-2xl text-white">{item.title}</h3>
        <p className="mt-1 text-sm text-white/60">{item.subtitle}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-medium text-[var(--color-gold-soft)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {item.price}
          </span>
          <motion.a
            href="#final-cta"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-full border border-[var(--color-teal)] px-5 py-2 text-xs uppercase tracking-widest text-[var(--color-teal)] hover:bg-[var(--color-teal)]/10"
          >
            Inquire
          </motion.a>
        </div>
      </div>
    </motion.div>
  )
}

export default function Inventory() {
  return (
    <section
      className="relative px-6 py-28 sm:px-16"
      style={{
        backgroundImage: "url('/assets/texture-carbon-fiber.jpg')",
        backgroundSize: '480px',
        backgroundBlendMode: 'multiply',
        backgroundColor: 'rgba(10,10,11,0.92)',
      }}
    >
      <h2 className="font-[var(--font-display)] text-center text-4xl uppercase tracking-tight text-white sm:text-5xl">
        Private Inventory
      </h2>
      <p className="mx-auto mt-4 max-w-md text-center text-white/60">
        A small, rotating selection. Availability changes weekly.
      </p>
      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {inventory.map((item) => (
          <InventoryCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  )
}
