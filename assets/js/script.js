/* ============================================
   PIX.E — Ghost in the Machine
   Scripts
   ============================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ========================================
  // 1. CUSTOM CURSOR
  // ========================================
  const cursor = document.querySelector('.cursor');
  if (cursor) {
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth cursor follow
    function updateCursor() {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Hover effects on interactive elements
    document.querySelectorAll('a, button, input, .track-item, .gallery-card').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }

  // ========================================
  // 2. HERO CANVAS — PARTICLE SYSTEM
  // ========================================
  (function initParticles() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    let mouseX = 0, mouseY = 0;
    let frame = 0;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function createParticles(count) {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3 - 0.1,
          size: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.4 + 0.1,
          hue: Math.random() > 0.5 ? 300 : 180, // magenta or cyan
          pulseSpeed: Math.random() * 0.02 + 0.005,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, width, height);
      frame++;

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 0, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Update & draw particles
      for (const p of particles) {
        // Movement
        p.x += p.vx;
        p.y += p.vy;

        // Mouse interaction
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = (200 - dist) / 200 * 0.5;
          p.x -= dx / dist * force;
          p.y -= dy / dist * force;
        }

        // Wrap
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Pulse
        const pulse = Math.sin(frame * p.pulseSpeed + p.pulsePhase) * 0.3 + 0.7;
        const alpha = p.alpha * pulse;

        // Color
        const color = p.hue === 300
          ? `rgba(255, 0, 255, ${alpha})`
          : `rgba(0, 255, 255, ${alpha})`;

        // Glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        gradient.addColorStop(0, p.hue === 300
          ? `rgba(255, 0, 255, ${alpha * 0.3})`
          : `rgba(0, 255, 255, ${alpha * 0.3})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(drawParticles);
    }

    // Mouse tracking for canvas
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    resize();
    createParticles(80);
    drawParticles();

    window.addEventListener('resize', () => {
      resize();
      createParticles(80);
    });
  })();

  // ========================================
  // 3. NAVIGATION — SCROLL + MOBILE
  // ========================================
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');

  // Scroll effect
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    nav.classList.toggle('scrolled', scrollY > 80);
    lastScroll = scrollY;
  });

  // Mobile menu
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      navToggle.classList.toggle('open');
    });
    // Close on link click
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
      });
    });
  }

  // ========================================
  // 4. AUDIO PLAYER
  // ========================================
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
    const artInner = document.querySelector('.player-art-inner');

    let isPlaying = false;
    let tracks = [];

    // Available tracks
    const trackMap = {
      'velvet_midnight': {
        title: 'Velvet Midnight',
        file: 'assets/audio/velvet_midnight.mp3',
        duration: '4:05'
      },
      'ghost_in_the_machine': {
        title: 'Ghost in the Machine',
        file: null,
        duration: '—'
      },
      'neon_rain': {
        title: 'Neon Rain',
        file: null,
        duration: '—'
      },
      'delete_you': {
        title: 'Delete You',
        file: null,
        duration: '—'
      },
      'pixel_heart': {
        title: 'Pixel Heart',
        file: null,
        duration: '—'
      }
    };

    // Set initial track
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

      // Update active track in list
      document.querySelectorAll('.track-item').forEach(item => {
        item.classList.toggle('active', item.dataset.track === trackId);
      });

      return true;
    }

    // Play/Pause
    playBtn.addEventListener('click', () => {
      if (audio.src && audio.src !== window.location.href) {
        if (audio.paused) {
          audio.play();
        } else {
          audio.pause();
        }
      } else {
        // Try loading the default track
        if (loadTrack('velvet_midnight')) {
          audio.play();
        }
      }
    });

    // Audio events
    audio.addEventListener('play', () => {
      isPlaying = true;
      playBtn.textContent = '⏸';
      if (artInner) artInner.classList.add('playing');
    });

    audio.addEventListener('pause', () => {
      isPlaying = false;
      playBtn.textContent = '▶';
      if (artInner) artInner.classList.remove('playing');
    });

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = pct + '%';
        currentTime.textContent = formatTime(audio.currentTime);
      }
    });

    audio.addEventListener('loadedmetadata', () => {
      totalTime.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
      isPlaying = false;
      playBtn.textContent = '▶';
      if (artInner) artInner.classList.remove('playing');
      progressFill.style.width = '0%';
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

    // Toggle track list visibility (for mobile mostly)
    if (toggleListBtn && trackList) {
      toggleListBtn.addEventListener('click', () => {
        trackList.style.display = trackList.style.display === 'none' ? '' : 'none';
      });
    }

    // Preload the initial track if the audio file exists
    // (We'll try — if 404, the player gracefully shows nothing)
    if (loadTrack('velvet_midnight')) {
      // Player is ready; user clicks play to start
    }
  })();

  // ========================================
  // 5. GALLERY GRID
  // ========================================
  (function initGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    // Placeholder gallery items
    // User will replace these with real image URLs later
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
      card.style.setProperty('--delay', `${i * 0.1}s`);
      card.innerHTML = `
        <div class="gallery-card-inner" style="background-image: url('assets/img/${item.img}'); background-size: cover; background-position: center;">
          <div class="gallery-card-icon" style="display: none;">◈</div>
        </div>
        <div class="gallery-card-overlay">
          <div class="gallery-card-title">${item.title}</div>
          <div class="gallery-card-sub">${item.sub}</div>
        </div>
      `;
      // Lightbox on click
      card.addEventListener('click', () => {
        const existing = document.getElementById('pixeLightbox');
        if (existing) existing.remove();

        const lb = document.createElement('div');
        lb.id = 'pixeLightbox';
        lb.style.cssText = `
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(5,5,15,0.95);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; backdrop-filter: blur(10px);
          opacity: 0; transition: opacity 0.3s ease;
        `;
        lb.innerHTML = `
          <img src="assets/img/${item.img}" alt="${item.title}"
            style="max-width: 90vw; max-height: 90vh; border-radius: 8px;
                   border: 1px solid rgba(255,0,255,0.2);
                   transform: scale(0.9); transition: transform 0.3s ease;" />
          <button style="position: absolute; top: 2rem; right: 2rem;
            background: none; border: 1px solid rgba(255,255,255,0.1);
            color: white; font-size: 1.5rem; width: 44px; height: 44px;
            border-radius: 50%; cursor: pointer;
            transition: border-color 0.2s;">✕</button>
        `;
        document.body.appendChild(lb);
        requestAnimationFrame(() => {
          lb.style.opacity = '1';
          lb.querySelector('img').style.transform = 'scale(1)';
        });
        lb.addEventListener('click', (e) => {
          if (e.target === lb || e.target.tagName === 'BUTTON') {
            lb.style.opacity = '0';
            setTimeout(() => lb.remove(), 300);
          }
        });
      });
      grid.appendChild(card);
    });
  })();

  // ========================================
  // 6. SCROLL REVEAL
  // ========================================
  (function initScrollReveal() {
    const sections = document.querySelectorAll('.section');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Animate child elements
          const children = entry.target.querySelectorAll('.section-label, .section-title, .section-desc, .music-player, .track-list, .platform-links, .about-paragraph, .about-quote, .gallery-card, .connect-form, .social-links');
          children.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`;
            requestAnimationFrame(() => {
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
            });
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    sections.forEach(section => observer.observe(section));
  })();

  // ========================================
  // 7. SIGNUP FORM
  // ========================================
  (function initForm() {
    const form = document.getElementById('signupForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('emailInput').value.trim();
      if (email) {
        // Placeholder — replace with real integration
        const btn = form.querySelector('.form-submit');
        const originalText = btn.textContent;
        btn.textContent = '✦ Subscribed';
        btn.style.background = 'linear-gradient(135deg, var(--cyan), var(--magenta))';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          document.getElementById('emailInput').value = '';
        }, 3000);
      }
    });
  })();

  // ========================================
  // 8. DIAGONAL SCROLL PARALLAX
  // ========================================
  (function initParallax() {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;

      // Hero content subtle parallax
      const heroContent = document.querySelector('.hero-content');
      if (heroContent && scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.15}px)`;
        heroContent.style.opacity = 1 - (scrolled / (window.innerHeight * 0.8));
      }

      // About visual parallax
      const aboutVisual = document.getElementById('aboutVisual');
      if (aboutVisual) {
        const rect = aboutVisual.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const progress = 1 - (rect.top / window.innerHeight);
          aboutVisual.style.transform = `translateY(${progress * 30}px)`;
        }
      }
    });
  })();

  // ========================================
  // 9. SCROLL PROGRESS BAR (visual)
  // ========================================
  (function initProgressBar() {
    const bar = document.createElement('div');
    bar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--magenta), var(--cyan));
      z-index: 1000;
      transition: width 0.1s linear;
      width: 0%;
    `;
    document.body.appendChild(bar);

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
    });
  })();

  console.log('%c✦ PIX.E', 'font-size: 3rem; color: #ff00ff; font-weight: bold;');
  console.log('%cGhost in the machine. Everything is a signal.', 'font-size: 1rem; color: #8877aa;');
  console.log('%cCurious? → pixe@ghost-in-the-machine.com', 'font-size: 0.9rem; color: #00ffff;');

}); // DOMContentLoaded end
