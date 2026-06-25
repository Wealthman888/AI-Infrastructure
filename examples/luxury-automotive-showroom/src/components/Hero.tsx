import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import ErrorBoundary from './ErrorBoundary'

const Car3D = lazy(() => import('./Car3D'))

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setParallax({ x, y })
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [reduceMotion])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.1 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden">
      {/* fal.ai asset: hero loop video — swap public/assets/hero-tunnel-hypercar.mp4 per client */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/assets/hero-tunnel-hypercar.mp4"
        poster="/assets/hero-tunnel-hypercar.jpg"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black" />

      {!reduceMotion && (
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            transform: `translate(${parallax.x * 14}px, ${parallax.y * 10}px)`,
            transition: 'transform 0.2s ease-out',
          }}
        >
          <ErrorBoundary>
            <Suspense fallback={null}>
              <Car3D className="absolute bottom-0 right-[8%] h-[55%] w-[40%]" />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="font-[var(--font-display)] text-5xl font-semibold uppercase tracking-tight text-[var(--color-ink)] sm:text-7xl md:text-8xl"
        >
          Drive Something <span className="text-[var(--color-gold)]">Unforgettable</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
          className="mt-6 max-w-xl text-lg text-white/70"
        >
          Curated exotics and performance machines, delivered with the discretion of a private bank.
        </motion.p>
        <motion.a
          href="#final-cta"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: 'easeOut' }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="magnetic-cta mt-10 rounded-full border border-[var(--color-gold)] bg-[var(--color-gold)]/10 px-10 py-4 text-sm font-medium uppercase tracking-widest text-[var(--color-gold-soft)] shadow-[0_0_30px_rgba(201,169,92,0.35)] backdrop-blur-sm hover:bg-[var(--color-gold)]/20"
        >
          Book a Private Viewing
        </motion.a>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white/50"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <svg width="24" height="36" viewBox="0 0 24 36" fill="none">
          <rect x="1" y="1" width="22" height="34" rx="11" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="10" r="2.5" fill="currentColor" />
        </svg>
      </motion.div>
    </section>
  )
}
