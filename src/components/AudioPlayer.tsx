import { useState, useRef, useEffect, useCallback } from 'react'

interface Track {
  id: string
  title: string
  file: string | null
  duration: string
  mood?: string
}

const TRACKS: Track[] = [
  { id: 'neon_rain', title: 'Neon Rain', file: '/audio/neon-rain.m4a', duration: '3:57', mood: 'Dreamy' },
  { id: 'two_am_wisdom', title: '2am Wisdom', file: null, duration: '—', mood: 'Atmospheric' },
  { id: 'ghost_in_the_machine', title: 'Ghost in the Machine', file: null, duration: '—', mood: 'Ethereal' },
  { id: 'delete_you', title: 'Delete You', file: null, duration: '—', mood: 'Melancholic' },
  { id: 'pixel_heart', title: 'Pixel Heart', file: null, duration: '—', mood: 'Upbeat' },
  { id: 'soft_collapse', title: 'Soft Collapse', file: null, duration: '—', mood: 'Ambient' },
]

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement | null>(null)
  const [currentTrack, setCurrentTrack] = useState('neon_rain')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showTrackList, setShowTrackList] = useState(false)

  const track = TRACKS.find(t => t.id === currentTrack)!

  const loadTrack = useCallback((trackId: string) => {
    const t = TRACKS.find(tr => tr.id === trackId)
    if (!t || !t.file || !audioRef.current) return
    audioRef.current.src = t.file
    audioRef.current.load()
    setCurrentTrack(trackId)
    setCurrentTime(0)
  }, [])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      if (audio.paused) {
        await audio.play()
      } else {
        audio.pause()
      }
    } catch { /* user interaction required first */ }
  }, [])

  const handleTrackSelect = useCallback((trackId: string) => {
    const t = TRACKS.find(tr => tr.id === trackId)
    if (!t?.file) return
    loadTrack(trackId)
    // Auto-play after load
    const audio = audioRef.current
    if (audio) {
      audio.addEventListener('canplay', () => audio.play(), { once: true })
    }
    setShowTrackList(false)
  }, [loadTrack])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * duration
  }, [duration])

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay])

  return (
    <>
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          const a = audioRef.current
          if (a) setCurrentTime(a.currentTime)
        }}
        onLoadedMetadata={() => {
          const a = audioRef.current
          if (a) setDuration(a.duration)
        }}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
      />

      <div className="reveal">
        {/* ── Player Glass Card ── */}
        <div className={`relative overflow-hidden rounded-2xl p-6 md:p-8 mb-4 transition-all duration-500 ${
          isPlaying ? 'glass-gold border-gold/30' : 'glass border-cream/10'
        }`}>
          {/* EQ bars (animated when playing) */}
          <div className="absolute inset-0 flex items-end justify-center gap-[3px] px-4 pointer-events-none opacity-[0.06]">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className={`w-[4px] rounded-full bg-gold transition-all duration-300 ${
                  isPlaying ? 'eq-bar-animate' : 'h-2'
                }`}
                style={isPlaying ? {
                  height: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.07}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                } : {}}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5">
            {/* Art disc */}
            <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full flex-shrink-0 flex items-center justify-center ${
              isPlaying ? 'animate-spin-slow' : ''
            }`}
              style={{
                background: 'linear-gradient(135deg, #d4a84b20, #b8943a40)',
                border: '1px solid rgba(212,168,75,0.3)',
              }}
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, #d4a84b15, #0a0a0f)',
                  border: '1px solid rgba(212,168,75,0.2)',
                }}
              >
                <span className="text-xl md:text-2xl font-display italic text-gold/70">P</span>
              </div>
            </div>

            {/* Info + Controls */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-gold/50 font-medium mb-1">
                    {isPlaying ? 'Now Playing' : 'Paused'}
                  </p>
                  <h3 className="font-display italic text-xl md:text-2xl text-cream truncate">
                    {track.title}
                  </h3>
                  <p className="text-xs text-cream-muted/60">Pix.E</p>
                </div>
              </div>

              {/* Controls row */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 bg-gold/10 hover:bg-gold/20 border border-gold/30 hover:border-gold/50 active:scale-95"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  <span className="text-lg md:text-xl text-gold">
                    {isPlaying ? '⏸' : '▶'}
                  </span>
                </button>

                {/* Progress bar */}
                <div className="flex-1">
                  <div
                    ref={progressRef}
                    className="progress-bar h-1.5 md:h-2 rounded-full bg-cream/10 cursor-pointer relative overflow-hidden group"
                    onClick={handleSeek}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold transition-all duration-100"
                      style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-gold shadow-lg shadow-gold/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%', transform: 'translate(-50%, -50%)' }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] md:text-xs text-cream-muted/50 font-mono">{formatTime(currentTime)}</span>
                    <span className="text-[10px] md:text-xs text-cream-muted/50 font-mono">{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Track list toggle */}
                <button
                  onClick={() => setShowTrackList(v => !v)}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-cream/5 hover:bg-cream/10 border border-cream/10 hover:border-cream/20 active:scale-95"
                  aria-label="Toggle track list"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream-muted/60">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Track List ── */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
          showTrackList ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="glass rounded-xl divide-y divide-cream/5">
            {TRACKS.map((t, i) => {
              const isCurrent = t.id === currentTrack
              const isPlayable = !!t.file
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-all duration-300 cursor-pointer ${
                    isCurrent
                      ? 'bg-gold/10 text-gold'
                      : isPlayable
                        ? 'hover:bg-cream/5 text-cream'
                        : 'text-cream-muted/40 cursor-not-allowed'
                  }`}
                  onClick={() => isPlayable && handleTrackSelect(t.id)}
                >
                  <span className={`text-xs font-mono w-6 ${isCurrent ? 'text-gold' : 'text-cream-muted/30'}`}>
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isCurrent ? 'text-gold' : ''}`}>
                      {t.title}
                    </p>
                    {t.mood && (
                      <p className="text-[10px] text-cream-muted/40 uppercase tracking-wider mt-0.5">
                        {t.mood}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-mono ${isCurrent ? 'text-gold/70' : 'text-cream-muted/30'}`}>
                    {isCurrent && isPlaying ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gold animate-pulse" />
                        <span className="w-1 h-1 rounded-full bg-gold animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <span className="w-1 h-1 rounded-full bg-gold animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </span>
                    ) : isCurrent ? (
                      'Playing'
                    ) : t.file ? (
                      t.duration
                    ) : (
                      <span className="text-[9px] uppercase tracking-wider">Soon</span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
