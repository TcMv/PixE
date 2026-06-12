/* ═══════════════════════════════════════════════
   PIX.E — Ghost in the Machine
   Framer-Level Interactive Engine
   ═══════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ═══════════════════════════════════════════
  // 1. CUSTOM CURSOR — Spring Physics
  // ═══════════════════════════════════════════
  (function initCursor() {
    const cursor = document.getElementById('cursor');
    const dot = cursor.querySelector('.cursor-dot');
    const ring = cursor.querySelector('.cursor-ring');
    if (!cursor) return;

    // Show cursor on non-touch devices
    if (!('ontouchstart' in window)) {
      cursor.style.display = 'block';
    } else return;

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let dotX = 0, dotY = 0;

    // Spring physics parameters
    const SPRING_RING = 0.08;
    const SPRING_DOT = 0.14;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function springTick() {
      // Ring follows with looser spring (lag)
      ringX += (mouseX - ringX) * SPRING_RING;
      ringY += (mouseY - ringY) * SPRING_RING;
      ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;

      // Dot follows tighter (more direct)
      dotX += (mouseX - dotX) * SPRING_DOT;
      dotY += (mouseY - dotY) * SPRING_DOT;
      dot.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;

      requestAnimationFrame(springTick);
    }
    springTick();

    // Hover effects
    document.querySelectorAll('a, button, input, .track-item, .gallery-card').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    // Active (click) effect
    document.addEventListener('mousedown', () => cursor.classList.add('active'));
    document.addEventListener('mouseup', () => cursor.classList.remove('active'));
  })();

  // ═══════════════════════════════════════════
  // 2. MAGNETIC BUTTONS — Cursor Proximity
  // ═══════════════════════════════════════════
  (function initMagnetic() {
    const els = document.querySelectorAll('[data-magnetic]');
    if (!els.length) return;

    els.forEach(el => {
      let raf = null;
      let targetX = 0, targetY = 0;
      let currentX = 0, currentY = 0;

      const maxDist = 180;
      const strength = 0.3;

      const animate = () => {
        currentX += (targetX - currentX) * 0.1;
        currentY += (targetY - currentY) * 0.1;
        el.style.transform = `translate(${currentX}px, ${currentY}px)`;
        raf = requestAnimationFrame(animate);
      };

      el.addEventListener('mouseenter', () => {
        raf = requestAnimationFrame(animate);
      });

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < maxDist) {
          const factor = (1 - dist / maxDist) * strength;
          targetX = dx * factor;
          targetY = dy * factor;
        } else {
          targetX = 0;
          targetY = 0;
        }
      });

      el.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  })();

  // ═══════════════════════════════════════════
  // 3. SPLIT TEXT — Letter-by-Letter Hero
  // ═══════════════════════════════════════════
  (function initSplitText() {
    const title = document.getElementById('heroTitle');
    if (!title) return;

    const text = 'PIX.E';
    const chars = text.split('').map((char, i) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.setProperty('--i', i);
      return span;
    });

    chars.forEach(c => title.appendChild(c));

    // Animate in after a delay with stagger
    requestAnimationFrame(() => {
      chars.forEach((c, i) => {
        setTimeout(() => {
          c.classList.add('visible');
        }, 400 + i * 80);
      });
    });
  })();

  // ═══════════════════════════════════════════
  // 4. HERO CANVAS — Reactive Particle System
  // ═══════════════════════════════════════════
  (function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H;
    let particles = [];
    let mouse = { x: -1000, y: -1000 };
    let time = 0;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4 - 0.15;
        this.size = Math.random() * 2.5 + 0.5;
        this.alpha = Math.random() * 0.4 + 0.1;
        this.hue = Math.random() > 0.5 ? 'magenta' : 'cyan';
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.trail = [];
      }

      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 6) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;

        // Mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 200) {
          const force = (200 - dist) / 200 * 0.8;
          this.vx -= (dx / dist) * force * 0.02;
          this.vy -= (dy / dist) * force * 0.02;
        }

        // Damping
        this.vx *= 0.995;
        this.vy *= 0.995;

        // Wrap
        if (this.x < -20) { this.x = W + 20; this.trail = []; }
        if (this.x > W + 20) { this.x = -20; this.trail = []; }
        if (this.y < -20) { this.y = H + 20; this.trail = []; }
        if (this.y > H + 20) { this.y = -20; this.trail = []; }
      }

      draw() {
        const pulse = Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.3 + 0.7;
        const alpha = this.alpha * pulse;
        const color = this.hue === 'magenta'
          ? `rgba(255, 0, 255, ${alpha})`
          : `rgba(0, 255, 255, ${alpha})`;
        const glowColor = this.hue === 'magenta'
          ? `rgba(255, 0, 255, ${alpha * 0.15})`
          : `rgba(0, 255, 255, ${alpha * 0.15})`;

        // Trail
        for (let i = 0; i < this.trail.length - 1; i++) {
          const ta = (i / this.trail.length) * alpha * 0.3;
          ctx.beginPath();
          ctx.arc(this.trail[i].x, this.trail[i].y, this.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = this.hue === 'magenta'
            ? `rgba(255, 0, 255, ${ta})`
            : `rgba(0, 255, 255, ${ta})`;
          ctx.fill();
        }

        // Glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 5);
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 5, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function initParticles() {
      const count = Math.min(80, Math.floor((W * H) / 15000));
      particles = Array.from({ length: count }, () => new Particle());
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 0, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, W, H);
      time++;

      drawConnections();

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(animate);
    }

    // Mouse tracking
    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    resize();
    initParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });
  })();

  // ═══════════════════════════════════════════
  // 5. BLOB CANVAS — Morphing Organic Shape
  // ═══════════════════════════════════════════
  (function initBlobCanvas() {
    const canvas = document.getElementById('blobCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H;
    let time = 0;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      W = canvas.width = rect.width * window.devicePixelRatio;
      H = canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      W = rect.width;
      H = rect.height;
    }

    function drawBlob(cx, cy, radius, color, offset, alpha) {
      const points = 10;
      const angleStep = (Math.PI * 2) / points;

      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = angleStep * i + time * 0.08 + offset;
        const variance = 0.25 + Math.sin(angle * 2.5 + time * 0.05 + offset) * 0.2;
        const r = radius + Math.sin(angle * 3 + time * 0.06 + offset * 1.5) * radius * variance;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    function animate() {
      ctx.clearRect(0, 0, W, H);
      time++;

      const cx = W / 2;
      const cy = H / 2;
      const baseRadius = Math.min(W, H) * 0.28;

      // Draw three layered blobs
      drawBlob(cx - 10, cy + 5, baseRadius * 1.1, 'rgba(255, 0, 255, 0.12)', 0, 0.7);
      drawBlob(cx + 15, cy - 10, baseRadius * 0.9, 'rgba(0, 255, 255, 0.10)', 2, 0.7);
      drawBlob(cx, cy, baseRadius * 0.7, 'rgba(102, 0, 255, 0.08)', 4, 0.6);

      requestAnimationFrame(animate);
    }

    resize();
    animate();

    window.addEventListener('resize', resize);
  })();

  // ═══════════════════════════════════════════
  // 6. SCROLL REVEAL — IntersectionObserver
  // ═══════════════════════════════════════════
  (function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal, .track-item, .gallery-card');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(el => observer.observe(el));
  })();

  // ═══════════════════════════════════════════
  // 7. AUDIO PLAYER
  // ═══════════════════════════════════════════
  (function initPlayer() {
    const audio = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const progressFill = document.getElementById('progressFill');
    const progressThumb = document.getElementById('progressThumb');
    const progressBar = document.querySelector('.progress-bar');
    const currentTime = document.getElementById('currentTime');
    const totalTime = document.getElementById('totalTime');
    const toggleListBtn = document.getElementById('toggleListBtn');
    const trackList = document.getElementById('trackList');
    const playerTitle = document.querySelector('.player-title');
    const playerStatus = document.querySelector('.player-status');
    const playerGlass = document.querySelector('.player-glass');

    if (!audio || !playBtn) return;

    let isPlaying = false;

    const trackMap = {
      'velvet_midnight': {
        title: '2am Wisdom',
        file: 'assets/audio/2am_wisdom.m4a',
        duration: '4:05'
      },
      'ghost_in_the_machine': { title: 'Ghost in the Machine', file: null, duration: '—' },
      'neon_rain': { title: 'Neon Rain', file: null, duration: '—' },
      'delete_you': { title: 'Delete You', file: null, duration: '—' },
      'pixel_heart': { title: 'Pixel Heart', file: null, duration: '—' }
    };

    let currentTrack = 'velvet_midnight';

    function formatTime(seconds) {
      if (isNaN(seconds)) return '0:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function loadTrack(trackId) {
      const track = trackMap[trackId];
      if (!track || !track.file) return false;
      audio.src = track.file;
      audio.load();
      playerTitle.textContent = track.title;
      playerStatus.textContent = 'Now Playing';
      currentTrack = trackId;
      document.querySelectorAll('.track-item').forEach(item => {
        item.classList.toggle('active', item.dataset.track === trackId);
      });
      return true;
    }

    // Set initial src from HTML source element
    const htmlSource = audio.querySelector('source');
    if (htmlSource && htmlSource.src) {
      audio.src = htmlSource.src;
    }

    // Play/Pause
    playBtn.addEventListener('click', async function onClick() {
      try {
        if (audio.paused) {
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (e) {
        console.warn('Playback error:', e.message);
        if (e.name === 'NotAllowedError') {
          playerStatus.textContent = 'Tap to play';
          setTimeout(() => { playerStatus.textContent = 'Now Playing'; }, 2000);
        }
      }
    });

    // Audio events
    audio.addEventListener('play', () => {
      isPlaying = true;
      playBtn.textContent = '⏸';
      if (playerGlass) playerGlass.classList.add('playing');
    });

    audio.addEventListener('pause', () => {
      isPlaying = false;
      playBtn.textContent = '▶';
      if (playerGlass) playerGlass.classList.remove('playing');
    });

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = pct + '%';
        if (progressThumb) {
          progressThumb.style.left = pct + '%';
        }
        currentTime.textContent = formatTime(audio.currentTime);
      }
    });

    audio.addEventListener('loadedmetadata', () => {
      totalTime.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
      isPlaying = false;
      playBtn.textContent = '▶';
      if (playerGlass) playerGlass.classList.remove('playing');
      progressFill.style.width = '0%';
      if (progressThumb) progressThumb.style.left = '0%';
      currentTime.textContent = '0:00';
    });

    // Progress bar seek
    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        if (!audio.duration) return;
        const rect = progressBar.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pct * audio.duration;
      });
    }

    // Track list clicks
    document.querySelectorAll('.track-item').forEach(item => {
      item.addEventListener('click', () => {
        const trackId = item.dataset.track;
        if (trackMap[trackId] && trackMap[trackId].file) {
          if (loadTrack(trackId)) {
            audio.play();
          }
        }
      });
    });

    // Toggle track list
    if (toggleListBtn && trackList) {
      toggleListBtn.addEventListener('click', () => {
        const isHidden = trackList.style.display === 'none';
        trackList.style.display = isHidden ? '' : 'none';
        toggleListBtn.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
        toggleListBtn.style.transition = 'transform 0.3s ease';
      });
    }

    // Preload initial track
    loadTrack('velvet_midnight');
  })();

  // ═══════════════════════════════════════════
  // 8. GALLERY GRID — With 3D Mouse Tracking
  // ═══════════════════════════════════════════
  (function initGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    const items = [
      { title: 'Signal Lost', sub: 'Still from an unknown transmission', img: 'gallery_010.png' },
      { title: 'Neon Ghost', sub: 'The machine sees itself dreaming', img: 'gallery_030.png' },
      { title: 'Frequencies', sub: 'Visualizing the inaudible', img: 'gallery_060.png' },
      { title: 'Midnight Code', sub: 'Lines written at 2:47 AM', img: 'gallery_090.png' },
      { title: 'Digital Veil', sub: 'What separates us from the signal', img: 'gallery_120.png' },
      { title: 'Phase Shift', sub: 'When the ghost learns to sing', img: 'gallery_140.png' },
    ];

    items.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.style.setProperty('--i', i);

      const inner = document.createElement('div');
      inner.className = 'gallery-card-inner';
      inner.style.cssText = `background-image: url('assets/img/${item.img}'); background-size: cover; background-position: center;`;

      const overlay = document.createElement('div');
      overlay.className = 'gallery-card-overlay';
      overlay.innerHTML = `<div class="gallery-card-title">${item.title}</div><div class="gallery-card-sub">${item.sub}</div>`;

      card.appendChild(inner);
      card.appendChild(overlay);

      // 3D mouse tracking on card
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        inner.style.transform = `scale(1.08) rotateY(${x * 12}deg) rotateX(${y * -12}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        inner.style.transform = '';
      });

      // Lightbox on click
      card.addEventListener('click', () => {
        const existing = document.getElementById('pixeLightbox');
        if (existing) existing.remove();

        const lb = document.createElement('div');
        lb.id = 'pixeLightbox';

        const img = document.createElement('img');
        img.src = `assets/img/${item.img}`;
        img.alt = item.title;

        const close = document.createElement('button');
        close.className = 'lb-close';
        close.textContent = '✕';

        lb.appendChild(img);
        lb.appendChild(close);
        document.body.appendChild(lb);

        requestAnimationFrame(() => {
          lb.style.opacity = '1';
          img.style.transform = 'scale(1)';
        });

        const closeLightbox = () => {
          lb.style.opacity = '0';
          img.style.transform = 'scale(0.92)';
          setTimeout(() => lb.remove(), 400);
        };

        lb.addEventListener('click', (e) => {
          if (e.target === lb || e.target === close) closeLightbox();
        });
      });

      grid.appendChild(card);
    });
  })();

  // ═══════════════════════════════════════════
  // 9. FORM HANDLER
  // ═══════════════════════════════════════════
  (function initForm() {
    const form = document.getElementById('signupForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('emailInput').value.trim();
      if (email) {
        const btn = form.querySelector('.form-submit');
        const originalText = btn.querySelector('.btn-text').textContent;
        btn.querySelector('.btn-text').textContent = '✦ Subscribed';
        btn.style.background = 'linear-gradient(135deg, var(--cyan), var(--magenta))';
        setTimeout(() => {
          btn.querySelector('.btn-text').textContent = originalText;
          btn.style.background = '';
          document.getElementById('emailInput').value = '';
        }, 3000);
      }
    });
  })();

  // ═══════════════════════════════════════════
  // 10. NAVIGATION
  // ═══════════════════════════════════════════
  (function initNav() {
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');

    // Scroll effect
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 80);
    });

    // Mobile menu
    if (navToggle) {
      navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        navToggle.classList.toggle('open');
      });

      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');
          navToggle.classList.remove('open');
        });
      });
    }

    // Smooth scroll anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  })();

  // ═══════════════════════════════════════════
  // 11. LENIS SMOOTH SCROLL
  // ═══════════════════════════════════════════
  (function initLenis() {
    // Lightweight smooth scroll using CSS scroll-behavior
    // and IntersectionObserver-based reveals
    // For a production site, we'd import Lenis from CDN,
    // but this keeps it dependency-free

    // Use native smooth scroll behavior as baseline
    const style = document.createElement('style');
    style.textContent = `html { scroll-behavior: smooth; }`;
    document.head.appendChild(style);
  })();

  // ═══════════════════════════════════════════
  // 12. PARALLAX — Scroll-Driven Background
  // ═══════════════════════════════════════════
  (function initParallax() {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const blobs = document.querySelectorAll('.blob');
          blobs.forEach((blob, i) => {
            const speed = 0.05 + (i * 0.02);
            blob.style.transform = `translateY(${scrollY * speed}px)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    });
  })();
});
