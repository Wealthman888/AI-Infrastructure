import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function RacingBand() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || !sectionRef.current) return

    const parallax = gsap.to(bgRef.current, {
      yPercent: 15,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    })

    const wipe = gsap.fromTo(
      headingRef.current,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          end: 'top 20%',
          scrub: true,
        },
      },
    )

    return () => {
      parallax.scrollTrigger?.kill()
      parallax.kill()
      wipe.scrollTrigger?.kill()
      wipe.kill()
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative h-[80vh] overflow-hidden">
      {/* fal.ai asset: racing B-roll — currently a still (racing-coastal-gt.jpg) pending
          fal.ai balance top-up; swap to racing-coastal-gt.mp4 <video> once regenerated */}
      <div
        ref={bgRef}
        className="absolute inset-0 -top-[10%] h-[120%] w-full bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/racing-coastal-gt.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex h-full items-center justify-center px-6">
        <h2
          ref={headingRef}
          className="font-[var(--font-display)] text-4xl font-semibold uppercase tracking-tight text-white sm:text-6xl"
        >
          Engineered for the Apex
        </h2>
      </div>
    </section>
  )
}
