// ---------- NAV MOBILE (hamburguer < 860px) ----------

const burgerBtn = document.getElementById('burgerBtn');
const mobileOverlay = document.getElementById('mobileOverlay');

if (burgerBtn && mobileOverlay) {
  burgerBtn.addEventListener('click', () => {
    const isOpen = mobileOverlay.classList.toggle('is-open');
    burgerBtn.classList.toggle('is-open', isOpen);
    burgerBtn.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });

  mobileOverlay.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileOverlay.classList.remove('is-open');
      burgerBtn.classList.remove('is-open');
      burgerBtn.setAttribute('aria-label', 'Abrir menu');
    });
  });
}

// ---------- TEMA CLARO/ESCURO ----------

const themeToggle = document.getElementById('themeToggle');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);

    try {
      localStorage.setItem('theme', next);
    } catch (e) {
      // localStorage pode falhar (modo privado) -- o tema so' nao
      // persiste entre visitas, sem quebrar o toggle nessa sessao.
    }

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) themeColorMeta.setAttribute('content', next === 'light' ? '#ffffff' : '#000000');

    // avisa js/script.js pra redesenhar a hero na hora (cores dependem
    // do tema), caso o usuario troque o tema parado em cima dela.
    document.dispatchEvent(new CustomEvent('themechange'));
  });
}

// ---------- SCROLL REVEAL (GSAP ScrollTrigger, agrupado por secao) ----------

const revealItems = document.querySelectorAll('.reveal-item');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (revealItems.length && typeof gsap !== 'undefined' && !prefersReducedMotion) {
  gsap.registerPlugin(ScrollTrigger);

  // agrupa por elemento-pai (mesma logica de "irmaos" do handoff original)
  // pra cada grupo entrar com stagger real, ligado ao scroll -- em vez de
  // um IntersectionObserver simples com delay fixo por indice.
  const revealGroups = new Map();
  revealItems.forEach((item) => {
    const parent = item.parentElement;
    if (!revealGroups.has(parent)) revealGroups.set(parent, []);
    revealGroups.get(parent).push(item);
  });

  revealGroups.forEach((items) => {
    gsap.set(items, { opacity: 0, y: 44, filter: 'blur(8px)' });
    ScrollTrigger.batch(items, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => {
        batch.forEach((el) => el.classList.add('in'));
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1,
          ease: 'power3.out',
          stagger: 0.1,
        });
      },
    });
  });
} else {
  revealItems.forEach((item) => item.classList.add('in'));
}

// ---------- EFEITO DE AGUA NA LOGO DO NAV (hover) ----------

const navLogoEl = document.getElementById('navLogo');
const waterDisplacement = document.getElementById('waterDisplacement');

if (navLogoEl && waterDisplacement) {
  navLogoEl.addEventListener('mouseenter', () => {
    gsap.to(waterDisplacement, { attr: { scale: 26 }, duration: 0.5, ease: 'power2.out' });
  });
  navLogoEl.addEventListener('mouseleave', () => {
    gsap.to(waterDisplacement, { attr: { scale: 0 }, duration: 0.6, ease: 'power2.out' });
  });
}

// ---------- PORTFOLIO: menu + previa flutuante ----------

const portfolioMenu = document.getElementById('portfolioMenu');
const portfolioIndicator = document.getElementById('portfolioIndicator');
const portfolioPreviewImg = document.getElementById('portfolioPreviewImg');
const portfolioPreviewBtn = document.getElementById('portfolioPreviewBtn');

if (portfolioMenu && portfolioIndicator && portfolioPreviewImg) {
  const menuItems = Array.from(portfolioMenu.querySelectorAll('.portfolio__menu-item'));

  function moveIndicatorTo(item) {
    gsap.to(portfolioIndicator, {
      top: item.offsetTop,
      height: item.offsetHeight,
      duration: 0.45,
      ease: 'power3.out',
    });
  }

  function selectItem(item) {
    if (item.classList.contains('is-active')) return;
    menuItems.forEach((el) => el.classList.remove('is-active'));
    item.classList.add('is-active');
    moveIndicatorTo(item);
    if (portfolioPreviewBtn) portfolioPreviewBtn.dataset.live = item.dataset.live;

    // crossfade rapido: esconde, troca o src, mostra de novo
    gsap.to(portfolioPreviewImg, {
      opacity: 0,
      duration: 0.18,
      ease: 'power1.in',
      onComplete: () => {
        portfolioPreviewImg.src = item.dataset.img;
        portfolioPreviewImg.alt = item.dataset.alt || '';
        gsap.to(portfolioPreviewImg, { opacity: 1, duration: 0.35, ease: 'power2.out' });
      },
    });
  }

  menuItems.forEach((item) => {
    item.addEventListener('click', () => selectItem(item));
  });

  // posiciona a barrinha no item ativo assim que a pagina carrega
  window.addEventListener('load', () => {
    const active = portfolioMenu.querySelector('.portfolio__menu-item.is-active') || menuItems[0];
    gsap.set(portfolioIndicator, { top: active.offsetTop, height: active.offsetHeight });
  });

  let portfolioResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(portfolioResizeTimer);
    portfolioResizeTimer = setTimeout(() => {
      const active = portfolioMenu.querySelector('.portfolio__menu-item.is-active') || menuItems[0];
      gsap.set(portfolioIndicator, { top: active.offsetTop, height: active.offsetHeight });
    }, 150);
  });
}

// ---------- MODAL: site de verdade rodando dentro (iframe) ----------

const siteModal = document.getElementById('siteModal');
const siteModalFrame = document.getElementById('siteModalFrame');
const siteModalTitle = document.getElementById('siteModalTitle');
const siteModalClose = document.getElementById('siteModalClose');

if (siteModal && siteModalFrame && portfolioPreviewBtn && typeof PortfolioLiveData !== 'undefined') {
  const openSiteModal = () => {
    const key = portfolioPreviewBtn.dataset.live;
    const html = PortfolioLiveData.decode(key);
    if (!html) return;
    siteModalFrame.srcdoc = html;
    siteModalTitle.textContent = portfolioPreviewImg.alt || 'Site';
    siteModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };
  const closeSiteModal = () => {
    siteModal.classList.remove('is-open');
    document.body.style.overflow = '';
    // limpa o iframe pra parar qualquer coisa rodando dentro (video,
    // intervalos de carrossel/depoimentos) assim que fecha o modal
    siteModalFrame.srcdoc = 'about:blank';
  };

  portfolioPreviewBtn.addEventListener('click', openSiteModal);
  siteModalClose.addEventListener('click', closeSiteModal);
  siteModal.addEventListener('click', (e) => {
    if (e.target === siteModal) closeSiteModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSiteModal();
  });
}

// ---------- FORMULARIO DE CONTATO -> WHATSAPP ----------

const contactForm = document.getElementById('contactForm');
const WHATSAPP_NUMBER = '5511993503008';

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = contactForm.querySelector('#fieldName').value.trim();
    const contato = contactForm.querySelector('#fieldContact').value.trim();
    const msg = contactForm.querySelector('#fieldMsg').value.trim();

    const texto = `Olá Brayan! Meu nome é ${nome}. ${msg} (contato: ${contato})`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  });
}
