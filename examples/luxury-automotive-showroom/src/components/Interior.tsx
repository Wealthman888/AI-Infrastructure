import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const specs = [
  { label: 'Upholstery', value: 'Hand-stitched full-grain leather' },
  { label: 'Trim', value: 'Forged carbon-fiber accents' },
  { label: 'Sound', value: '23-speaker reference audio' },
  { label: 'Climate', value: 'Tri-zone ionized climate control' },
  { label: 'Display', value: '16" curved digital cluster' },
]

export default function Interior() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.2 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="grid bg-[var(--color-midnight)] sm:grid-cols-2">
      <div className="relative h-[60vh] sm:h-auto">
        {/* fal.ai asset: interior cabin reveal video */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src="/assets/interior-cabin-reveal.mp4"
          poster="/assets/interior-cabin-reveal.jpg"
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
      </div>

      <div className="flex flex-col justify-center px-8 py-20 sm:px-16">
        <h2 className="font-[var(--font-display)] text-4xl uppercase tracking-tight text-white sm:text-5xl">
          The Interior Experience
        </h2>
        <p className="mt-4 max-w-md text-white/60">
          Every surface considered. Every material sourced for how it ages, not just how it photographs.
        </p>
        <ul className="mt-10 space-y-4">
          {specs.map((spec, i) => (
            <motion.li
              key={spec.label}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              onMouseEnter={() => setActive(i)}
              className={`border-l-2 pl-4 transition-colors ${
                active === i ? 'border-[var(--color-gold)]' : 'border-white/10'
              }`}
            >
              <div className="text-xs uppercase tracking-widest text-white/40">
                {spec.label}
              </div>
              <div className="mt-1 text-white">{spec.value}</div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
