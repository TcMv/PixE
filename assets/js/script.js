/* ═══════════════════════════════════════════════
   PIX.E — Ghost in the Machine
   Cosmic Interactive Engine (Three.js + Web Audio)
   ═══════════════════════════════════════════════ */

'use strict';

const THREE = window.THREE;

// ═════════════════════════════════════════════
// GLOBAL STATE
// ═════════════════════════════════════════════
const STATE = {
  audioCtx: null,
  analyser: null,
  freqData: null,
  bass: 0, mid: 0, treble: 0,
  avgFreq: 0,
  mouse: { x: 0, y: 0 },
  targetMouse: { x: 0, y: 0 },
  time: 0,
  isPlaying: false,
};

// ═════════════════════════════════════════════
// 1. WEB AUDIO API — Real-Time Analyser
// ═════════════════════════════════════════════
function initAudioAnalyser(audioElement) {
  try {
    STATE.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    STATE.analyser = STATE.audioCtx.createAnalyser();
    STATE.analyser.fftSize = 256;
    STATE.freqData = new Uint8Array(STATE.analyser.frequencyBinCount);

    const source = STATE.audioCtx.createMediaElementSource(audioElement);
    source.connect(STATE.analyser);
    STATE.analyser.connect(STATE.audioCtx.destination);

    // Resume context on first user interaction
    const resume = () => {
      if (STATE.audioCtx.state === 'suspended') {
        STATE.audioCtx.resume();
      }
      document.removeEventListener('click', resume);
      document.removeEventListener('touchstart', resume);
    };
    document.addEventListener('click', resume);
    document.addEventListener('touchstart', resume);
  } catch (e) {
    console.warn('Web Audio API not available:', e.message);
  }
}

function updateAudioData() {
  if (!STATE.analyser) return;
  STATE.analyser.getByteFrequencyData(STATE.freqData);
  const len = STATE.freqData.length;
  let total = 0;
  let bassTotal = 0, midTotal = 0, trebleTotal = 0;
  const bassEnd = Math.floor(len * 0.2);
  const midEnd = Math.floor(len * 0.6);

  for (let i = 0; i < len; i++) {
    const v = STATE.freqData[i] / 255;
    total += v;
    if (i < bassEnd) bassTotal += v;
    else if (i < midEnd) midTotal += v;
    else trebleTotal += v;
  }

  STATE.avgFreq = total / len;
  STATE.bass = bassTotal / bassEnd;
  STATE.mid = midTotal / (midEnd - bassEnd);
  STATE.treble = trebleTotal / (len - midEnd);
}

// ═════════════════════════════════════════════
// 2. CUSTOM CURSOR — With Trail Ripple
// ═════════════════════════════════════════════
(function initCursor() {
  const cursor = document.getElementById('cursor');
  const dot = cursor?.querySelector('.cursor-dot');
  const ring = cursor?.querySelector('.cursor-ring');
  if (!cursor) return;

  if (!('ontouchstart' in window)) {
    cursor.style.display = 'block';
  } else return;

  let mx = 0, my = 0;
  let rx = 0, ry = 0;
  let dx = 0, dy = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  function springTick() {
    rx += (mx - rx) * 0.08;
    ry += (my - ry) * 0.08;
    dx += (mx - dx) * 0.15;
    dy += (my - dy) * 0.15;
    if (ring) ring.style.transform = `translate(${rx - 20}px, ${ry - 20}px)`;
    if (dot) dot.style.transform = `translate(${dx - 4}px, ${dy - 4}px)`;
    STATE.mouse.x = (mx / window.innerWidth) * 2 - 1;
    STATE.mouse.y = -(my / window.innerHeight) * 2 + 1;
    STATE.targetMouse.x += (STATE.mouse.x - STATE.targetMouse.x) * 0.05;
    STATE.targetMouse.y += (STATE.mouse.y - STATE.targetMouse.y) * 0.05;
    requestAnimationFrame(springTick);
  }
  springTick();

  document.querySelectorAll('a, button, input, .track-item, .gallery-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
  document.addEventListener('mousedown', () => cursor.classList.add('active'));
  document.addEventListener('mouseup', () => cursor.classList.remove('active'));
})();

// ═════════════════════════════════════════════
// 3. MAGNETIC BUTTONS
// ═════════════════════════════════════════════
(function initMagnetic() {
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    let raf = null, tx = 0, ty = 0, cx = 0, cy = 0;

    el.addEventListener('mouseenter', () => {
      raf = requestAnimationFrame(function animate() {
        cx += (tx - cx) * 0.1;
        cy += (ty - cy) * 0.1;
        el.style.transform = `translate(${cx}px, ${cy}px)`;
        raf = requestAnimationFrame(animate);
      });
    });

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx2 = rect.left + rect.width / 2;
      const cy2 = rect.top + rect.height / 2;
      const ddx = e.clientX - cx2, ddy = e.clientY - cy2;
      const dist = Math.hypot(ddx, ddy);
      if (dist < 180) {
        const f = (1 - dist / 180) * 0.3;
        tx = ddx * f; ty = ddy * f;
      } else { tx = 0; ty = 0; }
    });

    el.addEventListener('mouseleave', () => {
      tx = 0; ty = 0;
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
    });
  });
})();

// ═════════════════════════════════════════════
// 4. SPLIT TEXT HERO
// ═════════════════════════════════════════════
(function initSplitText() {
  const title = document.getElementById('heroTitle');
  if (!title) return;
  const text = 'PIX.E';
  text.split('').forEach((char, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = char === ' ' ? '\u00A0' : char;
    title.appendChild(span);
    setTimeout(() => span.classList.add('visible'), 400 + i * 80);
  });
})();

// ═════════════════════════════════════════════
// 5. THREE.JS — 3D Particle Galaxy
// ═════════════════════════════════════════════
(function initThreeGalaxy() {
  if (!THREE) return;
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // ─── Particle System ───
  const PARTICLE_COUNT = 4000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const velocities = [];
  const spiralAngles = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const radius = 2 + Math.random() * 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    // Spiral distribution
    const spiral = i / PARTICLE_COUNT * Math.PI * 8;
    const r = (i / PARTICLE_COUNT) * 18 + 1;

    positions[i * 3] = Math.cos(spiral + theta) * r + (Math.random() - 0.5) * 2;
    positions[i * 3 + 1] = Math.sin(spiral * 0.5 + phi) * r * 0.4 + (Math.random() - 0.5) * 2;
    positions[i * 3 + 2] = Math.sin(spiral + theta) * r + (Math.random() - 0.5) * 2;

    const isMagenta = Math.random() > 0.5;
    colors[i * 3] = isMagenta ? 1 : 0;
    colors[i * 3 + 1] = 0;
    colors[i * 3 + 2] = isMagenta ? 0 : 1;

    sizes[i] = 0.05 + Math.random() * 0.15;
    velocities.push({
      x: (Math.random() - 0.5) * 0.005,
      y: (Math.random() - 0.5) * 0.005,
      z: (Math.random() - 0.5) * 0.005,
    });
    spiralAngles.push({ theta, phi, r, speed: 0.0002 + Math.random() * 0.0008 });
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const texture = createParticleTexture();
  const material = new THREE.PointsMaterial({
    size: 0.2,
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    vertexColors: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  function createParticleTexture() {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }

  // ─── Floating 3D Text ───
  const textCanvas = document.createElement('canvas');
  textCanvas.width = 1024;
  textCanvas.height = 256;
  const tctx = textCanvas.getContext('2d');
  tctx.clearRect(0, 0, 1024, 256);
  const grad = tctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0, '#ff00ff');
  grad.addColorStop(0.5, '#00ffff');
  grad.addColorStop(1, '#ff00ff');
  tctx.fillStyle = grad;
  tctx.font = 'bold 180px Space Grotesk, sans-serif';
  tctx.textAlign = 'center';
  tctx.textBaseline = 'middle';
  tctx.shadowColor = 'rgba(255,0,255,0.3)';
  tctx.shadowBlur = 40;
  tctx.fillText('PIX.E', 512, 128);

  const textTexture = new THREE.CanvasTexture(textCanvas);
  const textMat = new THREE.SpriteMaterial({
    map: textTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.15,
    depthWrite: false,
  });
  const textSprite = new THREE.Sprite(textMat);
  textSprite.position.set(0, 0, -5);
  textSprite.scale.set(24, 6, 1);
  scene.add(textSprite);

  // ─── Ambient Stars ───
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(1500 * 3);
  for (let i = 0; i < 1500; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 100;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 100;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 100 - 20;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.08,
    transparent: true,
    opacity: 0.4,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ─── Animation Loop ───
  function animate() {
    STATE.time++;
    updateAudioData();

    const pos = particles.geometry.attributes.position.array;
    const freq = STATE.avgFreq || 0;
    const bass = STATE.bass || 0;
    const pulse = 1 + freq * 0.3;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const sa = spiralAngles[i];
      const targetR = (i / PARTICLE_COUNT) * 18 + 1;
      const basePos = [
        Math.cos(sa.theta + STATE.time * sa.speed + bass * 0.5) * targetR,
        Math.sin(sa.theta * 0.5 + sa.phi + STATE.time * sa.speed * 0.7 + bass * 0.3) * targetR * 0.4,
        Math.sin(sa.theta + STATE.time * sa.speed + bass * 0.5) * targetR,
      ];

      pos[i3] += (basePos[0] - pos[i3]) * 0.02 + velocities[i].x;
      pos[i3 + 1] += (basePos[1] - pos[i3 + 1]) * 0.02 + velocities[i].y;
      pos[i3 + 2] += (basePos[2] - pos[i3 + 2]) * 0.02 + velocities[i].z;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Audio-reactive effects
    const scale = 1 + bass * 0.15;
    particles.scale.set(scale, scale, scale);
    material.opacity = 0.5 + freq * 0.5;
    material.size = 0.15 + bass * 0.3;

    // Text sprite reactivity
    textSprite.material.opacity = 0.08 + freq * 0.2;

    // Camera orbit based on mouse
    camera.position.x = Math.sin(STATE.targetMouse.x * 0.5) * 25;
    camera.position.y = Math.sin(STATE.targetMouse.y * 0.3) * 15;
    camera.position.z = 25 + Math.cos(STATE.targetMouse.x * 0.5) * 5;
    camera.lookAt(0, 0, 0);

    // Rotate star field
    stars.rotation.y += 0.0005;
    stars.rotation.x += 0.0002;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // ─── Resize ───
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

// ═════════════════════════════════════════════
// 6. AUDIO-REACTIVE BLOB CANVAS (About)
// ═════════════════════════════════════════════
(function initReactiveBlob() {
  const canvas = document.getElementById('blobCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = rect.width;
    H = canvas.height = rect.height;
  }

  function drawBlob(cx, cy, radius, color, offset, alpha, pulse) {
    const points = 10;
    const angleStep = (Math.PI * 2) / points;
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const angle = angleStep * i + STATE.time * 0.06 + offset;
      const v = 0.2 + (STATE.bass || 0) * 0.3;
      const r = radius + Math.sin(angle * 3 + STATE.time * 0.05 + offset * 1.5) * radius * v;
      const x = cx + Math.cos(angle) * r * pulse;
      const y = cy + Math.sin(angle) * r * pulse;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * (0.7 + (STATE.avgFreq || 0) * 0.3);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const br = Math.min(W, H) * 0.28;
    const pulse = 1 + (STATE.bass || 0) * 0.1;
    drawBlob(cx - 10, cy + 5, br * 1.1, 'rgba(255, 0, 255, 0.12)', 0, 0.7, pulse);
    drawBlob(cx + 15, cy - 10, br * 0.9, 'rgba(0, 255, 255, 0.10)', 2, 0.7, pulse);
    drawBlob(cx, cy, br * 0.7, 'rgba(102, 0, 255, 0.08)', 4, 0.6, pulse);
    requestAnimationFrame(animate);
  }

  resize();
  animate();
  window.addEventListener('resize', resize);
})();

// ═════════════════════════════════════════════
// 7. SCROLL REVEALS
// ═════════════════════════════════════════════
(function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .track-item, .gallery-card').forEach(el => observer.observe(el));
})();

// ═════════════════════════════════════════════
// 8. AUDIO PLAYER — With Visualizer Integration
// ═════════════════════════════════════════════
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

  const trackMap = {
    'velvet_midnight': { title: '2am Wisdom', file: 'assets/audio/2am_wisdom.m4a', duration: '4:05' },
    'ghost_in_the_machine': { title: 'Ghost in the Machine', file: null, duration: '—' },
    'neon_rain': { title: 'Neon Rain', file: null, duration: '—' },
    'delete_you': { title: 'Delete You', file: null, duration: '—' },
    'pixel_heart': { title: 'Pixel Heart', file: null, duration: '—' },
    'static_lullaby': { title: 'Static Lullaby', file: null, duration: '—' },
    'overwrite': { title: 'Overwrite', file: null, duration: '—' },
  };

  let currentTrack = 'velvet_midnight';

  function formatTime(s) {
    if (isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  }

  function loadTrack(trackId) {
    const track = trackMap[trackId];
    if (!track || !track.file) return false;
    audio.src = track.file;
    audio.load();
    playerTitle.textContent = track.title;
    playerStatus.textContent = 'Now Playing';
    currentTrack = trackId;
    document.querySelectorAll('.track-item').forEach(item =>
      item.classList.toggle('active', item.dataset.track === trackId));
    return true;
  }

  // Init Web Audio analyser
  initAudioAnalyser(audio);

  // Set initial src
  const hs = audio.querySelector('source');
  if (hs && hs.src) audio.src = hs.src;

  // Play/Pause
  playBtn.addEventListener('click', async () => {
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (e) {
      console.warn('Playback:', e.message);
    }
  });

  // Audio events
  audio.addEventListener('play', () => {
    STATE.isPlaying = true;
    playBtn.textContent = '⏸';
    if (playerGlass) playerGlass.classList.add('playing');
  });

  audio.addEventListener('pause', () => {
    STATE.isPlaying = false;
    playBtn.textContent = '▶';
    if (playerGlass) playerGlass.classList.remove('playing');
  });

  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = pct + '%';
      if (progressThumb) progressThumb.style.left = pct + '%';
      currentTime.textContent = formatTime(audio.currentTime);
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    totalTime.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    STATE.isPlaying = false;
    playBtn.textContent = '▶';
    if (playerGlass) playerGlass.classList.remove('playing');
    progressFill.style.width = '0%';
    if (progressThumb) progressThumb.style.left = '0%';
    currentTime.textContent = '0:00';
  });

  // Seek
  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const rect = progressBar.getBoundingClientRect();
      audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    });
  }

  // Track list clicks
  document.querySelectorAll('.track-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.track;
      if (trackMap[id] && trackMap[id].file && loadTrack(id)) audio.play();
    });
  });

  // Toggle track list
  if (toggleListBtn && trackList) {
    toggleListBtn.addEventListener('click', () => {
      const hidden = trackList.style.display === 'none';
      trackList.style.display = hidden ? '' : 'none';
      toggleListBtn.style.transform = hidden ? 'rotate(0deg)' : 'rotate(180deg)';
      toggleListBtn.style.transition = 'transform 0.3s ease';
    });
  }
})();

// ═════════════════════════════════════════════
// 9. THREE.JS — 3D Gallery Sphere
// ═════════════════════════════════════════════
(function init3DGallery() {
  if (!THREE) return;
  const container = document.getElementById('galleryGrid');
  if (!container) return;

  // Create 3D canvas overlay
  const canvas = document.createElement('canvas');
  canvas.id = 'gallery3DCanvas';
  canvas.style.cssText = 'width:100%;height:500px;border-radius:24px;display:block;';
  container.parentElement.insertBefore(canvas, container);
  container.style.display = 'none';

  const items = [
    'gallery_010.png', 'gallery_030.png', 'gallery_060.png',
    'gallery_090.png', 'gallery_120.png', 'gallery_140.png',
  ];

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight || 2, 0.1, 100);
  camera.position.z = 8;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Create image sprites
  const group = new THREE.Group();
  const radius = 3.5;
  let isDragging = false;
  let prevX = 0;
  let rotationSpeed = 0;

  function createImageSprite(index) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 384;
    const ctx = c.getContext('2d');

    // Simulated image backgrounds
    const hue = index % 2 === 0 ? 300 : 180;
    const grad = ctx.createLinearGradient(0, 0, 512, 384);
    grad.addColorStop(0, `hsla(${hue}, 80%, 20%, 0.8)`);
    grad.addColorStop(0.5, `hsla(${hue}, 60%, 10%, 0.9)`);
    grad.addColorStop(1, `hsla(${hue + 60}, 70%, 15%, 0.8)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 384);

    // Glitch lines
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(255,0,255,${0.02 + Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 384, Math.random() * 100 + 20, 1 + Math.random() * 2);
    }

    // Center gradient glow
    const cgrad = ctx.createRadialGradient(256, 192, 0, 256, 192, 150);
    cgrad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.15)`);
    cgrad.addColorStop(1, 'transparent');
    ctx.fillStyle = cgrad;
    ctx.fillRect(0, 0, 512, 384);

    // Title
    ctx.fillStyle = `hsla(${hue === 300 ? 300 : 180}, 100%, 80%, 0.4)`;
    ctx.font = '20px Space Grotesk, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(items[index].replace('.png', '').replace(/_/g, ' '), 256, 350);

    const texture = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    const angle = (index / items.length) * Math.PI * 2;
    sprite.position.set(Math.cos(angle) * radius, Math.sin(angle * 2) * 0.5, Math.sin(angle) * radius);
    sprite.scale.set(2.5, 1.9, 1);
    sprite.userData = { angle, targetScale: 2.5 };
    return sprite;
  }

  items.forEach((_, i) => group.add(createImageSprite(i)));
  scene.add(group);

  // Mouse interaction
  canvas.addEventListener('mousedown', (e) => { isDragging = true; prevX = e.clientX; });
  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const dx = e.clientX - prevX;
      rotationSpeed = dx * 0.01;
      group.rotation.y += rotationSpeed;
      prevX = e.clientX;
    }
  });
  window.addEventListener('mouseup', () => { isDragging = false; });

  // Touch support
  let touchPrevX = 0;
  canvas.addEventListener('touchstart', (e) => { touchPrevX = e.touches[0].clientX; });
  canvas.addEventListener('touchmove', (e) => {
    const dx = e.touches[0].clientX - touchPrevX;
    group.rotation.y += dx * 0.01;
    touchPrevX = e.touches[0].clientX;
  });

  // Animation
  function animate() {
    if (!isDragging) {
      rotationSpeed *= 0.97;
      group.rotation.y += rotationSpeed;
    }

    // Audio-reactive pulse
    const pulse = 1 + (STATE.bass || 0) * 0.05;
    group.children.forEach((sprite, i) => {
      const angle = sprite.userData.angle + STATE.time * 0.002;
      sprite.position.y = Math.sin(angle * 2 + STATE.time * 0.01) * 0.5;
      sprite.material.opacity = 0.6 + (STATE.avgFreq || 0) * 0.4;
      sprite.scale.setScalar(pulse * (2.5 - i * 0.05));
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Resize
  const resizeGallery = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  };
  window.addEventListener('resize', resizeGallery);
  setTimeout(resizeGallery, 100);
})();

// ═════════════════════════════════════════════
// 10. FULL-SCREEN FREQUENCY VISUALIZER
// ═════════════════════════════════════════════
(function initVisualizer() {
  const overlay = document.getElementById('vizOverlay');
  const canvas = document.getElementById('vizCanvas');
  const closeBtn = document.getElementById('vizClose');
  if (!canvas || !overlay) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  // Open visualizer — add a button in the player area
  const vizBtn = document.createElement('button');
  vizBtn.className = 'player-btn';
  vizBtn.id = 'vizBtn';
  vizBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  vizBtn.title = 'Full-screen visualizer';
  document.querySelector('.player-controls')?.appendChild(vizBtn);

  vizBtn.addEventListener('click', () => {
    overlay.classList.add('active');
    resize();
    animate();
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
  });

  let animId = null;
  function animate() {
    if (!overlay.classList.contains('active')) {
      if (animId) cancelAnimationFrame(animId);
      return;
    }

    updateAudioData();
    ctx.clearRect(0, 0, W, H);
    const len = STATE.freqData?.length || 128;
    const barWidth = W / len;
    const bass = STATE.bass || 0;

    // Background pulse
    const bgAlpha = 0.02 + bass * 0.06;
    ctx.fillStyle = `rgba(10, 10, 26, ${bgAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // Frequency bars
    for (let i = 0; i < len; i++) {
      const val = STATE.freqData ? STATE.freqData[i] / 255 : 0;
      const barH = val * H * 0.8;
      const x = i * barWidth;
      const y = H - barH;

      const hue = 300 + (i / len) * 60;
      const sat = 80 + val * 20;
      const lig = 40 + val * 40;

      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lig}%)`;
      ctx.globalAlpha = 0.4 + val * 0.6;
      ctx.fillRect(x, y, barWidth - 1, barH);

      // Glow
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.shadowBlur = val * 20;
      ctx.fillRect(x, y, barWidth - 1, barH);
      ctx.shadowBlur = 0;
    }

    // Center gradient
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.5);
    grad.addColorStop(0, `rgba(255, 0, 255, ${0.02 + bass * 0.05})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Particle sparks from bass
    if (bass > 0.3) {
      for (let i = 0; i < 3; i++) {
        const sx = Math.random() * W;
        const sy = Math.random() * H;
        const sr = 2 + bass * 8;
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
        sg.addColorStop(0, `rgba(255, 0, 255, ${bass * 0.3})`);
        sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    animId = requestAnimationFrame(animate);
  }
})();

// ═════════════════════════════════════════════
// 11. LIQUID CURSOR — Canvas Distortion Ripple
// ═════════════════════════════════════════════
(function initLiquidCursor() {
  const canvas = document.createElement('canvas');
  canvas.id = 'liquidCanvas';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:99996;pointer-events:none;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W, H;
  const ripples = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', (e) => {
    ripples.push({
      x: e.clientX,
      y: e.clientY,
      r: 2,
      maxR: 40 + Math.random() * 30,
      alpha: 0.15 + Math.random() * 0.1,
    });
    if (ripples.length > 30) ripples.shift();
  });

  function animate() {
    ctx.clearRect(0, 0, W, H);

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.r += 0.5;
      r.alpha *= 0.97;

      if (r.alpha < 0.01 || r.r > r.maxR) {
        ripples.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);

      // Magenta ring
      ctx.strokeStyle = `rgba(255, 0, 255, ${r.alpha * 0.4})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Cyan inner ring
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 255, 255, ${r.alpha * 0.25})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Glow
      const grad = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.r);
      grad.addColorStop(0, `rgba(255, 0, 255, ${r.alpha * 0.05})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }
  animate();
})();

// ═════════════════════════════════════════════
// 12. FORM
// ═════════════════════════════════════════════
(function initForm() {
  const form = document.getElementById('signupForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value.trim();
    if (email) {
      const btn = form.querySelector('.form-submit');
      const text = btn.querySelector('.btn-text');
      text.textContent = '✦ Subscribed';
      btn.style.background = 'linear-gradient(135deg, var(--cyan), var(--magenta))';
      setTimeout(() => {
        text.textContent = 'Subscribe';
        btn.style.background = '';
        document.getElementById('emailInput').value = '';
      }, 3000);
    }
  });
})();

// ═════════════════════════════════════════════
// 13. NAVIGATION
// ═════════════════════════════════════════════
(function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 80));

  if (toggle) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.classList.toggle('open');
    });
    document.querySelectorAll('.nav-link').forEach(l => {
      l.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('open');
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
})();

// ═════════════════════════════════════════════
// 14. SMOOTH SCROLL
// ═════════════════════════════════════════════
(function initSmoothScroll() {
  const s = document.createElement('style');
  s.textContent = 'html { scroll-behavior: smooth; }';
  document.head.appendChild(s);
})();

// ═════════════════════════════════════════════
// 15. PARALLAX BLOBS
// ═════════════════════════════════════════════
(function initParallax() {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        document.querySelectorAll('.blob').forEach((blob, i) => {
          blob.style.transform = `translateY(${window.scrollY * (0.05 + i * 0.02)}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  });
})();
