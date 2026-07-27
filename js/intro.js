document.body.classList.add('intro-active');

function runIntro() {
  const intro = document.getElementById('intro');
  const strokes = intro.querySelectorAll('.intro__stroke');
  const fills = intro.querySelectorAll('.intro__fill');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    intro.style.display = 'none';
    document.body.classList.remove('intro-active');
    return;
  }

  strokes.forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
  });

  gsap.timeline({
    onComplete: () => {
      intro.style.display = 'none';
      document.body.classList.remove('intro-active');
    },
  })
    .to(strokes, {
      strokeDashoffset: 0,
      duration: 1.3,
      ease: 'power2.inOut',
      stagger: 0.12,
    })
    .to(fills, {
      opacity: 1,
      duration: 0.35,
      ease: 'power1.out',
    }, '-=0.1')
    // nao muda nenhuma cor aqui -- a intro termina e revela a hero
    // por tras, que fica parada (fundo branco, logo preta) ate' o
    // usuario rolar. so' esconde o overlay da intro, sem fade.
    .set(intro, { display: 'none' }, '+=0.4');
}

window.addEventListener('DOMContentLoaded', runIntro);
