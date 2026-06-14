import { useEffect, useRef, useState } from 'react'

interface SpotlightRevealProps {
  baseImage: string
  revealImage: string
  radius?: number
  idleTimeout?: number
  bgSize?: string
  className?: string
  children?: React.ReactNode
}

export default function SpotlightReveal({
  baseImage,
  revealImage,
  radius = 260,
  idleTimeout = 3000,
  bgSize = 'cover',
  className = '',
  children,
}: SpotlightRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const revealRef = useRef<HTMLDivElement | null>(null)
  const raw = useRef({ x: -999, y: -999 })
  const smooth = useRef({ x: -999, y: -999 })
  const rafId = useRef<number | null>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const orbitAngle = useRef(0)
  const isInteracting = useRef(false)

  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 })

  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current
      if (!c) return
      c.width = window.innerWidth
      c.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const reveal = revealRef.current
    if (!canvas || !reveal) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const g = ctx.createRadialGradient(cursorPos.x, cursorPos.y, 0, cursorPos.x, cursorPos.y, radius)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.4, 'rgba(255,255,255,1)')
    g.addColorStop(0.6, 'rgba(255,255,255,0.75)')
    g.addColorStop(0.75, 'rgba(255,255,255,0.4)')
    g.addColorStop(0.88, 'rgba(255,255,255,0.12)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cursorPos.x, cursorPos.y, radius, 0, Math.PI * 2)
    ctx.fill()

    const mask = `url(${canvas.toDataURL()})`
    reveal.style.maskImage = mask
    reveal.style.setProperty('-webkit-mask-image', mask)
    reveal.style.maskSize = '100% 100%'
    reveal.style.setProperty('-webkit-mask-size', '100% 100%')
  }, [cursorPos, radius])

  const handlePointer = (cx: number, cy: number) => {
    raw.current.x = cx
    raw.current.y = cy
    isInteracting.current = true

    if (idleTimeout > 0) {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        isInteracting.current = false
      }, idleTimeout)
    }
  }

  useEffect(() => {
    const onMouse = (e: MouseEvent) => handlePointer(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) handlePointer(t.clientX, t.clientY)
    }
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) handlePointer(t.clientX, t.clientY)
    }

    window.addEventListener('mousemove', onMouse)
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchstart', onTouchStart)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [idleTimeout])

  useEffect(() => {
    const tick = () => {
      const W = window.innerWidth
      const H = window.innerHeight

      if (isInteracting.current) {
        smooth.current.x += (raw.current.x - smooth.current.x) * 0.1
        smooth.current.y += (raw.current.y - smooth.current.y) * 0.1
      } else if (idleTimeout > 0) {
        orbitAngle.current += 0.008
        const tx = W / 2 + Math.cos(orbitAngle.current) * radius * 2.25
        const ty = H / 2 + Math.sin(orbitAngle.current) * radius * 2.25 * 0.6
        smooth.current.x += (tx - smooth.current.x) * 0.03
        smooth.current.y += (ty - smooth.current.y) * 0.03
      }

      setCursorPos({ x: smooth.current.x, y: smooth.current.y })
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    }
  }, [idleTimeout, radius])

  return (
    <section className={`relative w-full overflow-hidden bg-black ${className}`}>
      <div
        className="absolute inset-0 bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${baseImage})`, backgroundSize: bgSize }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ display: 'none' }} />
      <div
        ref={revealRef}
        className="absolute inset-0 bg-center bg-no-repeat pointer-events-none z-10"
        style={{ backgroundImage: `url(${revealImage})`, backgroundSize: bgSize }}
      />

      <div className="relative z-20">
        {children}
      </div>
    </section>
  )
}
