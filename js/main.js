/* ============================================================
   NIFS — Premium interactions · 2026
   ============================================================ */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Preloader ---------- */
  const preloader = $('#preloader');
  window.addEventListener('load', () => {
    setTimeout(() => preloader.classList.add('done'), 500);
    setTimeout(() => preloader.remove(), 1400);
  });
  // Safety net if load event stalls
  setTimeout(() => preloader && preloader.classList.add('done'), 3500);

  /* ---------- Custom cursor + mouse glow ---------- */
  const dot = $('#cursorDot'), ring = $('#cursorRing'), glow = $('#mouseGlow');
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine && !reduceMotion) {
    let mx = -100, my = -100, rx = -100, ry = -100, gx = -100, gy = -100;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      gx += (mx - gx) * 0.06; gy += (my - gy) * 0.06;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      glow.style.transform = `translate(${gx}px,${gy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    const hoverables = 'a, button, .course-card, .m-item, .why-card, .cert-card, input, select, textarea';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverables)) ring.classList.add('hovering');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverables)) ring.classList.remove('hovering');
    });
  } else {
    [dot, ring, glow].forEach(el => el && el.remove());
  }

  /* ---------- Scroll progress + header + back-to-top ---------- */
  const progress = $('#scrollProgress');
  const header = $('#header');
  const toTop = $('#toTop');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
    header.classList.toggle('scrolled', scrollY > 40);
    toTop.classList.toggle('show', scrollY > 700);
    spyNav();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Scroll spy ---------- */
  const navLinks = $$('.nav-link');
  const spySections = navLinks.map(l => $(l.getAttribute('href'))).filter(Boolean);
  function spyNav() {
    let current = spySections[0];
    for (const sec of spySections) {
      if (sec.getBoundingClientRect().top <= innerHeight * 0.4) current = sec;
    }
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current.id));
  }

  /* ---------- Mobile menu ---------- */
  const burger = $('#hamburger'), mobileMenu = $('#mobileMenu');
  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burger.classList.remove('open');
    document.body.style.overflow = '';
  }));

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Hero particles (embers) ---------- */
  const canvas = $('#particles');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const colors = ['227,30,36', '249,168,37', '30,142,62'];
    let W, H, parts = [];
    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      parts = Array.from({ length: Math.min(46, W / 26) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 1 + Math.random() * 2.6,
        vy: 0.25 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.3,
        c: colors[Math.random() * colors.length | 0],
        a: 0.15 + Math.random() * 0.4
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    (function tick() {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.vy; p.x += p.vx;
        if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.a})`;
        ctx.fill();
      }
      requestAnimationFrame(tick);
    })();
  }

  /* ---------- Parallax (hero logo & floating shapes) ---------- */
  if (fine && !reduceMotion) {
    const hero = $('.hero');
    const pEls = $$('[data-parallax]');
    const shapes = $$('.float-shape');
    hero.addEventListener('mousemove', e => {
      const cx = (e.clientX / innerWidth - 0.5), cy = (e.clientY / innerHeight - 0.5);
      pEls.forEach(el => {
        const f = parseFloat(el.dataset.parallax) * 400;
        el.style.translate = `${cx * f}px ${cy * f}px`;
      });
      shapes.forEach((el, i) => {
        const f = 12 + i * 5;
        el.style.translate = `${cx * f}px ${cy * f}px`;
      });
    });
  }

  /* ============================================================
     COURSE SLIDER + FILTERS
     ============================================================ */
  const track = $('#courseTrack');
  const viewport = $('#courseViewport');
  const dotsWrap = $('#courseDots');
  const allCards = $$('.course-card', track);
  let index = 0, timer = null, visibleCards = allCards;

  const perView = () => innerWidth <= 640 ? 1 : innerWidth <= 1100 ? 2 : 4;
  const maxIndex = () => Math.max(0, visibleCards.length - perView());

  function layout() {
    const pv = perView();
    const gap = 24;
    const w = (viewport.offsetWidth - gap * (pv - 1)) / pv;
    visibleCards.forEach(c => { c.style.flexBasis = w + 'px'; });
    index = Math.min(index, maxIndex());
    move();
    buildDots();
  }
  function move() {
    if (!visibleCards.length) return;
    const gap = 24;
    const w = visibleCards[0].offsetWidth + gap;
    track.style.transform = `translateX(${-index * w}px)`;
    $$('button', dotsWrap).forEach((d, i) => d.classList.toggle('active', i === index));
  }
  function buildDots() {
    dotsWrap.innerHTML = '';
    for (let i = 0; i <= maxIndex(); i++) {
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      b.classList.toggle('active', i === index);
      b.addEventListener('click', () => { index = i; move(); restart(); });
      dotsWrap.appendChild(b);
    }
  }
  function next() { index = index >= maxIndex() ? 0 : index + 1; move(); }
  function prev() { index = index <= 0 ? maxIndex() : index - 1; move(); }
  function restart() { clearInterval(timer); if (!reduceMotion) timer = setInterval(next, 4000); }

  $('#courseNext').addEventListener('click', () => { next(); restart(); });
  $('#coursePrev').addEventListener('click', () => { prev(); restart(); });
  viewport.addEventListener('mouseenter', () => clearInterval(timer));
  viewport.addEventListener('mouseleave', restart);
  window.addEventListener('resize', layout);

  // touch swipe
  let sx = 0;
  viewport.addEventListener('touchstart', e => { sx = e.touches[0].clientX; clearInterval(timer); }, { passive: true });
  viewport.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 45) (dx < 0 ? next() : prev());
    restart();
  }, { passive: true });

  // filters
  $$('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const f = pill.dataset.filter;
      allCards.forEach(c => {
        const show = f === 'all' || c.dataset.cat.split(' ').includes(f);
        c.classList.toggle('hidden-cat', !show);
      });
      visibleCards = allCards.filter(c => !c.classList.contains('hidden-cat'));
      index = 0;
      layout();
      restart();
    });
  });

  layout();
  restart();
/* ---------- Two-finger trackpad scroll: courses ---------- */
let cAcc = 0, cLock = false;
viewport.addEventListener('wheel', e => {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical = normal page scroll
  e.preventDefault();
  if (cLock) return;
  cAcc += e.deltaX;
  if (Math.abs(cAcc) > 60) {
    cAcc > 0 ? next() : prev();
    restart();
    cAcc = 0; cLock = true;
    setTimeout(() => cLock = false, 450);
  }
}, { passive: false });
  /* ============================================================
     COUNTERS
     ============================================================ */
  const counterIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      counterIO.unobserve(en.target);
      const el = en.target, target = +el.dataset.target, dur = 1800, t0 = performance.now();
      (function step(t) {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-IN');
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.5 });
  $$('.counter').forEach(el => counterIO.observe(el));

  /* ============================================================
     TESTIMONIAL SLIDER
     ============================================================ */
  const tTrack = $('#testiTrack');
  const tCards = $$('.testi-card', tTrack);
  const tDots = $('#testiDots');
  let tIndex = 0, tTimer = null;
  const tPer = () => innerWidth <= 860 ? 1 : 2;
  const tMax = () => Math.max(0, tCards.length - tPer());
  function tBuild() {
    tDots.innerHTML = '';
    for (let i = 0; i <= tMax(); i++) {
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'Testimonial ' + (i + 1));
      b.addEventListener('click', () => { tIndex = i; tMove(); tRestart(); });
      tDots.appendChild(b);
    }
    tMove();
  }
  function tMove() {
    tIndex = Math.min(tIndex, tMax());
    const w = tCards[0].offsetWidth + 26;
    tTrack.style.transform = `translateX(${-tIndex * w}px)`;
    $$('button', tDots).forEach((d, i) => d.classList.toggle('active', i === tIndex));
  }
  function tNext() { tIndex = tIndex >= tMax() ? 0 : tIndex + 1; tMove(); }
  function tRestart() { clearInterval(tTimer); if (!reduceMotion) tTimer = setInterval(tNext, 4500); }
  $('#testiSlider').addEventListener('mouseenter', () => clearInterval(tTimer));
  $('#testiSlider').addEventListener('mouseleave', tRestart);
  window.addEventListener('resize', tBuild);
  tBuild(); tRestart();
  /* ---------- Two-finger trackpad scroll: testimonials ---------- */
let tAcc = 0, tLock = false;
$('#testiSlider').addEventListener('wheel', e => {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
  e.preventDefault();
  if (tLock) return;
  tAcc += e.deltaX;
  if (Math.abs(tAcc) > 60) {
    if (tAcc > 0) { tNext(); } else { tIndex = tIndex <= 0 ? tMax() : tIndex - 1; tMove(); }
    tRestart();
    tAcc = 0; tLock = true;
    setTimeout(() => tLock = false, 450);
  }
}, { passive: false });

  /* ============================================================
     GALLERY LIGHTBOX
     ============================================================ */
  const lightbox = $('#lightbox'), lbContent = $('#lbContent'), lbCaption = $('#lbCaption');
  $$('.m-item').forEach(item => {
    item.addEventListener('click', () => {
      lbContent.innerHTML = item.querySelector('.m-art').outerHTML;
      lbCaption.textContent = item.dataset.caption;
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });
  const closeLb = () => { lightbox.hidden = true; document.body.style.overflow = ''; };
  $('#lbClose').addEventListener('click', closeLb);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lightbox.hidden) closeLb(); });

  /* ============================================================
     CONTACT FORM VALIDATION
     ============================================================ */
  const form = $('#contactForm');
  const rules = {
    fName: v => v.trim().length >= 3 || 'Please enter your full name',
    fPhone: v => /^[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '')) || 'Enter a valid 10-digit mobile number',
    fEmail: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Enter a valid email address',
    fCourse: v => v !== '' || 'Please select a course'
  };
  function validate(input) {
    const rule = rules[input.id];
    if (!rule) return true;
    const res = rule(input.value);
    const field = input.closest('.field');
    const err = field.querySelector('.err');
    if (res !== true) { field.classList.add('invalid'); err.textContent = res; return false; }
    field.classList.remove('invalid'); err.textContent = ''; return true;
  }
  form.addEventListener('input', e => {
    if (e.target.closest('.field')?.classList.contains('invalid')) validate(e.target);
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const inputs = ['fName', 'fPhone', 'fEmail', 'fCourse'].map(id => $('#' + id));
    const ok = inputs.map(validate).every(Boolean);
    if (!ok) { inputs.find(i => i.closest('.field').classList.contains('invalid'))?.focus(); return; }
    const success = $('#formSuccess');
    success.hidden = false;
    setTimeout(() => { form.reset(); }, 400);
    setTimeout(() => { success.hidden = true; }, 6000);
  });

  /* ---------- Newsletter ---------- */
  $('#newsForm').addEventListener('submit', e => {
    e.preventDefault();
    const em = $('#newsEmail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value)) { em.focus(); return; }
    $('#newsOk').hidden = false;
    em.value = '';
    setTimeout(() => { $('#newsOk').hidden = true; }, 5000);
  });

  /* ---------- Brochure button (demo) ---------- */
  $('#brochureBtn').addEventListener('click', e => {
    e.preventDefault();
    const a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(
      'NIFS — National Institute of Fire & Safety\n==========================================\n\nPrograms:\n• Fire & Safety Management — 1 Year\n• Industrial Safety — 6 Months\n• Disaster Management — 1 Year\n• OSHA Certification — 3 Months\n• NEBOSH Training — 6 Months\n• HSE Professional — 1 Year\n\nAdmissions: admissions@nifsindia.in | +91 98765 43210\nCampus: Haridwar Road, Dehradun, Uttarakhand 248001');
    a.download = 'NIFS-Brochure.txt';
    a.click();
  });

})();
