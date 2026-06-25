import { lazy, Suspense, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { specs } from '../data/content'
import ErrorBoundary from './ErrorBoundary'

const Car3D = lazy(() => import('./Car3D'))

gsap.registerPlugin(ScrollTrigger)

export default function ScrollFeature() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const section = sectionRef.current
    if (!section) return

    const callouts = section.querySelectorAll<HTMLElement>('.hud-callout')

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=120%',
        scrub: true,
        pin: !reduceMotion,
      },
    })

    callouts.forEach((el, i) => {
      tl.fromTo(
        el,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4 },
        i * 0.3,
      )

      const counterEl = counterRefs.current[i]
      const target = specs[i]?.value ?? 0
      if (counterEl) {
        tl.fromTo(
          counterEl,
          { textContent: 0 },
          {
            textContent: target,
            duration: 0.5,
            snap: { textContent: target < 10 ? 0.1 : 1 },
            onUpdate: function () {
              const val = Number(this.targets()[0].textContent)
              counterEl.textContent =
                target < 10 ? val.toFixed(1) : Math.round(val).toString()
            },
          },
          i * 0.3,
        )
      }
    })

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative h-screen overflow-hidden bg-[var(--color-midnight)]">
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Car3D className="absolute inset-0 h-full w-full opacity-80" />
        </Suspense>
      </ErrorBoundary>
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />

      <div className="relative z-10 grid h-full grid-cols-2 gap-6 px-6 sm:grid-cols-4 sm:px-16">
        {specs.map((spec, i) => (
          <div
            key={spec.label}
            className="hud-callout flex flex-col items-center justify-center self-center rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center backdrop-blur-md"
          >
            <span className="font-[var(--font-display)] text-3xl text-[var(--color-teal)] sm:text-5xl">
              <span ref={(el) => { counterRefs.current[i] = el }}>0</span>
              {spec.suffix}
            </span>
            <span className="mt-2 text-xs uppercase tracking-widest text-white/60">
              {spec.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
