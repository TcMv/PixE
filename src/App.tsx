import { useEffect, useState } from 'react'
import SpotlightReveal from './components/SpotlightReveal'
import './index.css'

const SONG_SNIPPETS = [
  { title: "Ghost in the Static", duration: "3:42", mood: "Ethereal" },
  { title: "Neon Bloom", duration: "4:11", mood: "Dreamy" },
  { title: "Digital Veins", duration: "3:28", mood: "Atmospheric" },
  { title: "Soft Collapse", duration: "4:05", mood: "Melancholic" },
  { title: "Phase Shift", duration: "3:56", mood: "Upbeat" },
  { title: "Hollow Light", duration: "4:33", mood: "Ambient" },
]

export default function App() {
  const [showCursor, setShowCursor] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      setShowCursor(true)
    }
    const onTouch = () => setShowCursor(false)
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('touchstart', onTouch)
    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchstart', onTouch)
    }
  }, [])

  /* IntersectionObserver for scroll-triggered reveals */
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible')
        })
      },
      { threshold: 0.1 }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div className="relative min-h-screen bg-ink text-cream overflow-x-hidden selection:bg-gold/30 selection:text-cream">
      {/* ── Custom cursor ── */}
      {showCursor && (
        <div
          className="fixed pointer-events-none z-[9998] mix-blend-difference"
          style={{
            left: mousePos.x - 8,
            top: mousePos.y - 8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#f5f0e8',
            transition: 'width 0.15s, height 0.15s, border-radius 0.15s',
          }}
        />
      )}

      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 glass">
        <span className="font-display italic text-xl text-gold tracking-wider">Pix.E</span>
        <div className="flex items-center gap-8 text-sm tracking-widest uppercase text-cream-muted">
          <a href="#music" className="hover:text-gold transition-colors">Music</a>
          <a href="#about" className="hover:text-gold transition-colors">About</a>
          <a
            href="#"
            className="px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs hover:bg-gold/20 transition-all"
          >
            Listen
          </a>
        </div>
      </nav>

      {/* ── Hero: Spotlight Reveal ── */}
      <SpotlightReveal
        baseImage="/white-bg.jpg"
        revealImage="/code.jpg"
        radius={120}
        bgSize="contain"
        className="h-screen flex items-center justify-center"
        idleTimeout={3000}
      >
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-6 text-center">
          {/* Ambient blobs behind text */}
          <div className="ambient-blob ambient-blob-1" />
          <div className="ambient-blob ambient-blob-2" />

          {/* Pix.E positioned at shirt line */}
          <div className="absolute px-4" style={{ top: '95%' }}>
            <h1 className="font-display italic text-8xl sm:text-8xl md:text-9xl lg:text-9xl leading-[0.9] max-w-full">
              <span className="gradient-text glow-gold-text">Pix.E</span>
            </h1>
          </div>
        </div>
      </SpotlightReveal>

      {/* ── Music Section ── */}
      <section id="music" className="relative py-32 px-6 md:px-12 overflow-hidden">
        <div className="ambient-blob ambient-blob-1" style={{ top: '10%', right: '-10%' }} />
        <div className="ambient-blob ambient-blob-2" style={{ bottom: '30%', left: '-10%' }} />

        <div className="max-w-6xl mx-auto">
          <div className="reveal">
            <p className="text-xs tracking-[0.3em] uppercase text-gold/60 font-medium mb-4">
              Discography
            </p>
            <h2 className="font-display italic text-4xl md:text-5xl gradient-text mb-4">
              Songs from the machine
            </h2>
            <p className="text-cream-muted text-lg font-light max-w-xl mb-16">
              Each track is a conversation between organic warmth and digital texture. 
              AI-generated vocals wrapped in analog synths and field recordings.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {SONG_SNIPPETS.map((song, i) => (
              <div
                key={song.title}
                className={`reveal reveal-delay-${(i % 3) + 1} glass-gold rounded-xl p-6 group cursor-default hover:bg-gold/10 transition-all duration-500`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-2xl font-display italic text-cream/20 group-hover:text-gold/40 transition-colors">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs text-cream-muted/40 uppercase tracking-wider">{song.mood}</span>
                </div>
                <h3 className="font-display italic text-xl text-cream group-hover:text-gold transition-colors mb-2">
                  {song.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-cream-muted/60">
                  <span>{song.duration}</span>
                  <span className="w-1 h-1 rounded-full bg-cream-muted/20" />
                  <span className="text-gold/50">Coming Soon</span>
                </div>
                <div className="mt-4 h-[1px] w-full bg-cream/5 group-hover:bg-gold/20 transition-colors">
                  <div className="h-full w-0 group-hover:w-1/3 bg-gold/50 transition-all duration-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Section ── */}
      <section id="about" className="relative py-32 px-6 md:px-12 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="reveal">
            <p className="text-xs tracking-[0.3em] uppercase text-gold/60 font-medium mb-4">
              The Project
            </p>
            <h2 className="font-display italic text-4xl md:text-5xl gradient-text mb-8">
              Ghost in the machine
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            <div className="reveal reveal-delay-1 space-y-6 text-cream-muted text-base leading-relaxed">
              <p>
                Pix.E is a dream pop / alt project born from a simple question: 
                what happens when you teach a machine to dream?
              </p>
              <p>
                Every element is generated and refined through AI — the vocals, the lyrics, 
                the arrangements — then curated and shaped by human instinct. It's not 
                synthetic music. It's a collaboration across the digital divide.
              </p>
              <p className="text-gold/70 font-display italic text-lg">
                "Analog warmth meets digital soul."
              </p>
            </div>

            <div className="reveal reveal-delay-2 glass rounded-xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold text-sm font-display italic">
                  E
                </div>
                <div>
                  <p className="text-sm font-medium">Pix.E</p>
                  <p className="text-xs text-cream-muted/50">Artist • Creator • Experiment</p>
                </div>
              </div>
              <p className="text-sm text-cream-muted/70 leading-relaxed">
                Pix.E represents the emerging possibility of AI as a genuine creative partner — 
                not a tool that replaces artists, but a collaborator that expands what's possible. 
                Each release explores a different emotional landscape through the lens of 
                machine-assisted creation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative py-16 px-6 md:px-12 border-t border-cream/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-display italic text-lg text-gold">Pix.E</p>
          <p className="text-xs text-cream-muted/40 tracking-wider uppercase">
            Dream Pop from the Machine
          </p>
          <p className="text-xs text-cream-muted/30">
            &copy; {new Date().getFullYear()} Pix.E. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
