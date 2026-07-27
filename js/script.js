gsap.registerPlugin(ScrollTrigger);

// o site (.hero__real) e' real e fica PARADO em tamanho/posicao finais o
// tempo todo -- nunca cresce, nunca aparece do nada. quem se mexe e' so'
// o buraco da mascara (.hero__mask-overlay): um clip-path evenodd
// (retangulo do tamanho da tela MENOS as 4 partes do simbolo) recorta um
// "buraco" que cresce (scroll pra baixo) e encolhe (scroll pra cima) em
// volta do centro da tela, revelando/escondendo o conteudo real de baixo
// aos poucos -- como se a logo fosse uma janela.
// SCALE_START/SCALE_END sao' calculados (nao fixos) a partir do tamanho
// da tela -- em telas estreitas (celular), os mesmos numeros fixos que
// funcionavam no desktop fariam o "buraco" nascer maior que a propria
// tela e crescer de forma desproporcional. restPx usa a MESMA formula
// da CSS (.intro__logo: min(486px, 62vmin)) pra bater exatamente com o
// tamanho da logo no fim da intro; halfDiag garante que o buraco cresça
// o bastante pra sair de qualquer tela por completo (nao so' as largas).
const LOCAL_HALF_EXTENT = 245; // maior distancia entre um ponto do simbolo e a origem (256,246)

function computeScales() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const restPx = Math.min(486, Math.min(vw, vh) * 0.5);
  const halfDiag = Math.sqrt(vw * vw + vh * vh) / 2;
  return {
    start: restPx / 512,
    end: (halfDiag * 1.35) / LOCAL_HALF_EXTENT,
  };
}

let SCALE_START = 0.95; // buraco do tamanho da logo em repouso
let SCALE_END = 9; // grande o bastante pra sair da tela por completo

// a logo tem "vaos" (gaps) entre as asas e laminas -- escalar o desenho
// NAO fecha esses vaos, ja' que escala preserva proporcao (um vao que e'
// 5% do desenho continua sendo 5% por maior que fique). Por isso, perto
// do fim do scroll, o clip-path e' desligado de vez (revelando o
// conteudo real por completo) em vez de tentar escalar ate' os vaos
// saírem da tela -- o que nunca aconteceria sozinho.
const CLIP_OFF_AT = 0.97;

// o menu do nav (icone + links + WhatsApp) so' comeca a aparecer perto
// do fim do zoom -- antes disso fica 100% invisivel. Antes, a opacidade
// seguia o progresso linear desde o inicio (0% do scroll ja' deixava o
// menu 10% visivel, etc.), o que parecia "informacao do site aparecendo
// antes do zoom terminar". Agora so' entra depois de NAV_REVEAL_AT.
const NAV_REVEAL_AT = 0.9;

// a dica de scroll so' faz sentido em repouso -- some rapido (nos
// primeiros 6% do scroll) assim que o usuario ja' entendeu o que fazer.
const SCROLL_HINT_FADE_END = 0.06;

const maskOverlay = document.querySelector('.hero__mask-overlay');
const heroPinEl = document.querySelector('.hero__pin');
const scrollHint = document.getElementById('scrollHint');
const heroLogoGroup = document.getElementById('heroLogoGroup');
const heroLogoPaths = heroLogoGroup ? heroLogoGroup.querySelectorAll('path') : [];
const heroLogoGroupRipple = document.getElementById('heroLogoGroupRipple');
const heroLogoRipplePaths = heroLogoGroupRipple ? heroLogoGroupRipple.querySelectorAll('path') : [];
const heroLogoRippleVisual = document.getElementById('heroLogoRippleVisual');
const navLogo = document.getElementById('navLogo');
const navDesktopOnly = document.getElementById('navDesktopOnly');

// mesmo simbolo de sempre (logo/logo-simbolo-final.svg), como 4 listas
// de pontos [x,y] em vez de string -- fica facil escalar cada ponto em
// volta da origem do desenho (256,246) antes de montar o path.
const ORIGIN_X = 256;
const ORIGIN_Y = 246;
const HOLE_SHAPES = [
  [[256, 75], [75, 387], [229, 236], [256, 165]],
  [[256, 75], [437, 387], [283, 236], [256, 165]],
  [[229, 260], [229, 340], [84, 417]],
  [[283, 260], [283, 340], [428, 417]],
];

function shapePoints(points, scale) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  return points
    .map(([x, y], i) => {
      const sx = cx + (x - ORIGIN_X) * scale;
      const sy = cy + (y - ORIGIN_Y) * scale;
      return `${i === 0 ? 'M' : 'L'}${sx},${sy}`;
    })
    .join(' ');
}

function buildClipPath(scale) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const rect = `M-50,-50 L${w + 50},-50 L${w + 50},${h + 50} L-50,${h + 50} Z`;
  const shapes = HOLE_SHAPES.map((points) => `${shapePoints(points, scale)} Z`).join(' ');
  return `path(evenodd, '${rect} ${shapes}')`;
}

// desenho SOLIDO da logo (sem clip-path), sincronizado com o buraco --
// existe so' pra poder ser destorcido pelo filtro de agua no hover (ver
// comentario no CSS/HTML sobre por que um clip-path nao pode ser
// destorcido por um filter). atualiza as DUAS copias (a nitida e a
// sempre-destorcida-mas-mascarada) com a mesma geometria.
function updateLogoVisual(scale) {
  if (!heroLogoPaths.length) return;
  HOLE_SHAPES.forEach((points, i) => {
    const d = `${shapePoints(points, scale)} Z`;
    heroLogoPaths[i].setAttribute('d', d);
    if (heroLogoRipplePaths[i]) heroLogoRipplePaths[i].setAttribute('d', d);
  });
}

let currentScale = SCALE_START;

function render(progress) {
  // escala linear -- cresce de forma continua e constante o tempo todo,
  // pra dar a sensacao de zoom (entrando na logo) em vez de ficar
  // "parado" por boa parte do scroll e so' revelar tudo de repente perto
  // do fim (o que acontecia com uma curva ease-in).
  currentScale = gsap.utils.interpolate(SCALE_START, SCALE_END, progress);
  const bg = Math.round(gsap.utils.interpolate(255, 0, progress));
  const clipOff = progress >= CLIP_OFF_AT;
  gsap.set(maskOverlay, {
    clipPath: clipOff ? 'none' : buildClipPath(currentScale),
    backgroundColor: `rgb(${bg}, ${bg}, ${bg})`,
    opacity: clipOff ? 0 : 1,
  });
  updateLogoVisual(currentScale);
  if (heroLogoGroup) gsap.set(heroLogoGroup, { opacity: clipOff ? 0 : 1 });
  if (heroLogoRippleVisual) gsap.set(heroLogoRippleVisual, { opacity: clipOff ? 0 : 1 });

  // icone + links + botao do nav ficam 100% invisiveis ate' o zoom
  // estar quase todo completo, so' entrando (rapido) no fim -- o nome
  // (nav__word) fica sempre visivel (mix-blend-mode no CSS).
  const navOpacity = gsap.utils.clamp(0, 1, (progress - NAV_REVEAL_AT) / (1 - NAV_REVEAL_AT));
  gsap.set(navLogo, { opacity: navOpacity });
  gsap.set(navDesktopOnly, { opacity: navOpacity });

  // dica de "role para baixo": visivel em repouso, some rapido assim
  // que o scroll comeca.
  if (scrollHint) {
    const hintOpacity = 1 - gsap.utils.clamp(0, 1, progress / SCROLL_HINT_FADE_END);
    gsap.set(scrollHint, { opacity: hintOpacity });
  }
}

let heroScrollTrigger = null;

window.addEventListener('DOMContentLoaded', () => {
  const initialScales = computeScales();
  SCALE_START = initialScales.start;
  SCALE_END = initialScales.end;
  render(0);

  // efeito de agua: a copia sempre-destorcida (#heroLogoGroupRipple) so'
  // aparece onde a mask-image (radial-gradient, CSS) esta' opaca -- e
  // essa mascara e' posicionada no CURSOR via --ripple-x/--ripple-y
  // (ver .hero__logo-ripple no CSS). Por isso nao precisa de logica de
  // liga/desliga: o proprio raio limitado da mascara ja' faz o efeito
  // so' aparecer quando o mouse esta' de fato em cima da logo, e ele
  // "acompanha" o cursor porque essas variaveis sao' atualizadas a cada
  // mousemove (com uma leve suavizacao via GSAP).
  if (heroLogoRippleVisual && heroPinEl) {
    const cursor = { x: -9999, y: -9999 };
    const applyCursor = () => {
      heroLogoRippleVisual.style.setProperty('--ripple-x', `${cursor.x}px`);
      heroLogoRippleVisual.style.setProperty('--ripple-y', `${cursor.y}px`);
    };
    heroPinEl.addEventListener('mousemove', (e) => {
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.35, ease: 'power2.out', onUpdate: applyCursor });
    });
    heroPinEl.addEventListener('mouseleave', () => {
      gsap.to(cursor, { x: -9999, y: -9999, duration: 0.4, ease: 'power2.out', onUpdate: applyCursor });
    });
  }

  heroScrollTrigger = ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
    onUpdate: (self) => render(self.progress),
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // recalcula SCALE_START/END pro novo tamanho de tela (gira o
      // celular, por exemplo) e redesenha na posicao de scroll atual --
      // nao so' reaplica o currentScale antigo, que foi calculado com
      // os limites antigos.
      const scales = computeScales();
      SCALE_START = scales.start;
      SCALE_END = scales.end;
      render(heroScrollTrigger ? heroScrollTrigger.progress : 0);
    }, 150);
  });
});
