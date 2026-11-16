/* WebBloom agency site. Contact details live here: fill in the two empty values to show those buttons. */
const CONTACT = {
  instagram: '',   // your Instagram username, without @  (example: 'webbloom.lb')
  whatsapp: '',    // your WhatsApp number with country code, digits only  (example: '96170123456')
  email: 'webbloom.lb@gmail.com'
};

(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);

  /* contact buttons */
  const msg = encodeURIComponent('Hi! I would like a free demo website for my shop.');
  const links = {
    instagram: CONTACT.instagram && 'https://ig.me/m/' + encodeURIComponent(CONTACT.instagram),
    whatsapp: CONTACT.whatsapp && 'https://wa.me/' + CONTACT.whatsapp.replace(/\D/g, '') + '?text=' + msg,
    email: CONTACT.email && 'mailto:' + CONTACT.email + '?subject=' + encodeURIComponent('Free demo for my shop')
  };
  $$('[data-contact]').forEach(a => { const url = links[a.dataset.contact]; if (url) { a.href = url; a.hidden = false; } else a.hidden = true; });
  if (links.instagram || links.whatsapp) { const e = $('[data-contact="email"]'); if (e) e.classList.add('btn--ghost'); (($('[data-contact="instagram"]:not([hidden])') || $('[data-contact="whatsapp"]:not([hidden])'))).classList.remove('btn--ghost'); }
  else $('[data-contact="email"]')?.classList.remove('btn--ghost');
  const y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();

  /* mobile menu */
  const burger = $('.nav__burger'), menu = $('#menu');
  const closeMenu = () => { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', () => { const open = menu.classList.toggle('is-open'); burger.setAttribute('aria-expanded', String(open)); });
  $$('a', menu).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* FAQ: one open at a time */
  $$('.faq details').forEach(d => d.addEventListener('toggle', () => { if (d.open) $$('.faq details').forEach(o => { if (o !== d) o.open = false; }); }));

  /* active nav link */
  const navLinks = $$('.nav__links a');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => io.observe(s));
  }

  if (reduced || !hasGsap) { root.classList.add('no-anim', 'ready'); $$('[data-count]').forEach(el => { el.textContent = el.dataset.count; }); $$('[data-type]').forEach(el => { el.textContent = el.dataset.type; }); return; }

  gsap.registerPlugin(ScrollTrigger);
  const ease = 'expo.out';

  /* smooth scrolling */
  let lenis = null;
  if (window.Lenis && fine) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    root.classList.add('lenis');
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return; const target = $(id); if (!target) return;
    e.preventDefault(); if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -70 }); else target.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', id);
  }));

  /* split headings into words */
  function split(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
    while (walker.nextNode()) if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
    nodes.forEach(node => { const frag = document.createDocumentFragment(); node.textContent.split(/(\s+)/).forEach(part => { if (!part) return; if (/^\s+$/.test(part)) { frag.append(' '); return; } const w = document.createElement('span'), i = document.createElement('span'); w.className = 'w'; i.textContent = part; w.append(i); frag.append(w); }); node.replaceWith(frag); });
    return $$('.w > span', el);
  }

  /* starfield */
  const cv = $('.stars'), cx = cv.getContext('2d'); let stars = [], W = 0, H = 0, mouseX = 0, mouseY = 0;
  function sizeStars() { const d = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * d; H = cv.height = innerHeight * d; stars = Array.from({ length: Math.round(innerWidth / 14) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.3 + .3) * d, s: Math.random() * .25 + .05, p: Math.random() * 6.28 })); }
  sizeStars(); addEventListener('resize', sizeStars);
  gsap.ticker.add(t => { if (document.hidden) return; cx.clearRect(0, 0, W, H); for (const s of stars) { s.y -= s.s; if (s.y < -4) { s.y = H + 4; s.x = Math.random() * W; } cx.globalAlpha = .35 + Math.sin(t * 1.4 + s.p) * .3; cx.fillStyle = '#f6efe6'; cx.beginPath(); cx.arc(s.x + mouseX * s.r * 6, s.y + mouseY * s.r * 6, s.r, 0, 6.28); cx.fill(); } });

  /* intro: loader counter, then hero */
  const heroWords = split($('.hero [data-split]'));
  gsap.set(heroWords, { yPercent: 115, rotate: 5 });
  gsap.set('.hero [data-rise]', { y: 30, autoAlpha: 0 });
  gsap.set('.hero .device, .hero .chip', { autoAlpha: 0 });
  const num = $('[data-loader-num]'), counter = { v: 0 };
  const intro = gsap.timeline({ defaults: { ease } });
  intro.to(counter, { v: 100, duration: 1.1, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(counter.v); } })
    .to('.loader__in', { yPercent: -40, autoAlpha: 0, duration: .5, ease: 'power2.in' })
    .to('.loader', { yPercent: -100, duration: .9, ease: 'expo.inOut' }, '-=.15')
    .add(() => root.classList.add('ready'))
    .to(heroWords, { yPercent: 0, rotate: 0, duration: 1.2, stagger: .055 }, '-=.55')
    .to('.hero [data-rise]', { y: 0, autoAlpha: 1, duration: 1, stagger: .09 }, '-=.9')
    .fromTo('.device--laptop', { autoAlpha: 0, y: 120, rotateY: -40, rotateX: 20 }, { autoAlpha: 1, y: 0, rotateY: -16, rotateX: 6, duration: 1.5 }, '-=1.1')
    .fromTo('.device--phone', { autoAlpha: 0, y: 160, rotateZ: 14 }, { autoAlpha: 1, y: 0, rotateZ: 3, duration: 1.4 }, '-=1.2')
    .fromTo('.hero .chip', { autoAlpha: 0, scale: .4 }, { autoAlpha: 1, scale: 1, duration: .8, stagger: .12, ease: 'back.out(2)' }, '-=.9');

  /* hero: phone screenshot scrolls by itself, devices follow the mouse and the scroll */
  const shot = $('[data-scrollshot]');
  if (shot) gsap.to(shot, { yPercent: -52, duration: 9, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 2.5 });
  const depthEls = $$('.hero [data-depth]');
  if (fine) addEventListener('pointermove', e => { mouseX = e.clientX / innerWidth - .5; mouseY = e.clientY / innerHeight - .5; depthEls.forEach(el => gsap.to(el, { x: mouseX * -26 * el.dataset.depth, y: mouseY * -20 * el.dataset.depth, duration: 1, ease: 'power3.out', overwrite: 'auto' })); }, { passive: true });
  gsap.to('.hero__stage', { yPercent: 14, scale: .92, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__copy', { yPercent: -10, autoAlpha: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* progress bar + nav hide on scroll down */
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });
  const nav = $('[data-nav]');
  ScrollTrigger.create({ start: 200, end: 'max', onUpdate: s => { if (!menu.classList.contains('is-open')) nav.classList.toggle('is-hidden', s.direction === 1 && s.scroll() > 400); } });

  /* marquee leans with scroll speed */
  const track = $('.marquee__track'); let skew = 0;
  ScrollTrigger.create({ onUpdate: s => { const v = gsap.utils.clamp(-12, 12, s.getVelocity() / -220); if (Math.abs(v) > Math.abs(skew)) { skew = v; gsap.to(track, { skewX: v, duration: .2, overwrite: true, onComplete: () => gsap.to(track, { skewX: 0, duration: .8, ease: 'power3.out', onComplete: () => { skew = 0; } }) }); } } });

  /* generic reveals */
  $$('main [data-split]').forEach(el => { if (el.closest('.hero')) return; const words = split(el); gsap.from(words, { yPercent: 115, rotate: 4, duration: 1.1, stagger: .045, ease, scrollTrigger: { trigger: el, start: 'top 86%' } }); });
  ScrollTrigger.batch($$('main [data-rise]').filter(el => !el.closest('.hero')), { start: 'top 90%', once: true, onEnter: els => gsap.from(els, { y: 50, autoAlpha: 0, duration: 1, stagger: .08, ease, clearProps: 'transform,opacity,visibility' }) });

  /* story: pinned on desktop, DMs fly away and the site appears */
  const mm = gsap.matchMedia();
  const steps = $$('[data-story-step]'), dms = $$('[data-dm]');
  mm.add('(min-width: 1001px)', () => {
    gsap.set('[data-story-site]', { scale: .55, autoAlpha: 0, rotate: -8 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.story__pin', start: 'top top', end: '+=260%', pin: true, scrub: .6, onUpdate: s => { const i = Math.min(steps.length - 1, Math.floor(s.progress * steps.length * .999)); steps.forEach((el, k) => el.classList.toggle('is-on', k === i)); } } });
    tl.from(dms, { y: 140, autoAlpha: 0, scale: .6, stagger: .12, duration: .5, ease: 'back.out(1.6)' })
      .to(dms, { x: i => (i % 2 ? 1 : -1) * 20, duration: .5, ease: 'sine.inOut' })
      .to(dms, { x: i => (i % 2 ? 1 : -1) * 520, y: i => -160 + i * 40, rotate: i => (i % 2 ? 40 : -40), autoAlpha: 0, stagger: .06, duration: .7, ease: 'power2.in' })
      .to('[data-story-site]', { scale: 1, autoAlpha: 1, rotate: 0, duration: .9, ease: 'power3.out' }, '-=.3')
      .to('[data-story-site] img', { objectPosition: '50% 60%', duration: .8, ease: 'none' });
    return () => steps.forEach(el => el.classList.remove('is-on'));
  });
  mm.add('(max-width: 1000px)', () => {
    gsap.from(dms, { y: 60, autoAlpha: 0, scale: .7, stagger: .1, duration: .7, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.story__visual', start: 'top 80%' } });
    gsap.set('[data-story-site]', { autoAlpha: 0, scale: .6 });
    gsap.timeline({ scrollTrigger: { trigger: '.story__steps', start: 'top 75%', end: 'bottom 55%', scrub: .5, onUpdate: s => { const i = Math.min(steps.length - 1, Math.floor(s.progress * steps.length * .999)); steps.forEach((el, k) => el.classList.toggle('is-on', k === i)); } } })
      .to(dms, { autoAlpha: 0, scale: .5, stagger: .05 }).to('[data-story-site]', { autoAlpha: 1, scale: 1 }, '-=.2');
  });

  /* bento: spotlight follows the pointer; small live details */
  $$('[data-spot]').forEach(card => card.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(); card.style.setProperty('--mx', e.clientX - r.left + 'px'); card.style.setProperty('--my', e.clientY - r.top + 'px'); }));
  $$('[data-count]').forEach(el => { const o = { v: 0 }, end = +el.dataset.count; gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); }, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }); });
  $$('[data-type]').forEach(el => { const text = el.dataset.type, o = { n: 0 }; gsap.to(o, { n: text.length, duration: 1.6, ease: 'none', repeat: -1, repeatDelay: 1.6, yoyo: true, onUpdate: () => { el.textContent = text.slice(0, Math.round(o.n)) || ' '; }, scrollTrigger: { trigger: el, start: 'top 92%' } }); });

  /* work: sideways scroll on desktop, swipe on touch */
  const rail = $('[data-rail]');
  mm.add('(min-width: 1001px) and (hover: hover)', () => {
    $('.work').classList.add('is-pinned');
    const dist = () => rail.scrollWidth - innerWidth;
    const tween = gsap.to(rail, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.work', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .7, invalidateOnRefresh: true, anticipatePin: 1 } });
    $$('.shot', rail).forEach(s => gsap.from(s, { scale: .82, autoAlpha: .3, ease: 'none', scrollTrigger: { trigger: s, containerAnimation: tween, start: 'left 95%', end: 'left 55%', scrub: true } }));
    return () => $('.work').classList.remove('is-pinned');
  });

  /* steps: the line draws, each number lights up */
  const line = $('[data-line]');
  mm.add('(min-width: 1001px)', () => { gsap.to(line, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 70%', end: 'bottom 60%', scrub: .5 } }); });
  mm.add('(max-width: 1000px)', () => { gsap.to(line, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 70%', end: 'bottom 60%', scrub: .5 } }); });
  $$('[data-step]').forEach((s, i) => { ScrollTrigger.create({ trigger: s, start: 'top 68%', onEnter: () => s.classList.add('is-on'), onLeaveBack: () => s.classList.remove('is-on') }); gsap.from(s, { y: 60, autoAlpha: 0, duration: 1, delay: i * .12, ease, scrollTrigger: { trigger: '.steps', start: 'top 80%' } }); });

  /* price card tilt, magnetic buttons, cursor */
  if (fine) {
    $$('[data-tilt]').forEach(el => { el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, yy = (e.clientY - r.top) / r.height - .5; gsap.to(el, { rotateY: x * 7, rotateX: -yy * 7, transformPerspective: 1200, duration: .5, ease: 'power3.out' }); }); el.addEventListener('pointerleave', () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: .9, ease: 'elastic.out(1,.5)' })); });
    $$('[data-magnet]').forEach(b => { b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .28, y: (e.clientY - r.top - r.height / 2) * .38, duration: .4, ease: 'power3.out' }); }); b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.4)' })); });
    const cur = $('.cursor'), setX = gsap.quickTo(cur, 'x', { duration: .25, ease: 'power3.out' }), setY = gsap.quickTo(cur, 'y', { duration: .25, ease: 'power3.out' });
    addEventListener('pointermove', e => { setX(e.clientX); setY(e.clientY); cur.classList.toggle('is-big', !!e.target.closest('a,button,summary,[data-spot]')); }, { passive: true });
  }

  /* final CTA grows as it arrives */
  gsap.from('.cta__ring', { scale: .4, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top 90%', end: 'top 30%', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
