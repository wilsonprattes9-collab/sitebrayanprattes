// ---------- ANIMACOES EXTRAS LIGADAS AO SCROLL (GSAP + ScrollTrigger) ----------
// tudo aqui e' decorativo/complementar ao que ja existe em script.js
// (zoom da hero), trail.js (cobra) e main.js (menu do portfolio, modal,
// reveal basico) -- cortina de transicao entre secoes, titulos que
// revelam palavra por palavra, numeros que embaralham, parallax, tilt
// 3D nos cards, botoes magneticos, marquee reativo ao scroll e uma
// linha de progresso na secao de processo.

(function () {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (prefersReducedMotion) return;

  // ---------- BARRA DE PROGRESSO DO SCROLL (topo da pagina) ----------

  const scrollProgressFill = document.querySelector('#scrollProgress span');
  if (scrollProgressFill) {
    gsap.to(scrollProgressFill, {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        start: 0,
        end: 'max',
        scrub: 0.3,
      },
    });
  }

  // ---------- CORTINA DE TRANSICAO: cada secao "descobre" de cima pra baixo ----------

  document.querySelectorAll('.section-curtain').forEach((curtain) => {
    const section = curtain.closest('section');
    if (!section) return;
    gsap.fromTo(
      curtain,
      { clipPath: 'inset(0% 0 0 0)' },
      {
        clipPath: 'inset(100% 0 0 0)',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          end: 'top 30%',
          scrub: 0.3,
        },
      }
    );
  });

  // ---------- NUMEROS: "embaralham" digitos antes de assentar no valor final ----------

  function scrambleNumber(el) {
    const final = el.textContent.trim();
    const chars = '0123456789';
    const state = { progress: 0 };
    gsap.to(state, {
      progress: 1,
      duration: 0.7,
      ease: 'power2.out',
      onUpdate: () => {
        if (state.progress >= 1) {
          el.textContent = final;
          return;
        }
        el.textContent = final
          .split('')
          .map((ch) => (/\d/.test(ch) && Math.random() > state.progress ? chars[Math.floor(Math.random() * 10)] : ch))
          .join('');
      },
    });
  }

  document.querySelectorAll('.card__number, .process__step-number, .portfolio__menu-number').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => scrambleNumber(el),
    });
  });

  // ---------- TITULOS: revelam palavra por palavra ao entrar na tela ----------

  document.querySelectorAll('.section-head h2, .about__content h2, .contact__info h2').forEach((heading) => {
    const words = heading.textContent.trim().split(/\s+/);
    heading.innerHTML = words
      .map((word) => `<span class="word-mask"><span class="word-inner">${word}</span></span>`)
      .join(' ');

    const inners = heading.querySelectorAll('.word-inner');
    gsap.set(inners, { yPercent: 110 });

    ScrollTrigger.create({
      trigger: heading,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to(inners, {
          yPercent: 0,
          duration: 0.9,
          ease: 'power4.out',
          stagger: 0.06,
        });
      },
    });
  });

  // ---------- MARQUEE: velocidade/direcao reagem ao scroll ----------

  const marqueeTrack = document.querySelector('.marquee__track');
  if (marqueeTrack) {
    const marqueeTween = gsap.to(marqueeTrack, {
      xPercent: -50,
      duration: 22,
      ease: 'none',
      repeat: -1,
    });

    ScrollTrigger.create({
      trigger: '.marquee',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const speed = self.direction === -1 ? -2.2 : 1;
        gsap.to(marqueeTween, { timeScale: speed, duration: 0.4, overwrite: true });
      },
    });
  }

  // ---------- LINHA DE PROGRESSO DO PROCESSO ----------

  const processProgressFill = document.getElementById('processProgressFill');
  if (processProgressFill) {
    gsap.to(processProgressFill, {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: '#processo',
        start: 'top 70%',
        end: 'bottom 60%',
        scrub: 0.4,
      },
    });
  }

  // ---------- PARALLAX: foto "sobre" ----------

  const aboutPhoto = document.querySelector('.about__photo');
  if (aboutPhoto) {
    gsap.to(aboutPhoto, {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: '.about',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  // ---------- PARALLAX: marca d'agua do contato (rotacao lenta) ----------

  const contactWatermark = document.querySelector('.contact__watermark');
  if (contactWatermark) {
    gsap.to(contactWatermark, {
      rotation: 25,
      ease: 'none',
      scrollTrigger: {
        trigger: '.contact',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  // ---------- KEN BURNS: previa do portfolio da' um leve zoom ao rolar ----------

  const portfolioPreviewImg = document.getElementById('portfolioPreviewImg');
  if (portfolioPreviewImg) {
    gsap.to(portfolioPreviewImg, {
      scale: 1.08,
      ease: 'none',
      scrollTrigger: {
        trigger: '#portfolio',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  // ---------- TILT 3D + BOTOES MAGNETICOS (so' em telas com mouse de verdade) ----------

  if (supportsHover) {
    document.querySelectorAll('.card, .pillar, .testimonial').forEach((card) => {
      gsap.set(card, { transformPerspective: 700, transformOrigin: 'center' });
      const rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      const liftY = gsap.quickTo(card, 'y', { duration: 0.6, ease: 'power3.out' });

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        rotateY(px * 10);
        rotateX(-py * 10);
        liftY(-4);
      });

      card.addEventListener('mouseleave', () => {
        rotateX(0);
        rotateY(0);
        liftY(0);
      });
    });

    document.querySelectorAll('.btn').forEach((btn) => {
      const moveX = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
      const moveY = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        moveX(relX * 0.35);
        moveY(relY * 0.35);
      });

      btn.addEventListener('mouseleave', () => {
        moveX(0);
        moveY(0);
      });
    });
  } else {
    // toque: sem cursor pra seguir/inclinar -- em vez de deixar os
    // cards/botoes totalmente inertes no celular, um feedback rapido de
    // "pressionar" (encolhe levemente ao tocar, volta ao soltar).
    document.querySelectorAll('.card, .pillar, .testimonial, .btn').forEach((el) => {
      const press = () => gsap.to(el, { scale: 0.96, duration: 0.2, ease: 'power2.out' });
      const release = () => gsap.to(el, { scale: 1, duration: 0.35, ease: 'power2.out' });
      el.addEventListener('touchstart', press, { passive: true });
      el.addEventListener('touchend', release, { passive: true });
      el.addEventListener('touchcancel', release, { passive: true });
    });
  }
})();
